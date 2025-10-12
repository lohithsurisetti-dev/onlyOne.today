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
  source: 'reddit' | 'spotify' | 'google' | 'github' | 'google-trends' | 'youtube' | 'twitter' | 'curated'
  peopleCount: number // Estimated global count
  uniqueness: 0 // Ghost posts are always 0% unique (everyone's doing it)
  vibe?: string
  isGhost: true
}

// Cache for trending data (refresh every 10 minutes)
let trendingCache: TrendingItem[] = []
let lastFetch = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Curated ghost posts (fallback when APIs aren't available)
 * Updated periodically with real trending data
 */
const CURATED_GHOST_POSTS: Omit<GhostPost, 'id'>[] = [
  // Music trending
  {
    content: "Streamed Ordinary by Taylor Swift on repeat",
    type: 'ghost',
    source: 'spotify',
    peopleCount: 2300000,
    uniqueness: 0,
    vibe: '🎵 Music Lover',
    isGhost: true,
  },
  {
    content: "Added latest Drake album to playlist",
    type: 'ghost',
    source: 'spotify',
    peopleCount: 1800000,
    uniqueness: 0,
    vibe: '🎵 Music Lover',
    isGhost: true,
  },
  
  // Social media trending
  {
    content: "Scrolled Instagram for 2+ hours",
    type: 'ghost',
    source: 'curated',
    peopleCount: 4500000,
    uniqueness: 0,
    vibe: '😴 Procrastinator',
    isGhost: true,
  },
  {
    content: "Posted a story on Instagram",
    type: 'ghost',
    source: 'curated',
    peopleCount: 3200000,
    uniqueness: 0,
    vibe: '🤝 Social Butterfly',
    isGhost: true,
  },
  {
    content: "Watched TikTok videos for hours",
    type: 'ghost',
    source: 'curated',
    peopleCount: 5100000,
    uniqueness: 0,
    vibe: '💤 Chill Vibes',
    isGhost: true,
  },
  
  // Food delivery
  {
    content: "Ordered food delivery instead of cooking",
    type: 'ghost',
    source: 'curated',
    peopleCount: 2700000,
    uniqueness: 0,
    vibe: '🍳 Foodie Chef',
    isGhost: true,
  },
  {
    content: "Had coffee from Starbucks",
    type: 'ghost',
    source: 'curated',
    peopleCount: 3800000,
    uniqueness: 0,
    vibe: '☕ Coffee Addict',
    isGhost: true,
  },
  
  // Entertainment
  {
    content: "Binge-watched Netflix series",
    type: 'ghost',
    source: 'curated',
    peopleCount: 4200000,
    uniqueness: 0,
    vibe: '🏠 Homebody',
    isGhost: true,
  },
  {
    content: "Watched YouTube videos before bed",
    type: 'ghost',
    source: 'youtube',
    peopleCount: 6100000,
    uniqueness: 0,
    vibe: '🌙 Night Owl',
    isGhost: true,
  },
  
  // Work/productivity
  {
    content: "Checked work emails on weekend",
    type: 'ghost',
    source: 'curated',
    peopleCount: 1200000,
    uniqueness: 0,
    vibe: '🚀 Productivity Beast',
    isGhost: true,
  },
  {
    content: "Attended Zoom meetings from home",
    type: 'ghost',
    source: 'curated',
    peopleCount: 2900000,
    uniqueness: 0,
    vibe: '🏠 Homebody',
    isGhost: true,
  },
  
  // Sports/events
  {
    content: "Watched the game on TV",
    type: 'ghost',
    source: 'curated',
    peopleCount: 3400000,
    uniqueness: 0,
    vibe: '🤝 Social Butterfly',
    isGhost: true,
  },
  
  // Shopping
  {
    content: "Online shopping for hours",
    type: 'ghost',
    source: 'curated',
    peopleCount: 2100000,
    uniqueness: 0,
    vibe: '✈️ Wanderlust',
    isGhost: true,
  },
  
  // Tech
  {
    content: "Used ChatGPT to write something",
    type: 'ghost',
    source: 'google-trends',
    peopleCount: 1900000,
    uniqueness: 0,
    vibe: '🚀 Productivity Beast',
    isGhost: true,
  },
  {
    content: "Googled 'how to...' for basic things",
    type: 'ghost',
    source: 'google-trends',
    peopleCount: 8700000,
    uniqueness: 0,
    vibe: '✨ Free Spirit',
    isGhost: true,
  },
  
  // Sleep
  {
    content: "Hit snooze 5 times this morning",
    type: 'ghost',
    source: 'curated',
    peopleCount: 4800000,
    uniqueness: 0,
    vibe: '😴 Procrastinator',
    isGhost: true,
  },
]

/**
 * Get random ghost posts from real trending data (with fallback)
 */
export async function getGhostPosts(count: number = 10): Promise<GhostPost[]> {
  const now = Date.now()
  
  // Fetch fresh trending data if cache expired
  if (now - lastFetch > CACHE_DURATION || trendingCache.length === 0) {
    console.log('🔄 Fetching fresh trending data...')
    try {
      trendingCache = await getAllTrendingData()
      lastFetch = now
      console.log(`✅ Cached ${trendingCache.length} trending items`)
    } catch (error) {
      console.error('❌ Failed to fetch trending data:', error)
      // Keep using old cache or fall back to curated
    }
  }
  
  // Use trending data if available, otherwise use curated fallback
  if (trendingCache.length > 0) {
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
  
  // Fallback to curated posts
  console.log('⚠️ Using curated fallback posts')
  const shuffled = [...CURATED_GHOST_POSTS].sort(() => Math.random() - 0.5)
  const unique = shuffled.slice(0, Math.min(count, CURATED_GHOST_POSTS.length))
  
  return unique.map((post, index) => ({
    ...post,
    id: `ghost-${now}-${index}`,
  }))
}

/**
 * Inject ghost posts into feed when user posts are low
 * 
 * Strategy:
 * - If < 10 real posts: Add 10-15 ghost posts
 * - If 10-20 real posts: Add 5-10 ghost posts
 * - If 20+ real posts: Add 0-5 ghost posts
 */
export async function injectGhostPosts<T extends { id: string | number }>(
  realPosts: T[],
  minPosts: number = 20
): Promise<(T | GhostPost)[]> {
  const realCount = realPosts.length
  
  if (realCount >= minPosts) {
    // Enough real posts, maybe add a few ghosts for variety
    const ghostCount = Math.floor(Math.random() * 3) + 1 // 1-3 ghosts
    const ghosts = await getGhostPosts(ghostCount)
    
    // Interleave ghosts randomly
    const combined = [...realPosts]
    ghosts.forEach(ghost => {
      const randomIndex = Math.floor(Math.random() * (combined.length + 1))
      combined.splice(randomIndex, 0, ghost as any)
    })
    
    return combined
  }
  
  // Need more posts
  const needed = minPosts - realCount
  const ghostCount = Math.min(needed + 5, 15) // Add extra for variety
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
  }
}

/**
 * Check if a post is a ghost post
 */
export function isGhostPost(post: any): post is GhostPost {
  return post.isGhost === true || post.id?.toString().startsWith('ghost-')
}

