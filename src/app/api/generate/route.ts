// src/app/api/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, redis } from '@/lib/rate-limit';
import { SECTION_BRICKS } from '@/lib/bricks';
import { generateSectionPrompt } from '@/lib/ai/prompts/section-prompts';
import { DetectedStack } from '@/types';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

// ✅ Define proper types
interface GenerateRequestBody {
  sectionId: string;
  stack: DetectedStack;
  projectName: string;
  repoUrl?: string;
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
    const { sectionId, stack, projectName, repoUrl } = body;

    const section = SECTION_BRICKS.find(s => s.id === sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Enhanced context
    const additionalContext = `
Project Name: ${projectName}
${repoUrl ? `Repository: ${repoUrl}` : ''}
Detected Stack: ${stack.primary}
Language: ${stack.language}
Frameworks: ${stack.frameworks.join(', ')}
Package Manager: ${stack.packageManager}
Domain Hints: ${stack.domainHints?.join(', ') || 'None detected'}
`;

    const prompt = generateSectionPrompt(section, stack, projectName, additionalContext);

    // Redis Caching
    const projectSpecificHash = Buffer.from(`${projectName}:${sectionId}:${stack.primary}`).toString('base64');
    const cacheKey = `generate:${projectSpecificHash}`;

    // ✅ Properly typed cache retrieval
    const cached = await redis.get<CachedResponse>(cacheKey);
    if (cached) {
      // Validate cached content before using it
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

      // Validate generated content before caching
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

      // Only cache valid responses
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