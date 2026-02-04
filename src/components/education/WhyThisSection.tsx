// src/components/education/WhyThisSection.tsx

'use client';

import React, { useState } from 'react';
import { HelpCircle, ExternalLink, PlayCircle, X } from 'lucide-react';
import { SectionConfig } from '@/types';

interface WhyThisSectionProps {
  section: SectionConfig;
  aiExplanation?: string;
}

export function WhyThisSection({ section, aiExplanation }: WhyThisSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 
                   dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        Why do I need this?
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full 
                          max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b 
                            border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                📚 Why "{section.name}"?
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Main Explanation */}
              <div className="prose dark:prose-invert prose-sm">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {section.whyImportant}
                </p>
              </div>

              {/* AI-Generated Personalized Explanation */}
              {aiExplanation && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 
                                dark:from-purple-900/20 dark:to-blue-900/20 
                                rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      ✨ For Your Stack
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {aiExplanation}
                  </p>
                </div>
              )}

              {/* How To Write */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  ✍️ How to write this section:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {section.howToWrite}
                </p>
              </div>

              {/* Resources */}
              <div className="flex flex-wrap gap-2">
                {section.videoUrl && (
                  <a
                    href={section.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm 
                               bg-red-100 text-red-700 rounded-lg hover:bg-red-200 
                               transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Watch Tutorial
                  </a>
                )}
                {section.docsUrl && (
                  <a
                    href={section.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm 
                               bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 
                               transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Read More
                  </a>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 
                            bg-gray-50 dark:bg-gray-900 rounded-b-xl">
              <p className="text-xs text-gray-500 text-center">
                💡 Pro tip: A great README can be the difference between someone 
                using your project or moving on!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}