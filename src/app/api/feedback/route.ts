// src/app/api/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { type, message, email, page } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      email: email ?? user?.email ?? null,
      type,
      message,
      page: page ?? null,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Thanks for your feedback!',
    })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}