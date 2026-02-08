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

// ========== NEW IMPORTS ==========
import { createClient } from '@/supabase/server';
import { getUserTier, getGenerationLimit } from '@/lib/tiers/config';
import { checkUsageLimit, incrementUsage } from '@/lib/tiers/usage';
import { isSectionAvailable, getSectionTierRequirement } from '@/lib/tiers/feature-flags';
import type { UserTier } from '@/types';
// =================================

// Types (EXISTING - kept as-is)
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

// ========== NEW: Response helper for session cookies ==========
function createJsonResponse(
  body: Record<string, unknown>,
  options: { 
    status?: number; 
    headers?: Record<string, string>;
    sessionId?: string;
    isNewSession?: boolean;
  } = {}
): NextResponse {
  const response = NextResponse.json(body, { 
    status: options.status || 200,
    headers: options.headers 
  });

  // Set session cookie for anonymous users
  if (options.isNewSession && options.sessionId) {
    response.cookies.set('readme_session', options.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }

  return response;
}
// ==============================================================

/**
 * POST /api/generate - Generates README sections using AI
 * 
 * NOW INCLUDES:
 * - Optional authentication (anonymous users still work)
 * - Tier-based section gating (free vs premium sections)
 * - Daily usage limits per tier
 * - Usage tracking to Supabase
 * - Graceful degradation (auth failures don't break generation)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // ========== NEW: Session tracking for anonymous users ==========
  const existingSessionId = request.cookies.get('readme_session')?.value;
  const sessionId = existingSessionId || crypto.randomUUID();
  const isNewSession = !existingSessionId;
  // ===============================================================

  try {
    logger.debug('Available AI providers', {
      providers: aiOrchestrator.getAvailableProviders()
    });

    // ========== NEW: Authentication (optional, non-blocking) ==========
    let userId: string | null = null;
    let userEmail: string | null = null;
    let tier: UserTier = 'anonymous';

    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (user && !authError) {
        userId = user.id;
        userEmail = user.email || null;
        tier = await getUserTier(user.id);
        logger.debug('Authenticated user', { userId, tier });
      } else {
        logger.debug('Anonymous user', { sessionId });
      }
    } catch (authError) {
      // CRITICAL: Auth failures must NOT break generation
      logger.warn('Auth check failed, continuing as anonymous', { 
        error: authError instanceof Error ? authError.message : 'Unknown' 
      });
    }
    // ==================================================================

    // EXISTING: Rate limiting (IP-based DDoS protection - keep this)
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded', { ip, limit: rateLimitResult.limit });

      return createJsonResponse(
        {
          success: false,
          error: API_MESSAGES.RATE_LIMIT_EXCEEDED,
          resetAt: rateLimitResult.resetAt,
          remaining: rateLimitResult.remaining,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
          sessionId,
          isNewSession,
        }
      );
    }

    // EXISTING: Parse and validate request body
    const rawBody = await request.json();

    let validatedBody;
    try {
      validatedBody = GenerateRequestSchema.parse(rawBody);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        logger.warn('Invalid request body', {
          errors: validationError.flatten().fieldErrors
        });

        return createJsonResponse(
          {
            success: false,
            error: 'Invalid request',
            details: validationError.flatten().fieldErrors,
          },
          { status: 400, sessionId, isNewSession }
        );
      }
      throw validationError;
    }

    const { sectionId, projectName, repoUrl, repoData } = validatedBody;

    // EXISTING: Normalize stack
    const stack: DetectedStack = {
      ...validatedBody.stack,
      domainHints: validatedBody.stack.domainHints || [],
    };

    logger.debug('Generate request', {
      sectionId,
      projectName,
      stack: stack.primary,
      tier,
      hasRepoData: !!repoData,
    });

    // ========== NEW: Section availability check ==========
    if (!isSectionAvailable(sectionId, tier)) {
      const requiredTier = getSectionTierRequirement(sectionId);

      logger.info('Section blocked by tier', { sectionId, tier, requiredTier });

      return createJsonResponse(
        {
          success: false,
          error: 'premium_feature',
          message: `"${sectionId}" requires ${requiredTier} access`,
          sectionId,
          requiredTier,
          currentTier: tier,
          action: tier === 'anonymous' 
            ? 'Sign in for free to unlock more sections' 
            : 'Join the waitlist for premium access',
          waitlistFeature: 'premium-sections',
        },
        { status: 403, sessionId, isNewSession }
      );
    }
    // =====================================================

    // ========== NEW: Tier-based usage limit check ==========
    let usageResult;
    try {
      usageResult = await checkUsageLimit(userId, sessionId, tier);

      if (!usageResult.allowed) {
        logger.info('Usage limit reached', { 
          userId, 
          tier, 
          limit: usageResult.limit,
          used: usageResult.used,
        });

        return createJsonResponse(
          {
            success: false,
            error: 'usage_limit',
            message: tier === 'anonymous'
              ? `You've used your ${usageResult.limit} free generations. Sign in to get ${getGenerationLimit('free')} per day!`
              : `Daily limit reached (${usageResult.limit} per day). Resets at midnight UTC.`,
            tier,
            usage: {
              used: usageResult.used,
              limit: usageResult.limit,
              remaining: 0,
              resetAt: usageResult.resetAt,
            },
            action: tier === 'anonymous' 
              ? 'sign_in' 
              : 'join_waitlist',
            waitlistFeature: 'unlimited-generations',
          },
          { status: 429, sessionId, isNewSession }
        );
      }
    } catch (usageError) {
      // CRITICAL: Usage check failures should NOT block generation
      // Fall back to allowing the request (better UX than blocking)
      logger.warn('Usage limit check failed, allowing request', {
        error: usageError instanceof Error ? usageError.message : 'Unknown',
        userId,
        tier,
      });
      usageResult = {
        allowed: true,
        used: 0,
        limit: getGenerationLimit(tier),
        remaining: getGenerationLimit(tier),
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)),
      };
    }
    // =======================================================

    // EXISTING: Find section configuration
    const section = SECTION_BRICKS.find(s => s.id === sectionId);
    if (!section) {
      logger.warn('Section not found', { sectionId });

      return createJsonResponse(
        {
          success: false,
          error: API_MESSAGES.SECTION_NOT_FOUND,
        },
        { status: 404, sessionId, isNewSession }
      );
    }

    // EXISTING: Build context from repo data
    const additionalContext = buildEnhancedContext(repoData, stack, projectName, repoUrl);

    // EXISTING: Generate prompt
    const prompt = generateSectionPrompt(
      section,
      stack,
      projectName,
      additionalContext,
      repoUrl
    );

    // EXISTING: Generate cache key
    const contextHash = repoData
      ? Buffer.from(JSON.stringify(repoData.structure?.slice(0, 10) || [])).toString('base64').slice(0, 20)
      : '';
    const projectSpecificHash = Buffer.from(
      `${projectName}:${sectionId}:${stack.primary}:${contextHash}`
    ).toString('base64');
    const cacheKey = `generate:${projectSpecificHash}`;

    // EXISTING: Check cache
    const cached = await redis.get<CachedResponse>(cacheKey);

    if (isCacheValid(cached)) {
      logger.cache('hit', `${sectionId} (${cached.provider})`);

      const duration = Date.now() - startTime;

      // ========== NEW: Track usage even for cached responses ==========
      try {
        await incrementUsage(userId, sessionId, tier, {
          action: 'generate',
          stack: stack.primary,
          repoUrl: repoUrl || null,
        });
      } catch (trackErr) {
        logger.warn('Usage tracking failed for cached response', {
          error: trackErr instanceof Error ? trackErr.message : 'Unknown'
        });
      }
      // ================================================================

      return createJsonResponse(
        {
          success: true,
          data: cached,
          cached: true,
          // ========== NEW: Include tier and usage info ==========
          tier,
          usage: {
            remaining: Math.max(0, (usageResult?.remaining ?? 1) - 1),
            limit: usageResult?.limit ?? getGenerationLimit(tier),
            resetAt: usageResult?.resetAt ?? new Date(new Date().setUTCHours(24, 0, 0, 0)),
          },
          // ======================================================
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: rateLimitResult.resetAt,
          },
        },
        {
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-Cache': 'HIT',
            'X-Response-Time': `${duration}ms`,
            'X-User-Tier': tier,
          },
          sessionId,
          isNewSession,
        }
      );
    } else if (cached) {
      logger.cache('del', `invalid cache for ${sectionId}`);
      await redis.del(cacheKey);
    } else {
      logger.cache('miss', sectionId);
    }

    // EXISTING: Generate content using AI
    try {
      const response = await aiOrchestrator.generate(prompt, additionalContext);

      const result: GeneratedSectionResult = {
        sectionId,
        content: response.content,
        explanation: section.whyImportant,
        provider: response.provider,
      };

      // EXISTING: Cache valid responses only
      if (isContentCacheable(response.content)) {
        await redis.set(cacheKey, result, { ex: CACHE_CONFIG.GENERATION_TTL_SECONDS });
        logger.cache('set', `${sectionId} (${response.provider})`);
      } else {
        logger.warn('Not caching invalid response', {
          sectionId,
          provider: response.provider,
          contentLength: response.content?.length || 0,
        });
      }

      // ========== NEW: Track usage after successful generation ==========
      try {
        await incrementUsage(userId, sessionId, tier, {
          action: 'generate',
          stack: stack.primary,
          repoUrl: repoUrl || null,
        });
      } catch (trackErr) {
        logger.warn('Usage tracking failed', {
          error: trackErr instanceof Error ? trackErr.message : 'Unknown',
          sectionId,
        });
        // Don't fail the request - tracking is non-critical
      }
      // ==================================================================

      const duration = Date.now() - startTime;
      logger.info('Generation complete', {
        sectionId,
        provider: response.provider,
        duration,
        cached: false,
        tier,
        userId: userId || 'anonymous',
      });

      return createJsonResponse(
        {
          success: true,
          data: result,
          cached: false,
          // ========== NEW: Include tier and usage info ==========
          tier,
          usage: {
            remaining: Math.max(0, (usageResult?.remaining ?? 1) - 1),
            limit: usageResult?.limit ?? getGenerationLimit(tier),
            resetAt: usageResult?.resetAt ?? new Date(new Date().setUTCHours(24, 0, 0, 0)),
          },
          // ======================================================
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: rateLimitResult.resetAt,
          },
        },
        {
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-Cache': 'MISS',
            'X-Response-Time': `${duration}ms`,
            'X-User-Tier': tier,
          },
          sessionId,
          isNewSession,
        }
      );
    } catch (generationError) {
      logger.error('AI generation failed', generationError, { sectionId });

      const errorMessage = generationError instanceof Error
        ? generationError.message
        : 'Unknown error occurred';

      return createJsonResponse(
        {
          success: false,
          error: API_MESSAGES.GENERATION_FAILED,
          details: errorMessage,
          tier,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: rateLimitResult.resetAt,
          },
        },
        {
          status: 500,
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
          sessionId,
          isNewSession,
        }
      );
    }
  } catch (error) {
    logger.error('Request processing failed', error);

    if (error instanceof ZodError) {
      return createJsonResponse(
        {
          success: false,
          error: 'Validation error',
          details: error.flatten(),
        },
        { status: 400, sessionId, isNewSession }
      );
    }

    const errorMessage = error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

    return createJsonResponse(
      {
        success: false,
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500, sessionId, isNewSession }
    );
  }
}

/**
 * EXISTING: Builds enhanced context from repository data for AI prompt
 * (Unchanged from your original - kept as-is)
 */
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

  if (repoUrl) {
    sections.push(`Repository: ${repoUrl}`);
  }

  if (!repoData) {
    logger.debug('No repository data available for context');
    sections.push('\n⚠️ No repository data available.');
    return sections.join('\n');
  }

  if (repoData.structure && repoData.structure.length > 0) {
    const structure = repoData.structure;

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

    if (pkg.scripts && typeof pkg.scripts === 'object') {
      const scripts = pkg.scripts as Record<string, string>;
      const scriptEntries = Object.entries(scripts);
      sections.push('\n📜 SCRIPTS:');
      scriptEntries.forEach(([name, cmd]) => {
        sections.push(`  ${name}: ${cmd}`);
      });
    }

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

  if (repoData.envExample) {
    sections.push('\n=== .ENV.EXAMPLE ===');
    sections.push(repoData.envExample);
  }

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
    fileCount: repoData.structure?.length || 0,
  });

  return context;
}