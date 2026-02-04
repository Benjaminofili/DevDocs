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
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white dark:text-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Documentation Generator
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                  Professional README generation
                </p>
              </div>
            </div>
            
            {/* Step Counter - Compact on mobile */}
            <div className="flex-shrink-0">
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium whitespace-nowrap">
                <span className="hidden xs:inline">Step </span>
                {STEPS.findIndex(step => step.id === currentStep) + 1}/{STEPS.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8">
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
        <div className="mt-6 sm:mt-8 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-white mb-0.5 sm:mb-1">
                Current Status:
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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