// API Keys - Published keys safe for client-side use
export const API_KEYS = {
  NASA: 'R5HGRahmsdeL60ptptAHLc5DxAsmS6YkfMXuE6J1',
  OPENCAGE: '44cd122e57d1457d9159816b47599768',
  GEMINI: 'AIzaSyDBsX2odkU7EEvMKIV3ZipBpxpxI3Lo52c'
};

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  timestamp: string;
}

export interface CityData {
  name: string;
  country: string;
  lat: number;
  lng: number;
  airQuality: AirQualityData;
  healthImpact: {
    outdoorActivityDays: number;
    asthmaRisk: number;
    respiratoryIndex: number;
  };
}

export interface PredictionData {
  year: number;
  scenario: 'current' | 'clean_energy' | 'no_action';
  airQuality: AirQualityData;
  healthImpact: {
    outdoorActivityDays: number;
    asthmaRisk: number;
  };
}

export interface SatelliteData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  velocity: number;
  description?: string;
}
