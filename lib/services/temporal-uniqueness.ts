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
 */
export async function calculateTemporalUniqueness(
  contentHash: string,
  content: string
): Promise<TemporalUniqueness> {
  const supabase = createClient()
  const now = new Date()
  
  // Define time windows
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Fetch posts for each time window
  const [todayResult, weekResult, monthResult, allTimeResult] = await Promise.all([
    // Today
    supabase
      .from('posts')
      .select('id, content_hash')
      .gte('created_at', oneDayAgo.toISOString()),
    
    // This Week
    supabase
      .from('posts')
      .select('id, content_hash')
      .gte('created_at', oneWeekAgo.toISOString()),
    
    // This Month
    supabase
      .from('posts')
      .select('id, content_hash')
      .gte('created_at', oneMonthAgo.toISOString()),
    
    // All Time
    supabase
      .from('posts')
      .select('id, content_hash'),
  ])
  
  // Calculate uniqueness for each period
  const calculateForPeriod = (posts: any[] | null) => {
    if (!posts || posts.length === 0) {
      return { uniqueness: 100, matchCount: 0, totalPosts: 0 }
    }
    
    const matchCount = posts.filter(p => p.content_hash === contentHash).length - 1 // Exclude self
    const totalPosts = posts.length
    const uniqueness = Math.max(0, 100 - ((matchCount / totalPosts) * 100))
    
    return { uniqueness: Math.round(uniqueness), matchCount, totalPosts }
  }
  
  const today = calculateForPeriod(todayResult.data)
  const thisWeek = calculateForPeriod(weekResult.data)
  const thisMonth = calculateForPeriod(monthResult.data)
  const allTime = calculateForPeriod(allTimeResult.data)
  
  // Determine trend
  let trend: 'rising' | 'falling' | 'stable' = 'stable'
  
  if (allTime.matchCount > thisMonth.matchCount * 2) {
    trend = 'rising' // Getting more common over time
  } else if (thisMonth.matchCount > allTime.matchCount * 0.5) {
    trend = 'falling' // Getting less common
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
    return `This is becoming a thing! ${allTime.matchCount} people have done this. You're early to the trend. 📈`
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
    return `A timeless classic. ${allTime.matchCount}+ people have done this. You're in good company. 🤝`
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

