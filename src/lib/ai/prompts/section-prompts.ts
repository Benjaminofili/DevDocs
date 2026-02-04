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
BADGE INSTRUCTIONS:
Use these EXACT values for badges:
- Owner: ${githubInfo.owner}
- Repo: ${githubInfo.repo}
Example badge format:
![License](https://img.shields.io/github/license/${githubInfo.owner}/${githubInfo.repo})
![Stars](https://img.shields.io/github/stars/${githubInfo.owner}/${githubInfo.repo}?style=social)
`
    : `
BADGE INSTRUCTIONS:
Since no GitHub URL was provided, use generic/static badges or skip them:
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
`;

  const basePrompt = `You are a technical writer creating a README section.

PROJECT CONTEXT:
- Name: ${projectName}
- Stack: ${stack.primary}
- Language: ${stack.language}
- Frameworks: ${stack.frameworks.join(', ') || 'Standard stack'}
- Package Manager: ${stack.packageManager}
- Domain Hints: ${stack.domainHints?.join(', ') || 'None detected'}
${repoUrl ? `- Repository: ${repoUrl}` : ''}
${additionalContext ? `\nAdditional Context:\n${additionalContext}` : ''}

${badgeInstructions}

CRITICAL INSTRUCTIONS:
1. ANALYZE the project name and context to understand what this application actually DOES
2. If the project name suggests a specific domain (e.g., "BakerzBite" = bakery, "TaskMaster" = task management), 
   create content SPECIFIC to that domain, not generic tech content
3. Generate REALISTIC, domain-specific examples and features
4. AVOID generic React/Next.js descriptions unless the project is actually a generic tech demo
5. Focus on the BUSINESS PURPOSE, not just the technology
6. NEVER use generic templates or placeholders like "{{PROJECT_NAME}}" or "{{STACK}}"
7. ALWAYS use the actual project name: "${projectName}"
8. If domain hints are provided, USE THEM to create relevant content
9. DO NOT use placeholders like "your-username", "your-repo", "[owner]", "[repo]"
10. For badges, use the EXACT URLs provided above or static badges

DOMAIN-SPECIFIC GUIDELINES:
- If "BakerzBite" or similar bakery name: Focus on menu management, online ordering, custom cakes, delivery tracking
- If "Dua-Project" or similar religious app: Focus on prayers, religious content, spiritual features
- If e-commerce hints: Focus on products, shopping cart, payments, order management
- If social hints: Focus on user profiles, posts, comments, sharing features
- If task management: Focus on tasks, projects, deadlines, collaboration

TASK: Generate the "${section.name}" section.

REQUIREMENTS:
- Use clean, professional markdown
- Be concise - NO explanations of "why this section matters"
- Focus on actual content, not meta-commentary
- Use realistic examples based on the detected ${stack.primary} stack AND the project's apparent domain
- Keep it under 300 words
- NEVER use template variables like {{PROJECT_NAME}} - use actual values

OUTPUT FORMAT: Return ONLY the markdown content for this section. No preamble, no explanations.
`;

  const sectionInstructions: Record<string, string> = {
    header: `Generate a clean project header:

# ${projectName}

${githubInfo ? `
Add these working badges at the top:
![License](https://img.shields.io/github/license/${githubInfo.owner}/${githubInfo.repo})
![GitHub stars](https://img.shields.io/github/stars/${githubInfo.owner}/${githubInfo.repo}?style=social)
![GitHub issues](https://img.shields.io/github/issues/${githubInfo.owner}/${githubInfo.repo})
` : `
Add static badges:
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
`}

IMPORTANT: Create a description based on what this project appears to do. If "${projectName}" suggests a bakery, restaurant, e-commerce, social app, etc., describe THAT business.

> Brief tagline describing the project purpose

## ✨ Highlights
- List 3-4 key highlights (with emojis)

## Quick Start
\`\`\`bash
${stack.packageManager === 'npm' ? 'npm install' : stack.packageManager === 'yarn' ? 'yarn' : stack.packageManager === 'pnpm' ? 'pnpm install' : 'pip install -r requirements.txt'}
${stack.packageManager === 'npm' ? 'npm run dev' : stack.packageManager === 'yarn' ? 'yarn dev' : stack.packageManager === 'pnpm' ? 'pnpm dev' : 'python main.py'}
\`\`\`

Keep it simple and scannable.`,

    installation: `Create installation instructions for ${stack.primary}:

## 🚀 Installation

### Prerequisites
- ${stack.language} (version X.X or higher)
- ${stack.packageManager}
${stack.hasDocker ? '- Docker (optional)' : ''}

### Steps

1. **Clone the repository**
   \`\`\`bash
   git clone ${repoUrl || `https://github.com/username/${projectName}.git`}
   cd ${projectName}
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   ${stack.packageManager === 'npm' ? 'npm install' : stack.packageManager === 'yarn' ? 'yarn' : stack.packageManager === 'pnpm' ? 'pnpm install' : 'pip install -r requirements.txt'}
   \`\`\`

3. **Set up environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. **Run the application**
   \`\`\`bash
   ${stack.packageManager === 'npm' ? 'npm run dev' : stack.packageManager === 'yarn' ? 'yarn dev' : stack.packageManager === 'pnpm' ? 'pnpm dev' : 'python main.py'}
   \`\`\`

Include domain-specific setup if applicable.`,

    features: `List 5-6 features:

## ✨ Features

IMPORTANT: Create features based on the project's apparent domain, not generic tech features.

Format each feature as:
- 🎯 **Feature Name** - Brief description of what it does and why it matters

Be specific to the apparent business domain of "${projectName}".`,

    'tech-stack': `List the tech stack in a clean table:

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | ${stack.primary} |
| Language | ${stack.language} |
${stack.frameworks.map(f => `| Library | ${f} |`).join('\n')}

Add relevant categories: Frontend, Backend, Database, DevOps, Testing as appropriate.`,

    environment: `Document environment variables:

## ⚙️ Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
# Required
DATABASE_URL=your_database_connection_string
API_KEY=your_api_key

# Optional
DEBUG=false
PORT=3000
\`\`\`

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | Database connection string | Yes | - |
| API_KEY | External API key | Yes | - |
| DEBUG | Enable debug mode | No | false |
| PORT | Server port | No | 3000 |

Include domain-specific environment variables relevant to "${projectName}".`,

    'api-docs': `Create API documentation:

## 📚 API Reference

### Endpoints

#### Get Resources
\`\`\`http
GET /api/resources
\`\`\`

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max items to return |
| offset | number | Pagination offset |

**Response**
\`\`\`json
{
  "data": [],
  "total": 0
}
\`\`\`

Create realistic endpoints relevant to the domain of "${projectName}".`,

    contributing: `Create contribution guidelines:

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed`,

    license: `Add license section:

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by the ${projectName} team`,

    deployment: `Deployment guide for ${stack.primary}:

## 🚀 Deployment

### Production Build
\`\`\`bash
${stack.packageManager === 'npm' ? 'npm run build' : stack.packageManager === 'yarn' ? 'yarn build' : stack.packageManager === 'pnpm' ? 'pnpm build' : 'python -m build'}
\`\`\`

${stack.primary === 'nextjs' ? `
### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy!
` : ''}

${stack.hasDocker ? `
### Docker
\`\`\`bash
docker build -t ${projectName.toLowerCase()} .
docker run -p 3000:3000 ${projectName.toLowerCase()}
\`\`\`
` : ''}`,
  };

  return basePrompt + '\n\n' + (sectionInstructions[section.id] || section.howToWrite);
}