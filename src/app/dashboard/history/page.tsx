// src/app/dashboard/history/page.tsx

import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { HistoryClient } from './HistoryClient'
import { getUserTier } from '@/lib/tiers/config'

export const metadata = {
  title: 'Generation History | DevDocs',
  description: 'View your AI documentation generation history',
}

export default async function HistoryPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get initial history
  const { data: history, count } = await supabase
    .from('generation_history')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(0, 19)

  const initialPagination = {
    page: 1,
    limit: 20,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / 20)
  }

  return (
    <>
      <Header />
      <HistoryClient initialHistory={history || []} initialPagination={initialPagination} />
    </>
  )
}
