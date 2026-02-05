// src/lib/ai/providers/ollama.ts

import { AIResponse } from '@/types';
import { AIProviderInterface } from './base';
import { logger } from '@/lib/logger';
import { getEnv } from '@/lib/env';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export class OllamaProvider implements AIProviderInterface {
  private baseUrl: string;
  private model: string;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.OLLAMA_BASE_URL;
    this.model = env.OLLAMA_MODEL;
  }

  isConfigured(): boolean {
    // Check if Ollama is running locally
    return true; // We'll attempt to use it if other providers fail
  }

  async generate(prompt: string, context?: string): Promise<AIResponse> {
    try {
      const systemPrompt = `You are an expert technical writer helping junior developers create professional README files. 
      Be clear, concise, and educational. Always explain WHY something is important, not just WHAT it is.
      Use markdown formatting appropriately.`;

      let fullPrompt = systemPrompt + '\n\n';

      if (context) {
        fullPrompt += `Project Context:\n${context}\n\n`;
      }

      fullPrompt += prompt;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();

      return {
        content: data.response,
        provider: 'ollama',
      };
    } catch (error) {
      logger.error('Ollama generation failed:', error);
      throw new Error('Failed to generate content with Ollama. Make sure Ollama is running locally.');
    }
  }
}