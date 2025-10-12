import { NextRequest, NextResponse } from 'next/server'
import { refreshTrendingData } from '@/lib/services/trending'

/**
 * GET /api/cron/trending - Refresh trending data
 * 
 * This endpoint should be called periodically (e.g., every hour) by a cron job.
 * You can use Vercel Cron Jobs or an external service like cron-job.org
 * 
 * Example Vercel cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/trending",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Refresh trending data
    await refreshTrendingData()

    return NextResponse.json(
      { success: true, message: 'Trending data refreshed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      { error: 'Failed to refresh trending data' },
      { status: 500 }
    )
  }
}

