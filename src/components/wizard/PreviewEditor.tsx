// src/components/wizard/PreviewEditor.tsx

'use client';

import React, { useState } from 'react';
import { Copy, Download, ChevronLeft, RefreshCw, Check, Edit3, Eye, Trash2, Code } from 'lucide-react';
import { useReadmeStore } from '@/store/readme-store';
import { GeneratedSection } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export function PreviewEditor() {
  const { 
    generatedSections, 
    availableSections, 
    projectName,
    repoUrl,
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
        console.log('Cache cleared:', data.message);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
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
          console.error(`Failed to generate ${sectionId}:`, data.error);
          const errorSection: GeneratedSection = {
            id: sectionId,
            content: `## ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}\n\n*Content generation failed. Please try again.*`,
            explanation: 'Generation failed - please retry.',
          };
          addGeneratedSection(errorSection);
        }
      } catch (error) {
        console.error(`Failed to generate ${sectionId}:`, error);
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 
                          bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent 
                            rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Generating your README...
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Our AI is crafting the perfect documentation for your {projectName} project
          </p>
          <div className="mt-6 space-y-2">
            {generatedSections.map((section) => (
              <div key={section.id} className="text-sm text-gray-500 dark:text-gray-400">
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border 
                      border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Generated Documentation
              </h2>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Review, edit, and download your professional README
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 
                         hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 
                         rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isClearingCache ? 'Clearing...' : 'Clear Cache'}
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 
                         dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 
                         rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="btn-professional inline-flex items-center gap-2 px-4 py-2 
                         text-white font-medium rounded-lg"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors
                ${activeTab === 'preview'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors
                ${activeTab === 'edit'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors
                ${activeTab === 'raw'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Code className="w-4 h-4" />
              Raw Markdown
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'preview' ? (
            <div className="readme-preview bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-700">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Headings
                  h1: ({ children }) => (
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-4 mb-2">
                      {children}
                    </h4>
                  ),
                  
                  // Paragraph
                  p: ({ children }) => (
                    <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  
                  // Lists
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-slate-700 dark:text-slate-300">{children}</li>
                  ),
                  
                  // Code
                  code: ({ inline, className, children }) => {
                    if (inline) {
                      return (
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 text-sm font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={`${className} font-mono text-sm`}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">
                      {children}
                    </pre>
                  ),
                  
                  // Blockquote
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-600 dark:text-slate-400">
                      {children}
                    </blockquote>
                  ),
                  
                  // Table
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">
                        {children}
                      </table>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {children}
                    </td>
                  ),
                  
                  // Links
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      className="text-blue-600 dark:text-blue-400 hover:underline" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  
                  // Images (including badges)
                  img: ({ src, alt }) => {
                    // Fix common badge URL issues
                    let fixedSrc = src || '';
                    
                    // If it's a shields.io badge with placeholder, try to fix it
                    if (fixedSrc.includes('shields.io') && githubInfo) {
                      // Replace common placeholders
                      fixedSrc = fixedSrc
                        .replace(/your-username/g, githubInfo.owner)
                        .replace(/your-repo/g, githubInfo.repo)
                        .replace(/username/g, githubInfo.owner)
                        .replace(/repository/g, githubInfo.repo)
                        .replace(/dua-project\/dua-project/g, `${githubInfo.owner}/${githubInfo.repo}`)
                        .replace(/\[owner\]/g, githubInfo.owner)
                        .replace(/\[repo\]/g, githubInfo.repo);
                    }
                    
                    // Check if it's a badge (shields.io or similar)
                    const isBadge = fixedSrc.includes('shields.io') || 
                                   fixedSrc.includes('badge') || 
                                   fixedSrc.includes('img.shields');
                    
                    if (isBadge) {
                      return (
                        <img 
                          src={fixedSrc} 
                          alt={alt || 'badge'} 
                          className="inline-block h-5 mr-1"
                          onError={(e) => {
                            // Hide broken badge images
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    }
                    
                    return (
                      <img 
                        src={fixedSrc} 
                        alt={alt || 'image'} 
                        className="max-w-full h-auto rounded-lg my-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    );
                  },
                  
                  // Horizontal rule
                  hr: () => (
                    <hr className="my-8 border-slate-200 dark:border-slate-700" />
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Edit README Content
                </label>
                <button
                  onClick={handleSaveEdit}
                  className="btn-professional inline-flex items-center gap-2 px-4 py-2 
                           text-white font-medium rounded-lg text-sm"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
              <textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full h-[600px] p-4 border border-slate-300 dark:border-slate-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 
                         dark:text-slate-100 font-mono text-sm resize-none leading-relaxed"
                placeholder="Edit your README content here..."
                spellCheck={false}
              />
              <div className="text-sm text-slate-500 dark:text-slate-400">
                💡 Tip: Use Markdown syntax for formatting. Changes will be reflected in the preview tab.
              </div>
            </div>
          ) : (
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto">
                <code className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
                  {fullReadme}
                </code>
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 
                         text-slate-200 rounded text-sm transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 
                        dark:bg-slate-900/50 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={() => setCurrentStep('select')}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 
                     dark:text-slate-400 hover:text-slate-900 dark:hover:text-white 
                     transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Sections
          </button>

          <div className="flex gap-2">
            {activeTab === 'edit' && (
              <button
                onClick={handleSaveEdit}
                className="btn-professional inline-flex items-center gap-2 px-4 py-2 
                         text-white font-medium rounded-lg"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            )}
            <button
              onClick={handleRegenerate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 
                       dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 
                       rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}