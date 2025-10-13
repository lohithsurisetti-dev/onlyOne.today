/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API endpoints.
 * Uses IP address + endpoint as key.
 * 
 * For production at scale, use Redis or Upstash.
 * For MVP, in-memory is sufficient.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (will reset on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number
  
  /**
   * Time window in seconds
   */
  windowInSeconds: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (e.g., IP address)
 * @param endpoint - API endpoint name
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function rateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  const windowMs = config.windowInSeconds * 1000
  
  // Get or create entry
  let entry = rateLimitStore.get(key)
  
  // Create new entry if doesn't exist or window has passed
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs
    }
    rateLimitStore.set(key, entry)
  }
  
  // Increment counter
  entry.count++
  
  // Check if limit exceeded
  const success = entry.count <= config.limit
  const remaining = Math.max(0, config.limit - entry.count)
  const reset = Math.ceil(entry.resetTime / 1000) // Unix timestamp in seconds
  
  return {
    success,
    limit: config.limit,
    remaining,
    reset
  }
}

/**
 * Get the real IP address from a Next.js request
 * Handles various proxy headers
 */
export function getIP(request: Request): string {
  // Try various headers in order of preference
  const headers = request.headers
  
  // Vercel/Cloudflare
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  // Alternative headers
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback
  return 'unknown'
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  // Relaxed limits for testing
  POST_CREATION: {
    limit: 100, // 100 posts (increased for testing)
    windowInSeconds: 60, // per minute (reduced for testing)
  },
  
  // Moderate limits for reactions
  REACTIONS: {
    limit: 30, // 30 reactions
    windowInSeconds: 60 * 5, // per 5 minutes
  },
  
  // Generous limits for reads
  FEED_READ: {
    limit: 100, // 100 requests
    windowInSeconds: 60 * 5, // per 5 minutes
  },
  
  // Very strict for potential abuse
  SHARE_GENERATION: {
    limit: 20, // 20 shares
    windowInSeconds: 60 * 10, // per 10 minutes
  },
} as const

/**
 * Create a standardized rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again later.`,
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
      },
    }
  )
}

