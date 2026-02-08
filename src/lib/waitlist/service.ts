// src/lib/waitlist/service.ts
// Handles waitlist signups and counts

import { createClient } from '@/supabase/server'
import type { WaitlistEntry, WaitlistFeature, WaitlistResponse } from '@/types'

// ============================================
// JOIN WAITLIST
// ============================================

export async function joinWaitlist(
  entry: WaitlistEntry,
  userId?: string
): Promise<WaitlistResponse> {
  const supabase = await createClient()

  // Check if already on waitlist for this feature
  if (userId) {
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('user_id', userId)
      .eq('feature', entry.feature)
      .single()

    if (existing) {
      const count = await getWaitlistCount(entry.feature)
      return {
        success: true,
        message: "You're already on this waitlist!",
        waitingCount: count,
      }
    }
  } else {
    // Check by email for non-logged-in users
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', entry.email)
      .eq('feature', entry.feature)
      .single()

    if (existing) {
      const count = await getWaitlistCount(entry.feature)
      return {
        success: true,
        message: "You're already on this waitlist!",
        waitingCount: count,
      }
    }
  }

  // Add to waitlist
  const { error } = await supabase.from('waitlist').insert({
    user_id: userId ?? null,
    email: entry.email,
    feature: entry.feature,
    use_case: entry.useCase ?? null,
    value_level: entry.valueLevel ?? null,
  })

  if (error) {
    console.error('Waitlist insert error:', error)
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    }
  }

  const count = await getWaitlistCount(entry.feature)

  return {
    success: true,
    message: "You're on the list! We'll notify you when this launches.",
    waitingCount: count,
  }
}

// ============================================
// GET WAITLIST COUNT
// ============================================

export async function getWaitlistCount(
  feature: WaitlistFeature
): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('feature', feature)

  if (error) {
    console.error('Waitlist count error:', error)
    return 0
  }

  return count ?? 0
}

// ============================================
// GET ALL WAITLIST COUNTS (for UI)
// ============================================

export async function getAllWaitlistCounts(): Promise<
  Record<string, number>
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('waitlist')
    .select('feature')

  if (error || !data) return {}

  const counts: Record<string, number> = {}
  data.forEach((entry) => {
    counts[entry.feature] = (counts[entry.feature] ?? 0) + 1
  })

  return counts
}