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
    const { lat, lon, radius = 25000 } = await req.json();

    if (typeof lat !== "number" || typeof lon !== "number") {
      return new Response(
        JSON.stringify({ error: "lat and lon are required numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("OPENAQ_API_KEY") ?? "";

    // Helper to call OpenAQ with proper headers
    const callOpenAQ = async (url: string) => {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(apiKey ? { "X-API-Key": apiKey } : {}),
        },
      });
      const text = await res.text();
      if (!res.ok) {
        console.error("OpenAQ API error:", res.status, text);
        throw new Error(`OpenAQ API error ${res.status}: ${text}`);
      }
      return JSON.parse(text);
    };

    // Find nearest location using v3/locations with geospatial query
    const buildLocationsUrl = (coords: string) =>
      `https://api.openaq.org/v3/locations?coordinates=${coords}&radius=${radius}&limit=1`;

    let locationData: any | null = null;
    try {
      const coordsLatLon = `${lat},${lon}`; // try latitude,longitude first
      const locationsUrl1 = buildLocationsUrl(coordsLatLon);
      console.log("OpenAQ locations URL #1:", locationsUrl1);
      locationData = await callOpenAQ(locationsUrl1);
    } catch (e1) {
      // Try longitude,latitude ordering if first attempt failed
      try {
        const coordsLonLat = `${lon},${lat}`;
        const locationsUrl2 = buildLocationsUrl(coordsLonLat);
        console.log("OpenAQ locations URL #2:", locationsUrl2);
        locationData = await callOpenAQ(locationsUrl2);
      } catch (e2) {
        throw e2; // bubble up last error
      }
    }

    if (!locationData?.results || locationData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: "No air quality stations found in this area" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const location = locationData.results[0];
    const locationId = location.id;

    // Fetch sensors metadata for this location to map sensor IDs -> parameter names/units
    const locationDetailUrl = `https://api.openaq.org/v3/locations/${locationId}`;
    console.log("OpenAQ location detail URL:", locationDetailUrl);
    const locationDetail = await callOpenAQ(locationDetailUrl);

    const sensors: Array<{ id: number; parameter?: { name?: string; units?: string } }> =
      locationDetail?.results?.[0]?.sensors ?? [];

    const sensorMeta = new Map<number, { parameter: string; unit: string }>();
    for (const s of sensors) {
      if (s?.id != null) {
        sensorMeta.set(s.id, {
          parameter: s.parameter?.name ?? "unknown",
          unit: s.parameter?.units ?? "µg/m³",
        });
      }
    }

    // Fetch latest measurements for this location
    const latestByLocationUrl = `https://api.openaq.org/v3/locations/${locationId}/latest`;
    console.log("OpenAQ latest-by-location URL:", latestByLocationUrl);
    const latestData = await callOpenAQ(latestByLocationUrl);

    const latestResults: Array<{ value: number; sensorsId: number }> = latestData?.results ?? [];

    // Transform into the structure the frontend expects
    const measurements = latestResults.map((r: any) => {
      const meta = sensorMeta.get(Number(r.sensorsId));
      return {
        parameter: meta?.parameter ?? "unknown",
        value: Number(r.value),
        unit: meta?.unit ?? "µg/m³",
      };
    });

    const coordinates = location.coordinates ?? { latitude: lat, longitude: lon };

    const transformedData = {
      results: [
        {
          coordinates,
          measurements,
        },
      ],
    };

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("openaq-proxy error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
