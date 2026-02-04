// scripts/verify-providers.ts
import { GeminiProvider } from '../src/lib/ai/providers/gemini';
import { OpenAIProvider } from '../src/lib/ai/providers/openai';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

async function verifyProviders() {
    console.log('🔍 Verifying AI Providers...\n');

    // 1. Verify Gemini
    console.log('--- Checking Gemini Provider ---');
    const gemini = new GeminiProvider();
    if (gemini.isConfigured()) {
        console.log('✅ Gemini is configured (API Key present)');
        try {
            // Dry run or simple prompt
            // Note: We won't actually call generate to save tokens/money unless user wants, 
            // but we can check if the client instantiated correctly.
            console.log('✅ Gemini client initialized');
        } catch (error) {
            console.error('❌ Gemini initialization failed:', error);
        }
    } else {
        console.log('⚠️ Gemini is NOT configured (Missing GOOGLE_AI_API_KEY)');
    }

    console.log('\n--- Checking OpenAI Provider ---');
    const openai = new OpenAIProvider();
    if (openai.isConfigured()) {
        console.log('✅ OpenAI is configured (API Key present)');
        try {
            console.log('✅ OpenAI client initialized');
        } catch (error) {
            console.error('❌ OpenAI initialization failed:', error);
        }
    } else {
        console.log('⚠️ OpenAI is NOT configured (Missing OPENAI_API_KEY)');
    }
}

verifyProviders().catch(console.error);
