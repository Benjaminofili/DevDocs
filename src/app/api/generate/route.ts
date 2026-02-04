// src/app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, redis } from '@/lib/rate-limit';
import { SECTION_BRICKS } from '@/lib/bricks';
import { generateSectionPrompt } from '@/lib/ai/prompts/section-prompts';
import { DetectedStack } from '@/types';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

// Types
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
  repoData?: RepoData;
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

    // ✅ Parse body FIRST, then log
    const body = await request.json() as GenerateRequestBody;
    const { sectionId, stack, projectName, repoUrl, repoData } = body;

    // ✅ Now we can log after variables are defined
    console.log('📝 Generate request:', {
      sectionId,
      projectName,
      projectNameType: typeof projectName,
      hasStack: !!stack,
      hasRepoData: !!repoData,
    });

    // ✅ Safety check for projectName
    const safeProjectName = typeof projectName === 'string' && projectName.trim() 
      ? projectName 
      : 'Project';

    const section = SECTION_BRICKS.find(s => s.id === sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Build context from repo data
    const additionalContext = buildEnhancedContext(repoData, stack, safeProjectName, repoUrl);

    // Generate prompt
    const prompt = generateSectionPrompt(
      section, 
      stack, 
      safeProjectName, 
      additionalContext, 
      repoUrl
    );

    // Redis Caching
    const contextHash = repoData 
      ? Buffer.from(JSON.stringify(repoData.structure?.slice(0, 10) || [])).toString('base64').slice(0, 20)
      : '';
    const projectSpecificHash = Buffer.from(
      `${safeProjectName}:${sectionId}:${stack.primary}:${contextHash}`
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

    // Generate content
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

// Build enhanced context from repo data
function buildEnhancedContext(
  repoData: RepoData | undefined, 
  stack: DetectedStack, 
  projectName: string,
  repoUrl?: string
): string {
  const sections: string[] = [];

  // ✅ Safety check
  const safeName = typeof projectName === 'string' ? projectName : 'Project';

  sections.push(`=== PROJECT: ${safeName} ===`);
  sections.push(`Stack: ${stack.primary} (${stack.language})`);
  sections.push(`Package Manager: ${stack.packageManager}`);
  
  if (repoUrl) {
    sections.push(`Repository: ${repoUrl}`);
  }

  if (!repoData) {
    sections.push('\n⚠️ No repository data available.');
    return sections.join('\n');
  }

  // Analyze file structure
  if (repoData.structure && repoData.structure.length > 0) {
    const structure = repoData.structure;
    
    // Detect project type
    const hasGenerateApi = structure.some(f => f.includes('api/generate'));
    const hasAnalyzeApi = structure.some(f => f.includes('api/analyze'));
    const hasReadmeComponents = structure.some(f => 
      f.toLowerCase().includes('readme') || 
      f.toLowerCase().includes('preview') ||
      f.toLowerCase().includes('wizard')
    );
    
    if (hasGenerateApi || hasAnalyzeApi || hasReadmeComponents) {
      sections.push('\n🎯 PROJECT TYPE: README/Documentation Generator');
    }
    
    // API routes
    const apiRoutes = structure.filter(f => f.includes('/api/') || f.includes('api/'));
    if (apiRoutes.length > 0) {
      sections.push('\n📡 API ROUTES:');
      apiRoutes.slice(0, 10).forEach(r => sections.push(`  - ${r}`));
    }
    
    // File structure summary
    sections.push(`\n📁 FILES: ${structure.length} total`);
  }

  // Package.json info
  if (repoData.packageJson) {
    const pkg = repoData.packageJson;
    
    sections.push('\n=== PACKAGE.JSON ===');
    
    if (pkg.description) {
      sections.push(`📌 DESCRIPTION: "${pkg.description}"`);
    }
    
    if (pkg.name) {
      sections.push(`Name: ${pkg.name}`);
    }
    
    if (pkg.version) {
      sections.push(`Version: ${pkg.version}`);
    }
    
    // Scripts
    if (pkg.scripts && typeof pkg.scripts === 'object') {
      const scripts = pkg.scripts as Record<string, string>;
      sections.push('\n📜 SCRIPTS:');
      Object.entries(scripts).forEach(([name, cmd]) => {
        sections.push(`  ${name}: ${cmd}`);
      });
    }
    
    // Dependencies
    if (pkg.dependencies && typeof pkg.dependencies === 'object') {
      const deps = Object.keys(pkg.dependencies as Record<string, string>);
      sections.push(`\n📦 DEPENDENCIES (${deps.length}):`);
      sections.push(deps.join(', '));
    }
    
    if (pkg.devDependencies && typeof pkg.devDependencies === 'object') {
      const devDeps = Object.keys(pkg.devDependencies as Record<string, string>);
      sections.push(`\n🔧 DEV DEPENDENCIES (${devDeps.length}):`);
      sections.push(devDeps.join(', '));
    }
  }

  // Environment variables
  if (repoData.envExample) {
    sections.push('\n=== .ENV.EXAMPLE ===');
    sections.push(repoData.envExample);
  }

  // Features
  sections.push('\n=== DETECTED FEATURES ===');
  if (repoData.hasDocker) sections.push('✓ Docker');
  if (repoData.hasCI) sections.push('✓ CI/CD');
  if (repoData.hasTests) sections.push('✓ Tests');

  return sections.join('\n');
}