/**
 * Temporal Uniqueness - Compare Across Time
 * 
 * Shows how unique an action is across different time periods:
 * - Today (last 24 hours)
 * - This Week (last 7 days)
 * - This Month (last 30 days)
 * - All Time
 * 
 * Helps users understand if they're trendsetters or followers.
 */

import { createClient } from '@/lib/supabase/client'

export interface TemporalUniqueness {
  today: {
    uniqueness: number
    matchCount: number
    totalPosts: number
  }
  thisWeek: {
    uniqueness: number
    matchCount: number
    totalPosts: number
  }
  thisMonth: {
    uniqueness: number
    matchCount: number
    totalPosts: number
  }
  allTime: {
    uniqueness: number
    matchCount: number
    totalPosts: number
  }
  trend: 'rising' | 'falling' | 'stable' // Is this becoming more or less common?
  insight: string // Human-readable insight
}

/**
 * Calculate temporal uniqueness for a content hash
 * Now respects scope and location for accurate comparisons
 */
export async function calculateTemporalUniqueness(
  contentHash: string,
  content: string,
  scope: 'city' | 'state' | 'country' | 'world' = 'world',
  location?: {
    city?: string
    state?: string
    country?: string
  }
): Promise<TemporalUniqueness> {
  const supabase = createClient()
  const now = new Date()
  
  // Define time windows
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Helper to apply scope filter
  const applyScopeFilter = (query: any) => {
    if (scope === 'city' && location?.city) {
      return query.eq('location_city', location.city)
    } else if (scope === 'state' && location?.state) {
      return query.eq('location_state', location.state)
    } else if (scope === 'country' && location?.country) {
      return query.eq('location_country', location.country)
    }
    // world scope - no filter
    return query
  }
  
  // Add small delay to ensure post is committed to database
  // Without this, temporal calculation might run before post is visible
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Fetch posts for each time window (with scope filtering)
  const [todayResult, weekResult, monthResult, allTimeResult] = await Promise.all([
    // Today
    applyScopeFilter(
      supabase
        .from('posts')
        .select('id, content_hash')
        .gte('created_at', oneDayAgo.toISOString())
    ),
    
    // This Week
    applyScopeFilter(
      supabase
        .from('posts')
        .select('id, content_hash')
        .gte('created_at', oneWeekAgo.toISOString())
    ),
    
    // This Month
    applyScopeFilter(
      supabase
        .from('posts')
        .select('id, content_hash')
        .gte('created_at', oneMonthAgo.toISOString())
    ),
    
    // All Time
    applyScopeFilter(
      supabase
        .from('posts')
        .select('id, content_hash')
    ),
  ])
  
  console.log(`📊 Temporal query results:`, {
    today: todayResult.data?.length || 0,
    week: weekResult.data?.length || 0,
    month: monthResult.data?.length || 0,
    allTime: allTimeResult.data?.length || 0,
    errors: {
      today: todayResult.error,
      week: weekResult.error,
      month: monthResult.error,
      allTime: allTimeResult.error
    }
  })
  
  // Calculate uniqueness for each period using RARITY
  const calculateForPeriod = (posts: any[] | null, periodName: string) => {
    if (!posts || posts.length === 0) {
      console.log(`📊 ${periodName}: No posts found → 100% unique (first!)`)
      return { uniqueness: 100, matchCount: 0, totalPosts: 0 }
    }
    
    // Count matching posts in this period
    // Note: This includes the current post itself, so subtract 1 to get "others"
    const matchingPosts = posts.filter(p => p.content_hash === contentHash)
    const totalMatches = matchingPosts.length
    const matchCount = Math.max(0, totalMatches - 1) // Others (excluding self)
    const totalPosts = posts.length
    
    // RARITY-BASED CALCULATION: What % of people DIDN'T do this
    // If 5 out of 100 did it → 95% unique (intuitive!)
    let uniqueness = 100
    if (totalPosts > 0) {
      uniqueness = ((totalPosts - matchCount) / totalPosts) * 100
    }
    
    // Edge case: Only this post exists
    if (totalPosts === 1) {
      uniqueness = 100
    }
    
    console.log(`📊 ${periodName}: ${matchCount} out of ${totalPosts} posts did this → ${Math.round(uniqueness)}% unique (rarity-based)`)
    
    return { uniqueness: Math.round(uniqueness), matchCount, totalPosts }
  }
  
  const today = calculateForPeriod(todayResult.data, 'Today')
  const thisWeek = calculateForPeriod(weekResult.data, 'This Week')
  const thisMonth = calculateForPeriod(monthResult.data, 'This Month')
  const allTime = calculateForPeriod(allTimeResult.data, 'All Time')
  
  // Determine trend (compare recent vs historical activity)
  let trend: 'rising' | 'falling' | 'stable' = 'stable'
  
  // Calculate average daily match rate
  const todayRate = today.matchCount // matches in last 24 hours
  const weekRate = thisWeek.matchCount / 7 // avg matches per day over week
  const monthRate = thisMonth.matchCount / 30 // avg matches per day over month
  
  // Rising: Recent activity is higher than historical average
  if (todayRate > monthRate * 1.5 || weekRate > monthRate * 1.3) {
    trend = 'rising' // Getting more common recently
  } 
  // Falling: Recent activity is lower than historical average
  else if (todayRate < monthRate * 0.5 || weekRate < monthRate * 0.7) {
    trend = 'falling' // Getting less common recently
  }
  // Stable: Activity is relatively consistent
  else {
    trend = 'stable'
  }
  
  // Generate insight
  const insight = generateInsight(today, thisWeek, thisMonth, allTime, trend, content)
  
  return {
    today,
    thisWeek,
    thisMonth,
    allTime,
    trend,
    insight,
  }
}

