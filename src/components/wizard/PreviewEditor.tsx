// src/components/wizard/PreviewEditor.tsx

'use client';

import React, { useState } from 'react';
import { Copy, Download, ChevronLeft, RefreshCw, Check, Edit3, Eye, Trash2, Code } from 'lucide-react';
import { useReadmeStore } from '@/store/readme-store';
import { GeneratedSection } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { logger } from '@/lib/logger';

export function PreviewEditor() {
  const { 
    generatedSections, 
    availableSections, 
    projectName,
    repoUrl,
    repoData,
    currentStep, 
    setCurrentStep,
    selectedSectionIds,
    stack,
    setLoading,
    setGeneratedSections,
    addGeneratedSection
  } = useReadmeStore();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'edit'>('preview');
  const [editableContent, setEditableContent] = useState('');
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Combine all sections into final README
  const fullReadme = generatedSections
    .map(section => section.content)
    .join('\n\n');

  // Initialize editable content when generated sections change
  React.useEffect(() => {
    setEditableContent(fullReadme);
  }, [fullReadme]);

  const handleCopy = async () => {
    const contentToCopy = activeTab === 'edit' ? editableContent : fullReadme;
    await navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const contentToDownload = activeTab === 'edit' ? editableContent : fullReadme;
    const blob = new Blob([contentToDownload], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    if (generatedSections.length > 0) {
      const updatedSections = [...generatedSections];
      updatedSections[0] = {
        ...updatedSections[0],
        content: editableContent
      };
      setGeneratedSections(updatedSections);
    } else {
      const newSection: GeneratedSection = {
        id: 'main',
        content: editableContent,
        explanation: 'User-edited content'
      };
      addGeneratedSection(newSection);
    }
    setActiveTab('preview');
  };

  const handleClearCache = async () => {
    if (!projectName) return;
    
    setIsClearingCache(true);
    try {
      const response = await fetch('/api/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName }),
      });
      
      if (response.ok) {
        const data = await response.json();
        logger.info('Cache cleared:', data.message);
      }
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleRegenerate = async () => {
    if (!stack) return;
    
    setLoading(true);
    setCurrentStep('generate');
    setGeneratedSections([]);
    
    for (let i = 0; i < selectedSectionIds.length; i++) {
      const sectionId = selectedSectionIds[i];
      
      try {
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
            repoUrl,
            repoData
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          const section: GeneratedSection = {
            id: sectionId,
            content: data.data.content,
            explanation: data.data.explanation,
          };
          addGeneratedSection(section);
        } else {
          logger.error(`Failed to generate ${sectionId}:`, data.error);
          const errorSection: GeneratedSection = {
            id: sectionId,
            content: `## ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}\n\n*Content generation failed. Please try again.*`,
            explanation: 'Generation failed - please retry.',
          };
          addGeneratedSection(errorSection);
        }
      } catch (error) {
        logger.error(`Failed to generate ${sectionId}:`, error);
      }
    }

    setCurrentStep('preview');
    setLoading(false);
  };

  // Extract GitHub info for badge fixes
  const getGitHubInfo = () => {
    if (!repoUrl) return null;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') };
    }
    return null;
  };

  const githubInfo = getGitHubInfo();

  if (currentStep === 'generate') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 
                          bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-blue-600 border-t-transparent 
                            rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Generating your README...
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Our AI is crafting the perfect documentation for your {projectName} project
          </p>
          <div className="mt-6 space-y-2">
            {generatedSections.map((section) => (
              <div key={section.id} className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                ✓ Generated {availableSections.find(s => s.id === section.id)?.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border 
                      border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title */}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 dark:text-white truncate">
                Generated Documentation
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Review, edit, and download your professional README
              </p>
            </div>
            
            {/* Action Buttons - Updated with better colors */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 
                         bg-red-500 hover:bg-red-600 active:bg-red-700
                         text-white rounded-lg transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm
                         shadow-sm hover:shadow-md font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">
                  {isClearingCache ? 'Clearing...' : 'Clear Cache'}
                </span>
              </button>
              
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 
                         bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                         text-white rounded-lg transition-all duration-200 text-sm
                         shadow-sm hover:shadow-md font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Copy</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 
                         bg-green-500 hover:bg-green-600 active:bg-green-700
                         text-white font-medium rounded-lg text-sm
                         shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selector - Responsive */}
        <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 
                        font-medium transition-colors text-sm sm:text-base whitespace-nowrap
                ${activeTab === 'preview'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden xs:inline">Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 
                        font-medium transition-colors text-sm sm:text-base whitespace-nowrap
                ${activeTab === 'edit'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden xs:inline">Edit</span>
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 
                        font-medium transition-colors text-sm sm:text-base whitespace-nowrap
                ${activeTab === 'raw'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Code className="w-4 h-4" />
              <span className="hidden xs:inline">Raw</span>
            </button>
          </div>
        </div>

        {/* Content - Responsive Padding */}
        <div className="p-4 sm:p-6">
          {activeTab === 'preview' ? (
            <div className="readme-preview bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 
                          rounded-lg border border-slate-200 dark:border-slate-700 
                          overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Headings - Responsive sizes
                  h1: ({ children }) => (
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white 
                                 mb-3 sm:mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white 
                                 mt-6 sm:mt-8 mb-3 sm:mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white 
                                 mt-4 sm:mt-6 mb-2 sm:mb-3">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white 
                                 mt-3 sm:mt-4 mb-2">
                      {children}
                    </h4>
                  ),
                  
                  // Paragraph
                  p: ({ children }) => (
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  
                  // Lists
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-sm sm:text-base 
                                 text-slate-700 dark:text-slate-300 pl-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-sm sm:text-base 
                                 text-slate-700 dark:text-slate-300 pl-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-slate-700 dark:text-slate-300">{children}</li>
                  ),
                  
                  // Code - Fixed type
                  code: (props) => {
                    const { children, className } = props as { children?: React.ReactNode; className?: string };
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    
                    if (isInline) {
                      return (
                        <code className="px-1 sm:px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 
                                       text-red-600 dark:text-red-400 text-xs sm:text-sm font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={`${className} font-mono text-xs sm:text-sm`}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-slate-900 text-slate-100 p-3 sm:p-4 rounded-lg 
                                  overflow-x-auto mb-4 text-xs sm:text-sm">
                      {children}
                    </pre>
                  ),
                  
                  // Blockquote
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-3 sm:pl-4 italic my-4 
                                         text-sm sm:text-base text-slate-600 dark:text-slate-400">
                      {children}
                    </blockquote>
                  ),
                  
                  // Table - Better mobile overflow
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4 -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 
                                        border border-slate-200 dark:border-slate-700 rounded-lg">
                          {children}
                        </table>
                      </div>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold 
                                 text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {children}
                    </td>
                  ),
                  
                  // Links
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      className="text-blue-600 dark:text-blue-400 hover:underline break-words" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  
                  // Images (including badges) - Fixed to use regular img tag
                  img: (props) => {
                    const { src, alt } = props as { src?: string; alt?: string };
                    let fixedSrc = src || '';
                    const altText = alt || 'image';
                    
                    if (fixedSrc.includes('shields.io') && githubInfo) {
                      fixedSrc = fixedSrc
                        .replace(/your-username/g, githubInfo.owner)
                        .replace(/your-repo/g, githubInfo.repo)
                        .replace(/username/g, githubInfo.owner)
                        .replace(/repository/g, githubInfo.repo)
                        .replace(/dua-project\/dua-project/g, `${githubInfo.owner}/${githubInfo.repo}`)
                        .replace(/\[owner\]/g, githubInfo.owner)
                        .replace(/\[repo\]/g, githubInfo.repo);
                    }
                    
                    const isBadge = fixedSrc.includes('shields.io') || 
                                   fixedSrc.includes('badge') || 
                                   fixedSrc.includes('img.shields');
                    
                    if (isBadge) {
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={fixedSrc} 
                          alt={altText} 
                          className="inline-block h-4 sm:h-5 mr-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    }
                    
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={fixedSrc} 
                        alt={altText} 
                        className="max-w-full h-auto rounded-lg my-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    );
                  },
                  
                  // Horizontal rule
                  hr: () => (
                    <hr className="my-6 sm:my-8 border-slate-200 dark:border-slate-700" />
                  ),
                  
                  // Strong/Bold
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {children}
                    </strong>
                  ),
                  
                  // Emphasis/Italic
                  em: ({ children }) => (
                    <em className="italic text-slate-700 dark:text-slate-300">
                      {children}
                    </em>
                  ),
                }}
              >
                {fullReadme}
              </ReactMarkdown>
            </div>
          ) : activeTab === 'edit' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Edit README Content
                </label>
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 
                           bg-green-500 hover:bg-green-600 active:bg-green-700
                           text-white font-medium rounded-lg text-sm
                           shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full h-[400px] sm:h-[500px] md:h-[600px] p-3 sm:p-4 
                         border border-slate-300 dark:border-slate-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         dark:bg-slate-900 dark:text-slate-100 font-mono 
                         text-xs sm:text-sm resize-none leading-relaxed"
                placeholder="Edit your README content here..."
                spellCheck={false}
              />
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                💡 Tip: Use Markdown syntax for formatting. Changes will be reflected in the preview tab.
              </div>
            </div>
          ) : (
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-4 sm:p-6 rounded-lg 
                           overflow-x-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] 
                           overflow-y-auto">
                <code className="text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {fullReadme}
                </code>
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 
                         bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                         text-white rounded text-xs sm:text-sm transition-all duration-200
                         shadow-sm hover:shadow-md font-medium"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions - Updated Colors */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 
                        bg-slate-50 dark:bg-slate-900/50 rounded-b-xl sm:rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center 
                        sm:justify-between gap-3">
            <button
              onClick={() => setCurrentStep('select')}
              className="inline-flex items-center justify-center sm:justify-start gap-2 
                       px-4 py-2 bg-gray-500 hover:bg-gray-600 active:bg-gray-700
                       text-white rounded-lg transition-all duration-200 text-sm
                       shadow-sm hover:shadow-md font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Sections
            </button>

            <div className="flex flex-col xs:flex-row gap-2">
              {activeTab === 'edit' && (
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 
                           bg-green-500 hover:bg-green-600 active:bg-green-700
                           text-white font-medium rounded-lg text-sm
                           shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              )}
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 
                         bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                         text-white rounded-lg transition-all duration-200 text-sm
                         shadow-sm hover:shadow-md font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}