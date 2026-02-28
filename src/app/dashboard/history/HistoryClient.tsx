// src/app/dashboard/history/HistoryClient.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Rocket, Trash2, Copy, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// Adjust type if needed to match the schema
interface HistoryItem {
  id: string
  project_name: string
  section_id: string
  content: string
  provider: string
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface HistoryClientProps {
  initialHistory: HistoryItem[]
  initialPagination: Pagination
}

export function HistoryClient({ initialHistory, initialPagination }: HistoryClientProps) {
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory)
  const [pagination, setPagination] = useState<Pagination>(initialPagination)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchPage = async (page: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/user/history?page=${page}&limit=${pagination.limit}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch history page:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this history item?')) return
    setDeletingId(id)
    try {
      const res = await fetch('/api/user/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete history item:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header & Tabs */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Dashboard</h1>
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 pb-px">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Saved READMEs
          </Link>
          <Link
            href="/dashboard/history"
            className="px-4 py-2 text-sm font-medium border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
          >
            Generation History
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
          Recent Generations ({pagination.total})
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Rocket className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">No generation history yet</p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Generate Your First Section
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white capitalize">
                      {item.section_id.replace('-', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {item.project_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {item.provider}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-80 hover:opacity-100">
                  <button
                    onClick={() => handleCopy(item.id, item.content)}
                    className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Copy Content"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedId === item.id && (
                      <span className="absolute -mt-8 -ml-4 bg-slate-800 text-white text-[10px] px-2 py-1 rounded">Copied!</span>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50 max-h-40 overflow-y-auto custom-scrollbar">
                <pre className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap">
                  {item.content}
                </pre>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
