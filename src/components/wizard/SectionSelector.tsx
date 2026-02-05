// src/components/wizard/SectionSelector.tsx

'use client';

import React from 'react';
import { Check, Star, Lock, ChevronRight, ChevronLeft } from 'lucide-react';
import { WhyThisSection } from '../education/WhyThisSection';
import { STACK_EDUCATION } from '@/data/educational-content';
import { useReadmeStore } from '@/store/readme-store';
import { GeneratedSection } from '@/types';
import { logger } from '@/lib/logger';

interface PackageJson {
  name?: string;
  version?: string;
  [key: string]: unknown;
}

export function SectionSelector() {
  const { 
    availableSections, 
    selectedSectionIds, 
    stack, 
    toggleSection,
    setLoading,
    setCurrentStep,
    addGeneratedSection,
    projectName,
    repoUrl,
    repoData, // ✅ Add repoData from store
    isLoading,
    setGeneratedSections
  } = useReadmeStore();

  if (!stack) return null;

  const stackEducation = STACK_EDUCATION[stack.primary];

  const handleGenerate = async () => {
    setLoading(true);
    setCurrentStep('generate');
    
    // Clear previous generated sections
    setGeneratedSections([]);
    
    const generated: GeneratedSection[] = [];

    for (let i = 0; i < selectedSectionIds.length; i++) {
      const sectionId = selectedSectionIds[i];
      
      try {
        // Add delay between requests to avoid rate limits
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId,
            stack,
            projectName,
            repoUrl, // ✅ Pass repoUrl
            repoData, // ✅ Pass actual repo data
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          const section: GeneratedSection = {
            id: sectionId,
            content: data.data.content,
            explanation: data.data.explanation,
          };
          generated.push(section);
          addGeneratedSection(section);
        } else {
          logger.error(`Failed to generate ${sectionId}:`, data.error);
          const errorSection: GeneratedSection = {
            id: sectionId,
            content: `## ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}\n\n*Content generation failed. Please try again.*`,
            explanation: 'Generation failed - please retry.',
          };
          generated.push(errorSection);
          addGeneratedSection(errorSection);
        }
      } catch (error) {
        logger.error(`Failed to generate ${sectionId}:`, error);
        const errorSection: GeneratedSection = {
          id: sectionId,
          content: `## ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}\n\n*Error generating content. Please try again.*`,
          explanation: 'An error occurred during generation.',
        };
        generated.push(errorSection);
        addGeneratedSection(errorSection);
      }
    }

    setCurrentStep('preview');
    setLoading(false);
  };

  // Type-safe access to packageJson
  const packageJson = repoData?.packageJson as PackageJson | undefined;

  return (
    <div className="space-y-6">
      {/* Stack Tips Banner */}
      {stackEducation?.overview && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">
            💡 Tips for {stack.primary.charAt(0).toUpperCase() + stack.primary.slice(1)} READMEs
          </h3>
          <p className="text-indigo-100 text-sm">{stackEducation.overview}</p>
          
          {stackEducation.bestPractices.length > 0 && (
            <ul className="mt-3 space-y-1">
              {stackEducation.bestPractices.slice(0, 3).map((tip, i) => (
                <li key={i} className="text-sm text-indigo-100 flex items-start gap-2">
                  <span className="text-indigo-300">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Repository Info Banner - Show what was detected */}
      {repoData && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="text-green-600 dark:text-green-400">
              <Check className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                Repository Analyzed Successfully
              </h4>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p>📁 {repoData.structure?.length || 0} files detected</p>
                {packageJson && (
                  <p>📦 Package: {packageJson.name || projectName} v{packageJson.version || '1.0.0'}</p>
                )}
                {repoData.hasDocker && <p>🐳 Docker configuration found</p>}
                {repoData.hasTests && <p>🧪 Test suite detected</p>}
                {repoData.hasCI && <p>🔄 CI/CD pipeline configured</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border 
                      border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Choose Your Sections
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            We&apos;ve pre-selected recommended sections for your {stack.primary} project. 
            Toggle sections on/off based on your needs.
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {availableSections.map((section) => {
            const isSelected = selectedSectionIds.includes(section.id);
            const isRequired = section.isRequired;

            return (
              <div
                key={section.id}
                className={`p-4 transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => !isRequired && toggleSection(section.id)}
                    disabled={isRequired}
                    className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center 
                               justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    } ${isRequired ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    {isRequired && !isSelected && <Lock className="w-3 h-3" />}
                  </button>

                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {section.name}
                      </h3>
                      {section.isRecommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 
                                        bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          <Star className="w-3 h-3" />
                          Recommended
                        </span>
                      )}
                      {isRequired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 
                                        bg-red-100 text-red-800 text-xs rounded-full">
                          <Lock className="w-3 h-3" />
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {section.description}
                    </p>
                    
                    {/* Educational Link */}
                    <div className="mt-2">
                      <WhyThisSection section={section} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep('detect')}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 
                     dark:text-gray-400 hover:text-gray-900 dark:hover:text-white 
                     transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-sm text-gray-500">
          {selectedSectionIds.length} sections selected
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || selectedSectionIds.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white 
                     rounded-lg hover:bg-blue-700 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white 
                              rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate README
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}