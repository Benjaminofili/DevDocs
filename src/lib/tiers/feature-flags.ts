// src/lib/tiers/feature-flags.ts
// Determines what features are available per tier

import type { UserTier, WaitlistFeature } from '@/types'
import { TIER_CONFIGS } from './config'

// ============================================
// FEATURE DEFINITIONS
// ============================================

interface FeatureDefinition {
  id: WaitlistFeature
  name: string
  description: string
  requiredTier: UserTier
  waitlistMessage: string
  waitingCount?: number // Populated dynamically
}

export const FEATURES: Record<WaitlistFeature, FeatureDefinition> = {
  'private-repos': {
    id: 'private-repos',
    name: 'Private Repository Support',
    description: 'Analyze and generate READMEs for your private GitHub repos',
    requiredTier: 'premium',
    waitlistMessage: 'Private repo support is coming soon!',
  },
  'premium-ai': {
    id: 'premium-ai',
    name: 'Premium AI Models',
    description: 'Use GPT-4 and Claude for higher quality generation',
    requiredTier: 'premium',
    waitlistMessage: 'Premium AI models are coming soon!',
  },
  'unlimited-generations': {
    id: 'unlimited-generations',
    name: 'Unlimited Generations',
    description: 'No daily limit on README generation',
    requiredTier: 'premium',
    waitlistMessage: 'Unlimited generations coming soon!',
  },
  'version-history': {
    id: 'version-history',
    name: 'Version History',
    description: 'Track changes and revert to previous versions',
    requiredTier: 'premium',
    waitlistMessage: 'Version history is coming soon!',
  },
  'custom-templates': {
    id: 'custom-templates',
    name: 'Custom Templates',
    description: 'Create and save your own README templates',
    requiredTier: 'premium',
    waitlistMessage: 'Custom templates coming soon!',
  },
  'team-features': {
    id: 'team-features',
    name: 'Team Collaboration',
    description: 'Share templates and collaborate with your team',
    requiredTier: 'premium',
    waitlistMessage: 'Team features are coming soon!',
  },
  'export-formats': {
    id: 'export-formats',
    name: 'Export Formats',
    description: 'Export your README as PDF or HTML',
    requiredTier: 'premium',
    waitlistMessage: 'PDF and HTML export coming soon!',
  },
  'advanced-sections': {
    id: 'advanced-sections',
    name: 'Advanced Sections',
    description: 'Contributing guidelines, security policy, API docs, and more',
    requiredTier: 'premium',
    waitlistMessage: 'Advanced sections are coming soon!',
  },
}

// ============================================
// CHECK FUNCTIONS
// ============================================

export function isFeatureAvailable(
  feature: WaitlistFeature,
  tier: UserTier
): boolean {
  const featureDef = FEATURES[feature]
  if (!featureDef) return false

  const tierRank: Record<UserTier, number> = {
    anonymous: 0,
    free: 1,
    premium: 2,
  }

  return tierRank[tier] >= tierRank[featureDef.requiredTier]
}

export function isSectionAvailable(
  sectionId: string,
  tier: UserTier
): boolean {
  const config = TIER_CONFIGS[tier]
  // If the section is in the user's tier config, it's available
  if (config.availableSections.includes(sectionId)) return true
  // If the section isn't in ANY tier config (unknown/new section),
  // allow it by default to avoid accidental 403 blocks
  const allKnownSections = TIER_CONFIGS.premium.availableSections
  if (!allKnownSections.includes(sectionId)) return true
  // Section exists in a higher tier but not the user's tier
  return false
}

export function getLockedSections(tier: UserTier): string[] {
  const allSections = TIER_CONFIGS.premium.availableSections
  const available = TIER_CONFIGS[tier].availableSections
  return allSections.filter((s) => !available.includes(s))
}

export function getFeatureInfo(feature: WaitlistFeature): FeatureDefinition {
  return FEATURES[feature]
}

export function getUpgradeReason(
  feature: WaitlistFeature
): string {
  const info = FEATURES[feature]
  return info?.waitlistMessage ?? 'This feature is coming soon!'
}

// ============================================
// GET SECTION TIER REQUIREMENT
// ============================================

export function getSectionTierRequirement(sectionId: string): UserTier {
  // Check from lowest tier to highest — return the first tier that includes it
  if (TIER_CONFIGS.anonymous.availableSections.includes(sectionId)) {
    return 'anonymous'
  }
  if (TIER_CONFIGS.free.availableSections.includes(sectionId)) {
    return 'free'
  }
  if (TIER_CONFIGS.premium.availableSections.includes(sectionId)) {
    return 'premium'
  }
  // Unknown section — default to anonymous (allow access)
  return 'anonymous'
}