import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getGhostPosts } from '@/lib/services/ghost-posts'
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/utils/redis'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Constants
const POOL_SIZE = 100 // Cache large pool for rotation

/**
 * GET /api/trending - Server-side endpoint for trending data
 * 
 * Redis-backed caching strategy:
 * 1. Redis caches 100 posts for 5 minutes
 * 2. Client requests random subset (e.g., 30 posts)
 * 3. Each request = different posts from the pool
 * 4. ?force=true bypasses cache for fresh data
 * 
 * This balances:
 * - API rate limits (Redis cache)
 * - User freshness (rotation + force refresh)
 * - Performance (distributed cache)
 * - Serverless compatibility (no in-memory cache)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const forceRefresh = searchParams.get('force') === 'true'
  const requestedCount = parseInt(searchParams.get('count') || '30')
  
  try {
    
    // Force refresh bypasses cache
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - fetching fresh data...')
      const ghostPosts = await getGhostPosts(POOL_SIZE)
      
      if (ghostPosts.length > 0) {
        // Store in Redis cache
        await cacheSet(CacheKeys.TRENDING_POSTS, ghostPosts, CacheTTL.TRENDING_POSTS)
        console.log(`✅ Force refresh: Redis cache updated with ${ghostPosts.length} posts`)
      }
      
      // Return random subset
      const shuffled = ghostPosts.sort(() => Math.random() - 0.5)
      const subset = shuffled.slice(0, requestedCount)
      
      return NextResponse.json({
        success: true,
        count: subset.length,
        poolSize: ghostPosts.length,
        posts: subset,
        cached: false,
        forceRefresh: true,
        cacheSource: 'fresh'
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }
    
    // Try to get from Redis cache
    const cachedPool = await cacheGet<any[]>(CacheKeys.TRENDING_POSTS)
    
    // Return random subset from cached pool if available
    if (cachedPool && cachedPool.length > 0) {
      console.log(`📦 Redis cache HIT - returning random subset (${cachedPool.length} posts in pool)`)
      
      // Shuffle and return random subset
      const shuffled = [...cachedPool].sort(() => Math.random() - 0.5)
      const subset = shuffled.slice(0, requestedCount)
      
      return NextResponse.json({
        success: true,
        count: subset.length,
        poolSize: cachedPool.length,
        posts: subset,
        cached: true,
        cacheSource: 'redis'
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60' // Client can cache for 1 min
        }
      })
    }
    
    // Cache miss - fetch fresh data
    console.log('⏰ Redis cache MISS - fetching fresh trending data...')
    const ghostPosts = await getGhostPosts(POOL_SIZE)
    
    if (ghostPosts.length > 0) {
      // Update Redis cache
      await cacheSet(CacheKeys.TRENDING_POSTS, ghostPosts, CacheTTL.TRENDING_POSTS)
      console.log(`✅ Redis cache updated with ${ghostPosts.length} posts in pool`)
    }
    
    // Return random subset
    const shuffled = ghostPosts.sort(() => Math.random() - 0.5)
    const subset = shuffled.slice(0, requestedCount)
    
    return NextResponse.json({
      success: true,
      count: subset.length,
      poolSize: ghostPosts.length,
      posts: subset,
      cached: false,
      cacheSource: 'fresh'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch (error) {
    console.error('❌ Error fetching trending data:', error)
    
    // Try to return cached data as fallback
    try {
      const cachedPool = await cacheGet<any[]>(CacheKeys.TRENDING_POSTS)
      if (cachedPool && cachedPool.length > 0) {
        console.log('⚠️ Using stale Redis cache as fallback')
        const shuffled = [...cachedPool].sort(() => Math.random() - 0.5)
        const subset = shuffled.slice(0, requestedCount)
        
        return NextResponse.json({
          success: true,
          count: subset.length,
          poolSize: cachedPool.length,
          posts: subset,
          cached: true,
          stale: true,
          cacheSource: 'redis-fallback'
        })
      }
    } catch (cacheError) {
      console.error('❌ Failed to get fallback cache:', cacheError)
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trending data',
      posts: [],
      count: 0
    }, { status: 500 })
  }
}
