import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModerationStats } from '@/lib/services/moderation-hybrid'

/**
 * GET /api/stats - Get public platform statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get total posts today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    
    console.log('📊 Fetching stats for today:', todayISO)
    
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
    
    return NextResponse.json({
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
    }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/stats:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}

