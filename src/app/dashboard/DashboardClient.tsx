// src/app/dashboard/DashboardClient.tsx

'use client'

import { useState } from 'react'
import { UsageMeter } from '@/components/tiers/UsageMeter'
import { Header } from '@/components/layout/Header'
import type { SavedReadme, UserProfile } from '@/types'
import Link from 'next/link'

interface DashboardClientProps {
  readmes: SavedReadme[]
  profile: UserProfile | null
}

export function DashboardClient({ readmes: initialReadmes, profile }: DashboardClientProps) {
  const [readmes, setReadmes] = useState(initialReadmes)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this README?')) return

    setDeleting(id)
    try {
      const res = await fetch('/api/user/readmes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        setReadmes((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My READMEs</h1>
          <p className="text-sm text-neutral-400">
            {readmes.length} saved README{readmes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium 
                     text-white hover:bg-emerald-500 transition-colors"
        >
          + Generate New
        </Link>
      </div>

      {/* Usage Meter */}
      <div className="mb-8">
        <UsageMeter />
      </div>

      {/* READMEs Grid */}
      {readmes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-neutral-400 mb-4">No saved READMEs yet</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-emerald-600 px-4 py-2 
                       text-sm font-medium text-white hover:bg-emerald-500"
          >
            Generate Your First README
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {readmes.map((readme) => (
            <div
              key={readme.id}
              className="group rounded-xl border border-neutral-800 bg-neutral-900/50 
                         p-5 transition-all hover:border-neutral-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {readme.title}
                  </h3>
                  {readme.repo_url && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {readme.repo_url}
                    </p>
                  )}
                </div>
                {readme.stack && (
                  <span className="ml-2 shrink-0 rounded-full bg-neutral-800 
                                 px-2 py-0.5 text-xs text-neutral-400 border border-neutral-700">
                    {readme.stack}
                  </span>
                )}
              </div>

              {/* Preview of content */}
              <p className="text-xs text-neutral-500 line-clamp-2 mb-4">
                {readme.content.substring(0, 150)}...
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600">
                  {new Date(readme.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(readme.content)
                    }}
                    className="rounded-md bg-neutral-800 px-2.5 py-1 text-xs 
                             text-neutral-300 hover:bg-neutral-700 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(readme.id)}
                    disabled={deleting === readme.id}
                    className="rounded-md bg-neutral-800 px-2.5 py-1 text-xs 
                             text-red-400 hover:bg-red-900/30 transition-colors
                             disabled:opacity-50"
                  >
                    {deleting === readme.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}