// src/components/layout/Header.tsx
// Header component with auth and usage meter

'use client'

import Link from 'next/link'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { UsageMeter } from '@/components/tiers/UsageMeter'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 
                      bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white"
          >
            <span>📝</span>
            <span>DevDocs</span>
          </Link>

          {/* Right side: Usage Meter + Auth */}
          <div className="flex items-center gap-4">
            <UsageMeter />
            <UserMenu />
            <LoginButton />
          </div>
        </div>
      </div>
    </header>
  )
}

