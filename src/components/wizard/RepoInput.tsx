// src/components/wizard/RepoInput.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Github, Upload, ArrowRight, Loader2, BookMarked, Search, Star, GitBranch } from 'lucide-react';
import { useReadmeStore } from '@/store/readme-store';
import { logger } from '@/lib/logger';
import { useAuth } from '@/lib/auth/provider';

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export function RepoInput() {
  const { 
    setProjectInfo, 
    setStack, 
    setAvailableSections, 
    setRepoData,
    setCurrentStep,
    setLoading,
    isLoading 
  } = useReadmeStore();
  
  const { user } = useAuth(); // To check if signed in

  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('url');
  const [error, setError] = useState('');

  // Repo Browser State
  const [showRepoBrowser, setShowRepoBrowser] = useState(false);
  const [userRepos, setUserRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [reposError, setReposError] = useState('');

  const validateGitHubUrl = (url: string): boolean => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubRegex.test(url);
  };

  const fetchUserRepos = async (search = '') => {
    setLoadingRepos(true);
    setReposError('');
    try {
      const url = new URL('/api/github/repos', window.location.origin);
      if (search) url.searchParams.set('search', search);
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await res.json();
      setUserRepos(data.repos || []);
    } catch (err) {
      console.error(err);
      setReposError('Could not load your repositories. Please try again.');
    } finally {
      setLoadingRepos(false);
    }
  };

  // Debounced search for repos
  useEffect(() => {
    if (!showRepoBrowser) return;
    
    const timeoutId = setTimeout(() => {
      fetchUserRepos(repoSearch);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [repoSearch, showRepoBrowser]);

  const handleSelectRepo = (repo: GitHubRepo) => {
    setRepoUrl(repo.url);
    if (!projectName.trim()) {
      // Convert "my-awesome-repo" into "My Awesome Repo"
      const formattedName = repo.name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setProjectName(formattedName);
    }
    setShowRepoBrowser(false);
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
                       focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 
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
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
                            ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </button>
            </div>
          </div>

          {/* GitHub URL Input */}
          {inputMethod === 'url' && (
            <div className="animate-slide-up space-y-4">
              <div>
                <label 
                  htmlFor="repoUrl" 
                  className="block text-sm font-medium text-slate-900 dark:text-white mb-2"
                >
                  Repository URL <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="repoUrl"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/organization/repository"
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                             focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-slate-700 
                             dark:text-white transition-all duration-200"
                    required
                  />
                  {user && (
                    <button
                      type="button"
                      onClick={() => setShowRepoBrowser(!showRepoBrowser)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 
                               text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600
                               font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <BookMarked className="w-4 h-4" />
                      Browse My Repos
                    </button>
                  )}
                </div>
              </div>

              {/* Repo Browser Inline Modal */}
              {showRepoBrowser && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-slide-up">
                  <div className="flex items-center gap-2 mb-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search repositories..."
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-sm flex-1 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                  
                  {loadingRepos && userRepos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <p className="text-sm">Loading your repositories...</p>
                    </div>
                  ) : reposError ? (
                    <div className="text-red-500 text-sm py-4 text-center">{reposError}</div>
                  ) : userRepos.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {userRepos.map((repo) => (
                        <button
                          key={repo.id}
                          type="button"
                          onClick={() => handleSelectRepo(repo)}
                          className="w-full text-left p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-slate-900 dark:text-white truncate pr-4">
                              {repo.fullName}
                            </h4>
                            {repo.isPrivate && (
                              <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                                Private
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {repo.stars}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {repo.defaultBranch}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No matching repositories found.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
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
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 
                            rounded-lg p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50
                            dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-medium">
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
                  className="inline-flex items-center px-4 py-2 mt-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200
                           rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm font-medium text-sm"
                >
                  Choose Files
                </label>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 mx-auto max-w-sm">
                  Upload package.json, requirements.txt, go.mod, or related configuration files
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 
                          dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
              <div className="shrink-0 mt-0.5 text-lg">⚠️</div>
              <div>{error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-professional w-full flex items-center justify-center gap-3 px-6 py-4 
                     text-white font-medium rounded-lg shadow-lg bg-emerald-600 hover:bg-emerald-500 
                     disabled:opacity-70 disabled:cursor-not-allowed transition-all"
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
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize mb-4 text-center tracking-wide">
          Try a sample project
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
                setInputMethod('url');
                setShowRepoBrowser(false);
              }}
              className="group px-4 py-3 bg-slate-50 dark:bg-slate-900/50 
                       hover:bg-emerald-50 dark:hover:bg-emerald-900/20 
                       hover:border-emerald-200 dark:hover:border-emerald-800
                       rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-700 block text-left min-w-[140px]"
            >
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {example.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {example.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}