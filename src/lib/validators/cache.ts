// src/lib/validators/cache.ts

import { CACHE_CONFIG, INVALID_CONTENT_PATTERNS } from '@/config/constants';

interface CachedResponse {
  sectionId: string;
  content: string;
  explanation: string;
  provider: string;
}

/**
 * Validates if a cached response is still valid and usable
 * @param cached - The cached response to validate
 * @returns boolean indicating if the cache is valid
 */
export function isCacheValid(cached: CachedResponse | null | undefined): cached is CachedResponse {
  if (!cached) return false;
  
  // Check required fields exist
  if (!cached.content || !cached.provider || !cached.sectionId) {
    return false;
  }
  
  // Check minimum content length
  if (cached.content.length < CACHE_CONFIG.MIN_VALID_CONTENT_LENGTH) {
    return false;
  }
  
  // Check for invalid content patterns
  const hasInvalidPattern = INVALID_CONTENT_PATTERNS.some(pattern =>
    cached.content.includes(pattern)
  );
  
  if (hasInvalidPattern) {
    return false;
  }
  
  return true;
}

/**
 * Validates if generated content is worth caching
 * @param content - The generated content to validate
 * @returns boolean indicating if the content should be cached
 */
export function isContentCacheable(content: string | null | undefined): boolean {
  if (!content) return false;
  
  if (content.length < CACHE_CONFIG.MIN_VALID_CONTENT_LENGTH) {
    return false;
  }
  
  const hasInvalidPattern = INVALID_CONTENT_PATTERNS.some(pattern =>
    content.includes(pattern)
  );
  
  return !hasInvalidPattern;
}