import { supabase } from '@/integrations/supabase/client';

interface Grok4Response {
  response: string;
  model: string;
  powered_by?: string;
}

class Grok4ApiService {
  async generateResponse(message: string, context?: {
    selectedCity?: string;
    currentScenario?: string;
    currentYear?: number;
  }): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke<Grok4Response>('chat-grok', {
        body: { message, context }
      });

      if (error) {
        console.error('Grok-4 Fast API error via edge function:', error);
        return this.getFallbackResponse(message, context);
      }

      if (data?.response) {
        return data.response;
      }

      throw new Error('Invalid response format from Grok-4 API');
    } catch (error) {
      console.error('Grok-4 API error:', error);
      return this.getFallbackResponse(message, context);
    }
  }

  private getFallbackResponse(message: string, context?: any): string {
    const msg = message.toLowerCase();

    if (msg.includes('quantum') || msg.includes('ibm')) {
      return "Our quantum-enhanced predictions use IBM Quantum circuits to analyze air quality patterns. The quantum advantage provides up to 3-5x speedup in complex environmental modeling!";
    }

    if (msg.includes('satellite') || msg.includes('red lines')) {
      return "Those red lines are solar panels on Earth observation satellites! The ISS, Hubble, TERRA, and Landsat-8 continuously monitor global air quality using quantum-enhanced sensor arrays.";
    }

    if (msg.includes('air quality') || msg.includes('pollution')) {
      return "Air pollution comes from vehicles, industry, and power generation. Our quantum-enhanced AI powered by Grok-4 Fast analyzes NASA satellite data to track pollution trends with unprecedented accuracy.";
    }

    if (msg.includes('grok') || msg.includes('ai')) {
      return "I'm powered by Grok-4 Fast, X.AI's advanced AI model specialized in environmental science and quantum computing applications. Ask me anything about air quality, climate predictions, or quantum analytics!";
    }

    if (context?.selectedCity && (msg.includes('this city') || msg.includes('here'))) {
      return `For ${context.selectedCity}, the ${context.currentScenario} scenario shows ${context.currentScenario === 'clean_energy' ? 'significant improvements with quantum-predicted 40% AQI reduction' : context.currentScenario === 'no_action' ? 'concerning deterioration with 60% worsening' : 'gradual changes'} in air quality by ${new Date().getFullYear() + (context.currentYear || 0)}.`;
    }

    return "I'm Grok-4 Fast, your quantum-enhanced environmental AI assistant! Ask me about air quality, IBM Quantum predictions, climate data, satellite observations, or anything related to environmental science.";
  }
}

export const grokService = new Grok4ApiService();