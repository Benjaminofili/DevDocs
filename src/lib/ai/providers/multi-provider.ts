import { AIResponse, AIProvider } from '@/types';
import { AIProviderInterface } from './base';
import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { logger } from '@/lib/logger';

export class MultiProvider implements AIProviderInterface {
    private providers: AIProviderInterface[] = [];
    private providerOrder: AIProvider[] = ['gemini', 'groq', 'openai', 'anthropic'];

    constructor() {
        // Initialize providers in order of preference
        this.providers = [
            new GeminiProvider(),
            new GroqProvider(),
            new OpenAIProvider(),
            new AnthropicProvider(),
        ];
    }

    isConfigured(): boolean {
        return this.providers.some(provider => provider.isConfigured());
    }

    async generate(prompt: string, context?: string): Promise<AIResponse> {
        const errors: string[] = [];

        for (const provider of this.providers) {
            if (!provider.isConfigured()) {
                logger.warn(`${provider.constructor.name} not configured, skipping...`);
                continue;
            }

            try {
                logger.ai('multi-provider', `Trying ${provider.constructor.name}...`);
                const response = await provider.generate(prompt, context);
                logger.ai('multi-provider', `Success with ${provider.constructor.name}!`);
                return response;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${provider.constructor.name}: ${errorMessage}`);

                // Check if it's a rate limit error - if so, try next provider immediately
                if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
                    logger.warn(`${provider.constructor.name} rate limited, trying next provider...`);
                    continue;
                }

                // For other errors, also try next provider
                logger.warn(`${provider.constructor.name} failed: ${errorMessage}`);
            }
        }

        // If all providers failed, throw a comprehensive error
        logger.error('All AI providers failed. Errors:', errors);
        throw new Error(`All AI providers failed. Errors: ${errors.join('; ')}`);
    }

    // Method to get available providers for debugging
    getAvailableProviders(): string[] {
        return this.providers
            .filter(provider => provider.isConfigured())
            .map(provider => provider.constructor.name);
    }

    // Method to set custom provider order
    setProviderOrder(order: AIProvider[]): void {
        this.providerOrder = order;
        // Reorder providers array based on the new order
        const providerMap = new Map(
            this.providers.map(p => [this.getProviderType(p), p])
        );

        this.providers = order
            .map(type => providerMap.get(type))
            .filter(Boolean) as AIProviderInterface[];
    }

    private getProviderType(provider: AIProviderInterface): AIProvider {
        const name = provider.constructor.name.toLowerCase();
        if (name.includes('gemini')) return 'gemini';
        if (name.includes('groq')) return 'groq';
        if (name.includes('openai')) return 'openai';
        if (name.includes('anthropic')) return 'anthropic';
        return 'gemini'; // fallback
    }
}