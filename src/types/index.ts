// src/types/index.ts

export type StackType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'angular'
  | 'express'
  | 'nestjs'
  | 'django'
  | 'flask'
  | 'fastapi'
  | 'go'
  | 'rust'
  | 'unknown';

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'groq';

export interface DetectedStack {
  primary: StackType;
  secondary: StackType[];
  language: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'go' | 'cargo';
  hasDocker: boolean;
  hasCI: boolean;
  hasTesting: boolean;
  hasEnvFile: boolean;
  frameworks: string[];
  dependencies: Record<string, string>;
  domainHints: string[];
}

export interface RepoAnalysis {
  name: string;
  description: string | null;
  stack: DetectedStack;
  suggestedSections: SectionConfig[];
  files: string[];
}

export interface SectionConfig {
  id: string;
  name: string;
  description: string;
  whyImportant: string;
  howToWrite: string;
  videoUrl?: string;
  docsUrl?: string;
  isRecommended: boolean;
  isRequired: boolean;
  stackSpecific: StackType[];
  template: string;
  order: number;
}

export interface GeneratedSection {
  id: string;
  content: string;
  explanation: string;
}

export interface ReadmeConfig {
  repoUrl?: string;
  projectName: string;
  stack: DetectedStack;
  selectedSections: string[];
  customizations: Record<string, string>;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  tokensUsed?: number;
}