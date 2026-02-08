// src/app/admin/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// ===== Types =====
interface DashboardStats {
  users: { total: number; thisWeek: number; today: number };
  generations: { total: number; today: number; thisWeek: number };
  stacks: Array<{ stack: string; count: number; percentage: number }>;
  waitlist: {
    total: number;
    byFeature: Array<{ feature: string; count: number }>;
    recent: Array<{
      id: string;
      email: string;
      requested_feature: string;
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

// ===== Stat Card Component =====
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend 
}: { 
  title: string; 
  value: number | string; 
  subtitle?: string; 
  icon: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtitle && (
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      )}
      {trend && (
        <div className={`text-sm mt-2 ${trend.value > 0 ? 'text-green-400' : 'text-gray-500'}`}>
          {trend.value > 0 ? '↑' : '→'} {trend.value} {trend.label}
        </div>
      )}
    </div>
  );
}

// ===== Stack Bar Component =====
function StackBar({ stack, count, percentage, maxPercentage }: {
  stack: string;
  count: number;
  percentage: number;
  maxPercentage: number;
}) {
  const barWidth = maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-gray-300 text-sm w-32 truncate font-mono">{stack}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
        <div
          className="bg-green-500/70 h-full rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-gray-400 text-sm w-20 text-right">
        {count} ({percentage}%)
      </span>
    </div>
  );
}

// ===== Value Level Badge =====
function ValueBadge({ level }: { level: string | null }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    'need-for-work': { 
      bg: 'bg-green-500/20', 
      text: 'text-green-400', 
      label: '💰 Need for work' 
    },
    'time-saver': { 
      bg: 'bg-yellow-500/20', 
      text: 'text-yellow-400', 
      label: '⏱️ Time saver' 
    },
    'nice-to-have': { 
      bg: 'bg-gray-500/20', 
      text: 'text-gray-400', 
      label: '👍 Nice to have' 
    },
  };

  const c = config[level || ''] || { 
    bg: 'bg-gray-500/20', 
    text: 'text-gray-500', 
    label: level || 'No response' 
  };

  return (
    <span className={`${c.bg} ${c.text} text-xs px-2 py-1 rounded-full`}>
      {c.label}
    </span>
  );
}

// ===== Feature Name Formatter =====
function formatFeatureName(feature: string): string {
  const names: Record<string, string> = {
    'private-repos': '🔒 Private Repos',
    'premium-ai': '🤖 Premium AI (GPT-4/Claude)',
    'premium-sections': '📝 Premium Sections',
    'unlimited-generations': '♾️ Unlimited Generations',
    'readme-history': '📚 README History',
    'custom-templates': '🎨 Custom Templates',
    'team-features': '👥 Team Features',
    'export-formats': '📤 Export (PDF/HTML)',
  };
  return names[feature] || feature;
}

