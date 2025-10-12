/**
 * Client-side service for fetching trending data
 * 
 * Uses our server-side /api/trending endpoint to avoid CORS issues
 */

import type { GhostPost } from './ghost-posts'

export interface TrendingResponse {
  success: boolean
  count: number
  posts: GhostPost[]
  error?: string
}

/**
 * Fetch trending posts from our server API
 * This avoids CORS issues by using our server as a proxy
 * 
 * @param count - Number of posts to fetch (default: 30)
 * @param force - Force refresh, bypass cache (default: false)
 */
export async function fetchTrendingPosts(count: number = 30, force: boolean = false): Promise<GhostPost[]> {
  try {
    const params = new URLSearchParams({
      count: count.toString(),
      ...(force && { force: 'true' })
    })
    
    const url = `/api/trending?${params.toString()}`
    console.log(`📡 Fetching ${count} trending posts from ${url}...`)
    
    const response = await fetch(url, {
      cache: 'no-store' // Always get fresh data on client
    })
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }
    
    const data: TrendingResponse = await response.json()
    console.log(`📊 API response:`, {
      count: data.count,
      cached: (data as any).cached,
      poolSize: (data as any).poolSize,
      forceRefresh: (data as any).forceRefresh
    })
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch trending data')
    }
    
    console.log(`✅ Returning ${data.posts.length} trending posts`)
    return data.posts
  } catch (error) {
    console.error('❌ Failed to fetch trending posts:', error)
    return []
  }
}

