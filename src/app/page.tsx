// src/app/page.tsx
import Link from 'next/link';
import { 
  Code2, 
  GitBranch, 
  BookOpen, 
  ArrowRight,
  CheckCircle,
  Github,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 
                          rounded-full text-slate-700 dark:text-slate-300 text-sm font-medium mb-8 border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-professional-glow"></div>
            Enterprise-Grade Documentation Generator
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-slate-900 dark:text-white mb-6 animate-slide-up leading-tight">
            Professional README
            <span className="block text-gradient mt-3">
              Generation at Scale
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto mb-10 leading-relaxed">
            Generate comprehensive, standards-compliant documentation with intelligent stack detection 
            and <span className="font-semibold text-slate-900 dark:text-white">best-practice recommendations</span> 
            for production-ready projects.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/generate"
              className="btn-professional inline-flex items-center justify-center gap-3 px-8 py-4 
                         text-white font-medium rounded-xl shadow-lg"
            >
              Generate Documentation
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <a
              href="https://github.com/yourusername/devdocs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View DevDocs on GitHub"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 
                         bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium 
                         rounded-xl shadow-md border border-slate-200 dark:border-slate-700 
                         hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>Zero Configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Privacy-First</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
              <span>Production Ready</span>
            </div>
          </div>
        </div>

        {/* Subtle geometric elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent 
                        rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl 
                        opacity-30 animate-subtle-float"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-purple-100 to-transparent 
                        rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl 
                        opacity-30 animate-subtle-float-delayed"></div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-semibold text-slate-900 dark:text-white mb-6">
              Advanced Documentation Capabilities
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Intelligent analysis and generation for modern software projects
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border 
                            border-slate-200 dark:border-slate-700 card-professional">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl 
                              flex items-center justify-center mb-6">
                <Code2 className="w-7 h-7 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Intelligent Stack Detection
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Advanced analysis of dependencies, configuration files, and project structure 
                to generate <span className="font-semibold text-slate-900 dark:text-white">contextually relevant</span> documentation.
              </p>
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Supported Frameworks:</div>
                <div className="grid grid-cols-2 gap-2">
                  {['Next.js', 'React', 'Django', 'Express', 'FastAPI', 'Vue', 'Angular'].map((stack) => (
                    <div key={stack} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{stack}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border 
                            border-slate-200 dark:border-slate-700 card-professional">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl 
                              flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Standards-Compliant Documentation
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Generates documentation following industry best practices and established standards 
                for <span className="font-semibold text-slate-900 dark:text-white">professional software projects</span>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Industry Standards:</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Comprehensive documentation including installation guides, API references, 
                      contribution guidelines, and deployment instructions following 
                      open-source best practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border 
                            border-slate-200 dark:border-slate-700 card-professional">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl 
                              flex items-center justify-center mb-6">
                <GitBranch className="w-7 h-7 text-slate-700 dark:text-slate-300" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Production-Ready Output
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Generates deployment-ready documentation with proper badges, environment configuration, 
                and <span className="font-semibold text-slate-900 dark:text-white">CI/CD integration</span> guidelines.
              </p>
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Features:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Auto-detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Environment vars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">CI/CD templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Live badges</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-semibold text-center text-slate-900 dark:text-white mb-6">
            Professional Documentation Workflow
          </h2>
          <p className="text-xl text-center text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-16">
            Streamlined process for generating comprehensive project documentation
          </p>
          
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Project Analysis',
                description: 'Input repository URL for automated analysis of dependencies, configuration, and project structure.',
                detail: 'Supports Git, GitHub, GitLab, and Bitbucket repositories with comprehensive metadata extraction.'
              },
              {
                step: '2', 
                title: 'Stack Detection',
                description: 'AI-powered identification of frameworks, libraries, and architectural patterns.',
                detail: 'Advanced pattern matching for both common and specialized technology stacks.'
              },
              {
                step: '3',
                title: 'Content Generation',
                description: 'Automated generation of standards-compliant documentation sections.',
                detail: 'Customizable templates with industry-standard formatting and structure.'
              },
              {
                step: '4',
                title: 'Quality Assurance',
                description: 'Validation and optimization of generated content for production readiness.',
                detail: 'Includes markdown validation, link checking, and accessibility compliance.'
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 
                                rounded-full flex items-center justify-center font-semibold text-lg">
                  {item.step}
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/generate"
              className="btn-professional inline-flex items-center gap-3 px-8 py-4 
                         text-white font-medium rounded-xl shadow-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>
                Professional documentation generator for modern software development
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/yourusername/devdocs" 
                aria-label="View project on GitHub"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <span className="text-sm text-slate-500 dark:text-slate-500">
                Version 1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}