// ===== Time Ago Formatter =====
function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// ===== Main Dashboard =====
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [days, setDays] = useState(30);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/');
          return;
        }

        setAuthChecking(false);
      } catch {
        router.push('/');
      }
    }
    checkAuth();
  }, [router]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/stats?days=${days}`);

      if (response.status === 401 || response.status === 403) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setLastRefresh(new Date());
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [days, router]);

  useEffect(() => {
    if (!authChecking) {
      fetchStats();
    }
  }, [authChecking, fetchStats]);

  // Auth checking state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Verifying access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              📊 Admin Dashboard
            </h1>
            {lastRefresh && (
              <p className="text-gray-500 text-xs mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Date range selector */}
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-green-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            {/* Refresh button */}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md px-4 py-1.5 text-sm text-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-2.636-6.364" strokeLinecap="round" />
                <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>

            {/* Back to app */}
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-300 text-sm">{error}</span>
            </div>
            <button
              onClick={fetchStats}
              className="text-red-400 hover:text-red-300 text-sm underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats && (
        <div className="max-w-7xl mx-auto px-6 py-20 flex justify-center">
          <div className="text-gray-400 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading dashboard data...
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {stats && (
        <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

          {/* Overview Cards */}
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={stats.users.total}
                icon="👥"
                trend={{ value: stats.users.thisWeek, label: 'this week' }}
              />
              <StatCard
                title="Active Today"
                value={stats.users.today}
                subtitle={`${stats.users.thisWeek} this week`}
                icon="🟢"
              />
              <StatCard
                title="READMEs Generated"
                value={stats.generations.total}
                icon="📝"
                trend={{ value: stats.generations.thisWeek, label: 'this week' }}
              />
              <StatCard
                title="Waitlist Signups"
                value={stats.waitlist.total}
                subtitle={stats.waitlist.total > 0 
                  ? `Top: ${stats.waitlist.byFeature[0]?.feature || 'N/A'}` 
                  : 'No signups yet'}
                icon="📋"
              />
            </div>
          </section>

          {/* Usage Insights */}
          <section>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Usage Insights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Avg READMEs / User"
                value={stats.usage.averageGenerationsPerUser}
                icon="📊"
              />
              <StatCard
                title="Users Hitting Limit"
                value={stats.usage.usersHittingLimit}
                subtitle={stats.usage.limitHitRate > 0 
                  ? `${stats.usage.limitHitRate}% of active users` 
                  : 'No users hitting limit'}
                icon={stats.usage.limitHitRate > 20 ? '🔴' : '🟡'}
              />
              <StatCard
                title="Generations Today"
                value={stats.generations.today}
                subtitle={`${stats.generations.thisWeek} this week`}
                icon="⚡"
              />
            </div>

            {/* Monetization Signal */}
            {stats.usage.limitHitRate > 20 && (
              <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <span>💡</span>
                  <strong>Monetization Signal:</strong> {stats.usage.limitHitRate}% of users are hitting the daily limit.
                  Consider launching premium tier!
                </p>
              </div>
            )}
          </section>

          {/* Two Column: Stacks + Waitlist */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Stack Popularity */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                🔧 Stack Popularity
                <span className="text-gray-500 text-sm font-normal">
                  (last {days} days)
                </span>
              </h2>
              {stats.stacks.length > 0 ? (
                <div className="space-y-1">
                  {stats.stacks.slice(0, 8).map((s) => (
                    <StackBar
                      key={s.stack}
                      stack={s.stack}
                      count={s.count}
                      percentage={s.percentage}
                      maxPercentage={stats.stacks[0]?.percentage || 100}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center">
                  No stack data yet. Generate some READMEs!
                </p>
              )}
            </section>

            {/* Waitlist by Feature */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                📋 Waitlist by Feature
                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full ml-2">
                  {stats.waitlist.total} total
                </span>
              </h2>
              {stats.waitlist.byFeature.length > 0 ? (
                <div className="space-y-3">
                  {stats.waitlist.byFeature.map((f) => (
                    <div
                      key={f.feature}
                      className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                    >
                      <span className="text-gray-300 text-sm">
                        {formatFeatureName(f.feature)}
                      </span>
                      <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full font-mono">
                        {f.count} {f.count === 1 ? 'request' : 'requests'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center">
                  No waitlist signups yet. This will populate when users click locked features.
                </p>
              )}
            </section>
          </div>

          {/* Recent Waitlist Entries */}
          {stats.waitlist.recent.length > 0 && (
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">
                🆕 Recent Waitlist Entries
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-gray-500 font-medium py-3 pr-4">Email</th>
                      <th className="text-left text-gray-500 font-medium py-3 pr-4">Feature</th>
                      <th className="text-left text-gray-500 font-medium py-3 pr-4">Use Case</th>
                      <th className="text-left text-gray-500 font-medium py-3 pr-4">Value</th>
                      <th className="text-right text-gray-500 font-medium py-3">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.waitlist.recent.map((entry) => (
                      <tr 
                        key={entry.id} 
                        className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <span className="text-gray-300 font-mono text-xs">
                            {entry.email}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-gray-400">
                            {formatFeatureName(entry.requested_feature)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-gray-500 truncate block max-w-xs">
                            {entry.use_case || '—'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <ValueBadge level={entry.value_level} />
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-gray-600 text-xs">
                            {timeAgo(entry.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Two Column: Top Repos + Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top Repos */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">
                🔥 Top Repos Analyzed
              </h2>
              {stats.topRepos.length > 0 ? (
                <div className="space-y-2">
                  {stats.topRepos.slice(0, 8).map((repo, i) => (
                    <div
                      key={repo.repo_url}
                      className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-gray-600 text-xs font-mono w-5">
                          {i + 1}.
                        </span>
                        <a
                          href={repo.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm truncate transition-colors"
                        >
                          {repo.repo_url.replace('https://github.com/', '')}
                        </a>
                      </div>
                      <span className="text-gray-500 text-xs ml-3 shrink-0">
                        {repo.count}×
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center">
                  No repos analyzed yet.
                </p>
              )}
            </section>

            {/* Recent Feedback */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-300 mb-4">
                💬 Recent Feedback
              </h2>
              {stats.feedback.length > 0 ? (
                <div className="space-y-4">
                  {stats.feedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="border-b border-gray-800/50 last:border-0 pb-3 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            fb.type === 'bug' 
                              ? 'bg-red-500/20 text-red-400' 
                              : fb.type === 'feature'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {fb.type}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {fb.email || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-gray-600 text-xs">
                          {timeAgo(fb.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {fb.message}
                      </p>
                      {fb.page && (
                        <span className="text-gray-600 text-xs mt-1 inline-block">
                          on: {fb.page}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center">
                  No feedback yet. Add a feedback form to your app!
                </p>
              )}
            </section>
          </div>

          {/* Decision Helper */}
          <section className="bg-gray-900/50 border border-dashed border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-3">
              🎯 Decision Helper
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="text-gray-400 font-medium">Ready for payments?</h3>
                {stats.waitlist.total >= 50 ? (
                  <p className="text-green-400">
                    ✅ YES — {stats.waitlist.total} waitlist signups! Time to add Stripe.
                  </p>
                ) : stats.waitlist.total >= 20 ? (
                  <p className="text-yellow-400">
                    ⚠️ ALMOST — {stats.waitlist.total}/50 target. Keep pushing.
                  </p>
                ) : (
                  <p className="text-gray-500">
                    ❌ NOT YET — {stats.waitlist.total}/50 target. Focus on user growth.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-gray-400 font-medium">Limit too restrictive?</h3>
                {stats.usage.limitHitRate > 30 ? (
                  <p className="text-red-400">
                    🔴 {stats.usage.limitHitRate}% hitting limit — consider increasing or launching premium
                  </p>
                ) : stats.usage.limitHitRate > 10 ? (
                  <p className="text-yellow-400">
                    🟡 {stats.usage.limitHitRate}% hitting limit — healthy range
                  </p>
                ) : (
                  <p className="text-green-400">
                    🟢 {stats.usage.limitHitRate}% hitting limit — limit is fine
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-gray-400 font-medium">Next stack to add?</h3>
                {stats.stacks.length > 0 ? (
                  <p className="text-gray-300">
                    📊 Most requested: <strong>{stats.stacks[0]?.stack || 'N/A'}</strong>
                    {stats.stacks[1] && ` → then ${stats.stacks[1].stack}`}
                  </p>
                ) : (
                  <p className="text-gray-500">
                    Need more data to recommend.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-gray-600 text-xs py-6 border-t border-gray-800">
            <p>README Generator Admin • Data range: {days} days</p>
            <p className="mt-1">
              Tip: The &ldquo;Decision Helper&rdquo; updates based on your real metrics.
              Aim for 50 waitlist signups before adding payments.
            </p>
          </footer>
        </main>
      )}
    </div>
  );
}