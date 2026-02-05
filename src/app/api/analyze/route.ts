// src/app/api/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StackAnalyzer } from '@/lib/analyzers';
import { getSectionsForStack } from '@/lib/bricks';
import { redis } from '@/lib/rate-limit';
import { AnalyzeRequestSchema } from '@/lib/validators/schemas';
import { logger } from '@/lib/logger';
import { getEnv } from '@/lib/env';
import { GITHUB_CONFIG } from '@/config/constants';

interface FileContent {
  name: string;
  content: string;
}

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

// Type helper for checking if a string is in the important files array
const isImportantFile = (fileName: string): boolean => {
  return (GITHUB_CONFIG.IMPORTANT_FILES as readonly string[]).includes(fileName);
};

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = AnalyzeRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { repoUrl, files } = parseResult.data;

    // Redis Caching
    let cacheKey = '';
    if (repoUrl) {
      cacheKey = `analyze:${repoUrl}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.cache('hit', cacheKey);
        return NextResponse.json({ success: true, data: cached });
      }
    }

    let fileContents: FileContent[] = [];

    if (repoUrl) {
      fileContents = await fetchRepoContents(repoUrl);
    } else if (files) {
      fileContents = files;
    }

    const analyzer = new StackAnalyzer(fileContents);
    const stack = analyzer.analyze();
    const suggestedSections = getSectionsForStack(stack);

    // ✅ Extract comprehensive repo data
    const packageJsonFile = fileContents.find(f => f.name === 'package.json');
    const existingReadme = fileContents.find(f =>
      f.name.toLowerCase() === 'readme.md' || f.name.toLowerCase() === 'readme'
    );
    const envExample = fileContents.find(f =>
      f.name === '.env.example' || f.name === '.env.sample'
    );

    let packageJson: Record<string, unknown> | undefined;
    if (packageJsonFile?.content) {
      try {
        packageJson = JSON.parse(packageJsonFile.content);
      } catch {
        logger.warn('Failed to parse package.json');
      }
    }

    // ✅ Build comprehensive repo data
    const repoData = {
      files: fileContents.filter(f => f.content), // Only files with content
      structure: fileContents.map(f => f.name),
      packageJson,
      existingReadme: existingReadme?.content,
      envExample: envExample?.content,
      hasDocker: fileContents.some(f =>
        f.name === 'Dockerfile' ||
        f.name === 'docker-compose.yml' ||
        f.name === 'docker-compose.yaml'
      ),
      hasTests: fileContents.some(f =>
        f.name.includes('test') ||
        f.name.includes('spec') ||
        f.name.includes('__tests__') ||
        f.name.includes('.test.') ||
        f.name.includes('.spec.')
      ),
      hasCI: fileContents.some(f =>
        f.name.includes('.github/workflows') ||
        f.name.includes('.gitlab-ci') ||
        f.name.includes('azure-pipelines')
      ),
    };

    const result = {
      stack,
      suggestedSections,
      files: fileContents.map(f => f.name),
      repoData, // ✅ Include full repo data
    };

    // Cache result (15 minutes)
    if (cacheKey) {
      await redis.set(cacheKey, result, { ex: 900 });
    }

    console.log('📊 Analysis complete:', {
      stack: stack.primary,
      files: fileContents.length,
      hasPackageJson: !!packageJson,
      hasEnvExample: !!envExample,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to analyze repository', details: errorMessage },
      { status: 500 }
    );
  }
}

async function fetchRepoContents(repoUrl: string): Promise<FileContent[]> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');

  const [, owner, repo] = match;
  const cleanRepo = repo.replace('.git', '');

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': GITHUB_CONFIG.USER_AGENT,
  };

  const env = getEnv();
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `token ${env.GITHUB_TOKEN}`;
  }

  const fileContents: FileContent[] = [];

  // ✅ Fetch root contents
  const rootResponse = await fetch(
    `https://api.github.com/repos/${owner}/${cleanRepo}/contents`,
    { headers }
  );

  if (!rootResponse.ok) {
    const errorText = await rootResponse.text();
    logger.error('GitHub API error:', { error: errorText });
    throw new Error(`Failed to fetch repository: ${rootResponse.status} ${rootResponse.statusText}`);
  }

  const rootContents: GitHubFile[] = await rootResponse.json();

  // Fetch important files with content
  for (const file of rootContents) {
    if (isImportantFile(file.name) && file.type === 'file' && file.download_url) {
      try {
        const fileResponse = await fetch(file.download_url);
        if (fileResponse.ok) {
          const content = await fileResponse.text();
          fileContents.push({ name: file.name, content });
          logger.debug(`Fetched: ${file.name} (${content.length} chars)`);
        }
      } catch (error) {
        logger.warn(`Failed to fetch ${file.name}:`, { error });
        fileContents.push({ name: file.name, content: '' });
      }
    }
  }

  // ✅ Fetch directory structures (src, app, pages, etc.)
  const importantDirs = GITHUB_CONFIG.IMPORTANT_DIRECTORIES;

  for (const dir of importantDirs) {
    const dirEntry = rootContents.find(f => f.name === dir && f.type === 'dir');

    if (dirEntry) {
      try {
        const dirResponse = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${dir}`,
          { headers }
        );

        if (dirResponse.ok) {
          const dirContents: GitHubFile[] = await dirResponse.json();
          for (const file of dirContents) {
            // Add to structure without fetching content
            fileContents.push({
              name: `${dir}/${file.name}`,
              content: ''
            });
          }
          logger.debug(`Scanned directory: ${dir} (${dirContents.length} items)`);
        }
      } catch (error) {
        logger.warn(`Failed to fetch ${dir} directory:`, { error });
      }
    }
  }

  // ✅ Also try to fetch .github/workflows for CI info
  try {
    const workflowResponse = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}/contents/.github/workflows`,
      { headers }
    );

    if (workflowResponse.ok) {
      const workflows: GitHubFile[] = await workflowResponse.json();
      for (const file of workflows) {
        fileContents.push({
          name: `.github/workflows/${file.name}`,
          content: ''
        });
      }
      logger.debug(`Found ${workflows.length} workflow files`);
    }
  } catch {
    // No workflows, that's fine
  }

  // Record remaining root file names for structure detection
  for (const file of rootContents) {
    if (!fileContents.some(f => f.name === file.name)) {
      fileContents.push({ name: file.name, content: '' });
    }
  }

  logger.info(`Total files analyzed: ${fileContents.length}`);
  return fileContents;
}