// src/app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, redis } from '@/lib/rate-limit';
import { SECTION_BRICKS } from '@/lib/bricks';
import { generateSectionPrompt } from '@/lib/ai/prompts/section-prompts';
import { DetectedStack } from '@/types';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

// ✅ Enhanced types with repo data
interface RepoData {
  files: Array<{ name: string; content: string }>;
  structure: string[];
  packageJson?: Record<string, unknown>;
  existingReadme?: string;
  envExample?: string;
  hasDocker?: boolean;
  hasTests?: boolean;
  hasCI?: boolean;
}

interface GenerateRequestBody {
  sectionId: string;
  stack: DetectedStack;
  projectName: string;
  repoUrl?: string;
  repoData?: RepoData; // ✅ Accept repo data
}

interface CachedResponse {
  sectionId: string;
  content: string;
  explanation: string;
  provider: string;
}

interface GeneratedSectionResult {
  sectionId: string;
  content: string;
  explanation: string;
  provider: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Available AI providers:', aiOrchestrator.getAvailableProviders());

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetAt: rateLimitResult.resetAt,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
    }

    const body = await request.json() as GenerateRequestBody;
    const { sectionId, stack, projectName, repoUrl, repoData } = body;

    const section = SECTION_BRICKS.find(s => s.id === sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // ✅ Build rich context from actual repo data
    const additionalContext = buildEnhancedContext(repoData, stack, projectName, repoUrl);

    const prompt = generateSectionPrompt(section, stack, projectName, additionalContext, repoUrl);

    // Redis Caching - include repoData hash for better cache key
    const contextHash = repoData 
      ? Buffer.from(JSON.stringify(repoData.structure?.slice(0, 10) || [])).toString('base64').slice(0, 20)
      : '';
    const projectSpecificHash = Buffer.from(
      `${projectName}:${sectionId}:${stack.primary}:${contextHash}`
    ).toString('base64');
    const cacheKey = `generate:${projectSpecificHash}`;

    // Check cache
    const cached = await redis.get<CachedResponse>(cacheKey);
    if (cached) {
      const isValid = 
        cached.content &&
        cached.content.length > 100 &&
        !cached.content.includes('*AI generation temporarily unavailable*') &&
        !cached.content.includes('Please customize this section manually') &&
        !cached.content.includes('{{') &&
        cached.provider;

      if (isValid) {
        console.log(`✅ Valid cache hit for section ${sectionId} from ${cached.provider}`);
        return NextResponse.json({
          success: true,
          data: cached,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: rateLimitResult.resetAt,
          }
        });
      } else {
        console.warn(`🗑️ Removing invalid cache for ${sectionId}`);
        await redis.del(cacheKey);
      }
    }

    // Generate content using AIOrchestrator
    try {
      const response = await aiOrchestrator.generate(prompt, additionalContext);

      const isValidResponse = 
        response.content &&
        response.content.length > 100 &&
        !response.content.includes('*AI generation temporarily unavailable*') &&
        !response.content.includes('Please customize this section manually') &&
        !response.content.includes('{{');

      const result: GeneratedSectionResult = {
        sectionId,
        content: response.content,
        explanation: section.whyImportant,
        provider: response.provider,
      };

      if (isValidResponse) {
        await redis.set(cacheKey, result, { ex: 86400 });
        console.log(`💾 Cached valid response from ${response.provider} for ${sectionId}`);
      } else {
        console.warn(`⚠️ Not caching potentially invalid response from ${response.provider}`);
      }

      return NextResponse.json({
        success: true,
        data: result,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt,
        }
      });

    } catch (generationError) {
      const errorMessage = generationError instanceof Error 
        ? generationError.message 
        : 'Unknown error occurred';
      
      console.error('❌ Generation failed:', errorMessage);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to generate content. Please try again later.',
        details: errorMessage,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt,
        }
      }, { status: 500 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    console.error('Generation error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to generate section', details: errorMessage },
      { status: 500 }
    );
  }
}

// In /api/generate/route.ts - Update buildEnhancedContext

function buildEnhancedContext(
  repoData: RepoData | undefined, 
  stack: DetectedStack, 
  projectName: string,
  repoUrl?: string
): string {
  const sections: string[] = [];

  sections.push(`=== PROJECT: ${projectName} ===`);
  
  if (!repoData) {
    return sections.join('\n');
  }

  // ✅ Analyze file structure for purpose detection
  if (repoData.structure) {
    const structure = repoData.structure;
    
    // Key indicators
    const hasGenerateApi = structure.some(f => f.includes('api/generate'));
    const hasAnalyzeApi = structure.some(f => f.includes('api/analyze'));
    const hasReadmeComponents = structure.some(f => 
      f.toLowerCase().includes('readme') || 
      f.toLowerCase().includes('preview') ||
      f.toLowerCase().includes('wizard')
    );
    
    if (hasGenerateApi || hasAnalyzeApi || hasReadmeComponents) {
      sections.push('\n🎯 PROJECT TYPE DETECTED: README/Documentation Generator');
      sections.push('This project generates documentation using AI.');
    }
    
    // API routes
    const apiRoutes = structure.filter(f => f.includes('/api/'));
    if (apiRoutes.length > 0) {
      sections.push('\n📡 API ROUTES (shows what the project does):');
      apiRoutes.forEach(r => sections.push(`  - ${r}`));
    }
    
    // Components
    const components = structure.filter(f => 
      f.includes('/components/') || f.includes('wizard') || f.includes('preview')
    );
    if (components.length > 0) {
      sections.push('\n🧩 KEY COMPONENTS:');
      components.slice(0, 10).forEach(c => sections.push(`  - ${c}`));
    }
  }

  // Package.json
  if (repoData.packageJson) {
    const pkg = repoData.packageJson;
    
    if (pkg.description) {
      sections.push(`\n📌 OFFICIAL DESCRIPTION: "${pkg.description}"`);
    }
    
    // Scripts
    if (pkg.scripts) {
      sections.push('\n📜 SCRIPTS:');
      Object.entries(pkg.scripts as Record<string, string>).forEach(([name, cmd]) => {
        sections.push(`  ${name}: ${cmd}`);
      });
    }
    
    // Dependencies
    if (pkg.dependencies) {
      const deps = Object.keys(pkg.dependencies as Record<string, string>);
      sections.push('\n📦 DEPENDENCIES:');
      sections.push(deps.join(', '));
    }
  }

  // Environment variables
  if (repoData.envExample) {
    sections.push('\n🔐 ENVIRONMENT VARIABLES (.env.example):');
    sections.push(repoData.envExample);
  }

  return sections.join('\n');
}