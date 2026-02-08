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
  return config.availableSections.includes(sectionId)
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
  // Check which tier has access to this section
  if (TIER_CONFIGS.premium.availableSections.includes(sectionId)) {
    if (TIER_CONFIGS.free.availableSections.includes(sectionId)) {
      return 'free'
    }
    return 'premium'
  }
  return 'anonymous'
}