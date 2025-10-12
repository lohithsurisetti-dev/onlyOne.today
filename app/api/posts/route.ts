import { NextRequest, NextResponse } from 'next/server'
import { createPost, getRecentPosts } from '@/lib/services/posts'
import { rateLimit, getIP, RateLimitPresets, createRateLimitResponse } from '@/lib/utils/rate-limit'

/**
 * POST /api/posts - Create a new post
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getIP(request)
    const rateLimitResult = rateLimit(ip, 'post-creation', RateLimitPresets.POST_CREATION)
    
    if (!rateLimitResult.success) {
      console.log(`⚠️ Rate limit exceeded for IP: ${ip}`)
      return createRateLimitResponse(rateLimitResult)
    }
    
    const body = await request.json()
    const { content, inputType, scope, locationCity, locationState, locationCountry } = body

    // Validation
    if (!content || content.length < 3 || content.length > 500) {
      return NextResponse.json(
        { error: 'Content must be between 3 and 500 characters' },
        { status: 400 }
      )
    }

    if (!['action', 'day'].includes(inputType)) {
      return NextResponse.json(
        { error: 'Invalid input type' },
        { status: 400 }
      )
    }

    if (!['city', 'state', 'country', 'world'].includes(scope)) {
      return NextResponse.json(
        { error: 'Invalid scope' },
        { status: 400 }
      )
    }

    // Create the post
    const result = await createPost({
      content,
      inputType,
      scope,
      locationCity,
      locationState,
      locationCountry,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/posts - Get recent posts
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (generous for reads)
    const ip = getIP(request)
    const rateLimitResult = rateLimit(ip, 'feed-read', RateLimitPresets.FEED_READ)
    
    if (!rateLimitResult.success) {
      console.log(`⚠️ Rate limit exceeded for feed read from IP: ${ip}`)
      return createRateLimitResponse(rateLimitResult)
    }
    
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') as 'all' | 'unique' | 'common' || 'all'
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = parseInt(searchParams.get('offset') || '0')

    const posts = await getRecentPosts({ filter, limit, offset })

    return NextResponse.json({ posts }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json(
      { error: 'Failed to get posts' },
      { status: 500 }
    )
  }
}

