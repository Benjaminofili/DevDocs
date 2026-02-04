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

// ✅ Improved context builder - add to /api/generate/route.ts

function buildEnhancedContext(
  repoData: RepoData | undefined, 
  stack: DetectedStack, 
  projectName: string,
  repoUrl?: string
): string {
  const sections: string[] = [];

  sections.push(`=== PROJECT: ${projectName} ===`);
  sections.push(`Stack: ${stack.primary} (${stack.language})`);
  sections.push(`Package Manager: ${stack.packageManager}`);
  
  if (repoUrl) sections.push(`Repository: ${repoUrl}`);

  if (!repoData) {
    sections.push('\n⚠️ WARNING: No repository data available.');
    return sections.join('\n');
  }

  // ✅ Package.json - THE MOST IMPORTANT SOURCE OF TRUTH
  if (repoData.packageJson) {
    const pkg = repoData.packageJson;
    
    sections.push('\n=== PACKAGE.JSON (PRIMARY SOURCE OF TRUTH) ===');
    
    // Description is key!
    if (pkg.description) {
      sections.push(`📌 DESCRIPTION: "${pkg.description}"`);
      sections.push('   ^^^ USE THIS as the project description ^^^');
    } else {
      sections.push('📌 DESCRIPTION: Not provided - infer from dependencies');
    }
    
    if (pkg.name) sections.push(`Name: ${pkg.name}`);
    if (pkg.version) sections.push(`Version: ${pkg.version}`);
    if (pkg.license) sections.push(`License: ${pkg.license}`);
    
    // Scripts - shows what the project can do
    if (pkg.scripts && typeof pkg.scripts === 'object') {
      const scripts = pkg.scripts as Record<string, string>;
      sections.push('\n📜 ACTUAL SCRIPTS (document these):');
      Object.entries(scripts).forEach(([name, command]) => {
        sections.push(`  "${name}": "${command}"`);
      });
    }
    
    // Dependencies - reveals true functionality
    if (pkg.dependencies && typeof pkg.dependencies === 'object') {
      const deps = Object.keys(pkg.dependencies as Record<string, string>);
      sections.push('\n📦 ACTUAL DEPENDENCIES (base features on these):');
      sections.push(deps.join(', '));
      
      // Highlight AI dependencies
      const aiDeps = deps.filter(d => 
        d.includes('openai') || 
        d.includes('anthropic') || 
        d.includes('generative-ai') ||
        d.includes('groq')
      );
      if (aiDeps.length > 0) {
        sections.push(`\n🤖 AI DEPENDENCIES: ${aiDeps.join(', ')}`);
        sections.push('   This suggests the project is an AI-powered tool!');
      }
    }
  }

  // Environment variables from .env.example
  if (repoData.envExample) {
    sections.push('\n=== ACTUAL .ENV.EXAMPLE CONTENT ===');
    sections.push('Use THESE EXACT variables:');
    sections.push(repoData.envExample);
    sections.push('^^^ Copy these exactly, DO NOT invent new variables ^^^');
  } else {
    sections.push('\n⚠️ No .env.example found - infer variables from dependencies only');
  }

  // File structure
  if (repoData.structure && repoData.structure.length > 0) {
    sections.push('\n=== FILE STRUCTURE ===');
    
    // API routes are important
    const apiRoutes = repoData.structure.filter(f => f.includes('/api/'));
    if (apiRoutes.length > 0) {
      sections.push('📡 API Routes found:');
      apiRoutes.forEach(r => sections.push(`  ${r}`));
    }
    
    // Main structure
    const mainFiles = repoData.structure
      .filter(f => !f.includes('/'))
      .slice(0, 20);
    sections.push('Root files:');
    sections.push(mainFiles.join(', '));
  }

  // Project features
  sections.push('\n=== DETECTED PROJECT FEATURES ===');
  if (repoData.hasDocker) sections.push('✓ Docker support');
  if (repoData.hasCI) sections.push('✓ CI/CD pipeline');
  if (repoData.hasTests) sections.push('✓ Testing setup');

  // ✅ CRITICAL INSTRUCTIONS
  sections.push('\n=== ⚠️ GENERATION RULES ===');
  sections.push('1. ONLY describe features that exist in the actual code');
  sections.push('2. Use package.json description if available');
  sections.push('3. Base features on ACTUAL dependencies, not assumptions');
  sections.push('4. Use EXACT environment variables from .env.example');
  sections.push('5. DO NOT invent: user profiles, commenting, blog posting, analytics');
  sections.push('6. If it has AI deps (openai, anthropic) → describe as AI-powered tool');

  return sections.join('\n');
}