/**
 * Generate human-readable insight
 */
function generateInsight(
  today: any,
  thisWeek: any,
  thisMonth: any,
  allTime: any,
  trend: 'rising' | 'falling' | 'stable',
  content: string
): string {
  // Perfect uniqueness
  if (today.uniqueness === 100 && allTime.uniqueness === 100) {
    return "You're literally the first person EVER to do this. Legendary. 🦄"
  }
  
  // Trendsetter (unique today, common historically)
  if (today.uniqueness >= 90 && allTime.uniqueness <= 50) {
    return "You started this trend! Others are catching on. Trendsetter energy. 🔥"
  }
  
  // Late to the party (common today, was unique before)
  if (today.uniqueness <= 50 && allTime.uniqueness >= 90) {
    return "This was rare once. Now everyone's doing it. You're part of the wave. 🌊"
  }
  
  // Rising trend
  if (trend === 'rising') {
    const percentage = allTime.totalPosts > 0 ? Math.round(((allTime.matchCount + 1) / allTime.totalPosts) * 100) : 0
    return `This is becoming a thing! ${allTime.matchCount + 1} people (${percentage}% of all posts) have done this. You're early to the trend. 📈`
  }
  
  // Falling trend (becoming rare)
  if (trend === 'falling') {
    return `This used to be common, but not anymore. You're keeping it alive! 💫`
  }
  
  // Consistently unique
  if (today.uniqueness >= 80 && allTime.uniqueness >= 80) {
    return "Rare today, rare always. You've always been different. ✨"
  }
  
  // Consistently common
  if (today.uniqueness <= 30 && allTime.uniqueness <= 30) {
    const percentage = allTime.totalPosts > 0 ? Math.round(((allTime.matchCount + 1) / allTime.totalPosts) * 100) : 0
    return `A timeless classic. ${allTime.matchCount + 1} people (${percentage}%) have done this. You're in good company. 🤝`
  }
  
  // Default
  return `Unique today (${today.uniqueness}%), but patterns change over time. Keep being you! 💫`
}

/**
 * Get a visual representation of temporal change
 */
export function getTemporalEmoji(temporal: TemporalUniqueness): string {
  if (temporal.trend === 'rising') return '📈'
  if (temporal.trend === 'falling') return '📉'
  return '➡️'
}

/**
 * Format temporal stats for display
 */
export function formatTemporalStats(temporal: TemporalUniqueness) {
  return [
    {
      label: 'Today',
      uniqueness: temporal.today.uniqueness,
      matches: temporal.today.matchCount,
      icon: '📅',
    },
    {
      label: 'This Week',
      uniqueness: temporal.thisWeek.uniqueness,
      matches: temporal.thisWeek.matchCount,
      icon: '📆',
    },
    {
      label: 'This Month',
      uniqueness: temporal.thisMonth.uniqueness,
      matches: temporal.thisMonth.matchCount,
      icon: '🗓️',
    },
    {
      label: 'All Time',
      uniqueness: temporal.allTime.uniqueness,
      matches: temporal.allTime.matchCount,
      icon: '♾️',
    },
  ]
}

