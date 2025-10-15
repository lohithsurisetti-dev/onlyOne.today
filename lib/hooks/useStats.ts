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
 * Hook to fetch platform statistics (timezone-aware)
 * Optionally accepts timezone to override auto-detection
 */
export function usePlatformStats(timezone?: string) {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTimezone, setUserTimezone] = useState<string | null>(null) // Start as null, detect on mount
  const [timezoneOffset, setTimezoneOffset] = useState<number>(0)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  useEffect(() => {
    // Detect user's timezone on client-side
    if (typeof window !== 'undefined') {
      const detectedTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
      const offset = new Date().getTimezoneOffset()
      setUserTimezone(detectedTZ)
      setTimezoneOffset(offset)
      console.log(`🌍 Detected timezone: ${detectedTZ} (UTC${offset > 0 ? '-' : '+'}${Math.abs(offset / 60)})`)
    }
  }, [])

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      // Use provided timezone or detected timezone (must be detected first!)
      const tz = timezone || userTimezone || 'UTC'
      
      // Build query with timezone info
      const params = new URLSearchParams({
        timezone: tz,
        offset: timezoneOffset.toString()
      })
      
      const response = await fetch(`/api/stats?${params}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data)
      setLastRefreshed(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Only fetch when timezone is detected
    if (userTimezone) {
      fetchStats()
      // Removed auto-refresh - manual only now!
    }
  }, [timezone, userTimezone, timezoneOffset])

  return { stats, loading, refreshing, error, userTimezone, timezoneOffset, lastRefreshed, refreshStats: fetchStats }
}

