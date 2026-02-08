// src/app/api/admin/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';
import { isAdmin } from '@/lib/admin/config';
import { logger } from '@/lib/logger';

// Force dynamic - always fresh data
export const dynamic = 'force-dynamic';

/**
 * Admin-only stats for the dashboard
 * 
 * Uses the authenticated user's session to verify admin access,
 * then uses a service role query pattern to fetch aggregate data.
 * 
 * NOTE: For aggregate queries (COUNT, etc.) across all users,
 * you need either:
 *   a) A Supabase service role client (bypasses RLS)
 *   b) Database functions with SECURITY DEFINER
 *   c) RLS policies that allow admin reads
 * 
 * We use approach (c) with a database function for safety.
 */

interface DashboardStats {
  users: {
    total: number;
    thisWeek: number;
    today: number;
  };
  generations: {
    total: number;
    today: number;
    thisWeek: number;
  };
  stacks: Array<{ stack: string; count: number; percentage: number }>;
  waitlist: {
    total: number;
    byFeature: Array<{ feature: string; count: number }>;
    recent: Array<{
      id: string;
      email: string;
      feature: string;
      use_case: string | null;
      value_level: string | null;
      created_at: string;
    }>;
  };
  usage: {
    usersHittingLimit: number;
    averageGenerationsPerUser: number;
    limitHitRate: number;
  };
  feedback: Array<{
    id: string;
    email: string | null;
    type: string;
    message: string;
    page: string | null;
    created_at: string;
  }>;
  topRepos: Array<{ repo_url: string; count: number }>;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(user.email)) {
      logger.warn('Non-admin attempted admin access', { 
        email: user.email,
        userId: user.id 
      });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query params for date range
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - days);

    // ===== Fetch all stats in parallel =====
    const [
      totalUsersResult,
      weekUsersResult,
      todayUsersResult,
      totalGenerationsResult,
      todayGenerationsResult,
      weekGenerationsResult,
      stacksResult,
      waitlistTotalResult,
      waitlistByFeatureResult,
      waitlistRecentResult,
      feedbackResult,
      topReposResult,
      dailyLimitResult,
    ] = await Promise.allSettled([
      // Total users
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Users this week
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString()),

      // Users today
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),

      // Total generations
      supabase
        .from('usage_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'generate'),

      // Generations today
      supabase
        .from('usage_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'generate')
        .gte('created_at', todayStart.toISOString()),

      // Generations this week
      supabase
        .from('usage_tracking')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'generate')
        .gte('created_at', weekStart.toISOString()),

      // Stack popularity
      supabase
        .from('usage_tracking')
        .select('stack')
        .eq('action', 'generate')
        .not('stack', 'is', null)
        .gte('created_at', rangeStart.toISOString()),

      // Waitlist total
      supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true }),

      // Waitlist by feature
      supabase
        .from('waitlist')
        .select('feature'),

      // Recent waitlist entries
      supabase
        .from('waitlist')
        .select('id, email, feature, use_case, value_level, created_at')
        .order('created_at', { ascending: false })
        .limit(20),

      // Recent feedback
      supabase
        .from('feedback')
        .select('id, email, type, message, page, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Top repos
      supabase
        .from('usage_tracking')
        .select('repo_url')
        .eq('action', 'generate')
        .not('repo_url', 'is', null)
        .gte('created_at', rangeStart.toISOString()),

      // Users who hit daily limit today
      supabase
        .from('profiles')
        .select('id, daily_generation_count')
        .gte('daily_generation_count', 5),
    ]);

    // ===== Process results safely =====
    const safeResult = <T>(
      result: PromiseSettledResult<{ data: T; count: number | null; error: unknown }>,
      fallbackData: T,
      fallbackCount: number = 0
    ): { data: T; count: number } => {
      if (result.status === 'fulfilled' && !result.value.error) {
        return { 
          data: result.value.data ?? fallbackData, 
          count: result.value.count ?? fallbackCount 
        };
      }
      logger.warn('Admin query failed', {
        error: result.status === 'rejected' ? result.reason : result.value.error,
      });
      return { data: fallbackData, count: fallbackCount };
    };

    // Process user counts
    const totalUsers = safeResult(totalUsersResult, null).count;
    const weekUsers = safeResult(weekUsersResult, null).count;
    const todayUsers = safeResult(todayUsersResult, null).count;

    // Process generation counts
    const totalGenerations = safeResult(totalGenerationsResult, null).count;
    const todayGenerations = safeResult(todayGenerationsResult, null).count;
    const weekGenerations = safeResult(weekGenerationsResult, null).count;

    // Process stack popularity
    const stacksData = safeResult(stacksResult, [] as Array<{ stack: string }>).data;
    const stackCounts: Record<string, number> = {};
    if (Array.isArray(stacksData)) {
      stacksData.forEach((row: { stack: string }) => {
        if (row.stack) {
          stackCounts[row.stack] = (stackCounts[row.stack] || 0) + 1;
        }
      });
    }
    const totalStackEntries = Object.values(stackCounts).reduce((a, b) => a + b, 0);
    const stacks = Object.entries(stackCounts)
      .map(([stack, count]) => ({
        stack,
        count,
        percentage: totalStackEntries > 0 
          ? Math.round((count / totalStackEntries) * 100) 
          : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Process waitlist
    const waitlistTotal = safeResult(waitlistTotalResult, null).count;
    const waitlistFeatureData = safeResult(
      waitlistByFeatureResult, 
      [] as Array<{ requested_feature: string }>
    ).data;
    
    const featureCounts: Record<string, number> = {};
    if (Array.isArray(waitlistFeatureData)) {
      waitlistFeatureData.forEach((row: { feature: string }) => {
        if (row.feature) {
          featureCounts[row.feature] = 
            (featureCounts[row.feature] || 0) + 1;
        }
      });
    }
    const waitlistByFeature = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count);

    const waitlistRecent = safeResult(waitlistRecentResult, []).data;

    // Process feedback
    const feedback = safeResult(feedbackResult, []).data;

    // Process top repos
    const repoData = safeResult(
      topReposResult, 
      [] as Array<{ repo_url: string }>
    ).data;
    const repoCounts: Record<string, number> = {};
    if (Array.isArray(repoData)) {
      repoData.forEach((row: { repo_url: string }) => {
        if (row.repo_url) {
          repoCounts[row.repo_url] = (repoCounts[row.repo_url] || 0) + 1;
        }
      });
    }
    const topRepos = Object.entries(repoCounts)
      .map(([repo_url, count]) => ({ repo_url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Process daily limit data
    const limitData = safeResult(dailyLimitResult, []).data;
    const usersHittingLimit = Array.isArray(limitData) ? limitData.length : 0;

    // ===== Build response =====
    const stats: DashboardStats = {
      users: {
        total: totalUsers,
        thisWeek: weekUsers,
        today: todayUsers,
      },
      generations: {
        total: totalGenerations,
        today: todayGenerations,
        thisWeek: weekGenerations,
      },
      stacks,
      waitlist: {
        total: waitlistTotal,
        byFeature: waitlistByFeature,
        recent: Array.isArray(waitlistRecent) ? waitlistRecent : [],
      },
      usage: {
        usersHittingLimit,
        averageGenerationsPerUser: totalUsers > 0
          ? Math.round((totalGenerations / totalUsers) * 10) / 10
          : 0,
        limitHitRate: todayUsers > 0
          ? Math.round((usersHittingLimit / todayUsers) * 100)
          : 0,
      },
      feedback: Array.isArray(feedback) ? feedback : [],
      topRepos,
    };

    logger.info('Admin stats fetched', { 
      adminEmail: user.email,
      totalUsers,
      totalGenerations 
    });

    return NextResponse.json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString(),
      range: `${days} days`,
    });

  } catch (error) {
    logger.error('Admin stats failed', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch admin stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}