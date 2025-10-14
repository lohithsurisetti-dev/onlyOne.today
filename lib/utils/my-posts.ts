/**
 * localStorage utility for tracking user's own posts
 * No signup needed - works across sessions!
 */

export interface MyPost {
  id: string
  content: string
  uniquenessScore: number
  matchCount: number
  scope: string
  timestamp: string
  viewUrl: string
}

const STORAGE_KEY = 'onlyone_my_posts'
const MAX_POSTS = 50 // Keep last 50 posts

/**
 * Save a post to user's local history
 */
export function saveMyPost(post: MyPost): void {
  if (typeof window === 'undefined') return
  
  try {
    const existing = getMyPosts()
    const updated = [post, ...existing].slice(0, MAX_POSTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    console.log('✅ Post saved to My Posts')
  } catch (error) {
    console.error('Failed to save post:', error)
  }
}

/**
 * Get all user's posts from localStorage
 */
export function getMyPosts(): MyPost[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const posts = JSON.parse(stored) as MyPost[]
    
    // Filter out posts older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const recentPosts = posts.filter(p => new Date(p.timestamp).getTime() > thirtyDaysAgo)
    
    // Update storage if we filtered any
    if (recentPosts.length !== posts.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentPosts))
    }
    
    return recentPosts
  } catch (error) {
    console.error('Failed to get posts:', error)
    return []
  }
}

/**
 * Get today's posts only
 */
export function getTodaysPosts(): MyPost[] {
  const all = getMyPosts()
  const today = new Date().toDateString()
  
  return all.filter(p => new Date(p.timestamp).toDateString() === today)
}

/**
 * Clear all posts (if user wants to reset)
 */
export function clearMyPosts(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ My Posts cleared')
  } catch (error) {
    console.error('Failed to clear posts:', error)
  }
}

/**
 * Get stats about user's posts
 */
export function getMyPostsStats() {
  const all = getMyPosts()
  const today = getTodaysPosts()
  
  const avgUniqueness = today.length > 0
    ? Math.round(today.reduce((sum, p) => sum + p.uniquenessScore, 0) / today.length)
    : 0
  
  const totalUnique = today.filter(p => p.uniquenessScore >= 70).length
  const totalCommon = today.filter(p => p.uniquenessScore < 70).length
  
  return {
    totalToday: today.length,
    totalAllTime: all.length,
    avgUniqueness,
    totalUnique,
    totalCommon,
  }
}

