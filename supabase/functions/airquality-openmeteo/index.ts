import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (!isFinite(latitude) || !isFinite(longitude)) {
      return new Response(
        JSON.stringify({ error: "lat and lon are required numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prefer current conditions to avoid parsing hourly arrays
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: [
        "pm2_5",
        "pm10",
        "carbon_monoxide",
        "nitrogen_dioxide",
        "sulphur_dioxide",
        "ozone",
        "us_aqi",
      ].join(","),
      // Ensure nearest cell selection
      cell_selection: "nearest",
      // Return ISO timestamps in UTC (default)
      timeformat: "iso8601",
    });

    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
    console.log("Open-Meteo URL:", url);

    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    if (!res.ok) {
      console.error("Open-Meteo API error:", res.status, text);
      return new Response(
        JSON.stringify({ error: `Open-Meteo API error: ${res.status}`, details: text }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(text);

    const current = data.current ?? {};
    const currentUnits = data.current_units ?? {};

    // Helper to safely read a value and unit
    const read = (k: string): { value: number | null; unit: string | null } => ({
      value: typeof current[k] === "number" ? current[k] : null,
      unit: typeof currentUnits[k] === "string" ? currentUnits[k] : null,
    });

    // Build measurements in the shape expected by the frontend
    const measurements: Array<{ parameter: string; value: number; unit: string }> = [];

    const mapping: Array<{ key: string; parameter: string }> = [
      { key: "pm2_5", parameter: "pm25" },
      { key: "pm10", parameter: "pm10" },
      { key: "ozone", parameter: "o3" },
      { key: "nitrogen_dioxide", parameter: "no2" },
      { key: "sulphur_dioxide", parameter: "so2" },
      { key: "carbon_monoxide", parameter: "co" },
    ];

    for (const { key, parameter } of mapping) {
      const { value, unit } = read(key);
      if (value != null) {
        measurements.push({ parameter, value, unit: unit ?? "µg/m³" });
      }
    }

    // Fallback: if current is missing (rare), try first element of hourly arrays
    if (measurements.length === 0 && data.hourly) {
      const h = data.hourly as Record<string, unknown>;
      const units = (data.hourly_units ?? {}) as Record<string, string>;
      const takeFirst = (arr: unknown): number | null => (Array.isArray(arr) && typeof arr[0] === "number" ? arr[0] : null);

      const hourlyMap: Array<{ key: string; parameter: string }> = [
        { key: "pm2_5", parameter: "pm25" },
        { key: "pm10", parameter: "pm10" },
        { key: "ozone", parameter: "o3" },
        { key: "nitrogen_dioxide", parameter: "no2" },
        { key: "sulphur_dioxide", parameter: "so2" },
        { key: "carbon_monoxide", parameter: "co" },
      ];
      for (const { key, parameter } of hourlyMap) {
        const v = takeFirst(h[key]);
        if (v != null) {
          measurements.push({ parameter, value: v, unit: units[key] ?? "µg/m³" });
        }
      }
    }

    if (measurements.length === 0) {
      return new Response(
        JSON.stringify({ error: "No air quality data available for this location" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coordinates = { latitude, longitude };
    const transformed = {
      results: [
        {
          coordinates,
          measurements,
        },
      ],
    };

    return new Response(JSON.stringify(transformed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("airquality-openmeteo error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
