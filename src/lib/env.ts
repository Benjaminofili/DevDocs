// src/lib/env.ts

import { z } from 'zod';

const envSchema = z.object({
  // Required for caching
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Optional AI providers (at least one should be set)
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),

  // Ollama Configuration
  OLLAMA_BASE_URL: z.string().url().optional().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().optional().default('llama2'),

  // Optional GitHub token for higher rate limits
  GITHUB_TOKEN: z.string().optional(),

  // Optional configuration
  DEBUG: z.enum(['true', 'false']).optional().default('false'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Validates environment variables and returns typed env object
 * Caches result after first call
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    throw new Error('Invalid environment configuration');
  }

  // Check that at least one AI provider is configured
  const hasAIProvider =
    result.data.OPENAI_API_KEY ||
    result.data.GOOGLE_AI_API_KEY ||
    result.data.ANTHROPIC_API_KEY ||
    result.data.GROQ_API_KEY;

  if (!hasAIProvider) {
    console.warn('⚠️ Warning: No AI provider API keys configured. At least one is recommended.');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Checks if a specific AI provider is configured
 */
export function isProviderConfigured(provider: 'openai' | 'gemini' | 'anthropic' | 'groq' | 'ollama'): boolean {
  const env = getEnv();

  switch (provider) {
    case 'openai':
      return Boolean(env.OPENAI_API_KEY);
    case 'gemini':
      return Boolean(env.GOOGLE_AI_API_KEY);
    case 'anthropic':
      return Boolean(env.ANTHROPIC_API_KEY);
    case 'groq':
      return Boolean(env.GROQ_API_KEY);
    case 'ollama':
      return true; // Always available locally (conceptually)
    default:
      return false;
  }
}

/**
 * Returns list of configured AI providers
 */
export function getConfiguredProviders(): string[] {
  const providers: string[] = [];
  const env = getEnv();

  if (env.OPENAI_API_KEY) providers.push('openai');
  if (env.GOOGLE_AI_API_KEY) providers.push('gemini');
  if (env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (env.GROQ_API_KEY) providers.push('groq');

  return providers;
}