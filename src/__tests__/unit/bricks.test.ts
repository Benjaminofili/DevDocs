// src/__tests__/unit/bricks.test.ts

import { getSectionsForStack, SECTION_BRICKS } from '@/lib/bricks';
import { DetectedStack } from '@/types';

describe('getSectionsForStack', () => {
  const baseStack: DetectedStack = {
    primary: 'nextjs',
    secondary: [],
    language: 'TypeScript',
    packageManager: 'npm',
    hasDocker: false,
    hasCI: false,
    hasTesting: false,
    hasEnvFile: false,
    frameworks: [],
    dependencies: {},
    domainHints: [],
  };

  it('should return all non-stack-specific sections', () => {
    const sections = getSectionsForStack(baseStack);
    
    expect(sections).toContainEqual(
      expect.objectContaining({ id: 'header' })
    );
    expect(sections).toContainEqual(
      expect.objectContaining({ id: 'features' })
    );
    expect(sections).toContainEqual(
      expect.objectContaining({ id: 'installation' })
    );
  });

  it('should include stack-specific sections for Next.js', () => {
    const sections = getSectionsForStack(baseStack);
    
    // scripts is included for nextjs
    expect(sections).toContainEqual(
      expect.objectContaining({ id: 'scripts' })
    );
  });

  it('should NOT include api-docs for Next.js (frontend framework)', () => {
    const sections = getSectionsForStack(baseStack);
    
    // api-docs is only for backend frameworks (express, django, etc.)
    const apiDocs = sections.find(s => s.id === 'api-docs');
    expect(apiDocs).toBeUndefined();
  });

  it('should include api-docs for Express (backend framework)', () => {
    const expressStack: DetectedStack = {
      ...baseStack,
      primary: 'express',
    };

    const sections = getSectionsForStack(expressStack);
    const apiDocs = sections.find(s => s.id === 'api-docs');
    
    expect(apiDocs).toBeDefined();
  });

  it('should mark Docker as recommended if hasDocker is true', () => {
    const stackWithDocker: DetectedStack = {
      ...baseStack,
      hasDocker: true,
    };

    const sections = getSectionsForStack(stackWithDocker);
    const dockerSection = sections.find(s => s.id === 'docker');

    expect(dockerSection?.isRecommended).toBe(true);
  });

  it('should mark Docker as not recommended if hasDocker is false', () => {
    const sections = getSectionsForStack(baseStack);
    const dockerSection = sections.find(s => s.id === 'docker');

    expect(dockerSection?.isRecommended).toBe(false);
  });

  it('should mark testing as recommended if hasTesting is true', () => {
    const stackWithTesting: DetectedStack = {
      ...baseStack,
      hasTesting: true,
    };

    const sections = getSectionsForStack(stackWithTesting);
    const testingSection = sections.find(s => s.id === 'testing');

    expect(testingSection?.isRecommended).toBe(true);
  });

  it('should return sections sorted by order', () => {
    const sections = getSectionsForStack(baseStack);
    
    for (let i = 1; i < sections.length; i++) {
      expect(sections[i].order).toBeGreaterThanOrEqual(sections[i - 1].order);
    }
  });

  it('should include all required sections', () => {
    const sections = getSectionsForStack(baseStack);
    const requiredSections = sections.filter(s => s.isRequired);

    expect(requiredSections).toContainEqual(
      expect.objectContaining({ id: 'header' })
    );
    expect(requiredSections).toContainEqual(
      expect.objectContaining({ id: 'installation' })
    );
    expect(requiredSections).toContainEqual(
      expect.objectContaining({ id: 'license' })
    );
  });

  it('should have correct number of bricks defined', () => {
    expect(SECTION_BRICKS.length).toBe(12);
  });
});