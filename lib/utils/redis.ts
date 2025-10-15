/**
 * Redis/KV Client Utility
 * 
 * Provides caching layer for:
 * - Trending posts
 * - Platform stats
 * - Feed results
 * - Rate limiting
 * - Rankings/leaderboards
 */

import { kv } from '@vercel/kv'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CACHE KEY CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CacheKeys = {
  // Trending
  TRENDING_POSTS: 'trending:posts',
  TRENDING_TOPICS: 'trending:topics',
  
  // Stats
  STATS_TODAY: 'stats:today',
  STATS_ALL_TIME: 'stats:alltime',
  
  // Feed (parameterized)
  feed: (filter: string, scope: string, page: number) => 
    `feed:${filter}:${scope}:${page}`,
  
  // Rankings
  rankings: (period: 'today' | 'week' | 'month') => 
    `rankings:${period}`,
  
  // Rate limiting
  rateLimit: (ip: string, action: string) => 
    `ratelimit:${ip}:${action}`,
  
  // User posts
  userPosts: (userId: string) => 
    `user:${userId}:posts`,
  
  // Similar posts
  similarPosts: (contentHash: string) => 
    `similar:${contentHash}`,
} as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CACHE TTL CONSTANTS (seconds)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CacheTTL = {
  TRENDING_POSTS: 300,      // 5 minutes
  TRENDING_TOPICS: 300,     // 5 minutes
  STATS: 60,                // 1 minute
  FEED_RESULTS: 30,         // 30 seconds
  RANKINGS: 300,            // 5 minutes
  RATE_LIMIT: 60,           // 1 minute
  USER_POSTS: 600,          // 10 minutes
  SIMILAR_POSTS: 600,       // 10 minutes
} as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if Redis is available (graceful degradation)
 */
export function isRedisAvailable(): boolean {
  if (typeof window !== 'undefined') {
    return false // Client-side
  }
  
  return !!(
    process.env.KV_URL &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  )
}

/**
 * Generic cache get with fallback
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) {
    console.log('⚠️ Redis not available, skipping cache get')
    return null
  }
  
  try {
    const cached = await kv.get<T>(key)
    if (cached) {
      console.log(`✅ Cache HIT: ${key}`)
      return cached
    }
    console.log(`❌ Cache MISS: ${key}`)
    return null
  } catch (error) {
    console.error('Redis get error:', error)
    return null // Graceful degradation
  }
}

/**
 * Generic cache set with TTL
 */
export async function cacheSet<T>(
  key: string, 
  value: T, 
  ttl: number
): Promise<void> {
  if (!isRedisAvailable()) {
    console.log('⚠️ Redis not available, skipping cache set')
    return
  }
  
  try {
    await kv.setex(key, ttl, value)
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`)
  } catch (error) {
    console.error('Redis set error:', error)
    // Don't throw - graceful degradation
  }
}

/**
 * Delete cache entry
 */
export async function cacheDel(key: string | string[]): Promise<void> {
  if (!isRedisAvailable()) {
    return
  }
  
  try {
    if (Array.isArray(key)) {
      await kv.del(...key)
      console.log(`🗑️ Cache DEL: ${key.join(', ')}`)
    } else {
      await kv.del(key)
      console.log(`🗑️ Cache DEL: ${key}`)
    }
  } catch (error) {
    console.error('Redis del error:', error)
  }
}

/**
 * Invalidate feed cache (when new post created)
 */
export async function invalidateFeedCache(): Promise<void> {
  if (!isRedisAvailable()) {
    return
  }
  
  try {
    // Pattern matching for all feed keys
    const keys = await kv.keys('feed:*')
    if (keys.length > 0) {
      await kv.del(...keys)
      console.log(`🗑️ Invalidated ${keys.length} feed cache entries`)
    }
  } catch (error) {
    console.error('Feed cache invalidation error:', error)
  }
}

/**
 * Invalidate stats cache (when new post created)
 */
export async function invalidateStatsCache(): Promise<void> {
  await cacheDel([
    CacheKeys.STATS_TODAY,
    CacheKeys.STATS_ALL_TIME,
  ])
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RATE LIMITING WITH REDIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // seconds until reset
}

/**
 * Check rate limit using Redis atomic operations
 * Much faster than DB-based rate limiting (5ms vs 200ms)
 */
export async function checkRateLimit(
  identifier: string, // IP or user ID
  action: string,
  limit: number,
  window: number = 60 // seconds
): Promise<RateLimitResult> {
  // Fallback to permissive if Redis unavailable
  if (!isRedisAvailable()) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: window,
    }
  }
  
  try {
    const key = CacheKeys.rateLimit(identifier, action)
    
    // Atomic increment
    const count = await kv.incr(key)
    
    // Set expiry on first request
    if (count === 1) {
      await kv.expire(key, window)
    }
    
    // Get TTL for reset time
    const ttl = await kv.ttl(key)
    
    const remaining = Math.max(0, limit - count)
    const success = count <= limit
    
    return {
      success,
      limit,
      remaining,
      reset: ttl > 0 ? ttl : window,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Permissive fallback
    return {
      success: true,
      limit,
      remaining: limit,
      reset: window,
    }
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  identifier: string,
  action: string
): Promise<void> {
  if (!isRedisAvailable()) {
    return
  }
  
  try {
    const key = CacheKeys.rateLimit(identifier, action)
    await kv.del(key)
    console.log(`🔄 Rate limit reset: ${key}`)
  } catch (error) {
    console.error('Rate limit reset error:', error)
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEADERBOARD FUNCTIONS (Redis Sorted Sets)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Add score to leaderboard
 */
export async function addToLeaderboard(
  leaderboard: string,
  member: string,
  score: number
): Promise<void> {
  if (!isRedisAvailable()) {
    return
  }
  
  try {
    await kv.zadd(leaderboard, { score, member })
  } catch (error) {
    console.error('Leaderboard add error:', error)
  }
}

/**
 * Get top N from leaderboard
 */
export async function getTopFromLeaderboard(
  leaderboard: string,
  count: number = 10
): Promise<Array<{ member: string; score: number }>> {
  if (!isRedisAvailable()) {
    return []
  }
  
  try {
    // Get top N with scores (highest first)
    const results = await kv.zrange(leaderboard, 0, count - 1, {
      rev: true,
      withScores: true,
    })
    
    // Format results
    const formatted = []
    for (let i = 0; i < results.length; i += 2) {
      formatted.push({
        member: results[i] as string,
        score: results[i + 1] as number,
      })
    }
    
    return formatted
  } catch (error) {
    console.error('Leaderboard get error:', error)
    return []
  }
}

/**
 * Get rank of a member in leaderboard
 */
export async function getLeaderboardRank(
  leaderboard: string,
  member: string
): Promise<number | null> {
  if (!isRedisAvailable()) {
    return null
  }
  
  try {
    const rank = await kv.zrevrank(leaderboard, member)
    return rank !== null ? rank + 1 : null // 1-indexed
  } catch (error) {
    console.error('Leaderboard rank error:', error)
    return null
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT REDIS CLIENT (for advanced use cases)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { kv as redis }

