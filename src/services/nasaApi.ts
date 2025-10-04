import { API_KEYS } from '@/types';

const NASA_BASE_URL = 'https://api.nasa.gov';

export class NASAService {
  private apiKey: string;

  constructor() {
    this.apiKey = API_KEYS.NASA;
  }

  async getEarthImagery(lat: number, lon: number, date?: string) {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `${NASA_BASE_URL}/planetary/earth/assets?lon=${lon}&lat=${lat}&date=${dateParam}&dim=0.5&api_key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('NASA Earth Imagery API error:', error);
      return null;
    }
  }

  async getAirQualityData(lat: number, lon: number) {
    // Simulated air quality data based on location
    // In production, this would use NASA's actual air quality APIs
    const baseAQI = Math.floor(Math.random() * 150) + 50;
    
    return {
      aqi: baseAQI,
      pm25: Math.floor(baseAQI * 0.4),
      pm10: Math.floor(baseAQI * 0.6),
      o3: Math.floor(baseAQI * 0.3),
      no2: Math.floor(baseAQI * 0.2),
      so2: Math.floor(baseAQI * 0.1),
      co: Math.floor(baseAQI * 0.5),
      timestamp: new Date().toISOString()
    };
  }

  async getPollutionForecast(lat: number, lon: number, years: number = 7) {
    // Simulated prediction data
    const currentAQI = await this.getAirQualityData(lat, lon);
    const predictions = [];
    
    for (let i = 1; i <= years; i++) {
      const cleanEnergyFactor = Math.max(0.7, 1 - (i * 0.05)); // Improvement with clean energy
      const noActionFactor = Math.min(1.5, 1 + (i * 0.08)); // Degradation without action
      
      predictions.push({
        year: new Date().getFullYear() + i,
        current: {
          ...currentAQI,
          aqi: Math.floor(currentAQI.aqi * (1 + Math.random() * 0.1 - 0.05))
        },
        clean_energy: {
          ...currentAQI,
          aqi: Math.floor(currentAQI.aqi * cleanEnergyFactor)
        },
        no_action: {
          ...currentAQI,
          aqi: Math.floor(currentAQI.aqi * noActionFactor)
        }
      });
    }
    
    return predictions;
  }
}

export const nasaService = new NASAService();