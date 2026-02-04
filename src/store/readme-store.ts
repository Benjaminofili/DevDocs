// src/store/readme-store.ts

import { create } from 'zustand';
import { DetectedStack, SectionConfig, GeneratedSection } from '@/types';

// ✅ Add interfaces for repo data
interface RepoFile {
    name: string;
    content: string;
}

interface RepoData {
    files: RepoFile[];
    structure: string[];
    packageJson?: Record<string, unknown>;
    readmeExists?: boolean;
    existingReadme?: string;
    envExample?: string;
    hasDocker?: boolean;
    hasTests?: boolean;
    hasCI?: boolean;
}

interface ReadmeState {
    // Project info
    projectName: string;
    repoUrl: string;

    // ✅ NEW: Repository data
    repoData: RepoData | null;

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
    setRepoData: (data: RepoData) => void;
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
    repoData: null,
    stack: null,
    availableSections: [],
    selectedSectionIds: [],
    generatedSections: [],
    currentStep: 'input',
    isLoading: false,

    // Actions
    setProjectInfo: (name, url) => set({ projectName: name, repoUrl: url }),

    // ✅ NEW: Set repo data
    setRepoData: (data) => set({ repoData: data }),

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

    setGeneratedSections: (sections) => set({ generatedSections: sections }),

    setCurrentStep: (step) => set({ currentStep: step }),

    setLoading: (loading) => set({ isLoading: loading }),

    reset: () => set({
        projectName: '',
        repoUrl: '',
        repoData: null,
        stack: null,
        availableSections: [],
        selectedSectionIds: [],
        generatedSections: [],
        currentStep: 'input',
        isLoading: false,
    }),
}));