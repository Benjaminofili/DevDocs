// src/lib/ai/orchestrator.ts

import { AIProvider, AIResponse } from '@/types';
import { AIProviderInterface } from './providers/base';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';
import { GroqProvider } from './providers/groq';
import { logger } from '@/lib/logger';

interface ProviderConfig {
  provider: AIProvider;
  instance: AIProviderInterface;
  priority: number;
  isAvailable: boolean;
}

export class AIOrchestrator {
  private providers: ProviderConfig[] = [];
  private currentProvider: AIProvider = 'openai';

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize all providers with priority
    const providerConfigs: Array<{
      provider: AIProvider;
      instance: AIProviderInterface;
      priority: number;
    }> = [
        { provider: 'groq', instance: new GroqProvider(), priority: 1 }, // Top priority due to speed
        { provider: 'gemini', instance: new GeminiProvider(), priority: 2 },
        { provider: 'openai', instance: new OpenAIProvider(), priority: 3 },
        { provider: 'anthropic', instance: new AnthropicProvider(), priority: 4 },
        { provider: 'ollama', instance: new OllamaProvider(), priority: 5 },
      ];

    this.providers = providerConfigs.map(config => ({
      ...config,
      isAvailable: config.instance.isConfigured(),
    }));

    // Set current provider to first available
    const available = this.providers.find(p => p.isAvailable);
    if (available) {
      this.currentProvider = available.provider;
    }

    // Log available providers
    const availableProviders = this.providers
      .filter(p => p.isAvailable)
      .map(p => p.provider)
      .join(', ');

    logger.info('Available AI Providers:', { providers: availableProviders || 'None configured' });
  }

  async generate(
    prompt: string,
    context?: string,
    preferredProvider?: AIProvider
  ): Promise<AIResponse> {
    // Get ordered list of providers to try
    const providersToTry = this.getProvidersInOrder(preferredProvider);

    if (providersToTry.length === 0) {
      throw new Error('No AI providers are configured. Please set up at least one API key in your environment variables.');
    }

    for (const providerConfig of providersToTry) {
      try {
        logger.ai(providerConfig.provider, 'Attempting generation...');
        const response = await providerConfig.instance.generate(prompt, context);
        logger.ai(providerConfig.provider, 'Successfully generated content');
        return response;
      } catch (error) {
        logger.warn(`${providerConfig.provider} failed, trying next...`, { error });
        // Continue to next provider (Circuit Breaker pattern)
        continue;
      }
    }

    throw new Error('All AI providers failed. Please check your API keys and try again.');
  }

  private getProvidersInOrder(preferred?: AIProvider): ProviderConfig[] {
    const available = this.providers.filter(p => p.isAvailable);

    if (preferred) {
      const preferredProvider = available.find(p => p.provider === preferred);
      if (preferredProvider) {
        return [
          preferredProvider,
          ...available.filter(p => p.provider !== preferred),
        ];
      }
    }

    return available.sort((a, b) => a.priority - b.priority);
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers
      .filter(p => p.isAvailable)
      .map(p => p.provider);
  }

  setPreferredProvider(provider: AIProvider) {
    const isAvailable = this.providers.some(
      p => p.provider === provider && p.isAvailable
    );
    if (isAvailable) {
      this.currentProvider = provider;
    } else {
      throw new Error(`Provider ${provider} is not available`);
    }
  }

  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator();