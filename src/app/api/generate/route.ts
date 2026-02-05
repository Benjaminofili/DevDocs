// src/app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, redis } from '@/lib/rate-limit';
import { SECTION_BRICKS } from '@/lib/bricks';
import { generateSectionPrompt } from '@/lib/ai/prompts/section-prompts';
import { DetectedStack } from '@/types';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { logger } from '@/lib/logger';
import { GenerateRequestSchema } from '@/lib/validators/schemas';
import { isCacheValid, isContentCacheable } from '@/lib/validators/cache';
import { CACHE_CONFIG, API_MESSAGES } from '@/config/constants';
import { ZodError } from 'zod';

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

/**
 * POST /api/generate - Generates README sections using AI
 * 
 * Accepts a section ID, project stack information, and optional repository data.
 * Uses multi-provider AI orchestration with fallback and caching.
 * 
 * @param request - Next.js request object
 * @returns JSON response with generated content or error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logger.debug('Available AI providers', { 
      providers: aiOrchestrator.getAvailableProviders() 
    });

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { ip, limit: rateLimitResult.limit });
      
      return NextResponse.json(
        {
          success: false,
          error: API_MESSAGES.RATE_LIMIT_EXCEEDED,
          resetAt: rateLimitResult.resetAt,
          remaining: rateLimitResult.remaining
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          }
        }
      );
    }

    // Parse and validate request body
    const rawBody = await request.json();
    
    let validatedBody;
    try {
      validatedBody = GenerateRequestSchema.parse(rawBody);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        logger.warn('Invalid request body', { 
          errors: validationError.flatten().fieldErrors 
        });
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid request', 
            details: validationError.flatten().fieldErrors 
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { sectionId, projectName, repoUrl, repoData } = validatedBody;

    // ✅ FIX: Normalize stack to ensure it matches DetectedStack type
    const stack: DetectedStack = {
      ...validatedBody.stack,
      domainHints: validatedBody.stack.domainHints || [], // Ensure it's always an array
    };

    logger.debug('Generate request', { 
      sectionId, 
      projectName, 
      stack: stack.primary,
      hasRepoData: !!repoData 
    });

    // Find section configuration
    const section = SECTION_BRICKS.find(s => s.id === sectionId);
    if (!section) {
      logger.warn('Section not found', { sectionId });
      
      return NextResponse.json(
        { 
          success: false,
          error: API_MESSAGES.SECTION_NOT_FOUND 
        },
        { status: 404 }
      );
    }

    // Build context from repo data
    const additionalContext = buildEnhancedContext(repoData, stack, projectName, repoUrl);

    // Generate prompt
    const prompt = generateSectionPrompt(
      section, 
      stack, 
      projectName, 
      additionalContext, 
      repoUrl
    );

    // Generate cache key
    const contextHash = repoData 
      ? Buffer.from(JSON.stringify(repoData.structure?.slice(0, 10) || [])).toString('base64').slice(0, 20)
      : '';
    const projectSpecificHash = Buffer.from(
      `${projectName}:${sectionId}:${stack.primary}:${contextHash}`
    ).toString('base64');
    const cacheKey = `generate:${projectSpecificHash}`;

    // Check cache
    const cached = await redis.get<CachedResponse>(cacheKey);
    
    if (isCacheValid(cached)) {
      logger.cache('hit', `${sectionId} (${cached.provider})`);
      
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt,
        }
      }, {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-Cache': 'HIT',
          'X-Response-Time': `${duration}ms`,
        }
      });
    } else if (cached) {
      // Cache exists but is invalid
      logger.cache('del', `invalid cache for ${sectionId}`);
      await redis.del(cacheKey);
    } else {
      logger.cache('miss', sectionId);
    }

    // Generate content using AI
    try {
      const response = await aiOrchestrator.generate(prompt, additionalContext);

      const result: GeneratedSectionResult = {
        sectionId,
        content: response.content,
        explanation: section.whyImportant,
        provider: response.provider,
      };

      // Cache valid responses only
      if (isContentCacheable(response.content)) {
        await redis.set(cacheKey, result, { ex: CACHE_CONFIG.GENERATION_TTL_SECONDS });
        logger.cache('set', `${sectionId} (${response.provider})`);
      } else {
        logger.warn('Not caching invalid response', { 
          sectionId, 
          provider: response.provider,
          contentLength: response.content?.length || 0 
        });
      }

      const duration = Date.now() - startTime;
      logger.info('Generation complete', { 
        sectionId, 
        provider: response.provider, 
        duration,
        cached: false 
      });

      return NextResponse.json({
        success: true,
        data: result,
        cached: false,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt,
        }
      }, {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-Cache': 'MISS',
          'X-Response-Time': `${duration}ms`,
        }
      });

    } catch (generationError) {
      logger.error('AI generation failed', generationError, { sectionId });
      
      const errorMessage = generationError instanceof Error 
        ? generationError.message 
        : 'Unknown error occurred';
      
      return NextResponse.json({
        success: false,
        error: API_MESSAGES.GENERATION_FAILED,
        details: errorMessage,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt,
        }
      }, { 
        status: 500,
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        }
      });
    }

  } catch (error) {
    logger.error('Request processing failed', error);
    
    // Handle specific error types
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error', 
          details: error.flatten() 
        },
        { status: 400 }
      );
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

/**
 * Builds enhanced context from repository data for AI prompt
 * 
 * @param repoData - Optional repository analysis data
 * @param stack - Detected technology stack
 * @param projectName - Name of the project
 * @param repoUrl - Optional GitHub repository URL
 * @returns Formatted context string for AI prompt
 */
function buildEnhancedContext(
  repoData: RepoData | undefined, 
  stack: DetectedStack, // ✅ Now only accepts DetectedStack (not DetectedStackInput)
  projectName: string,
  repoUrl?: string
): string {
  const sections: string[] = [];

  sections.push(`=== PROJECT: ${projectName} ===`);
  sections.push(`Stack: ${stack.primary} (${stack.language})`);
  sections.push(`Package Manager: ${stack.packageManager}`);
  
  if (repoUrl) {
    sections.push(`Repository: ${repoUrl}`);
  }

  if (!repoData) {
    logger.debug('No repository data available for context');
    sections.push('\n⚠️ No repository data available.');
    return sections.join('\n');
  }

  // Analyze file structure
  if (repoData.structure && repoData.structure.length > 0) {
    const structure = repoData.structure;
    
    // Detect project type from file structure
    const hasGenerateApi = structure.some(f => f.includes('api/generate'));
    const hasAnalyzeApi = structure.some(f => f.includes('api/analyze'));
    const hasReadmeComponents = structure.some(f => 
      f.toLowerCase().includes('readme') || 
      f.toLowerCase().includes('preview') ||
      f.toLowerCase().includes('wizard')
    );
    
    if (hasGenerateApi || hasAnalyzeApi || hasReadmeComponents) {
      sections.push('\n🎯 PROJECT TYPE: README/Documentation Generator');
      logger.debug('Project type detected', { type: 'README Generator' });
    }
    
    // List API routes
    const apiRoutes = structure.filter(f => f.includes('/api/') || f.includes('api/'));
    if (apiRoutes.length > 0) {
      sections.push('\n📡 API ROUTES:');
      apiRoutes.slice(0, 10).forEach(r => sections.push(`  - ${r}`));
      
      if (apiRoutes.length > 10) {
        sections.push(`  ... and ${apiRoutes.length - 10} more`);
      }
    }
    
    sections.push(`\n📁 FILES: ${structure.length} total`);
  }

  // Parse package.json information
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
    
    // List available scripts
    if (pkg.scripts && typeof pkg.scripts === 'object') {
      const scripts = pkg.scripts as Record<string, string>;
      const scriptEntries = Object.entries(scripts);
      
      sections.push('\n📜 SCRIPTS:');
      scriptEntries.forEach(([name, cmd]) => {
        sections.push(`  ${name}: ${cmd}`);
      });
    }
    
    // List dependencies
    if (pkg.dependencies && typeof pkg.dependencies === 'object') {
      const deps = Object.keys(pkg.dependencies as Record<string, string>);
      sections.push(`\n📦 DEPENDENCIES (${deps.length}):`);
      sections.push(deps.join(', '));
    }
    
    // List dev dependencies
    if (pkg.devDependencies && typeof pkg.devDependencies === 'object') {
      const devDeps = Object.keys(pkg.devDependencies as Record<string, string>);
      sections.push(`\n🔧 DEV DEPENDENCIES (${devDeps.length}):`);
      sections.push(devDeps.join(', '));
    }
  }

  // Include environment variable template
  if (repoData.envExample) {
    sections.push('\n=== .ENV.EXAMPLE ===');
    sections.push(repoData.envExample);
  }

  // List detected features
  sections.push('\n=== DETECTED FEATURES ===');
  const features: string[] = [];
  if (repoData.hasDocker) features.push('✓ Docker');
  if (repoData.hasCI) features.push('✓ CI/CD');
  if (repoData.hasTests) features.push('✓ Tests');
  
  if (features.length > 0) {
    features.forEach(f => sections.push(f));
  } else {
    sections.push('(No additional features detected)');
  }

  const context = sections.join('\n');
  
  logger.debug('Built enhanced context', { 
    lines: sections.length,
    hasPackageJson: !!repoData.packageJson,
    hasEnvExample: !!repoData.envExample,
    fileCount: repoData.structure?.length || 0
  });

  return context;
}