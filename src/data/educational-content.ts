// src/data/educational-content.ts

import { StackType } from '@/types';

interface EducationalTip {
  title: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface StackEducation {
  overview: string;
  bestPractices: string[];
  commonMistakes: string[];
  resources: Array<{
    title: string;
    url: string;
    type: 'video' | 'article' | 'docs';
  }>;
}

export const STACK_EDUCATION: Record<StackType, StackEducation> = {
  nextjs: {
    overview: `Next.js is a React framework for production. Your README should highlight 
    whether you're using the App Router or Pages Router, and any special features 
    like ISR, SSR, or API routes.`,
    bestPractices: [
      'Mention which Next.js version you\'re using (13+ has different patterns)',
      'Document if you\'re using App Router or Pages Router',
      'Include Vercel deployment instructions (it\'s one-click!)',
      'List any environment variables for API routes',
    ],
    commonMistakes: [
      'Not mentioning the Node.js version required',
      'Forgetting to document API routes',
      'Not explaining the folder structure (especially with App Router)',
    ],
    resources: [
      {
        title: 'Next.js README Examples',
        url: 'https://github.com/vercel/next.js/tree/canary/examples',
        type: 'docs',
      },
    ],
  },
  react: {
    overview: `React projects should clearly state whether they use Create React App, Vite, 
    or a custom setup. Document your state management solution and routing approach.`,
    bestPractices: [
      'Specify the build tool (CRA, Vite, etc.)',
      'Document state management (Redux, Zustand, Context)',
      'Include browser support information',
    ],
    commonMistakes: [
      'Not documenting how to build for production',
      'Missing information about environment variables',
    ],
    resources: [],
  },
  express: {
    overview: `Express.js backends need clear API documentation. Consider using tables 
    for endpoints and include authentication requirements.`,
    bestPractices: [
      'Document all API endpoints in a table format',
      'Include Postman collection or Swagger docs link',
      'Explain database setup and migrations',
      'Document authentication flow',
    ],
    commonMistakes: [
      'Not explaining how to set up the database',
      'Missing API endpoint documentation',
      'Forgetting to mention required services (Redis, etc.)',
    ],
    resources: [],
  },
  django: {
    overview: `Django projects should explain the apps structure, management commands, 
    and migration process. Include admin panel access information.`,
    bestPractices: [
      'Document management commands (makemigrations, migrate, etc.)',
      'Explain how to create a superuser',
      'Include database setup instructions',
      'Document any custom management commands',
    ],
    commonMistakes: [
      'Not explaining virtual environment setup',
      'Missing migration instructions',
      'Forgetting to document static files handling',
    ],
    resources: [],
  },
  // Add more stacks...
  vue: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
  angular: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
  nestjs: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
  flask: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
  fastapi: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
  go: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
  rust: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
  unknown: { overview: '', bestPractices: [], commonMistakes: [], resources: [] },
};

export const GENERAL_TIPS: EducationalTip[] = [
  {
    title: 'Use Descriptive Commit Messages',
    content: `Your README will be more credible if your commit history is clean. 
    Use conventional commits like "feat:", "fix:", "docs:" prefixes.`,
    level: 'beginner',
  },
  {
    title: 'Add a Demo Link or GIF',
    content: `A picture is worth a thousand words. Add a screenshot or GIF of your 
    project in action. Tools like Loom or Gifox make this easy.`,
    level: 'beginner',
  },
  {
    title: 'Keep it Updated',
    content: `An outdated README is worse than no README. Set a reminder to review 
    it whenever you add major features.`,
    level: 'intermediate',
  },
];