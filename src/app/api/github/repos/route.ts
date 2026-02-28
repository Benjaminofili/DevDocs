// src/app/api/github/repos/route.ts
// Lists the authenticated user's GitHub repositories

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  updated_at: string
  private: boolean
  default_branch: string
  owner: {
    login: string
    avatar_url: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated. Sign in with GitHub first.' },
        { status: 401 }
      )
    }

    // Get GitHub username from Supabase user metadata
    const githubUsername =
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      null

    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username not found in profile.' },
        { status: 400 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('per_page') || '30', 10)
    const sort = searchParams.get('sort') || 'updated' // updated, created, pushed, full_name
    const search = searchParams.get('search') || ''

    // Fetch repos from GitHub API
    // Use the app's GITHUB_TOKEN for higher rate limits, fetching the user's public repos
    const githubToken = process.env.GITHUB_TOKEN
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'DevDocs-App',
    }
    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`
    }

    const apiUrl = new URL(`https://api.github.com/users/${githubUsername}/repos`)
    apiUrl.searchParams.set('page', String(page))
    apiUrl.searchParams.set('per_page', String(perPage))
    apiUrl.searchParams.set('sort', sort)
    apiUrl.searchParams.set('direction', 'desc')
    apiUrl.searchParams.set('type', 'owner')

    const response = await fetch(apiUrl.toString(), { headers })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch repositories from GitHub.' },
        { status: response.status }
      )
    }

    const repos: GitHubRepo[] = await response.json()

    // Filter by search term if provided
    let filteredRepos = repos
    if (search) {
      const term = search.toLowerCase()
      filteredRepos = repos.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          (r.description && r.description.toLowerCase().includes(term)) ||
          (r.language && r.language.toLowerCase().includes(term))
      )
    }

    // Map to a cleaner response format
    const result = filteredRepos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch,
    }))

    // Parse GitHub Link header for pagination info
    const linkHeader = response.headers.get('Link')
    const hasMore = linkHeader ? linkHeader.includes('rel="next"') : false

    return NextResponse.json({
      repos: result,
      page,
      perPage,
      hasMore,
      total: result.length,
    })
  } catch (error) {
    console.error('GitHub repos API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
