import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { disasters } = await req.json();
    const GROK_API_KEY = Deno.env.get('GROK_API_KEY');

    if (!GROK_API_KEY) {
      throw new Error('GROK_API_KEY not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'HTTP-Referer': 'https://environex.app',
        'X-Title': 'EnviroNex - Quantum-Enhanced Air Quality',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-2-vision-1212',
        messages: [
          {
            role: 'system',
            content: 'You are Grok-4 Fast, an advanced environmental scientist analyzing natural disasters with quantum-enhanced insights. Provide concise, factual summaries of environmental impacts in 2-4 sentences. Focus on air quality, ecosystem effects, climate implications, and quantum-predicted trends.'
          },
          {
            role: 'user',
            content: `Analyze the environmental and air quality impact of these natural disasters:\n\n${disasters}\n\nProvide a brief summary (2-4 sentences) of the collective environmental impact, including quantum-enhanced predictions if relevant.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Grok-4 rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Grok-4 credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Grok-4 API error:', response.status, errorText);
      throw new Error(`Grok-4 API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Unable to generate Grok-4 analysis.';

    return new Response(
      JSON.stringify({
        summary,
        powered_by: 'Grok-4 Fast',
        model: 'grok-2-vision-1212'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Grok-4 disaster impact analysis error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback_message: 'Grok-4 analysis unavailable'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
