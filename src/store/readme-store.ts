// src/store/readme-store.ts

import { create } from 'zustand';
import { DetectedStack, SectionConfig, GeneratedSection } from '@/types';

interface ReadmeState {
    // Project info
    projectName: string;
    repoUrl: string;

    // Stack detection
    stack: DetectedStack | null;

    // Sections
    availableSections: SectionConfig[];
    selectedSectionIds: string[];
    generatedSections: GeneratedSection[];

    // UI state
    currentStep: 'input' | 'detect' | 'select' | 'generate' | 'preview';
    isLoading: boolean;

    // Actions
    setProjectInfo: (name: string, url: string) => void;
    setStack: (stack: DetectedStack) => void;
    setAvailableSections: (sections: SectionConfig[]) => void;
    toggleSection: (id: string) => void;
    addGeneratedSection: (section: GeneratedSection) => void;
    setGeneratedSections: (sections: GeneratedSection[]) => void;
    setCurrentStep: (step: ReadmeState['currentStep']) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

export const useReadmeStore = create<ReadmeState>((set) => ({
    // Initial state
    projectName: '',
    repoUrl: '',
    stack: null,
    availableSections: [],
    selectedSectionIds: [],
    generatedSections: [],
    currentStep: 'input',
    isLoading: false,

    // Actions
    setProjectInfo: (name, url) => set({ projectName: name, repoUrl: url }),

    setStack: (stack) => set({ stack }),

    setAvailableSections: (sections) => set({
        availableSections: sections,
        selectedSectionIds: sections
            .filter(s => s.isRecommended || s.isRequired)
            .map(s => s.id)
    }),

    toggleSection: (id) => set((state) => {
        const section = state.availableSections.find(s => s.id === id);
        if (section?.isRequired) return state;

        return {
            selectedSectionIds: state.selectedSectionIds.includes(id)
                ? state.selectedSectionIds.filter(sid => sid !== id)
                : [...state.selectedSectionIds, id]
        };
    }),

    addGeneratedSection: (section) => set((state) => ({
        generatedSections: [...state.generatedSections, section]
    })),

    // ✅ New action for full updates
    setGeneratedSections: (sections) => set({ generatedSections: sections }),

    setCurrentStep: (step) => set({ currentStep: step }),

    setLoading: (loading) => set({ isLoading: loading }),

    reset: () => set({
        projectName: '',
        repoUrl: '',
        stack: null,
        availableSections: [],
        selectedSectionIds: [],
        generatedSections: [],
        currentStep: 'input',
        isLoading: false,
    }),
}));