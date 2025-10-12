import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getGhostPosts } from '@/lib/services/ghost-posts'

// Server-side cache for trending posts (5 minutes)
// We cache a LARGE pool (100 posts) so clients can rotate through them
let cachedTrendingPool: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes (reduced for fresher data)
const POOL_SIZE = 100 // Cache large pool for rotation

/**
 * GET /api/trending - Server-side endpoint for trending data
 * 
 * Smart caching strategy:
 * 1. Server caches 100 posts for 5 minutes
 * 2. Client requests random subset (e.g., 30 posts)
 * 3. Each request = different posts from the pool
 * 4. ?force=true bypasses cache for fresh data
 * 
 * This balances:
 * - API rate limits (cache)
 * - User freshness (rotation + force refresh)
 * - Performance (shared cache)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('force') === 'true'
    const requestedCount = parseInt(searchParams.get('count') || '30')
    
    const now = Date.now()
    const cacheAge = now - cacheTimestamp
    
    // Force refresh bypasses cache
    if (forceRefresh) {
      console.log('🔄 Force refresh requested - fetching fresh data...')
      const ghostPosts = await getGhostPosts(POOL_SIZE)
      
      if (ghostPosts.length > 0) {
        cachedTrendingPool = ghostPosts
        cacheTimestamp = now
        console.log(`✅ Force refresh: cache updated with ${ghostPosts.length} posts`)
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
        forceRefresh: true
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }
    
    // Return random subset from cached pool if still fresh
    if (cachedTrendingPool && cacheAge < CACHE_DURATION) {
      console.log(`📦 Returning random subset from cached pool (${Math.round(cacheAge / 1000)}s old, ${cachedTrendingPool.length} total)`)
      
      // Shuffle and return random subset
      const shuffled = [...cachedTrendingPool].sort(() => Math.random() - 0.5)
      const subset = shuffled.slice(0, requestedCount)
      
      return NextResponse.json({
        success: true,
        count: subset.length,
        poolSize: cachedTrendingPool.length,
        posts: subset,
        cached: true,
        cacheAge: Math.round(cacheAge / 1000)
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      })
    }
    
    // Fetch fresh pool of posts
    console.log('🔄 Fetching fresh trending pool...')
    const ghostPosts = await getGhostPosts(POOL_SIZE)
    
    if (ghostPosts.length > 0) {
      // Update cache
      cachedTrendingPool = ghostPosts
      cacheTimestamp = now
      console.log(`✅ Cache updated with ${ghostPosts.length} posts in pool`)
    }
    
    // Return random subset
    const shuffled = ghostPosts.sort(() => Math.random() - 0.5)
    const subset = shuffled.slice(0, requestedCount)
    
    return NextResponse.json({
      success: true,
      count: subset.length,
      poolSize: ghostPosts.length,
      posts: subset,
      cached: false
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('❌ Error fetching trending data:', error)
    
    // Return cached data as fallback if available
    if (cachedTrendingPool) {
      console.log('⚠️ Using stale cache as fallback')
      const shuffled = [...cachedTrendingPool].sort(() => Math.random() - 0.5)
      const subset = shuffled.slice(0, parseInt(request.nextUrl.searchParams.get('count') || '30'))
      
      return NextResponse.json({
        success: true,
        count: subset.length,
        poolSize: cachedTrendingPool.length,
        posts: subset,
        cached: true,
        stale: true
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trending data',
      posts: []
    }, { status: 500 })
  }
}

