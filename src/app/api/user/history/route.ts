// src/app/api/user/history/route.ts
// API route to get or delete the authenticated user's generation history

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Parse query params for pagination
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '20', 10)
        const offset = (page - 1) * limit

        const { data, error, count } = await supabase
            .from('generation_history')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching generation history:', error)
            return NextResponse.json(
                { error: 'Failed to fetch history' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            history: data,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        })
    } catch (error) {
        console.error('History GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { id, clearAll } = body

        if (clearAll) {
            // Delete all history for this user
            const { error } = await supabase
                .from('generation_history')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error

            return NextResponse.json({ success: true, message: 'All history cleared' })
        }

        if (!id) {
            return NextResponse.json(
                { error: 'id is required to delete a specific history item' },
                { status: 400 }
            )
        }

        // Delete single item
        const { error } = await supabase
            .from('generation_history')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id) // Ensure they own it

        if (error) throw error

        return NextResponse.json({ success: true, message: 'History item deleted' })
    } catch (error) {
        console.error('History DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
