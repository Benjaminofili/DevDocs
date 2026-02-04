// src/lib/ai/providers/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';
import { AIResponse } from '@/types';
import { AIProviderInterface } from './base';

export class AnthropicProvider implements AIProviderInterface {
  private client: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generate(prompt: string, context?: string): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Anthropic not configured');
    }

    try {
      const systemPrompt = `You are an expert technical writer helping junior developers create professional README files. 
      Be clear, concise, and educational. Always explain WHY something is important, not just WHAT it is.
      Use markdown formatting appropriately.`;

      let userPrompt = prompt;
      if (context) {
        userPrompt = `Project Context:\n${context}\n\n${prompt}`;
      }

      const message = await this.client.messages.create({
        model: 'claude-3-haiku-20240307', // Most cost-effective Claude model
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract text from Claude's response
      const content = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      return {
        content,
        provider: 'anthropic',
        tokensUsed: message.usage?.input_tokens + message.usage?.output_tokens,
      };
    } catch (error) {
      console.error('Anthropic generation failed:', error);
      throw new Error('Failed to generate content with Anthropic');
    }
  }
}