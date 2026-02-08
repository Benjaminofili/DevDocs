// src/app/components/tiers/UsageMeter.tsx

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/provider'
import type { UsageInfo } from '@/types'

export function UsageMeter() {
  const { user, tier, loading: authLoading } = useAuth()
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/user/usage')
        if (res.ok) {
          const data = await res.json()
          setUsage(data)
        }
      } catch (err) {
        console.error('Failed to fetch usage:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchUsage()
    }
  }, [authLoading, user])

  if (loading || authLoading || !usage) {
    return null
  }

  const percentage = usage.limit === Infinity
    ? 0
    : (usage.used / usage.limit) * 100

  const isNearLimit = percentage >= 80
  const isAtLimit = usage.remaining === 0

  // Color based on usage
  const barColor = isAtLimit
    ? 'bg-red-500'
    : isNearLimit
      ? 'bg-amber-500'
      : 'bg-emerald-500'

  const textColor = isAtLimit
    ? 'text-red-400'
    : isNearLimit
      ? 'text-amber-400'
      : 'text-neutral-400'

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-400">
          Daily Usage
        </span>
        <span className={`text-xs font-mono ${textColor}`}>
          {usage.used}/{usage.limit === Infinity ? '∞' : usage.limit}
        </span>
      </div>

      {/* Progress bar */}
      {usage.limit !== Infinity && (
        <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {/* Status message */}
      {isAtLimit && (
        <div className="mt-2">
          {tier === 'anonymous' ? (
            <p className="text-xs text-amber-400">
              Sign in with GitHub for 5 free generations per day →
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              Resets at midnight UTC
            </p>
          )}
        </div>
      )}

      {/* Remaining count when near limit */}
      {isNearLimit && !isAtLimit && (
        <p className="mt-1 text-xs text-amber-400/70">
          {usage.remaining} generation{usage.remaining !== 1 ? 's' : ''} remaining today
        </p>
      )}
    </div>
  )
}