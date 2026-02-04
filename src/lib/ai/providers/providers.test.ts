import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';

// Mock environment variables
const ORIGINAL_ENV = process.env;

describe('AI Providers', () => {
    beforeEach(() => {
        jest.resetModules(); // Clear cache
        process.env = { ...ORIGINAL_ENV }; // Reset env
    });

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    });

    describe('OpenAIProvider', () => {
        it('should be configured when API key is present', () => {
            process.env.OPENAI_API_KEY = 'test-key';
            const provider = new OpenAIProvider();
            expect(provider.isConfigured()).toBe(true);
        });

        it('should NOT be configured when API key is missing', () => {
            delete process.env.OPENAI_API_KEY;
            const provider = new OpenAIProvider();
            expect(provider.isConfigured()).toBe(false);
        });

        it('should throw error if generating without configuration', async () => {
            delete process.env.OPENAI_API_KEY;
            const provider = new OpenAIProvider();
            await expect(provider.generate('test')).rejects.toThrow('OpenAI not configured');
        });
    });

    describe('GeminiProvider', () => {
        it('should be configured when API key is present', () => {
            process.env.GOOGLE_AI_API_KEY = 'test-key';
            const provider = new GeminiProvider();
            expect(provider.isConfigured()).toBe(true);
        });

        it('should NOT be configured when API key is missing', () => {
            delete process.env.GOOGLE_AI_API_KEY;
            const provider = new GeminiProvider();
            expect(provider.isConfigured()).toBe(false);
        });
    });
});
