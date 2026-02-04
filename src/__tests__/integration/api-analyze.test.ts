// src/__tests__/integration/api-analyze.test.ts

import { StackAnalyzer } from '@/lib/analyzers';
import { getSectionsForStack } from '@/lib/bricks';

// Test the core logic, not the API route directly
describe('Analyze Integration', () => {
  describe('StackAnalyzer + getSectionsForStack', () => {
    it('should analyze Next.js project and return correct sections', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({
            dependencies: {
              next: '^14.0.0',
              react: '^18.0.0',
              typescript: '^5.0.0',
            },
            devDependencies: {
              tailwindcss: '^3.0.0',
              jest: '^29.0.0',
            },
          }),
        },
        { name: 'Dockerfile', content: '' },
        { name: '.github/workflows/ci.yml', content: '' },
        { name: '.env.example', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const stack = analyzer.analyze();
      const sections = getSectionsForStack(stack);

      // Verify stack detection
      expect(stack.primary).toBe('nextjs');
      expect(stack.language).toBe('TypeScript');
      expect(stack.hasDocker).toBe(true);
      expect(stack.hasCI).toBe(true);
      expect(stack.hasTesting).toBe(true);
      expect(stack.hasEnvFile).toBe(true);

      // Verify sections include Docker (because hasDocker is true)
      const dockerSection = sections.find(s => s.id === 'docker');
      expect(dockerSection?.isRecommended).toBe(true);

      // Verify scripts is included for Next.js
      expect(sections.some(s => s.id === 'scripts')).toBe(true);

      // Verify api-docs is NOT included (Next.js is frontend)
      expect(sections.some(s => s.id === 'api-docs')).toBe(false);
    });

    it('should analyze Django project and return correct sections', () => {
      const files = [
        {
          name: 'requirements.txt',
          content: 'django==4.2\ndjangorestframework==3.14\npytest==7.0',
        },
        { name: 'manage.py', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const stack = analyzer.analyze();
      const sections = getSectionsForStack(stack);

      expect(stack.primary).toBe('django');
      expect(stack.language).toBe('Python');
      expect(stack.packageManager).toBe('pip');
      expect(stack.hasTesting).toBe(true);

      // api-docs should be included for Django (backend framework)
      expect(sections.some(s => s.id === 'api-docs')).toBe(true);
    });

    it('should analyze Express project and return correct sections', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({
            dependencies: {
              express: '^4.18.0',
            },
          }),
        },
      ];

      const analyzer = new StackAnalyzer(files);
      const stack = analyzer.analyze();
      const sections = getSectionsForStack(stack);

      expect(stack.primary).toBe('express');
      expect(sections.some(s => s.id === 'api-docs')).toBe(true);
      expect(sections.some(s => s.id === 'scripts')).toBe(true);
    });
  });
});