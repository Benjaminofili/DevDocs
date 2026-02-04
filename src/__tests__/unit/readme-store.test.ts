// src/__tests__/unit/readme-store.test.ts

import { useReadmeStore } from '@/store/readme-store';
import { DetectedStack, SectionConfig } from '@/types';

describe('useReadmeStore', () => {
  beforeEach(() => {
    // Reset store before each test using getState/setState
    useReadmeStore.setState({
      projectName: '',
      repoUrl: '',
      stack: null,
      availableSections: [],
      selectedSectionIds: [],
      generatedSections: [],
      currentStep: 'input',
      isLoading: false,
    });
  });

  describe('setProjectInfo', () => {
    it('should set project name and repo URL', () => {
      useReadmeStore.getState().setProjectInfo('Test Project', 'https://github.com/test/repo');

      const state = useReadmeStore.getState();
      expect(state.projectName).toBe('Test Project');
      expect(state.repoUrl).toBe('https://github.com/test/repo');
    });
  });

  describe('setStack', () => {
    it('should set detected stack', () => {
      const mockStack: DetectedStack = {
        primary: 'nextjs',
        secondary: [],
        language: 'TypeScript',
        packageManager: 'npm',
        hasDocker: false,
        hasCI: true,
        hasTesting: true,
        hasEnvFile: true,
        frameworks: ['Next.js', 'React', 'Tailwind CSS'],
        dependencies: {},
      };

      useReadmeStore.getState().setStack(mockStack);

      const state = useReadmeStore.getState();
      expect(state.stack).toEqual(mockStack);
    });
  });

  describe('setAvailableSections', () => {
    it('should set sections and auto-select recommended ones', () => {
      const mockSections: SectionConfig[] = [
        {
          id: 'header',
          name: 'Header',
          description: 'Test',
          whyImportant: 'Test',
          howToWrite: 'Test',
          isRecommended: true,
          isRequired: true,
          stackSpecific: [],
          template: 'header',
          order: 1,
        },
        {
          id: 'features',
          name: 'Features',
          description: 'Test',
          whyImportant: 'Test',
          howToWrite: 'Test',
          isRecommended: false,
          isRequired: false,
          stackSpecific: [],
          template: 'features',
          order: 2,
        },
      ];

      useReadmeStore.getState().setAvailableSections(mockSections);

      const state = useReadmeStore.getState();
      expect(state.availableSections).toEqual(mockSections);
      expect(state.selectedSectionIds).toEqual(['header']); // Only required/recommended
    });

    it('should auto-select both required and recommended sections', () => {
      const mockSections: SectionConfig[] = [
        {
          id: 'header',
          name: 'Header',
          description: 'Test',
          whyImportant: 'Test',
          howToWrite: 'Test',
          isRecommended: false,
          isRequired: true,
          stackSpecific: [],
          template: 'header',
          order: 1,
        },
        {
          id: 'features',
          name: 'Features',
          description: 'Test',
          whyImportant: 'Test',
          howToWrite: 'Test',
          isRecommended: true,
          isRequired: false,
          stackSpecific: [],
          template: 'features',
          order: 2,
        },
        {
          id: 'optional',
          name: 'Optional',
          description: 'Test',
          whyImportant: 'Test',
          howToWrite: 'Test',
          isRecommended: false,
          isRequired: false,
          stackSpecific: [],
          template: 'optional',
          order: 3,
        },
      ];

      useReadmeStore.getState().setAvailableSections(mockSections);

      const state = useReadmeStore.getState();
      expect(state.selectedSectionIds).toContain('header');
      expect(state.selectedSectionIds).toContain('features');
      expect(state.selectedSectionIds).not.toContain('optional');
    });
  });

  describe('toggleSection', () => {
    it('should toggle non-required section', () => {
      const mockSections: SectionConfig[] = [
        {
          id: 'features',
          name: 'Features',
          description: 'Test',
          whyImportant: 'Test',
          howToWrite: 'Test',
          isRecommended: false,
          isRequired: false,
          stackSpecific: [],
          template: 'features',
          order: 1,
        },
      ];

      useReadmeStore.getState().setAvailableSections(mockSections);

      // Initially not selected
      expect(useReadmeStore.getState().selectedSectionIds).not.toContain('features');

      // Toggle on
      useReadmeStore.getState().toggleSection('features');
      expect(useReadmeStore.getState().selectedSectionIds).toContain('features');

      // Toggle off
      useReadmeStore.getState().toggleSection('features');
      expect(useReadmeStore.getState().selectedSectionIds).not.toContain('features');
    });

    it('should NOT toggle required section', () => {
      const mockSections: SectionConfig[] = [
        {
          id: 'header',
          name: 'Header',
          description: 'Test',
          whyImportant: 'Test',
          howToWrite: 'Test',
          isRecommended: true,
          isRequired: true,
          stackSpecific: [],
          template: 'header',
          order: 1,
        },
      ];

      useReadmeStore.getState().setAvailableSections(mockSections);
      expect(useReadmeStore.getState().selectedSectionIds).toContain('header');

      // Try to toggle off (should not work)
      useReadmeStore.getState().toggleSection('header');
      expect(useReadmeStore.getState().selectedSectionIds).toContain('header');
    });
  });

  describe('addGeneratedSection', () => {
    it('should add generated section to array', () => {
      const mockSection = {
        id: 'header',
        content: '# Test Project',
        explanation: 'This is the header',
      };

      useReadmeStore.getState().addGeneratedSection(mockSection);

      const state = useReadmeStore.getState();
      expect(state.generatedSections).toHaveLength(1);
      expect(state.generatedSections[0]).toEqual(mockSection);
    });

    it('should append multiple sections', () => {
      useReadmeStore.getState().addGeneratedSection({ id: '1', content: 'A', explanation: 'A' });
      useReadmeStore.getState().addGeneratedSection({ id: '2', content: 'B', explanation: 'B' });

      const state = useReadmeStore.getState();
      expect(state.generatedSections).toHaveLength(2);
    });
  });

  describe('setGeneratedSections', () => {
    it('should replace all generated sections', () => {
      // Add some initial sections
      useReadmeStore.getState().addGeneratedSection({ id: '1', content: 'A', explanation: 'A' });

      // Replace with new array
      useReadmeStore.getState().setGeneratedSections([
        { id: '2', content: 'B', explanation: 'B' },
        { id: '3', content: 'C', explanation: 'C' },
      ]);

      const state = useReadmeStore.getState();
      expect(state.generatedSections).toHaveLength(2);
      expect(state.generatedSections[0].id).toBe('2');
    });
  });

  describe('setCurrentStep', () => {
    it('should update current step', () => {
      expect(useReadmeStore.getState().currentStep).toBe('input');

      useReadmeStore.getState().setCurrentStep('detect');
      expect(useReadmeStore.getState().currentStep).toBe('detect');

      useReadmeStore.getState().setCurrentStep('preview');
      expect(useReadmeStore.getState().currentStep).toBe('preview');
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      expect(useReadmeStore.getState().isLoading).toBe(false);

      useReadmeStore.getState().setLoading(true);
      expect(useReadmeStore.getState().isLoading).toBe(true);

      useReadmeStore.getState().setLoading(false);
      expect(useReadmeStore.getState().isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set some values
      useReadmeStore.getState().setProjectInfo('Test', 'https://github.com/test/repo');
      useReadmeStore.getState().setCurrentStep('preview');
      useReadmeStore.getState().setLoading(true);
      useReadmeStore.getState().addGeneratedSection({ id: '1', content: 'A', explanation: 'A' });

      // Reset
      useReadmeStore.getState().reset();

      const state = useReadmeStore.getState();
      expect(state.projectName).toBe('');
      expect(state.repoUrl).toBe('');
      expect(state.currentStep).toBe('input');
      expect(state.isLoading).toBe(false);
      expect(state.generatedSections).toEqual([]);
      expect(state.stack).toBeNull();
    });
  });
});