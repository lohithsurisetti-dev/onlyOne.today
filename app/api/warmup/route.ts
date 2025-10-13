import { NextResponse } from 'next/server'
import { getAllTrendingData } from '@/lib/services/trending-data'
import { initEmbeddingModel } from '@/lib/services/nlp-advanced'

/**
 * GET /api/warmup - Pre-warm trending cache + AI model
 * Call this on server startup or via cron job
 * OPTIMIZATION: Preloads AI model for faster first post
 */
export async function GET() {
  try {
    console.log('🔥 Warming up caches and AI model...')
    const start = Date.now()
    
    // Preload AI model in background (don't block response)
    initEmbeddingModel().then(() => {
      console.log('✅ AI model preloaded successfully')
    }).catch(err => {
      console.error('⚠️ AI model preload failed (non-critical):', err)
    })
    
    // Warm trending cache
    const trends = await getAllTrendingData()
    
    const duration = Date.now() - start
    
    return NextResponse.json({
      success: true,
      count: trends.length,
      duration: `${duration}ms`,
      message: 'Trending cache warmed, AI model preloading',
      aiModelPreloading: true
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

