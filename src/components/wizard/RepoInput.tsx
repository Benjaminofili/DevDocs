// src/components/wizard/RepoInput.tsx

'use client';

import React, { useState } from 'react';
import { Github, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { useReadmeStore } from '@/store/readme-store';
import { logger } from '@/lib/logger';

export function RepoInput() {
  const { 
    setProjectInfo, 
    setStack, 
    setAvailableSections, 
    setRepoData, // ✅ Add setRepoData
    setCurrentStep,
    setLoading,
    isLoading 
  } = useReadmeStore();

  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('url');
  const [error, setError] = useState('');

  const validateGitHubUrl = (url: string): boolean => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    if (inputMethod === 'url') {
      if (!repoUrl.trim()) {
        setError('Please enter a GitHub URL');
        return;
      }
      if (!validateGitHubUrl(repoUrl)) {
        setError('Please enter a valid GitHub repository URL');
        return;
      }
    }

    // Capture values before async
    const currentRepoUrl = repoUrl;
    const currentProjectName = projectName;

    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: currentRepoUrl }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update Store
        setProjectInfo(currentProjectName, currentRepoUrl);
        setStack(data.data.stack);
        setAvailableSections(data.data.suggestedSections);
        
        // ✅ Store the repo data for accurate generation
        if (data.data.repoData) {
          setRepoData(data.data.repoData);
          logger.info('Repo data stored:', {
            files: data.data.repoData.structure?.length || 0,
            hasPackageJson: !!data.data.repoData.packageJson,
            hasEnvExample: !!data.data.repoData.envExample,
          });
        }
        
        // Move to next step
        setCurrentStep('detect');
      } else {
        setError(data.error || 'Failed to analyze repository');
      }
    } catch (err) {
      logger.error('Failed to analyze repo:', err);
      setError('An error occurred while analyzing the repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-100 p-6 text-white dark:text-slate-900">
          <h2 className="text-2xl font-semibold">
            Project Configuration
          </h2>
          <p className="mt-2 text-slate-300 dark:text-slate-700">
            Configure repository details for comprehensive documentation analysis
          </p>
          <div className="mt-4 bg-white/10 dark:bg-slate-800/20 rounded-lg p-3">
            <p className="text-sm font-medium">
              <span className="font-semibold">Analysis Scope:</span> Dependencies, configuration files, and project structure
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name Input */}
          <div>
            <label 
              htmlFor="projectName" 
              className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Analytics Dashboard"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 
                       dark:text-white transition-all duration-200"
              required
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Enter the official project name for documentation header
            </p>
          </div>

          {/* Input Method Tabs */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
              Repository Source
            </label>
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setInputMethod('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md
                          font-medium text-sm transition-all
                          ${inputMethod === 'url' 
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
              >
                <Github className="w-4 h-4" />
                GitHub URL
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md
                          font-medium text-sm transition-all
                          ${inputMethod === 'upload' 
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          </div>

          {/* GitHub URL Input */}
          {inputMethod === 'url' && (
            <div className="animate-slide-up">
              <label 
                htmlFor="repoUrl" 
                className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
              >
                Repository URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/organization/repository"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 
                         dark:text-white transition-all duration-200"
                required
              />
              <div className="mt-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Analysis includes:</span> Package files, configuration, 
                  dependencies, and project structure for comprehensive documentation generation.
                </p>
              </div>
            </div>
          )}

          {/* File Upload */}
          {inputMethod === 'upload' && (
            <div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 
                            rounded-lg p-8 text-center hover:border-gray-400 
                            dark:hover:border-gray-500 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Drag and drop your project files here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  accept=".json,.txt,.toml,.yaml,.yml,.lock"
                />
                <label 
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white 
                           rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose Files
                </label>
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Upload package.json, requirements.txt, go.mod, or similar files
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 
                          dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-professional w-full flex items-center justify-center gap-3 px-6 py-4 
                     text-white font-medium rounded-lg shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Repository
              </>
            ) : (
              <>
                Analyze Project
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Examples */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 text-center">
          Sample Projects
        </h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { url: 'https://github.com/vercel/next.js', name: 'Next.js', desc: 'React Framework' },
            { url: 'https://github.com/facebook/react', name: 'React', desc: 'UI Library' },
            { url: 'https://github.com/django/django', name: 'Django', desc: 'Python Framework' },
          ].map((example) => (
            <button
              key={example.url}
              type="button"
              onClick={() => {
                setRepoUrl(example.url);
                setProjectName(example.name);
              }}
              className="group px-4 py-2 bg-slate-100 dark:bg-slate-700 
                       hover:bg-slate-200 dark:hover:bg-slate-600 
                       rounded-lg transition-all duration-200 border border-slate-200 dark:border-slate-600"
            >
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {example.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {example.desc}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Click to load sample configuration
        </p>
      </div>
    </div>
  );
}