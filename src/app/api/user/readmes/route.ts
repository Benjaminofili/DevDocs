// src/app/api/user/readmes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { getTierConfig } from '@/lib/tiers/config'
import type { UserTier } from '@/types'

// GET - List saved READMEs
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to view saved READMEs' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('saved_readmes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ readmes: data })
  } catch (error) {
    console.error('Readmes GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Save a README
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to save READMEs' },
        { status: 401 }
      )
    }

    // Check tier limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    const tier = (profile?.tier as UserTier) ?? 'free'
    const config = getTierConfig(tier)

    // Check saved count
    const { count } = await supabase
      .from('saved_readmes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= config.maxSavedReadmes) {
      return NextResponse.json(
        {
          error: `You've reached the limit of ${config.maxSavedReadmes} saved READMEs`,
          limit: config.maxSavedReadmes,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, repoUrl, stack, sections, content, metadata } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('saved_readmes')
      .insert({
        user_id: user.id,
        title,
        repo_url: repoUrl ?? null,
        stack: stack ?? null,
        sections: sections ?? [],
        content,
        metadata: metadata ?? {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ readme: data }, { status: 201 })
  } catch (error) {
    console.error('Readmes POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a saved README
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'README id is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('saved_readmes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Readmes DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}