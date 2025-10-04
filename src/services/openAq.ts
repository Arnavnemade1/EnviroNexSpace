// OpenAQ service: fetch nearest measurements and compute AQI (US EPA) based on PM2.5 when available
import type { AirQualityData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface OpenAQLatestResponse {
  results: Array<{
    coordinates?: { latitude: number; longitude: number };
    measurements: Array<{
      parameter: string; // pm25, pm10, so2, no2, o3, co, etc
      value: number;
      unit: string; // 'µg/m³', 'ppm', 'ppb'
    }>;
  }>;
}

class OpenAQService {
  private baseUrl = 'https://api.openaq.org/v3/latest';
  private apiKey = '2e4753879800c5b4d925b6b8b46486b145b4ecbec17ce2dad4d8f4162045a390';

  private async fetchNearest(lat: number, lon: number, radius: number = 25000) {
    const { data, error } = await supabase.functions.invoke('airquality-openmeteo', {
      body: { lat, lon, radius },
    });
    if (error) {
      console.error('airquality-openmeteo failed:', error);
      throw new Error(typeof error === 'string' ? error : (error.message ?? 'Air quality proxy error'));
    }
    if (!data?.results || data.results.length === 0) {
      throw new Error('No air quality data available for this location');
    }
    return (data as OpenAQLatestResponse).results[0];
  }

  private generateFallbackData(lat: number, lon: number) {
    // Generate realistic air quality data based on location
    const baseAQI = Math.floor(Math.random() * 100) + 30; // 30-130 range
    const pm25 = Math.floor(baseAQI * 0.4); // Rough conversion
    
    return {
      coordinates: { latitude: lat, longitude: lon },
      measurements: [
        { parameter: 'pm25', value: pm25, unit: 'µg/m³' },
        { parameter: 'pm10', value: Math.floor(pm25 * 1.5), unit: 'µg/m³' },
        { parameter: 'no2', value: Math.floor(Math.random() * 40) + 10, unit: 'µg/m³' },
        { parameter: 'so2', value: Math.floor(Math.random() * 20) + 5, unit: 'µg/m³' },
        { parameter: 'o3', value: Math.floor(Math.random() * 80) + 40, unit: 'µg/m³' },
        { parameter: 'co', value: Math.floor(Math.random() * 2000) + 500, unit: 'µg/m³' }
      ]
    };
  }

  private computeAQIFromPM25(pm25: number): number {
    // US EPA AQI for PM2.5 (24-hr) using breakpoints
    const bp = [
      { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
      { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
      { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
      { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
      { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
      { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
    ];
    for (const b of bp) {
      if (pm25 >= b.cLow && pm25 <= b.cHigh) {
        return Math.round(((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (pm25 - b.cLow) + b.iLow);
      }
    }
    return Math.min(500, Math.max(0, Math.round(pm25 * 4))); // fallback
  }

  async getLatestAirQuality(lat: number, lon: number): Promise<AirQualityData> {
    try {
      // Try smaller radius first, then expand if needed
      let result;
      try {
        result = await this.fetchNearest(lat, lon, 20000);
      } catch (error) {
        console.log('Trying larger radius...');
        result = await this.fetchNearest(lat, lon, 50000);
      }

      const map: Record<string, { value: number; unit: string }> = {};
      for (const m of result.measurements) {
        map[m.parameter.toLowerCase()] = { value: m.value, unit: m.unit };
      }

      // Helper to read value safely (µg/m3 preferred). For gases often ppb/ppm; keep raw value when unit is µg/m3
      const readValue = (key: string): number => {
        const entry = map[key];
        if (!entry) return 0;
        const { value, unit } = entry;
        if (unit.includes('µg')) return Math.round(value);
        // Basic conversion for O3 if provided in ppb/ppm to µg/m3 using MW/24.45 (MW O3 = 48)
        if (key === 'o3') {
          if (unit.toLowerCase() === 'ppb') return Math.round(value * (48 / 24.45)); // ≈1.963 µg/m3 per ppb
          if (unit.toLowerCase() === 'ppm') return Math.round(value * 1000 * (48 / 24.45));
        }
        // For others, return rounded value; units vary but UI labels as µg/m3 generically
        return Math.round(value);
      };

      const pm25 = readValue('pm25');
      const pm10 = readValue('pm10');
      const no2 = readValue('no2');
      const so2 = readValue('so2');
      const o3 = readValue('o3');
      const co = readValue('co');

      const aqi = this.computeAQIFromPM25(pm25 || 0);

      return {
        aqi,
        pm25,
        pm10,
        o3,
        no2,
        so2,
        co,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get air quality data:', error);
      throw error;
    }
  }
}

export const openaqService = new OpenAQService();
