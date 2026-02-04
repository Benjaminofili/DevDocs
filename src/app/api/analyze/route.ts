// src/app/api/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StackAnalyzer } from '@/lib/analyzers';
import { getSectionsForStack } from '@/lib/bricks';
import { redis } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, files } = body;

    // ✅ Redis Caching
    let cacheKey = '';
    if (repoUrl) {
      cacheKey = `analyze:${repoUrl}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit for ${repoUrl}`);
        return NextResponse.json({ success: true, data: cached });
      }
    }

    let fileContents: Array<{ name: string; content: string }> = [];

    if (repoUrl) {
      // Fetch from GitHub API
      fileContents = await fetchRepoContents(repoUrl);
    } else if (files) {
      // Use uploaded files
      fileContents = files;
    } else {
      return NextResponse.json(
        { error: 'Provide either repoUrl or files' },
        { status: 400 }
      );
    }

    const analyzer = new StackAnalyzer(fileContents);
    const stack = analyzer.analyze();
    const suggestedSections = getSectionsForStack(stack);

    const result = {
      stack,
      suggestedSections,
      files: fileContents.map(f => f.name),
    };

    // Cache result if using repoUrl (15 minutes)
    if (cacheKey) {
      await redis.set(cacheKey, result, { ex: 900 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    );
  }
}

async function fetchRepoContents(repoUrl: string) {
  // Parse GitHub URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');

  const [, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(apiUrl, { headers });
  if (!response.ok) throw new Error('Failed to fetch repository');

  const contents = await response.json();

  // Fetch important files
  const importantFiles = [
    'package.json',
    'requirements.txt',
    'pyproject.toml',
    'go.mod',
    'Cargo.toml',
    '.env.example',
    'Dockerfile',
    'docker-compose.yml',
  ];

  const fileContents: Array<{ name: string; content: string }> = [];

  for (const file of contents) {
    if (importantFiles.includes(file.name) && file.type === 'file') {
      const fileResponse = await fetch(file.download_url);
      const content = await fileResponse.text();
      fileContents.push({ name: file.name, content });
    }
  }

  // Also record all file names for structure detection
  for (const file of contents) {
    if (!fileContents.some(f => f.name === file.name)) {
      fileContents.push({ name: file.name, content: '' });
    }
  }

  return fileContents;
}