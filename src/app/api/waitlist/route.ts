// src/app/api/waitlist/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { joinWaitlist, getWaitlistCount } from '@/lib/waitlist/service'
import type { WaitlistFeature } from '@/types'

// POST - Join waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, feature, useCase, valueLevel } = body

    // Validate
    if (!email || !feature) {
      return NextResponse.json(
        { error: 'Email and feature are required' },
        { status: 400 }
      )
    }

    // Check if user is logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const result = await joinWaitlist(
      { email, feature, useCase, valueLevel },
      user?.id
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get waitlist count for a feature
export async function GET(request: NextRequest) {
  try {
    const feature = request.nextUrl.searchParams.get('feature')

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature parameter required' },
        { status: 400 }
      )
    }

    const count = await getWaitlistCount(feature as WaitlistFeature)

    return NextResponse.json({ feature, count })
  } catch (error) {
    console.error('Waitlist count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}