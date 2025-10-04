import { supabase } from "@/integrations/supabase/client";

export type QuantumForecast = {
  model: { name: string; backend: string; horizonHours: number };
  city: { name: string; country?: string; lat: number; lng: number };
  generatedAt: string;
  hourly: Array<{ hourOffset: number; aqi: number; pm25: number; confidence: number }>;
};

async function get24hForecast(
  city: { name: string; country?: string; lat: number; lng: number },
  airQuality: { aqi: number; pm25: number; pm10: number; o3: number; no2: number; so2: number; co: number }
): Promise<QuantumForecast> {
  const { data, error } = await supabase.functions.invoke("quantum-predictor", {
    body: { city, airQuality },
  });
  if (error) throw error;
  return data as QuantumForecast;
}

export const quantumPredictor = { get24hForecast };