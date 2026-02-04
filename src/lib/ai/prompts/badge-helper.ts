// src/lib/ai/prompts/badge-helper.ts

export function generateBadgeUrls(projectName: string, repoUrl?: string) {
  // Extract owner and repo from URL if available
  let owner = 'username';
  let repo = projectName;
  
  if (repoUrl) {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      [, owner, repo] = match;
    }
  }

  return {
    buildStatus: `https://img.shields.io/github/actions/workflow/status/${owner}/${repo}/ci.yml?branch=main`,
    license: `https://img.shields.io/github/license/${owner}/${repo}`,
    version: `https://img.shields.io/github/v/tag/${owner}/${repo}`,
    stars: `https://img.shields.io/github/stars/${owner}/${repo}?style=social`,
    issues: `https://img.shields.io/github/issues/${owner}/${repo}`,
    coverage: `https://img.shields.io/codecov/c/github/${owner}/${repo}`,
    npm: `https://img.shields.io/npm/v/${repo}`,
    downloads: `https://img.shields.io/npm/dm/${repo}`,
  };
}