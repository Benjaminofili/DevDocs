// src/app/components/tiers/WaitlistModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/provider'
import { getFeatureInfo } from '@/lib/tiers/feature-flags'
import type { WaitlistFeature, ValueLevel } from '@/types'

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  feature: WaitlistFeature
}

export function WaitlistModal({ isOpen, onClose, feature }: WaitlistModalProps) {
  const { user } = useAuth()
  const featureInfo = getFeatureInfo(feature)

  // Form state
  const [email, setEmail] = useState('')
  const [useCase, setUseCase] = useState('')
  const [step, setStep] = useState<'form' | 'followup' | 'success'>('form')
  const [valueLevel, setValueLevel] = useState<ValueLevel | ''>('')
  const [waitingCount, setWaitingCount] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill email if logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  // Fetch current waitlist count
  useEffect(() => {
    if (isOpen) {
      fetch(`/api/waitlist?feature=${feature}`)
        .then((res) => res.json())
        .then((data) => setWaitingCount(data.count))
        .catch(() => {})
    }
  }, [isOpen, feature])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('form')
      setUseCase('')
      setValueLevel('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          feature,
          useCase: useCase || undefined,
          valueLevel: valueLevel || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setWaitingCount(data.waitingCount)
        if (step === 'form') {
          setStep('followup')
        } else {
          setStep('success')
        }
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFollowup() {
    // Update the waitlist entry with value level
    if (valueLevel) {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          feature,
          useCase,
          valueLevel,
        }),
      }).catch(() => {})
    }
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-neutral-700 
                      bg-neutral-900 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-neutral-500 
                     hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* ============================================ */}
          {/* Step 1: Email + Use Case */}
          {/* ============================================ */}
          {step === 'form' && (
            <>
              <div className="mb-6">
                <div className="mb-2 flex h-12 w-12 items-center justify-center 
                               rounded-full bg-emerald-900/30 text-2xl">
                  🔒
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {featureInfo.name}
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  {featureInfo.description}
                </p>
                {waitingCount !== null && waitingCount > 0 && (
                  <p className="mt-2 text-xs text-emerald-400">
                    {waitingCount} developer{waitingCount !== 1 ? 's' : ''} waiting for this
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 
                             px-3 py-2 text-sm text-white placeholder-neutral-500
                             focus:border-emerald-600 focus:outline-none focus:ring-1 
                             focus:ring-emerald-600"
                    disabled={!!user?.email}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    What would you use this for?{' '}
                    <span className="text-neutral-500">(optional)</span>
                  </label>
                  <textarea
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    placeholder="e.g., I need to document my private work projects..."
                    rows={2}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 
                             px-3 py-2 text-sm text-white placeholder-neutral-500
                             focus:border-emerald-600 focus:outline-none focus:ring-1 
                             focus:ring-emerald-600 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm 
                           font-medium text-white transition-colors 
                           hover:bg-emerald-500 disabled:opacity-50 
                           disabled:cursor-not-allowed"
                >
                  {submitting ? 'Joining...' : 'Join Waitlist →'}
                </button>
              </form>
            </>
          )}

          {/* ============================================ */}
          {/* Step 2: Follow-up (optional value question) */}
          {/* ============================================ */}
          {step === 'followup' && (
            <>
              <div className="mb-6">
                <div className="mb-2 flex h-12 w-12 items-center justify-center 
                               rounded-full bg-emerald-900/30 text-2xl">
                  ✅
                </div>
                <h3 className="text-lg font-semibold text-white">
                  You&apos;re on the list!
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Quick question to help us prioritize:
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-300">
                  How valuable would this be for you?
                </p>

                {[
                  { value: 'nice-to-have' as ValueLevel, label: 'Nice to have', emoji: '👍' },
                  { value: 'time-saver' as ValueLevel, label: 'Would save me significant time', emoji: '⏱️' },
                  { value: 'need-for-work' as ValueLevel, label: 'I need this for work', emoji: '💼' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setValueLevel(option.value)}
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm 
                              transition-all ${
                                valueLevel === option.value
                                  ? 'border-emerald-600 bg-emerald-900/20 text-emerald-400'
                                  : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                              }`}
                  >
                    {option.emoji} {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep('success')}
                  className="flex-1 rounded-lg border border-neutral-700 px-4 py-2 
                           text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleFollowup}
                  disabled={!valueLevel}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm 
                           font-medium text-white hover:bg-emerald-500 
                           disabled:opacity-50 transition-colors"
                >
                  Submit
                </button>
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* Step 3: Success */}
          {/* ============================================ */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="mb-4 text-5xl">🎉</div>
              <h3 className="text-lg font-semibold text-white">
                Thanks for your interest!
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                We&apos;ll email you when {featureInfo.name.toLowerCase()} launches.
              </p>
              {waitingCount !== null && (
                <p className="mt-1 text-xs text-emerald-400">
                  {waitingCount} developer{waitingCount !== 1 ? 's' : ''} on the waitlist
                </p>
              )}
              <button
                onClick={onClose}
                className="mt-6 rounded-lg bg-neutral-800 px-6 py-2 text-sm 
                         text-white hover:bg-neutral-700 transition-colors"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}