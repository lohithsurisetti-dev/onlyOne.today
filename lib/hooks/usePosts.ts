import { useState, useEffect } from 'react'

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
}

/**
 * Hook to create a new post
 */
export function useCreatePost() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPost = async (data: CreatePostData): Promise<CreatePostResult | null> => {
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
        throw new Error(errorData.error || 'Failed to create post')
      }

      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createPost, loading, error }
}

/**
 * Hook to fetch recent posts
 */
export function useRecentPosts(
  filter: 'all' | 'unique' | 'common' = 'all',
  limit: number = 25,
  offset: number = 0,
  refreshKey: number = 0
) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          filter,
          limit: limit.toString(),
          offset: offset.toString(),
        })

        const response = await fetch(`/api/posts?${params}`, {
          cache: 'no-store' // Prevent caching
        })

        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = await response.json()
        console.log('📡 API Response:', data)
        console.log('📊 Posts fetched:', data.posts?.length, 'posts')
        setPosts(data.posts || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [filter, limit, offset, refreshKey])

  return { posts, loading, error }
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

