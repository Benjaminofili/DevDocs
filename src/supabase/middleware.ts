// src/lib/supabase/middleware.ts
// Handles session refresh on every request

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if Supabase env vars are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, skip auth (for development)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase env vars not set. Auth features will be disabled.')
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not remove this line
  // Refreshes the auth token and keeps session alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Optional: Protect specific routes
  // If user is not logged in and tries to access /dashboard, redirect
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('login', 'required')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}