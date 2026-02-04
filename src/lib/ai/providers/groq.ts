// src/lib/ai/providers/groq.ts

import Groq from 'groq-sdk';
import { AIResponse } from '@/types';
import { AIProviderInterface } from './base';

export class GroqProvider implements AIProviderInterface {
    private client: Groq | null = null;
    private readonly models = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'openai/gpt-oss-120b',
    ];

    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.client = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        }
    }

    isConfigured(): boolean {
        return this.client !== null;
    }

    async generate(prompt: string, context?: string): Promise<AIResponse> {
        if (!this.client) {
            throw new Error('Groq not configured - add GROQ_API_KEY to .env.local');
        }

        const systemPrompt = `You are an expert technical writer helping junior developers create professional README files. 
Be clear, concise, and educational. Always explain WHY something is important, not just WHAT it is.
Use markdown formatting appropriately.`;

        const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
        ];

        if (context) {
            messages.push({ role: 'user', content: `Project Context:\n${context}` });
        }

        messages.push({ role: 'user', content: prompt });

        for (const model of this.models) {
            try {
                console.log(`⚡ Groq attempting with ${model}...`);

                const completion = await this.client.chat.completions.create({
                    messages,
                    model,
                    temperature: 0.5,
                    max_tokens: 2048,
                    top_p: 1,
                    stop: null,
                    stream: false,
                });

                const content = completion.choices[0]?.message?.content || '';

                if (content) {
                    return {
                        content,
                        provider: 'groq',
                        tokensUsed: completion.usage?.total_tokens,
                    };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`Groq ${model} failed:`, errorMessage);
                // Continue to next model
            }
        }

        throw new Error('All Groq models failed');
    }
}