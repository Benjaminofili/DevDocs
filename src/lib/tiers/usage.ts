// src/lib/tiers/usage.ts
// Tracks and enforces usage limits
// Uses Redis for fast limit checks + Supabase for persistent logging

import { Redis } from '@upstash/redis'
import { createClient } from '@/supabase/server'
import { getGenerationLimit } from './config'
import type { UserTier, UsageInfo, UsageCheckResult } from '@/types'

// ============================================
// REDIS CLIENT (reuse your existing one if you have it)
// ============================================

const redis = Redis.fromEnv()

// ============================================
// KEY HELPERS
// ============================================

function getDailyKey(identifier: string): string {
  const today = new Date().toISOString().split('T')[0] // "2025-01-15"
  return `usage:daily:${identifier}:${today}`
}

function getResetTime(): string {
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}

// ============================================
// CHECK USAGE (before generation)
// ============================================

export async function checkUsage(
  userId: string | null,
  sessionId: string | null,
  tier: UserTier
): Promise<UsageCheckResult> {
  const limit = getGenerationLimit(tier)
  const identifier = userId ?? `anon:${sessionId}`
  const key = getDailyKey(identifier)

  try {
    // Get current count from Redis (fast)
    const currentCount = (await redis.get<number>(key)) ?? 0

    const usage: UsageInfo = {
      used: currentCount,
      limit,
      remaining: Math.max(0, limit - currentCount),
      tier,
      resetsAt: getResetTime(),
    }

    if (currentCount >= limit) {
      return {
        allowed: false,
        usage,
        message:
          tier === 'anonymous'
            ? 'Sign in with GitHub to get 5 free generations per day!'
            : 'You\'ve reached your daily limit. Resets at midnight UTC.',
      }
    }

    return { allowed: true, usage }
  } catch (error) {
    // If Redis is down, fail OPEN (allow generation)
    console.error('Usage check failed, allowing generation:', error)
    return {
      allowed: true,
      usage: {
        used: 0,
        limit,
        remaining: limit,
        tier,
        resetsAt: getResetTime(),
      },
    }
  }
}

// ============================================
// RECORD USAGE (after successful generation)
// ============================================

export async function recordUsage(
  userId: string | null,
  sessionId: string | null,
  tier: UserTier,
  metadata: {
    action: 'generate' | 'analyze'
    stack?: string
    repoUrl?: string
  }
): Promise<UsageInfo> {
  const identifier = userId ?? `anon:${sessionId}`
  const key = getDailyKey(identifier)

  try {
    // Increment in Redis (fast, for limit checking)
    const newCount = await redis.incr(key)

    // Set expiry to end of day (so it auto-resets)
    // 86400 seconds = 24 hours (safe buffer)
    await redis.expire(key, 86400)

    // Log to Supabase (persistent, for analytics)
    // Fire and forget - don't await to keep response fast
    logToSupabase(userId, sessionId, metadata).catch((err) =>
      console.error('Failed to log usage to Supabase:', err)
    )

    const limit = getGenerationLimit(tier)

    return {
      used: newCount,
      limit,
      remaining: Math.max(0, limit - newCount),
      tier,
      resetsAt: getResetTime(),
    }
  } catch (error) {
    console.error('Failed to record usage:', error)
    const limit = getGenerationLimit(tier)
    return {
      used: 0,
      limit,
      remaining: limit,
      tier,
      resetsAt: getResetTime(),
    }
  }
}

// ============================================
// GET CURRENT USAGE (for UI display)
// ============================================

export async function getCurrentUsage(
  userId: string | null,
  sessionId: string | null,
  tier: UserTier
): Promise<UsageInfo> {
  const identifier = userId ?? `anon:${sessionId}`
  const key = getDailyKey(identifier)
  const limit = getGenerationLimit(tier)

  try {
    const currentCount = (await redis.get<number>(key)) ?? 0

    return {
      used: currentCount,
      limit,
      remaining: Math.max(0, limit - currentCount),
      tier,
      resetsAt: getResetTime(),
    }
  } catch {
    return {
      used: 0,
      limit,
      remaining: limit,
      tier,
      resetsAt: getResetTime(),
    }
  }
}

// ============================================
// ALIASES FOR BACKWARD COMPATIBILITY
// ============================================

export const checkUsageLimit = checkUsage
export const incrementUsage = recordUsage

// ============================================
// SUPABASE LOGGING (async, for analytics)
// ============================================

async function logToSupabase(
  userId: string | null,
  sessionId: string | null,
  metadata: {
    action: 'generate' | 'analyze'
    stack?: string
    repoUrl?: string
  }
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('usage_tracking').insert({
    user_id: userId,
    session_id: sessionId,
    action: metadata.action,
    stack: metadata.stack ?? null,
    repo_url: metadata.repoUrl ?? null,
    metadata: {},
  })
}