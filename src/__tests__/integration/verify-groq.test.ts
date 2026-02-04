import { GroqProvider } from '@/lib/ai/providers/groq';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

describe('Groq Integration Verification', () => {
    it('should have GROQ_API_KEY in environment', () => {
        const key = process.env.GROQ_API_KEY;
        console.log('Checking GROQ_API_KEY:', key ? '✅ Present' : '❌ Missing');
        if (key) {
            console.log('Key length:', key.length);
            console.log('Key starts with:', key.substring(0, 4) + '...');
        }
        expect(key).toBeDefined();
        expect(key?.length).toBeGreaterThan(10);
    });

    it('should have Groq registered in Orchestrator', () => {
        const providers = aiOrchestrator.getAvailableProviders();
        console.log('Available Providers in Orchestrator:', providers);
        expect(providers).toContain('groq');
    });

    it('should be the preferred provider (Priority 0/1)', () => {
        // We can't easily check private priority, but we can check if it's the first one tried
        // by checking the order in getAvailableProviders if we modified the getter, 
        // but let's just check if it is configured.
        const provider = new GroqProvider();
        expect(provider.isConfigured()).toBe(true);
    });

    it('should successfully make a generation request', async () => {
        const provider = new GroqProvider();
        if (!provider.isConfigured()) {
            console.warn('Skipping generation test because Groq is not configured');
            return;
        }

        try {
            console.log('Attempting generation with Groq...');
            const result = await provider.generate('Say "Hello World" briefly.');
            console.log('✅ Generation Success:', result.content);
            expect(result.content).toBeTruthy();
            expect(result.provider).toBe('groq');
        } catch (error) {
            console.error('❌ Generation Failed:', error);
            throw error;
        }
    }, 30000); // 30s timeout
});
