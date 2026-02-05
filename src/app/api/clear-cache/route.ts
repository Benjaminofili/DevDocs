// src/app/api/clear-cache/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/rate-limit';
import { ClearCacheRequestSchema } from '@/lib/validators/schemas';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = ClearCacheRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { projectName } = parseResult.data;

    // ✅ Fix: cursor is a string in Upstash
    let cursor = '0';
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    do {
      try {
        const result = await redis.scan(cursor, {
          match: `generate:*`,
          count: 100
        });

        // ✅ Upstash returns [cursor: string, keys: string[]]
        cursor = result[0].toString();
        const keys = result[1] as string[];

        const projectKeys = keys.filter(key => {
          try {
            const decodedKey = key.replace('generate:', '');
            const decoded = Buffer.from(decodedKey, 'base64').toString('utf-8');
            return decoded.includes(projectName);
          } catch {
            return false;
          }
        });

        keysToDelete.push(...projectKeys);

      } catch (scanError) {
        logger.error('Scan error:', scanError);
        break;
      }
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        await Promise.all(batch.map(key => redis.del(key)));
        deletedCount += batch.length;
      }
      logger.cache('del', `Cleared ${deletedCount} cache entries for project: ${projectName}`);
    } else {
      logger.info(`No cache entries found for project: ${projectName}`);
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} cache entries for ${projectName}`,
      clearedCount: deletedCount
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('project');

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required as ?project=your-project-name' },
        { status: 400 }
      );
    }

    let cursor = '0';
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    do {
      try {
        const result = await redis.scan(cursor, {
          match: `generate:*`,
          count: 100
        });

        cursor = result[0].toString();
        const keys = result[1] as string[];

        const projectKeys = keys.filter(key => {
          try {
            const decodedKey = key.replace('generate:', '');
            const decoded = Buffer.from(decodedKey, 'base64').toString('utf-8');
            return decoded.includes(projectName);
          } catch {
            return false;
          }
        });

        keysToDelete.push(...projectKeys);

      } catch (scanError) {
        logger.error('Scan error:', scanError);
        break;
      }
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        await Promise.all(batch.map(key => redis.del(key)));
        deletedCount += batch.length;
      }
      logger.cache('del', `Cleared ${deletedCount} cache entries for project: ${projectName}`);
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} cache entries for ${projectName}`,
      clearedCount: deletedCount
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: errorMessage },
      { status: 500 }
    );
  }
}