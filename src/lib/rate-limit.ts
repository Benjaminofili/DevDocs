// src/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client
export const redis = Redis.fromEnv();

// Create rate limiter
// 10 requests per 10 minutes per IP
export const rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '10 m'),
    analytics: true,
    prefix: 'devdocs:ratelimit',
});

// Helper to check rate limit
export async function checkRateLimit(identifier: string) {
    const { success, limit, reset, remaining } = await rateLimiter.limit(identifier);

    return {
        allowed: success,
        limit,
        remaining,
        resetAt: new Date(reset),
    };
}