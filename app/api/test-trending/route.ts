import { NextResponse } from 'next/server'
import { getGhostPosts } from '@/lib/services/ghost-posts'
import { getAllTrendingData } from '@/lib/services/trending-data'

/**
 * Test endpoint to preview ghost posts with real trending data
 */
export async function GET() {
  try {
    // Show all available trending data
    const allTrends = await getAllTrendingData()
    const ghostPosts = await getGhostPosts(25) // Get more ghost posts
    
    // Group by source
    const bySource: Record<string, number> = {}
    allTrends.forEach(trend => {
      bySource[trend.source] = (bySource[trend.source] || 0) + 1
    })
    
    return NextResponse.json({
      success: true,
      totalAvailable: allTrends.length,
      sourceBreakdown: bySource,
      count: ghostPosts.length,
      posts: ghostPosts.map(post => ({
        content: post.content,
        source: post.source,
        peopleCount: post.peopleCount.toLocaleString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching ghost posts:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}

