// src/app/api/user/usage/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { getCurrentUsage } from '@/lib/tiers/usage'
import type { UserTier } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine tier
    let tier: UserTier = 'anonymous'

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single()

      tier = (profile?.tier as UserTier) ?? 'free'
    }

    // Get session ID for anonymous users
    const sessionId = request.cookies.get('readme_session')?.value ?? null

    const usage = await getCurrentUsage(
      user?.id ?? null,
      sessionId,
      tier
    )

    return NextResponse.json(usage)
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}