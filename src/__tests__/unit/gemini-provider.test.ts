// src/__tests__/unit/gemini-provider.test.ts

import { GeminiProvider } from '@/lib/ai/providers/gemini';

// Mock the entire module
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent,
  }));

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    __mockGenerateContent: mockGenerateContent,
    __mockGetGenerativeModel: mockGetGenerativeModel,
  };
});

// Get mock functions
const getMocks = () => {
  const module = require('@google/generative-ai');
  return {
    mockGenerateContent: module.__mockGenerateContent,
    mockGetGenerativeModel: module.__mockGetGenerativeModel,
    GoogleGenerativeAI: module.GoogleGenerativeAI,
  };
};

describe('GeminiProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_AI_API_KEY;
  });

  describe('isConfigured', () => {
    it('should return true when API key is set', () => {
      const provider = new GeminiProvider();
      expect(provider.isConfigured()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.GOOGLE_AI_API_KEY;
      const provider = new GeminiProvider();
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate content successfully', async () => {
      const { mockGenerateContent } = getMocks();
      
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '# Test README\n\nThis is a test.',
        },
      });

      const provider = new GeminiProvider();
      const result = await provider.generate('Generate a README header');

      expect(result.content).toBe('# Test README\n\nThis is a test.');
      expect(result.provider).toBe('gemini');
    });

    it('should return fallback template when all models fail', async () => {
      const { mockGenerateContent } = getMocks();
      
      mockGenerateContent.mockRejectedValue(new Error('All models failed'));

      const provider = new GeminiProvider();
      const result = await provider.generate('Generate the "Project Header" section');

      expect(result.content).toContain('{{PROJECT_NAME}}');
      expect(result.provider).toBe('gemini');
    });

    it('should throw error if not configured', async () => {
      delete process.env.GOOGLE_AI_API_KEY;
      const provider = new GeminiProvider();

      await expect(provider.generate('Test')).rejects.toThrow('Gemini not configured');
    });
  });

  describe('fallback templates', () => {
    beforeEach(() => {
      const { mockGenerateContent } = getMocks();
      mockGenerateContent.mockRejectedValue(new Error('Failed'));
    });

    it('should provide Installation template', async () => {
      const provider = new GeminiProvider();
      const result = await provider.generate('Generate the "Installation" section');

      expect(result.content).toContain('Installation');
      expect(result.content).toContain('git clone');
    });

    it('should provide Features template', async () => {
      const provider = new GeminiProvider();
      const result = await provider.generate('Generate the "Features" section');

      expect(result.content).toContain('Features');
    });

    it('should provide generic template for unknown section', async () => {
      const provider = new GeminiProvider();
      const result = await provider.generate('Generate the "Custom Section" section');

      expect(result.content).toContain('Custom Section');
      expect(result.content).toContain('temporarily unavailable');
    });
  });
});