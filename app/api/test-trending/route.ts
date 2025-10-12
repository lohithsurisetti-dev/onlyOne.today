import { NextResponse } from 'next/server'
import { getGhostPosts } from '@/lib/services/ghost-posts'

/**
 * Test endpoint to preview ghost posts with real trending data
 */
export async function GET() {
  try {
    const ghostPosts = await getGhostPosts(10)
    
    return NextResponse.json({
      success: true,
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

