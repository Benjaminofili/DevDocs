// src/app/dashboard/page.tsx

import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?login=required')
  }

  // Fetch user's saved READMEs
  const { data: readmes } = await supabase
    .from('saved_readmes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <DashboardClient
      readmes={readmes ?? []}
      profile={profile}
    />
  )
}