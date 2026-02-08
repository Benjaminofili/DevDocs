// src/lib/tiers/config.ts
// Central tier configuration - single source of truth

import type { UserTier, TierConfig } from '@/types'

// ============================================
// SECTION DEFINITIONS
// ============================================

// Basic sections available to everyone
export const BASIC_SECTIONS = [
  'introduction',
  'installation',
  'usage',
  'license',
  'env-variables',
] as const

// Extra sections for logged-in free users
export const FREE_SECTIONS = [
  ...BASIC_SECTIONS,
  'tech-stack',
  'features',
  'folder-structure',
  'screenshots',
] as const

// All sections for premium users
export const PREMIUM_SECTIONS = [
  ...FREE_SECTIONS,
  'contributing',
  'code-of-conduct',
  'testing',
  'deployment',
  'api-documentation',
  'security',
  'changelog',
  'troubleshooting',
  'acknowledgements',
  'roadmap',
] as const

// ============================================
// TIER CONFIGURATIONS
// ============================================

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
  anonymous: {
    maxGenerationsPerDay: 2,
    maxSavedReadmes: 0,
    availableSections: [...BASIC_SECTIONS],
    teachingDepth: 'basic',
    canSaveReadmes: false,
    canAccessPrivateRepos: false,
    aiModels: ['gemini', 'groq'],
    exportFormats: ['markdown'],
  },

  free: {
    maxGenerationsPerDay: 5,
    maxSavedReadmes: 10,
    availableSections: [...FREE_SECTIONS],
    teachingDepth: 'standard',
    canSaveReadmes: true,
    canAccessPrivateRepos: false,
    aiModels: ['gemini', 'groq'],
    exportFormats: ['markdown'],
  },

  premium: {
    maxGenerationsPerDay: Infinity,
    maxSavedReadmes: Infinity,
    availableSections: [...PREMIUM_SECTIONS],
    teachingDepth: 'full',
    canSaveReadmes: true,
    canAccessPrivateRepos: true,
    aiModels: ['gemini', 'groq', 'openai', 'anthropic'],
    exportFormats: ['markdown', 'pdf', 'html'],
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTierConfig(tier: UserTier): TierConfig {
  return TIER_CONFIGS[tier]
}

export function getSectionLimit(tier: UserTier): string[] {
  return TIER_CONFIGS[tier].availableSections
}

export function getGenerationLimit(tier: UserTier): number {
  return TIER_CONFIGS[tier].maxGenerationsPerDay
}

export function getSaveLimit(tier: UserTier): number {
  return TIER_CONFIGS[tier].maxSavedReadmes
}

// ============================================
// GET USER TIER FROM DATABASE
// ============================================

export async function getUserTier(userId: string): Promise<UserTier> {
  // This will be called from server-side code
  // Import dynamically to avoid circular dependencies
  const { createClient } = await import('@/supabase/server')
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()
  
  return (profile?.tier as UserTier) ?? 'free'
}