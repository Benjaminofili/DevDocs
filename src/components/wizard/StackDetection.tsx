// src/components/wizard/StackDetection.tsx

'use client';

import React from 'react';
import { CheckCircle, Package, FileCode, ChevronRight, ChevronLeft, Database, Terminal } from 'lucide-react';
import { useReadmeStore } from '@/store/readme-store';

export function StackDetection() {
  const { stack, repoData, setCurrentStep } = useReadmeStore(); // ✅ Add repoData
  
  if (!stack) return null;

  const getStackIcon = (stackType: string) => {
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

  // ✅ Extract package.json info if available
  const packageInfo = repoData?.packageJson as Record<string, unknown> | undefined;
  const scripts = packageInfo?.scripts as Record<string, string> | undefined;
  const dependencies = packageInfo?.dependencies as Record<string, string> | undefined;

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
            Here&apos;s what we found in your project. We&apos;ll use this to customize your README.
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

          {/* ✅ NEW: Repository Data Section */}
          {repoData && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Repository Analysis
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Files Detected */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                    Files Analyzed
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {repoData.structure?.length || 0}
                  </p>
                </div>

                {/* Dependencies Count */}
                {dependencies && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                      Dependencies
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Object.keys(dependencies).length}
                    </p>
                  </div>
                )}
              </div>

              {/* Available Scripts */}
              {scripts && Object.keys(scripts).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Available Scripts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(scripts).slice(0, 8).map((script) => (
                      <code
                        key={script}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 
                                 dark:text-gray-300 rounded text-sm font-mono"
                      >
                        {script}
                      </code>
                    ))}
                    {Object.keys(scripts).length > 8 && (
                      <span className="px-2 py-1 text-gray-500 text-sm">
                        +{Object.keys(scripts).length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Key Dependencies */}
              {dependencies && Object.keys(dependencies).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Key Dependencies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(dependencies).slice(0, 10).map((dep) => (
                      <span
                        key={dep}
                        className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 
                                 dark:text-indigo-300 rounded text-sm"
                      >
                        {dep}
                      </span>
                    ))}
                    {Object.keys(dependencies).length > 10 && (
                      <span className="px-2 py-1 text-gray-500 text-sm">
                        +{Object.keys(dependencies).length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Features Detected */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Project Features
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Docker Setup', value: stack.hasDocker || repoData?.hasDocker },
                { label: 'CI/CD Pipeline', value: stack.hasCI || repoData?.hasCI },
                { label: 'Testing Suite', value: stack.hasTesting || repoData?.hasTests },
                { label: 'Environment Config', value: stack.hasEnvFile || !!repoData?.envExample },
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

          {/* ✅ Data Quality Indicator */}
          <div className={`rounded-lg p-4 ${
            repoData?.packageJson 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <p className={`text-sm ${
              repoData?.packageJson 
                ? 'text-green-800 dark:text-green-300' 
                : 'text-yellow-800 dark:text-yellow-300'
            }`}>
              {repoData?.packageJson ? (
                <>
                  ✅ <strong>High accuracy mode:</strong> Full package.json analysis available. 
                  Generated content will be based on actual project data.
                </>
              ) : (
                <>
                  ⚠️ <strong>Limited data:</strong> Could not fetch full project details. 
                  Generated content may need manual adjustments.
                </>
              )}
            </p>
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