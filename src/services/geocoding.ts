import { API_KEYS } from '@/types';

const OPENCAGE_BASE_URL = 'https://api.opencagedata.com/geocode/v1/json';

export class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = API_KEYS.OPENCAGE;
  }

  async searchCity(query: string) {
    const url = `${OPENCAGE_BASE_URL}?q=${encodeURIComponent(query)}&key=${this.apiKey}&limit=5&no_annotations=1`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return data.results?.map((result: any) => ({
        name: result.components.city || result.components.town || result.components.village || result.formatted,
        country: result.components.country,
        lat: result.geometry.lat,
        lng: result.geometry.lng,
        formatted: result.formatted
      })) || [];
    } catch (error) {
      console.error('Geocoding API error:', error);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    const url = `${OPENCAGE_BASE_URL}?q=${lat}+${lng}&key=${this.apiKey}&no_annotations=1`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          name: result.components.city || result.components.town || result.components.village || 'Unknown',
          country: result.components.country || 'Unknown',
          formatted: result.formatted
        };
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();