// src/app/components/tiers/FeatureLock.tsx
// Wraps premium features with a lock overlay

'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/provider'
import { isFeatureAvailable, getFeatureInfo } from '@/lib/tiers/feature-flags'
import { WaitlistModal } from './WaitlistModal'
import type { WaitlistFeature } from '@/types'

interface FeatureLockProps {
  feature: WaitlistFeature
  children: React.ReactNode
  /** If true, shows the children but greyed out. If false, hides completely */
  showPreview?: boolean
}

export function FeatureLock({
  feature,
  children,
  showPreview = true,
}: FeatureLockProps) {
  const { tier } = useAuth()
  const [showWaitlist, setShowWaitlist] = useState(false)

  // If feature is available for this tier, render children normally
  if (isFeatureAvailable(feature, tier)) {
    return <>{children}</>
  }

  const featureInfo = getFeatureInfo(feature)

  return (
    <>
      <div className="relative">
        {/* Preview of the feature (greyed out) */}
        {showPreview && (
          <div className="pointer-events-none opacity-40 blur-[1px] select-none">
            {children}
          </div>
        )}

        {/* Lock overlay */}
        <div
          className={`${showPreview ? 'absolute inset-0' : ''} flex items-center justify-center`}
        >
          <button
            onClick={() => setShowWaitlist(true)}
            className="flex items-center gap-2 rounded-lg border border-neutral-700 
                       bg-neutral-900/95 px-4 py-3 text-sm transition-all 
                       hover:border-emerald-700 hover:bg-neutral-800 group"
          >
            <span className="text-lg">🔒</span>
            <div className="text-left">
              <p className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                {featureInfo.name}
              </p>
              <p className="text-xs text-neutral-400">
                Coming soon — Join the waitlist
              </p>
            </div>
            <svg
              className="h-4 w-4 text-neutral-500 group-hover:text-emerald-400 transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={showWaitlist}
        onClose={() => setShowWaitlist(false)}
        feature={feature}
      />
    </>
  )
}