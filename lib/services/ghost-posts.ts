/**
 * Ghost Posts - Real-Time Trending Activity
 * 
 * When real user posts are low, inject "ghost posts" showing what
 * the world is actually doing (from real APIs: Reddit, GitHub, Google Trends).
 * 
 * Makes the feed feel alive even with few users.
 */

import { getAllTrendingData, type TrendingItem } from './trending-data'

export interface GhostPost {
  id: string
  content: string
  type: 'ghost' // Special type to distinguish from real posts
  source: 'reddit' | 'spotify' | 'google' | 'github' | 'google-trends' | 'youtube' | 'twitter' | 'curated' | 'sports'
  peopleCount: number // Estimated global count
  uniqueness: 0 // Ghost posts are always 0% unique (everyone's doing it)
  vibe?: string
  isGhost: true
}

// Cache for trending data (refresh every 5 minutes for faster updates)
let trendingCache: TrendingItem[] = []
let lastFetch = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let isFetching = false

/**
 * Background fetch trending data (non-blocking)
 */
async function refreshTrendingCache() {
  if (isFetching) return
  
  isFetching = true
  console.log('🔄 Background fetch: trending data...')
  
  try {
    const fresh = await getAllTrendingData()
    trendingCache = fresh
    lastFetch = Date.now()
    console.log(`✅ Cache refreshed: ${trendingCache.length} trends`)
  } catch (error) {
    console.error('❌ Background fetch failed:', error)
  } finally {
    isFetching = false
  }
}

/**
 * Get random ghost posts from REAL trending data ONLY
 * Returns cache immediately, refreshes in background if stale
 */
export async function getGhostPosts(count: number = 10): Promise<GhostPost[]> {
  const now = Date.now()
  const cacheAge = now - lastFetch
  
  // If cache is stale, trigger background refresh (but don't wait)
  if (cacheAge > CACHE_DURATION && !isFetching) {
    refreshTrendingCache() // Fire and forget
  }
  
  // If no cache exists, wait for first fetch
  if (trendingCache.length === 0 && cacheAge === now) {
    console.log('⏳ First fetch: waiting for trending data...')
    await refreshTrendingCache()
  }
  
  // Return from cache immediately (stale cache is better than slow response)
  if (trendingCache.length === 0) {
    console.log('⚠️ No trending data available')
    return []
  }
  
  // Shuffle and select from trending cache
  const shuffled = [...trendingCache].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)
  
  return selected.map((trend, index) => ({
    id: `ghost-${now}-${index}`,
    content: trend.content,
    type: 'ghost' as const,
    source: trend.source,
    peopleCount: trend.count,
    uniqueness: 0,
    isGhost: true,
  }))
}

/**
 * Inject ghost posts into feed when user posts are low
 * 
 * Strategy (OPTIMIZED for speed):
 * - If < 10 real posts: Add 15-20 ghost posts
 * - If 10-20 real posts: Add 8-12 ghost posts
 * - If 20+ real posts: Add 3-5 ghost posts
 */
export async function injectGhostPosts<T extends { id: string | number }>(
  realPosts: T[],
  minPosts: number = 25
): Promise<(T | GhostPost)[]> {
  const realCount = realPosts.length
  
  // Calculate how many ghost posts to add (REDUCED for performance)
  let ghostCount: number
  
  if (realCount < 10) {
    ghostCount = Math.floor(Math.random() * 6) + 15 // 15-20 ghosts
  } else if (realCount < 20) {
    ghostCount = Math.floor(Math.random() * 5) + 8 // 8-12 ghosts
  } else if (realCount < 30) {
    ghostCount = Math.floor(Math.random() * 3) + 3 // 3-5 ghosts
  } else {
    ghostCount = Math.floor(Math.random() * 2) + 1 // 1-2 ghosts (minimal)
  }
  
  const ghosts = await getGhostPosts(ghostCount)
  
  // Mix real and ghost posts
  const combined = [...realPosts, ...ghosts]
  
  // Shuffle to make it feel organic
  return combined.sort(() => Math.random() - 0.5)
}

/**
 * Format ghost post for display
 */
export function formatGhostPost(ghost: GhostPost) {
  return {
    id: ghost.id,
    content: ghost.content,
    type: 'common' as const,
    score: 0,
    count: ghost.peopleCount,
    time: 'trending now',
    funny_count: 0,
    creative_count: 0,
    must_try_count: 0,
    total_reactions: 0,
    isGhost: true,
    source: ghost.source,
  }
}

/**
 * Check if a post is a ghost post
 */
export function isGhostPost(post: any): post is GhostPost {
  return post.isGhost === true || post.id?.toString().startsWith('ghost-')
}


