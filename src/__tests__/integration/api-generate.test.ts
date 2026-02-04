// src/__tests__/integration/api-generate.test.ts

import { generateSectionPrompt } from '@/lib/ai/prompts/section-prompts';
import { SECTION_BRICKS } from '@/lib/bricks';
import { DetectedStack } from '@/types';

describe('Generate Integration', () => {
  const mockStack: DetectedStack = {
    primary: 'nextjs',
    secondary: [],
    language: 'TypeScript',
    packageManager: 'npm',
    hasDocker: true,
    hasCI: true,
    hasTesting: true,
    hasEnvFile: true,
    frameworks: ['Next.js', 'Tailwind CSS'],
    dependencies: {},
  };

  describe('generateSectionPrompt', () => {
    it('should generate header prompt with project context', () => {
      const section = SECTION_BRICKS.find(s => s.id === 'header')!;
      const prompt = generateSectionPrompt(section, mockStack, 'MyApp');

      expect(prompt).toContain('MyApp');
      expect(prompt).toContain('nextjs');
      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('npm');
    });

    it('should generate installation prompt with package manager', () => {
      const section = SECTION_BRICKS.find(s => s.id === 'installation')!;
      const prompt = generateSectionPrompt(section, mockStack, 'MyApp');

      expect(prompt).toContain('npm install');
      expect(prompt).toContain('nextjs');
    });

    it('should include Docker info in deployment prompt when hasDocker is true', () => {
      const section = SECTION_BRICKS.find(s => s.id === 'deployment')!;
      const prompt = generateSectionPrompt(section, mockStack, 'MyApp');

      expect(prompt).toContain('Docker');
    });

    it('should not include Docker in deployment prompt when hasDocker is false', () => {
      const stackWithoutDocker = { ...mockStack, hasDocker: false };
      const section = SECTION_BRICKS.find(s => s.id === 'deployment')!;
      const prompt = generateSectionPrompt(section, stackWithoutDocker, 'MyApp');

      expect(prompt).not.toContain('docker build');
    });

    it('should generate tech-stack prompt with frameworks', () => {
      const section = SECTION_BRICKS.find(s => s.id === 'tech-stack')!;
      const prompt = generateSectionPrompt(section, mockStack, 'MyApp');

      expect(prompt).toContain('Next.js');
      expect(prompt).toContain('Tailwind CSS');
    });

    it('should use section howToWrite as fallback for unknown sections', () => {
      const customSection = {
        ...SECTION_BRICKS[0],
        id: 'custom',
        howToWrite: 'Custom instructions here',
      };
      
      const prompt = generateSectionPrompt(customSection, mockStack, 'MyApp');
      expect(prompt).toContain('Custom instructions here');
    });
  });

  describe('SECTION_BRICKS validation', () => {
    it('should have unique IDs', () => {
      const ids = SECTION_BRICKS.map(s => s.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have required sections marked correctly', () => {
      const requiredSections = SECTION_BRICKS.filter(s => s.isRequired);
      const requiredIds = requiredSections.map(s => s.id);

      expect(requiredIds).toContain('header');
      expect(requiredIds).toContain('installation');
      expect(requiredIds).toContain('license');
    });

    it('should have all sections with valid order numbers', () => {
      SECTION_BRICKS.forEach(section => {
        expect(section.order).toBeGreaterThan(0);
        expect(section.order).toBeLessThanOrEqual(20);
      });
    });
  });
});