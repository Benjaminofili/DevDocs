// src/app/components/auth/UserMenu.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth/provider'
import Link from 'next/link'

export function UserMenu() {
  const { user, profile, loading, signOut, tier } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading || !user) return null

  const avatarUrl =
    profile?.avatar_url ??
    user.user_metadata?.avatar_url ??
    null

  const displayName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.user_name ??
    'Developer'

  const githubUsername =
    profile?.github_username ??
    user.user_metadata?.user_name ??
    ''

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-neutral-700 
                   bg-neutral-900 px-3 py-1.5 transition-colors 
                   hover:bg-neutral-800 hover:border-neutral-600"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-neutral-300 hidden sm:inline">
          {displayName}
        </span>
        <svg
          className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-neutral-700 
                        bg-neutral-900 py-1 shadow-xl z-50">
          {/* User info */}
          <div className="border-b border-neutral-700 px-4 py-3">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-neutral-400">@{githubUsername}</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-900/50 
                           px-2 py-0.5 text-xs text-emerald-400 border border-emerald-800">
              {tier === 'premium' ? '⭐ Premium' : '🆓 Free Tier'}
            </span>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 
                         hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My READMEs
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-neutral-700 py-1">
            <button
              onClick={() => {
                signOut()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm 
                         text-red-400 hover:bg-neutral-800 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}