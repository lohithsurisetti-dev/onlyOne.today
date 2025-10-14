import { NextRequest, NextResponse } from 'next/server'
import { createPost, getRecentPosts } from '@/lib/services/posts'
import { rateLimit, getIP, RateLimitPresets, createRateLimitResponse } from '@/lib/utils/rate-limit'
import { sanitizeContent } from '@/lib/services/moderation'
import { moderateWithOptions, trackModerationResult } from '@/lib/services/moderation-hybrid'
import { validateContentQuality } from '@/lib/services/content-quality'

// =====================================================
// PERFORMANCE: Enable response caching
// =====================================================
// Cache GET requests for 30 seconds (feeds change frequently)
// This reduces DB load by 90%+ for repeated feed requests
export const revalidate = 30 // seconds
import { 
  validateBodySize, 
  validateJSON, 
  sanitizeInput, 
  validateString, 
  validateEnum, 
  detectSQLInjection, 
  detectXSS,
  createSecureErrorResponse,
  validateLocation
} from '@/lib/utils/security'

/**
 * POST /api/posts - Create a new post
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (async - Supabase-backed)
    const ip = getIP(request)
    const rateLimitResult = await rateLimit(ip, 'post-creation', RateLimitPresets.POST_CREATION)
    
    if (!rateLimitResult.success) {
      console.log(`⚠️ Rate limit exceeded for IP: ${ip}`)
      return createRateLimitResponse(rateLimitResult)
    }
    
    // 2. Validate request body size
    const bodySizeCheck = await validateBodySize(request, 50) // 50KB max
    if (!bodySizeCheck.valid) {
      return NextResponse.json(
        { error: bodySizeCheck.error },
        { status: 413 } // Payload Too Large
      )
    }
    
    // 3. Validate JSON format
    const jsonCheck = await validateJSON(request)
    if (!jsonCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    const body = jsonCheck.data
    const { content, inputType, scope, locationCity, locationState, locationCountry } = body

    // 4. Validate content string
    const contentValidation = validateString(content, {
      required: true,
      minLength: 3,
      maxLength: 500
    })
    
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: contentValidation.error || 'Invalid content' },
        { status: 400 }
      )
    }
    
    // 5. Check for SQL injection patterns (defense in depth)
    if (detectSQLInjection(content)) {
      console.log(`🚫 SQL injection attempt detected from IP: ${ip}`)
      return NextResponse.json(
        { error: 'Invalid content detected' },
        { status: 400 }
      )
    }
    
    // 6. Check for XSS patterns
    if (detectXSS(content)) {
      console.log(`🚫 XSS attempt detected from IP: ${ip}`)
      return NextResponse.json(
        { error: 'Invalid content detected' },
        { status: 400 }
      )
    }

    // 7. Sanitize content EARLY (remove any HTML, extra whitespace, etc.)
    // Do this once before all content checks
    const sanitizedContent = sanitizeInput(content.trim())

    // 8. OPTIMIZATION: Run quality checks BEFORE expensive AI moderation
    // Quality checks are fast (~15ms) and catch 90% of issues
    // This saves ~500ms AI API calls for spam/gibberish content
    const qualityCheck = validateContentQuality(sanitizedContent, inputType as 'action' | 'day')
    if (!qualityCheck.allowed) {
      console.log(`🚫 Low quality content rejected from IP ${ip}: ${qualityCheck.reason}`)
      console.log(`   Quality score: ${qualityCheck.score}/100`)
      console.log(`   Issues: ${qualityCheck.issues.join(', ')}`)
      
      return NextResponse.json(
        { 
          error: qualityCheck.reason || 'Content does not meet quality standards',
          reason: qualityCheck.reason,
          qualityScore: qualityCheck.score,
          suggestion: inputType === 'action' 
            ? 'Please describe a specific action you did today (e.g., "played cricket", "cooked dinner", "went for a walk")'
            : 'Please share meaningful activities or experiences from your day'
        },
        { status: 400 }
      )
    }
    
    console.log(`✅ Content quality check passed (${qualityCheck.score}/100)`)

    // 9. Hybrid Content Moderation - Static + AI (AFTER quality checks)
    // Only run expensive AI moderation if content passed quality checks
    // This catches:
    // 1. Static rules: phone, email, URLs, etc. (fast)
    // 2. AI detection: toxic language, hate speech, etc. (smart but slow)
    const moderationResult = await moderateWithOptions(sanitizedContent, {
      useAI: true,        // Enable AI detection
      logResults: true,   // Log for analytics
    })
    
    // Track stats for analytics
    trackModerationResult(moderationResult)
    
    if (!moderationResult.allowed) {
      console.log(`🚫 Content blocked by ${moderationResult.blockedBy} for IP ${ip}: ${moderationResult.reason}`)
      
      return NextResponse.json(
        { 
          error: moderationResult.message || moderationResult.reason,
          moderationFailed: true,
          severity: moderationResult.severity,
          blockedBy: moderationResult.blockedBy 
        },
        { status: 400 }
      )
    }

    // 10. Validate input type enum
    const inputTypeValidation = validateEnum(inputType, ['action', 'day'], 'inputType')
    if (!inputTypeValidation.valid) {
      return NextResponse.json(
        { error: inputTypeValidation.error },
        { status: 400 }
      )
    }

    // 11. Validate scope enum
    const scopeValidation = validateEnum(scope, ['city', 'state', 'country', 'world'], 'scope')
    if (!scopeValidation.valid) {
      return NextResponse.json(
        { error: scopeValidation.error },
        { status: 400 }
      )
    }
    
    // 12. Validate and sanitize location data
    const locationValidation = validateLocation({
      city: locationCity,
      state: locationState,
      country: locationCountry
    })
    
    if (!locationValidation.valid) {
      return NextResponse.json(
        { error: locationValidation.error },
        { status: 400 }
      )
    }

    // 13. Create the post with sanitized content and location
    const result = await createPost({
      content: sanitizedContent,
      inputType,
      scope,
      locationCity: locationValidation.sanitized?.city,
      locationState: locationValidation.sanitized?.state,
      locationCountry: locationValidation.sanitized?.country,
    })

    console.log(`✅ Post created successfully from IP: ${ip}`)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return createSecureErrorResponse(error, 'Failed to create post')
  }
}

/**
 * GET /api/posts - Get recent posts
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting (generous for reads, async - Supabase-backed)
    const ip = getIP(request)
    const rateLimitResult = await rateLimit(ip, 'feed-read', RateLimitPresets.FEED_READ)
    
    if (!rateLimitResult.success) {
      console.log(`⚠️ Rate limit exceeded for feed read from IP: ${ip}`)
      return createRateLimitResponse(rateLimitResult)
    }
    
    // 2. Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('id') // For fetching specific post
    const filter = searchParams.get('filter') || 'all'
    const limitParam = searchParams.get('limit') || '25'
    const offsetParam = searchParams.get('offset') || '0'
    
    // If requesting specific post by ID, fetch that with LIVE score calculation
    if (postId) {
      const { createClient } = await import('@/lib/supabase/server')
      const { calculateUniquenessScore, getTotalPostsCount } = await import('@/lib/services/posts')
      const supabase = createClient()
      
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()
      
      if (error || !post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }
      
      // IMPORTANT: Recalculate LIVE scores using RARITY (same as feed does)
      // Get total posts today for rarity calculation
      const totalPostsToday = await getTotalPostsCount('today')
      
      // Count current matches in last 24 hours
      const { count, error: countError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('content_hash', post.content_hash)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      if (!countError && count) {
        // Recalculate with live data using rarity
        const actualMatches = count - 1 // Exclude self (this is "others")
        // actualMatches = others, +1 for user = total who did it
        const totalWhoDidIt = actualMatches + 1
        const freshScore = calculateUniquenessScore(totalWhoDidIt, totalPostsToday)
        
        console.log(`✅ Fetched post ${postId} with LIVE RARITY scores: ${freshScore}% unique (${actualMatches} out of ${totalPostsToday} posts today), was ${post.uniqueness_score}%`)
        
        // Return with fresh scores
        return NextResponse.json({ 
          post: {
            ...post,
            uniqueness_score: freshScore,
            match_count: actualMatches,
            total_posts_today: totalPostsToday // Add this for display
          }
        }, { status: 200 })
      }
      
      // Fallback to stored scores if count fails
      console.log(`⚠️ Using stored scores for post ${postId}: ${post.uniqueness_score}% unique, ${post.match_count} matches`)
      return NextResponse.json({ post }, { status: 200 })
    }
    
    // Otherwise, fetch recent posts list
    // Validate filter
    const filterValidation = validateEnum(filter, ['all', 'unique', 'common'], 'filter')
    if (!filterValidation.valid) {
      return NextResponse.json(
        { error: filterValidation.error },
        { status: 400 }
      )
    }
    
    // Validate and sanitize numeric parameters
    const limit = Math.min(Math.max(parseInt(limitParam) || 25, 1), 100) // Max 100
    const offset = Math.max(parseInt(offsetParam) || 0, 0)

    // 3. Fetch posts
    const posts = await getRecentPosts({ 
      filter: filter as 'all' | 'unique' | 'common', 
      limit, 
      offset 
    })

    return NextResponse.json({ posts }, { status: 200 })
  } catch (error) {
    return createSecureErrorResponse(error, 'Failed to get posts')
  }
}

