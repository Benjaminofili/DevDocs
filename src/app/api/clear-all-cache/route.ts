// src/app/api/clear-all-cache/route.ts

import { NextResponse } from 'next/server';
import { redis } from '@/lib/rate-limit';

export async function POST() {
  try {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const result = await redis.scan(cursor, {
        match: 'generate:*',
        count: 100
      });

      cursor = result[0].toString();
      const keys = result[1] as string[];

      if (keys.length > 0) {
        // Delete in batches
        const batchSize = 10;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await Promise.all(batch.map(key => redis.del(key)));
          deletedCount += batch.length;
        }
      }
    } while (cursor !== '0');

    console.log(`🗑️ Cleared ${deletedCount} total cache entries`);

    return NextResponse.json({
      success: true,
      message: `Cleared all ${deletedCount} cache entries`,
      clearedCount: deletedCount
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cache clear error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Same logic for GET requests
  try {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const result = await redis.scan(cursor, {
        match: 'generate:*',
        count: 100
      });

      cursor = result[0].toString();
      const keys = result[1] as string[];

      if (keys.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await Promise.all(batch.map(key => redis.del(key)));
          deletedCount += batch.length;
        }
      }
    } while (cursor !== '0');

    console.log(`🗑️ Cleared ${deletedCount} total cache entries`);

    return NextResponse.json({
      success: true,
      message: `Cleared all ${deletedCount} cache entries`,
      clearedCount: deletedCount
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cache clear error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: errorMessage },
      { status: 500 }
    );
  }
}