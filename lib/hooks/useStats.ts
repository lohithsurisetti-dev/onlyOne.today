import { useState, useEffect } from 'react'

export interface PlatformStats {
  today: {
    totalPosts: number
    uniquePosts: number
    blockedPosts: number
  }
  allTime: {
    totalPosts: number
  }
  moderation: {
    totalBlocked: number
    staticBlocked: number
    aiBlocked: number
  }
}

/**
 * Hook to fetch platform statistics
 */
export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats', {
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return { stats, loading, error }
}

