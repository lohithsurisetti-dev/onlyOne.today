import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModerationStats } from '@/lib/services/moderation-hybrid'
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/utils/redis'

// =====================================================
// PERFORMANCE: Redis + Response caching
// =====================================================
export const revalidate = 60 // seconds

/**
 * GET /api/stats - Get public platform statistics
 * Supports timezone-aware queries via ?timezone=America/New_York
 * 
 * Now with Redis caching for 10x faster responses!
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get timezone from query params (defaults to UTC)
    const searchParams = request.nextUrl.searchParams
    const userTimezone = searchParams.get('timezone') || 'UTC'
    const timezoneOffset = searchParams.get('offset') // Offset in minutes
    
    // Create cache key based on timezone offset (users in same TZ get same cache)
    const cacheKey = `${CacheKeys.STATS_TODAY}:${timezoneOffset || '0'}`
    
    // Try Redis cache first
    const cached = await cacheGet<any>(cacheKey)
    if (cached) {
      console.log(`✅ Stats cache HIT for timezone offset ${timezoneOffset}`)
      return NextResponse.json(cached, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30', // Client cache 30s
          'X-Cache-Status': 'HIT'
        }
      })
    }
    
    console.log(`❌ Stats cache MISS for timezone offset ${timezoneOffset} - fetching from DB...`)
    
    // Calculate "today" in user's timezone
    let todayISO: string
    
    if (timezoneOffset) {
      // Use offset if provided (more reliable than timezone name)
      const offsetMinutes = parseInt(timezoneOffset)
      const now = new Date()
      
      // Get midnight in user's timezone
      const userNow = new Date(now.getTime() - (offsetMinutes * 60 * 1000))
      const userToday = new Date(Date.UTC(
        userNow.getUTCFullYear(),
        userNow.getUTCMonth(), 
        userNow.getUTCDate(),
        0, 0, 0, 0
      ))
      
      // Add offset back to get UTC time of user's midnight
      todayISO = new Date(userToday.getTime() + (offsetMinutes * 60 * 1000)).toISOString()
    } else {
      // Fallback to UTC
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
      todayISO = today.toISOString()
    }
    
    console.log(`📊 Fetching stats for today (${userTimezone}, offset: ${timezoneOffset}min):`, todayISO)
    
    const { count: totalPostsToday, error: todayError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)
    
    if (todayError) {
      console.error('Error fetching today posts:', todayError)
    }
    
    // Get total unique posts today (100% uniqueness)
    const { count: uniquePostsToday, error: uniqueError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO)
      .eq('uniqueness_score', 100)
    
    if (uniqueError) {
      console.error('Error fetching unique posts:', uniqueError)
    }
    
    // Get total posts all time
    const { count: totalPostsAllTime, error: allTimeError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
    
    if (allTimeError) {
      console.error('Error fetching all time posts:', allTimeError)
    }
    
    console.log('📊 Stats:', { totalPostsToday, uniquePostsToday, totalPostsAllTime })
    
    // Get moderation stats (blocked posts)
    const moderationStats = getModerationStats()
    
    // Build response
    const statsData = {
      today: {
        totalPosts: totalPostsToday || 0,
        uniquePosts: uniquePostsToday || 0,
        blockedPosts: moderationStats.staticBlocked + moderationStats.aiBlocked,
      },
      allTime: {
        totalPosts: totalPostsAllTime || 0,
      },
      moderation: {
        totalBlocked: moderationStats.staticBlocked + moderationStats.aiBlocked,
        staticBlocked: moderationStats.staticBlocked,
        aiBlocked: moderationStats.aiBlocked,
      }
    }
    
    // Cache in Redis for 60 seconds
    await cacheSet(cacheKey, statsData, CacheTTL.STATS)
    
    return NextResponse.json(statsData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30',
        'X-Cache-Status': 'MISS'
      }
    })
  } catch (error) {
    console.error('Error in GET /api/stats:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}

