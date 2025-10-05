import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  context?: {
    selectedCity?: string;
    currentScenario?: string;
    currentYear?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context }: ChatRequest = await req.json();
    const LLAMA_API_KEY = Deno.env.get('LLAMA_API_KEY') || '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';

    if (!LLAMA_API_KEY) {
      throw new Error('LLAMA_API_KEY not configured');
    }

    const systemPrompt = `You are an advanced AI assistant specialized in air quality, climate change, quantum computing applications, and environmental science.
Provide accurate, insightful responses about air quality, pollution, climate predictions, IBM Quantum computing applications, and Earth observation data.
Be conversational but precise. Keep responses informative and engaging (2-4 sentences).`;

    const contextInfo = context ? `
Context: The user is exploring air quality data for ${context.selectedCity || 'a location'}.
Current scenario: ${context.currentScenario || 'current trends'}
Current forecast year: ${new Date().getFullYear() + (context.currentYear || 0)}
` : '';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMA_API_KEY}`,
        'HTTP-Referer': 'https://environex.app',
        'X-Title': 'EnviroNex - Quantum-Enhanced Air Quality',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextInfo + '\n\nUser question: ' + message }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Llama API error:', response.status, errorText);
      throw new Error(`Llama API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return new Response(
        JSON.stringify({
          response: data.choices[0].message.content,
          model: 'meta-llama/llama-3.3-70b-instruct',
          powered_by: 'Llama 3.3 70B'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid response format from AI API');
  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        fallback_message: 'AI assistant is currently unavailable. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
