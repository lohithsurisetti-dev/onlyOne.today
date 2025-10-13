import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/stats/timezones - Get global timezone activity breakdown
 * Shows which timezones are most active right now
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Define major timezones to track
    const timezones = [
      { name: 'America/New_York', label: 'NYC', offset: 300, emoji: '🗽' },      // UTC-5
      { name: 'America/Los_Angeles', label: 'LA', offset: 480, emoji: '🌴' },   // UTC-8
      { name: 'Europe/London', label: 'London', offset: 0, emoji: '🇬🇧' },     // UTC+0
      { name: 'Europe/Paris', label: 'Paris', offset: -60, emoji: '🇫🇷' },     // UTC+1
      { name: 'Asia/Tokyo', label: 'Tokyo', offset: -540, emoji: '🇯🇵' },      // UTC+9
      { name: 'Asia/Dubai', label: 'Dubai', offset: -240, emoji: '🇦🇪' },      // UTC+4
      { name: 'Australia/Sydney', label: 'Sydney', offset: -660, emoji: '🇦🇺' }, // UTC+11
      { name: 'Asia/Kolkata', label: 'India', offset: -330, emoji: '🇮🇳' },    // UTC+5:30
    ]
    
    // Get post counts for each timezone's "today"
    const timezoneStats = await Promise.all(
      timezones.map(async (tz) => {
        // Calculate midnight in this timezone
        const now = new Date()
        const userNow = new Date(now.getTime() - (tz.offset * 60 * 1000))
        const userToday = new Date(Date.UTC(
          userNow.getUTCFullYear(),
          userNow.getUTCMonth(),
          userNow.getUTCDate(),
          0, 0, 0, 0
        ))
        const todayISO = new Date(userToday.getTime() + (tz.offset * 60 * 1000)).toISOString()
        
        // Count posts since this timezone's midnight
        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayISO)
        
        if (error) {
          console.error(`Error fetching stats for ${tz.name}:`, error)
        }
        
        return {
          timezone: tz.name,
          label: tz.label,
          emoji: tz.emoji,
          offset: tz.offset,
          postsToday: count || 0,
          localTime: new Date(now.getTime() - (tz.offset * 60 * 1000)).toLocaleTimeString('en-US', {
            timeZone: tz.name,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        }
      })
    )
    
    // Sort by most active
    timezoneStats.sort((a, b) => b.postsToday - a.postsToday)
    
    return NextResponse.json({
      timezones: timezoneStats,
      mostActive: timezoneStats[0],
      totalGlobal: timezoneStats.reduce((sum, tz) => sum + tz.postsToday, 0)
    })
  } catch (error) {
    console.error('Error in GET /api/stats/timezones:', error)
    return NextResponse.json(
      { error: 'Failed to get timezone stats' },
      { status: 500 }
    )
  }
}

