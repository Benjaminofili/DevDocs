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
  stack: DetectedStack,
  projectName: string,
  additionalContext?: string,
  repoUrl?: string
): string {
  const githubInfo = extractGitHubInfo(repoUrl);
  
  const badgeInstructions = githubInfo 
    ? `
BADGE URLs (use exactly):
![License](https://img.shields.io/github/license/${githubInfo.owner}/${githubInfo.repo})
![Stars](https://img.shields.io/github/stars/${githubInfo.owner}/${githubInfo.repo}?style=social)
![Issues](https://img.shields.io/github/issues/${githubInfo.owner}/${githubInfo.repo})
`
    : `
Use static badges:
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
`;

  // ✅ CRITICAL: Much stricter base prompt
  const basePrompt = `You are a technical writer creating a README section.

=== CRITICAL RULES - READ CAREFULLY ===

1. **ONLY describe features that ACTUALLY EXIST in the codebase**
2. **DO NOT invent features** like "commenting system", "user profiles", "blog posting" unless you see actual code for them
3. **Look at the ACTUAL dependencies and scripts** - these tell you what the project does
4. **If the project has AI dependencies (openai, anthropic, gemini)** - it's likely an AI-powered tool
5. **Base your description on package.json description, scripts, and actual file structure**
6. **NEVER assume** - if you don't see evidence of a feature, don't mention it

=== PROJECT CONTEXT ===
${additionalContext || `Project: ${projectName}, Stack: ${stack.primary}`}

=== WHAT TO LOOK FOR ===
- package.json "description" field - USE THIS as the primary description
- package.json "scripts" - these show what the project can do
- Actual dependencies - these reveal the true functionality
- File names in src/ - but DON'T assume "post" means "blog posting"

${badgeInstructions}

=== OUTPUT REQUIREMENTS ===
- Clean, professional markdown
- NO meta-commentary or explanations
- ONLY real features based on actual code evidence
- Under 250 words
- No template variables like {{PROJECT_NAME}}

TASK: Generate the "${section.name}" section for ${projectName}.
`;

  const sectionInstructions: Record<string, string> = {
    header: `Generate a project header based ONLY on actual project data.

# ${projectName}

${githubInfo ? `![License](https://img.shields.io/github/license/${githubInfo.owner}/${githubInfo.repo})
![Stars](https://img.shields.io/github/stars/${githubInfo.owner}/${githubInfo.repo}?style=social)
![Issues](https://img.shields.io/github/issues/${githubInfo.owner}/${githubInfo.repo})` : ''}

INSTRUCTIONS:
1. Look at package.json "description" field - USE IT if available
2. If no description, infer from:
   - Dependencies (AI libs = AI tool, react-markdown = documentation tool, etc.)
   - Scripts available
   - Project structure

3. For Quick Start, use ACTUAL scripts from package.json:
   - If "dev" script exists: npm run dev
   - If "start" script exists: npm start
   - Match the actual package manager detected

4. List 3-4 REAL highlights based on actual dependencies, NOT imagined features

DO NOT mention features like "user profiles", "commenting", "blog posting" unless you see actual code for them.`,

    features: `List ONLY features that are ACTUALLY implemented.

## ✨ Features

CRITICAL INSTRUCTIONS:
1. Look at the ACTUAL dependencies in package.json
2. Look at the ACTUAL file structure
3. ONLY list features you can PROVE exist from the code

Examples of what to look for:
- Has react-markdown + AI libs → "AI-powered documentation generation"
- Has @upstash/redis → "Redis caching for performance"
- Has zustand → "State management"
- Has tailwindcss → "Responsive UI with Tailwind CSS"

DO NOT LIST:
- "User profiles" (unless you see user authentication code)
- "Commenting system" (unless you see comment-related APIs)
- "Blog posting" (unless you see blog/post creation code)
- "Analytics" (unless you see analytics dependencies)

Format: 
- 🎯 **Feature** - Brief description based on actual code`,

    installation: `Create installation instructions using ACTUAL project data.

## 🚀 Installation

### Prerequisites
Based on package.json, list REAL requirements:
- Node.js (check "engines" field, or default to v18+)
- ${stack.packageManager}

### Steps

1. **Clone the repository**
   \`\`\`bash
   git clone ${repoUrl || `https://github.com/username/${projectName}.git`}
   cd ${projectName}
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   ${stack.packageManager === 'npm' ? 'npm install' : stack.packageManager === 'yarn' ? 'yarn' : 'pnpm install'}
   \`\`\`

3. **Set up environment**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. **Run the application**
   Use the ACTUAL "dev" script from package.json:
   \`\`\`bash
   ${stack.packageManager === 'npm' ? 'npm run dev' : stack.packageManager === 'yarn' ? 'yarn dev' : 'pnpm dev'}
   \`\`\`

NOTE: Only mention environment setup if .env.example actually exists in the project.`,

    'tech-stack': `Create tech stack based ONLY on actual dependencies.

## 🛠️ Tech Stack

Read the dependencies from package.json and list them accurately:

| Category | Technology |
|----------|------------|
| Framework | ${stack.primary} |
| Language | ${stack.language} |

Add rows ONLY for dependencies that actually exist:
- If has "tailwindcss" → Styling: Tailwind CSS
- If has "prisma" → ORM: Prisma
- If has "@upstash/redis" → Cache: Redis (Upstash)
- If has "openai" → AI: OpenAI
- If has "@google/generative-ai" → AI: Google Gemini
- If has "zustand" → State: Zustand

DO NOT add technologies that aren't in the dependencies.`,

    environment: `Document environment variables ONLY from .env.example if it exists.

## ⚙️ Environment Variables

CRITICAL: 
1. If .env.example content is provided in context, use THOSE EXACT variables
2. If no .env.example, list variables based on dependencies:
   - Has openai → OPENAI_API_KEY
   - Has @google/generative-ai → GOOGLE_AI_API_KEY  
   - Has @upstash/redis → UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
   - Has groq-sdk → GROQ_API_KEY

Format:
\`\`\`env
# Copy from .env.example and fill in your values
VARIABLE_NAME=your_value_here
\`\`\`

| Variable | Description | Required |
|----------|-------------|----------|

DO NOT invent variables like "SOCIAL_MEDIA_INTEGRATION" or "BLOG_CMS_INTEGRATION" unless they exist in .env.example.`,

    'api-docs': `Document API endpoints ONLY if they actually exist.

## 📚 API Reference

CRITICAL:
1. Look at the actual API routes in the project (app/api/ or pages/api/)
2. ONLY document endpoints that exist
3. If you see /api/generate, /api/analyze, /api/clear-cache - document those
4. DO NOT invent endpoints

If this is a ${stack.primary} project with app/api/ routes, document:
- The actual routes from the file structure
- What they do based on their names
- Example request/response based on actual functionality`,

    deployment: `Create deployment instructions for ${stack.primary}.

## 🚀 Deployment

### Production Build
\`\`\`bash
${stack.packageManager === 'npm' ? 'npm run build' : stack.packageManager === 'yarn' ? 'yarn build' : 'pnpm build'}
\`\`\`

${stack.primary === 'nextjs' ? `
### Vercel (Recommended for Next.js)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push code to GitHub
2. Import project in Vercel  
3. Add environment variables
4. Deploy
` : ''}

${stack.hasDocker ? `
### Docker
\`\`\`bash
docker build -t ${projectName.toLowerCase()} .
docker run -p 3000:3000 ${projectName.toLowerCase()}
\`\`\`
` : ''}

List only deployment options relevant to the actual project setup.`,

    contributing: `Standard contributing guidelines.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/your-feature\`)
3. Commit your changes (\`git commit -m 'Add your feature'\`)
4. Push to the branch (\`git push origin feature/your-feature\`)
5. Open a Pull Request

### Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed`,

    license: `Add license section.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ for the developer community`,

    testing: `Document testing ONLY if test scripts exist.

## 🧪 Testing

CRITICAL: Only include this if package.json has test scripts.

If "test" script exists:
\`\`\`bash
${stack.packageManager === 'npm' ? 'npm test' : stack.packageManager === 'yarn' ? 'yarn test' : 'pnpm test'}
\`\`\`

If "test:watch" exists:
\`\`\`bash
${stack.packageManager === 'npm' ? 'npm run test:watch' : 'yarn test:watch'}
\`\`\`

If "test:coverage" exists:
\`\`\`bash
${stack.packageManager === 'npm' ? 'npm run test:coverage' : 'yarn test:coverage'}
\`\`\`

Only mention testing conventions if you see test files in the structure.`,

    scripts: `Document ACTUAL scripts from package.json.

## 📜 Available Scripts

List ONLY scripts that exist in package.json:

| Script | Command | Description |
|--------|---------|-------------|

For each script in package.json, explain what it does based on its command.
Common scripts to look for: dev, build, start, lint, test, format, etc.

DO NOT add scripts that don't exist.`,
  };

  return basePrompt + '\n\n' + (sectionInstructions[section.id] || section.howToWrite);
}