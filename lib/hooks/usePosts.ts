import { useState, useEffect, useMemo } from 'react'

export interface Post {
  id: string
  content: string
  content_hash: string | null
  input_type: 'action' | 'day'
  scope: 'city' | 'state' | 'country' | 'world'
  location_city: string | null
  location_state: string | null
  location_country: string | null
  uniqueness_score: number
  match_count: number
  funny_count?: number
  creative_count?: number
  must_try_count?: number
  total_reactions?: number
  created_at: string
}

export interface CreatePostData {
  content: string
  inputType: 'action' | 'day'
  scope: 'city' | 'state' | 'country' | 'world'
  locationCity?: string
  locationState?: string
  locationCountry?: string
}

export interface CreatePostResult {
  post: Post
  similarPosts: Post[]
  matchCount: number
  uniquenessScore: number
  percentile?: {
    percentile: number
    tier: 'elite' | 'rare' | 'unique' | 'notable' | 'common' | 'popular'
    displayText: string
    badge: string
    message: string
    comparison: string
  }
  totalPosts?: number
  // Day summary specific fields
  activities?: string[]
  activityCount?: number
  isDaySummary?: boolean
}

/**
 * Hook to create a new post
 */
export function useCreatePost() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPost = async (data: CreatePostData): Promise<CreatePostResult> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.reason || 'Failed to create post'
        
        // Set error state for hook consumers
        setError(errorMessage)
        
        // Also throw so caller can catch immediately
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Clear any previous errors on success
      setError(null)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      
      // Re-throw so caller can handle immediately
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createPost, loading, error }
}

/**
 * Hook to fetch recent posts with pagination and server-side filtering
 */
export function useRecentPosts(
  filter: 'all' | 'unique' | 'common' = 'all',
  limit: number = 25,
  offset: number = 0,
  refreshKey: number = 0,
  scopeFilter: 'all' | 'city' | 'state' | 'country' | 'world' = 'world',
  reactionFilter: 'all' | 'funny' | 'creative' | 'must_try' = 'all',
  location?: { city?: string; state?: string; country?: string }
) {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stabilize location object to prevent infinite re-renders
  const locationKey = useMemo(() => 
    JSON.stringify(location || {}), 
    [location?.city, location?.state, location?.country]
  )

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get user's timezone offset in minutes (e.g., Chicago = 300 for UTC-5)
        const timezoneOffset = new Date().getTimezoneOffset()
        
        const params = new URLSearchParams({
          filter,
          limit: limit.toString(),
          offset: offset.toString(),
          scopeFilter,
          reactionFilter,
          timezoneOffset: timezoneOffset.toString(), // Send user's timezone offset
          ...(location?.city && { locationCity: location.city }),
          ...(location?.state && { locationState: location.state }),
          ...(location?.country && { locationCountry: location.country }),
        })

        const response = await fetch(`/api/posts?${params}`, {
          cache: 'no-store' // Prevent caching
        })

        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = await response.json()
        console.log('📡 API Response:', data)
        console.log('📊 Posts fetched:', data.posts?.length, 'posts, total:', data.total)
        setPosts(data.posts || [])
        setTotal(data.total || 0)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, limit, offset, refreshKey, scopeFilter, reactionFilter, locationKey])

  return { posts, total, loading, error }
}

/**
 * Hook to refresh posts manually
 */
export function useRefreshPosts() {
  const [loading, setLoading] = useState(false)

  const refreshPosts = async (
    filter: 'all' | 'unique' | 'common' = 'all',
    limit: number = 25,
    offset: number = 0
  ): Promise<Post[]> => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        filter,
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`/api/posts?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      return data.posts || []
    } catch (err) {
      console.error('Error refreshing posts:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  return { refreshPosts, loading }
}

