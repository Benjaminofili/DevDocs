// src/lib/ai/prompts/section-prompts.ts

import { DetectedStack, SectionConfig } from '@/types';

interface GitHubInfo {
  owner: string;
  repo: string;
}

function extractGitHubInfo(repoUrl?: string): GitHubInfo | null {
  if (!repoUrl) return null;
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2].replace('.git', '') };
  }
  return null;
}

export function generateSectionPrompt(
  section: SectionConfig,
  projectName: string,
  stack: DetectedStack,
  additionalContext?: string,
  repoUrl?: string
): string {
  const githubInfo = extractGitHubInfo(repoUrl);
  
  // ✅ CRITICAL: Analyze context to determine actual project purpose
  const projectPurpose = inferProjectPurpose(additionalContext || '', projectName);
  
  const badgeInstructions = githubInfo 
    ? `
Badges (use exactly):
![License](https://img.shields.io/github/license/${githubInfo.owner}/${githubInfo.repo})
![Stars](https://img.shields.io/github/stars/${githubInfo.owner}/${githubInfo.repo}?style=social)
![Issues](https://img.shields.io/github/issues/${githubInfo.owner}/${githubInfo.repo})
`
    : '';

  const basePrompt = `You are a technical writer creating a README section.

=== PROJECT PURPOSE (USE THIS!) ===
${projectPurpose}

=== STRICT RULES ===
1. Use the PROJECT PURPOSE above as the main description
2. ONLY describe features based on actual code/dependencies
3. DO NOT invent features
4. If you see API routes like /api/generate, /api/analyze → this is a GENERATOR tool
5. If you see react-markdown + AI libs → this is a DOCUMENTATION tool

=== PROJECT DATA ===
${additionalContext || `Project: ${projectName}, Stack: ${stack.primary}`}

${badgeInstructions}

OUTPUT: Clean markdown, no meta-commentary, under 250 words.

TASK: Generate the "${section.name}" section.
`;

  const sectionInstructions: Record<string, string> = {
    header: `# ${projectName}

${githubInfo ? `![License](https://img.shields.io/github/license/${githubInfo.owner}/${githubInfo.repo})
![Stars](https://img.shields.io/github/stars/${githubInfo.owner}/${githubInfo.repo}?style=social)
![Issues](https://img.shields.io/github/issues/${githubInfo.owner}/${githubInfo.repo})` : ''}

INSTRUCTIONS:
1. Write a clear 1-2 sentence description of WHAT THIS PROJECT DOES
2. Use the PROJECT PURPOSE from above
3. For ${projectName}:
   - If it has /api/generate, /api/analyze → "A tool that generates/analyzes X"
   - If it has react-markdown + AI deps → "An AI-powered documentation tool"
   - If it has readme, docs in name/routes → "A README/documentation generator"

4. Quick Start with actual scripts:
\`\`\`bash
npm install
npm run dev
\`\`\`

5. List 3-4 highlights based on ACTUAL dependencies only`,

    features: `## ✨ Features

INSTRUCTIONS:
1. Each feature must be based on an ACTUAL dependency or API route
2. Format: - **Feature Name** - Description

For ${projectName}, look for:
- API routes (what they do)
- UI components (what they render)
- Dependencies (what functionality they provide)

Example mapping:
- Has /api/generate + AI libs → "AI-Powered Generation - Uses multiple AI providers to generate content"
- Has /api/analyze → "Repository Analysis - Analyzes project structure and dependencies"
- Has react-markdown → "Markdown Preview - Live preview of generated content"
- Has zustand → "State Management - Manages application state efficiently"
- Has @upstash/redis → "Caching - Caches results for faster responses"
- Has @upstash/ratelimit → "Rate Limiting - Prevents API abuse"

DO NOT add features without evidence in the code.`,

    installation: `## 🚀 Installation

### Prerequisites
- Node.js v18 or higher
- npm (or yarn/pnpm)

### Steps

1. **Clone the repository**
\`\`\`bash
git clone ${repoUrl || `https://github.com/username/${projectName}.git`}
cd ${projectName}
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**
\`\`\`bash
cp .env.example .env
\`\`\`
Then edit \`.env\` and add your API keys.

4. **Start development server**
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.`,

    'tech-stack': `## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js |
| Language | TypeScript |

Add ONLY technologies that exist in dependencies:
- @upstash/redis → | Cache | Upstash Redis |
- zustand → | State | Zustand |
- tailwindcss → | Styling | Tailwind CSS |
- AI libs → | AI | OpenAI, Google Gemini, Anthropic, Groq |

DO NOT add technologies not in package.json.`,

    environment: `## ⚙️ Environment Variables

CRITICAL: Use EXACT variables from .env.example if provided in context.
If not provided, infer from dependencies:

\`\`\`env
# AI Provider Keys (at least one required)
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_google_ai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key

# Redis (required for caching)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Optional
GITHUB_TOKEN=your_github_token  # For higher API rate limits
\`\`\`

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | OpenAI API key | No* |
| GOOGLE_AI_API_KEY | Google AI API key | No* |
| GROQ_API_KEY | Groq API key | No* |
| UPSTASH_REDIS_REST_URL | Redis connection URL | Yes |
| UPSTASH_REDIS_REST_TOKEN | Redis auth token | Yes |

*At least one AI provider key is required.`,

    scripts: `## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| \`npm run dev\` | Start development server |
| \`npm run build\` | Create production build |
| \`npm run start\` | Start production server |
| \`npm run lint\` | Run ESLint |
| \`npm test\` | Run tests |
| \`npm run test:watch\` | Run tests in watch mode |
| \`npm run test:coverage\` | Run tests with coverage |

Only include scripts that actually exist in package.json.`,

    deployment: `## 🚀 Deployment

### Production Build
\`\`\`bash
npm run build
npm run start
\`\`\`

### Deploy to Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production
Make sure to set all required environment variables in your deployment platform.`,

    contributing: `## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit changes: \`git commit -m 'Add amazing feature'\`
4. Push to branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request

### Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed`,

    license: `## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using Next.js and AI`,

    testing: `## 🧪 Testing

Run tests:
\`\`\`bash
npm test
\`\`\`

Watch mode:
\`\`\`bash
npm run test:watch
\`\`\`

Coverage report:
\`\`\`bash
npm run test:coverage
\`\`\``,
  };

  return basePrompt + '\n\n' + (sectionInstructions[section.id] || section.howToWrite);
}

// ✅ NEW: Infer project purpose from context
function inferProjectPurpose(context: string, projectName: string): string {
  const contextLower = context.toLowerCase();
  const nameLower = projectName.toLowerCase();
  
  // Check for README generator indicators
  const isReadmeGenerator = 
    contextLower.includes('/api/generate') ||
    contextLower.includes('/api/analyze') ||
    contextLower.includes('readme') ||
    contextLower.includes('generatereadme') ||
    contextLower.includes('section-prompts') ||
    contextLower.includes('readme-store') ||
    contextLower.includes('previeweditor') ||
    contextLower.includes('sectionSelector') ||
    nameLower.includes('readme') ||
    nameLower.includes('docs') ||
    nameLower.includes('devdocs');
  
  // Check for documentation tool indicators
  const isDocTool =
    contextLower.includes('react-markdown') &&
    (contextLower.includes('openai') || contextLower.includes('generative-ai'));
  
  // Check for multi-provider AI
  const hasMultipleAI = 
    (contextLower.includes('openai') ? 1 : 0) +
    (contextLower.includes('anthropic') ? 1 : 0) +
    (contextLower.includes('generative-ai') || contextLower.includes('gemini') ? 1 : 0) +
    (contextLower.includes('groq') ? 1 : 0) >= 2;
  
  if (isReadmeGenerator || (nameLower.includes('doc') && hasMultipleAI)) {
    return `
📌 PROJECT PURPOSE: ${projectName} is an AI-powered README/documentation generator.

It analyzes GitHub repositories, detects the tech stack, and uses AI (OpenAI, Gemini, Anthropic, Groq) 
to generate professional, customized README files.

Key functionality:
- Analyzes repository structure and dependencies
- Detects tech stack automatically  
- Generates README sections using AI
- Supports multiple AI providers with fallback
- Caches results for performance

USE THIS DESCRIPTION - don't say "AI-powered tool" generically.
`;
  }
  
  if (isDocTool) {
    return `
📌 PROJECT PURPOSE: ${projectName} is an AI-powered documentation tool.

It uses AI to help create and manage documentation with markdown preview.
`;
  }
  
  if (hasMultipleAI) {
    return `
📌 PROJECT PURPOSE: ${projectName} is an AI-powered tool using multiple AI providers.

Analyze the API routes to determine exactly what it generates/creates.
`;
  }
  
  return `
📌 PROJECT PURPOSE: Analyze the actual API routes and components to determine what ${projectName} does.
Look at /api/ routes and main components to understand the core functionality.
`;
}