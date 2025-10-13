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
  const [error, setError] = useState<string | null>(null)
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [timezoneOffset, setTimezoneOffset] = useState<number>(0)

  useEffect(() => {
    // Detect user's timezone on client-side
    if (typeof window !== 'undefined') {
      const detectedTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
      const offset = new Date().getTimezoneOffset() // Minutes offset from UTC (negative for ahead)
      setUserTimezone(detectedTZ)
      setTimezoneOffset(offset)
      console.log(`🌍 Detected timezone: ${detectedTZ} (UTC${offset > 0 ? '-' : '+'}${Math.abs(offset / 60)})`)
    }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use provided timezone or detected timezone
        const tz = timezone || userTimezone
        
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when timezone is detected
    if (userTimezone) {
      fetchStats()
      
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000)
      
      return () => clearInterval(interval)
    }
  }, [timezone, userTimezone, timezoneOffset])

  return { stats, loading, error, userTimezone, timezoneOffset }
}

