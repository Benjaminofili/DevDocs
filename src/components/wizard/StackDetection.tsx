// src/components/wizard/StackDetection.tsx

'use client';

import React from 'react';
import { CheckCircle, Package, GitBranch, FileCode, ChevronRight, ChevronLeft } from 'lucide-react';
import { useReadmeStore } from '@/store/readme-store';

export function StackDetection() {
  const { stack, setCurrentStep } = useReadmeStore();
  
  if (!stack) return null;

  const getStackIcon = (stackType: string) => {
    // You can expand this with actual framework logos
    const icons: Record<string, string> = {
      nextjs: '▲',
      react: '⚛️',
      vue: '💚',
      angular: '🅰️',
      express: '🚂',
      nestjs: '🐈',
      django: '🐍',
      flask: '🌶️',
      fastapi: '⚡',
      go: '🐹',
      rust: '🦀',
    };
    return icons[stackType] || '📦';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border 
                      border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl">{getStackIcon(stack.primary)}</span>
            We detected your stack!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Here's what we found in your project. We'll use this to customize your README.
          </p>
        </div>

        {/* Detection Results */}
        <div className="p-6 space-y-6">
          {/* Primary Stack */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 
                          dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 
                          dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                  Primary Framework
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stack.primary.charAt(0).toUpperCase() + stack.primary.slice(1)}
                </p>
              </div>
              <div className="text-5xl opacity-50">
                {getStackIcon(stack.primary)}
              </div>
            </div>
          </div>

          {/* Detection Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Language */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Language
                </span>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {stack.language}
              </p>
            </div>

            {/* Package Manager */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Package Manager
                </span>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {stack.packageManager}
              </p>
            </div>
          </div>

          {/* Detected Frameworks */}
          {stack.frameworks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Detected Frameworks & Libraries
              </h3>
              <div className="flex flex-wrap gap-2">
                {stack.frameworks.map((framework) => (
                  <span
                    key={framework}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 
                             dark:text-blue-300 rounded-full text-sm font-medium"
                  >
                    {framework}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features Detected */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Project Features
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Docker Setup', value: stack.hasDocker },
                { label: 'CI/CD Pipeline', value: stack.hasCI },
                { label: 'Testing Suite', value: stack.hasTesting },
                { label: 'Environment Config', value: stack.hasEnvFile },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle 
                    className={`w-5 h-5 ${
                      value 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                  <span className={`text-sm ${
                    value 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 
                        dark:bg-gray-900 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep('input')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 
                     dark:text-gray-400 hover:text-gray-900 dark:hover:text-white 
                     transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={() => setCurrentStep('select')}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white 
                     font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Sections
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
