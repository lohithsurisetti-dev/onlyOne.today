/**
 * Rate Limiting Utility (Serverless-Compatible)
 * 
 * Uses Supabase as a distributed rate limit store.
 * Works across all Vercel serverless function instances.
 * 
 * 100% open source - no Redis/Upstash needed!
 */

import { createClient } from '@supabase/supabase-js'

interface RateLimitEntry {
  id: string
  count: number
  reset_time: number
  updated_at?: string
}

// Initialize Supabase client for rate limiting
// Using anon key is fine - we have RLS policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

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
 * Check if a request should be rate limited (ASYNC - Serverless Compatible)
 * 
 * @param identifier - Unique identifier (e.g., IP address)
 * @param endpoint - API endpoint name
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export async function rateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = getSupabaseClient()
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  const windowMs = config.windowInSeconds * 1000
  const resetTime = now + windowMs
  
  try {
    // Try to get existing entry
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('id', key)
      .single()
    
    let entry: RateLimitEntry
    
    // Cast to unknown first to avoid TypeScript errors with dynamic schemas
    const existingData = existing as unknown as RateLimitEntry | null
    
    if (fetchError || !existingData || now > existingData.reset_time) {
      // Create or reset entry
      const { data: newEntry, error: upsertError } = await supabase
        .from('rate_limits')
        .upsert({
          id: key,
          count: 1,
          reset_time: resetTime,
          updated_at: new Date().toISOString()
        } as any, {
          onConflict: 'id'
        })
        .select()
        .single()
      
      if (upsertError) {
        console.error('Rate limit upsert error:', upsertError)
        // Fail open - allow request if DB error
        return {
          success: true,
          limit: config.limit,
          remaining: config.limit - 1,
          reset: Math.ceil(resetTime / 1000)
        }
      }
      
      entry = newEntry as unknown as RateLimitEntry
    } else {
      // Increment existing counter
      const newCount = existingData.count + 1
      
      const { data: updated, error: updateError } = await (supabase
        .from('rate_limits') as any)
        .update({ 
          count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', key)
        .select()
        .single()
      
      if (updateError) {
        console.error('Rate limit update error:', updateError)
        // Fail open
        return {
          success: true,
          limit: config.limit,
          remaining: config.limit - 1,
          reset: Math.ceil(existingData.reset_time / 1000)
        }
      }
      
      entry = updated as unknown as RateLimitEntry
    }
    
    // Check if limit exceeded
    const success = entry.count <= config.limit
    const remaining = Math.max(0, config.limit - entry.count)
    const reset = Math.ceil(entry.reset_time / 1000)
    
    return {
      success,
      limit: config.limit,
      remaining,
      reset
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if error
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil(resetTime / 1000)
    }
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

