import { NextResponse } from 'next/server'
import { getAllTrendingData } from '@/lib/services/trending-data'

/**
 * GET /api/warmup - Pre-warm trending cache
 * Call this on server startup or via cron job
 */
export async function GET() {
  try {
    console.log('🔥 Warming up trending cache...')
    const start = Date.now()
    
    const trends = await getAllTrendingData()
    
    const duration = Date.now() - start
    
    return NextResponse.json({
      success: true,
      count: trends.length,
      duration: `${duration}ms`,
      message: 'Cache warmed successfully'
    })
  } catch (error) {
    console.error('❌ Warmup failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to warm cache' 
      },
      { status: 500 }
    )
  }
}

