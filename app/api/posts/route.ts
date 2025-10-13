import { NextRequest, NextResponse } from 'next/server'
import { createPost, getRecentPosts } from '@/lib/services/posts'
import { rateLimit, getIP, RateLimitPresets, createRateLimitResponse } from '@/lib/utils/rate-limit'
import { sanitizeContent } from '@/lib/services/moderation'
import { moderateWithOptions, trackModerationResult } from '@/lib/services/moderation-hybrid'
import { validateContentQuality } from '@/lib/services/content-quality'
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
    // 1. Rate limiting
    const ip = getIP(request)
    const rateLimitResult = rateLimit(ip, 'post-creation', RateLimitPresets.POST_CREATION)
    
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

    // Hybrid Content Moderation - Static + AI
    // This catches:
    // 1. Static rules: phone, email, URLs, etc. (fast)
    // 2. AI detection: toxic language, hate speech, etc. (smart)
    const moderationResult = await moderateWithOptions(content, {
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

    // 7. Sanitize content (remove any HTML, extra whitespace, etc.)
    const sanitizedContent = sanitizeInput(sanitizeContent(content))

    // 8. Check content quality (semantic coherence, spam patterns, action validation)
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

    // 9. Validate input type enum
    const inputTypeValidation = validateEnum(inputType, ['action', 'day'], 'inputType')
    if (!inputTypeValidation.valid) {
      return NextResponse.json(
        { error: inputTypeValidation.error },
        { status: 400 }
      )
    }

    // 9. Validate scope enum
    const scopeValidation = validateEnum(scope, ['city', 'state', 'country', 'world'], 'scope')
    if (!scopeValidation.valid) {
      return NextResponse.json(
        { error: scopeValidation.error },
        { status: 400 }
      )
    }
    
    // 10. Validate and sanitize location data
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

    // 11. Create the post with sanitized content and location
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
    // 1. Rate limiting (generous for reads)
    const ip = getIP(request)
    const rateLimitResult = rateLimit(ip, 'feed-read', RateLimitPresets.FEED_READ)
    
    if (!rateLimitResult.success) {
      console.log(`⚠️ Rate limit exceeded for feed read from IP: ${ip}`)
      return createRateLimitResponse(rateLimitResult)
    }
    
    // 2. Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all'
    const limitParam = searchParams.get('limit') || '25'
    const offsetParam = searchParams.get('offset') || '0'
    
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

