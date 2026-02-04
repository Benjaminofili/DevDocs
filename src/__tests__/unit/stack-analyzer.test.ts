// src/__tests__/unit/stack-analyzer.test.ts

import { StackAnalyzer } from '@/lib/analyzers';

describe('StackAnalyzer', () => {
  describe('Next.js detection', () => {
    it('should detect Next.js with TypeScript', () => {
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
            },
          }),
        },
        { name: 'package-lock.json', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.primary).toBe('nextjs');
      expect(result.language).toBe('TypeScript');
      expect(result.packageManager).toBe('npm');
      expect(result.frameworks).toContain('Next.js');
      expect(result.frameworks).toContain('Tailwind CSS');
    });

    it('should detect pnpm as package manager', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({
            dependencies: { next: '^14.0.0' },
          }),
        },
        { name: 'pnpm-lock.yaml', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.packageManager).toBe('pnpm');
    });

    it('should detect yarn as package manager', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({
            dependencies: { next: '^14.0.0' },
          }),
        },
        { name: 'yarn.lock', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.packageManager).toBe('yarn');
    });
  });

  describe('React detection', () => {
    it('should detect React project', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({
            dependencies: {
              react: '^18.0.0',
              'react-dom': '^18.0.0',
            },
          }),
        },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.primary).toBe('react');
      expect(result.language).toBe('JavaScript');
      expect(result.frameworks).toContain('React');
    });
  });

  describe('Django detection', () => {
    it('should detect Django with manage.py', () => {
      const files = [
        {
          name: 'requirements.txt',
          content: 'django==4.2\npytest==7.0',
        },
        { name: 'manage.py', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.primary).toBe('django');
      expect(result.language).toBe('Python');
      expect(result.packageManager).toBe('pip');
      expect(result.frameworks).toContain('Django');
      expect(result.hasTesting).toBe(true);
    });

    it('should detect poetry as package manager', () => {
      const files = [
        {
          name: 'requirements.txt',
          content: 'django==4.2',
        },
        { name: 'poetry.lock', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.packageManager).toBe('poetry');
    });
  });

  describe('Go detection', () => {
    it('should detect Go project with Gin framework', () => {
      const files = [
        {
          name: 'go.mod',
          content: `module example.com/app

require (
    github.com/gin-gonic/gin v1.9.0
)`,
        },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.primary).toBe('go');
      expect(result.language).toBe('Go');
      expect(result.packageManager).toBe('go');
      expect(result.frameworks).toContain('Gin');
    });
  });

  describe('Rust detection', () => {
    it('should detect Rust project with Axum', () => {
      const files = [
        {
          name: 'Cargo.toml',
          content: `[package]
name = "my-app"
version = "0.1.0"

[dependencies]
axum = "0.6"`,
        },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.primary).toBe('rust');
      expect(result.language).toBe('Rust');
      expect(result.packageManager).toBe('cargo');
      expect(result.frameworks).toContain('Axum');
    });
  });

  describe('Feature detection', () => {
    it('should detect Docker', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({ dependencies: { next: '^14.0.0' } }),
        },
        { name: 'Dockerfile', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.hasDocker).toBe(true);
    });

    it('should detect CI/CD', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({ dependencies: { next: '^14.0.0' } }),
        },
        { name: '.github/workflows/ci.yml', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.hasCI).toBe(true);
    });

    it('should detect testing framework', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({
            dependencies: { react: '^18.0.0' },
            devDependencies: { jest: '^29.0.0' },
          }),
        },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.hasTesting).toBe(true);
    });

    it('should detect env file', () => {
      const files = [
        {
          name: 'package.json',
          content: JSON.stringify({ dependencies: { next: '^14.0.0' } }),
        },
        { name: '.env.example', content: '' },
      ];

      const analyzer = new StackAnalyzer(files);
      const result = analyzer.analyze();

      expect(result.hasEnvFile).toBe(true);
    });
  });
});