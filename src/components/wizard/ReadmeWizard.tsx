// src/components/wizard/ReadmeWizard.tsx

'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { RepoInput } from './RepoInput';
import { StackDetection } from './StackDetection';
import { SectionSelector } from './SectionSelector';
import { PreviewEditor } from './PreviewEditor';
import { StepIndicator } from './StepIndicator';
import { useReadmeStore } from '@/store/readme-store';

const STEPS = [
  { id: 'input', label: 'Project' },
  { id: 'detect', label: 'Detect Stack' },
  { id: 'select', label: 'Sections' },
  { id: 'generate', label: 'Generate' },
  { id: 'preview', label: 'Preview' },
];

export function ReadmeWizard() {
  const { currentStep } = useReadmeStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Documentation Generator
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Professional README generation for production projects
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Step {STEPS.findIndex(step => step.id === currentStep) + 1} of {STEPS.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="animate-slide-up">
          {currentStep === 'input' && <RepoInput />}
          
          {currentStep === 'detect' && <StackDetection />}
          
          {currentStep === 'select' && <SectionSelector />}
          
          {(currentStep === 'generate' || currentStep === 'preview') && <PreviewEditor />}
        </div>

        {/* Status Indicator */}
        <div className="mt-8 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">Current Status:</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentStep === 'input' && "Configure project details for analysis"}
                {currentStep === 'detect' && "Analyzing repository structure and dependencies"}
                {currentStep === 'select' && "Select documentation sections for generation"}
                {(currentStep === 'generate' || currentStep === 'preview') && "Generating and validating documentation"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
