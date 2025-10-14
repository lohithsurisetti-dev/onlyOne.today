/**
 * Query Cache Utility (Open Source, Serverless-Compatible)
 * 
 * Uses Supabase as a distributed cache for expensive queries.
 * Replaces Redis/Upstash with 100% open source solution!
 * 
 * Perfect for:
 * - Expensive aggregations
 * - External API results
 * - Frequently accessed data
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

interface CacheEntry {
  cache_key: string
  cache_value: any
  expires_at: number
}

/**
 * Get a value from the cache
 * Returns null if not found or expired
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const supabase = getSupabaseClient()
    const now = Date.now()
    
    const { data, error } = await supabase
      .from('query_cache')
      .select('cache_value, expires_at')
      .eq('cache_key', key)
      .single()
    
    if (error || !data || now > data.expires_at) {
      return null
    }
    
    return data.cache_value as T
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set a value in the cache with TTL (time to live)
 * @param key - Cache key
 * @param value - Value to cache (will be JSON serialized)
 * @param ttlSeconds - Time to live in seconds
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    
    const { error } = await supabase
      .from('query_cache')
      .upsert({
        cache_key: key,
        cache_value: value,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      })
    
    if (error) {
      console.error('Cache set error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Cache set error:', error)
    return false
  }
}

/**
 * Delete a value from the cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('query_cache')
      .delete()
      .eq('cache_key', key)
    
    if (error) {
      console.error('Cache delete error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Cache delete error:', error)
    return false
  }
}

/**
 * Get or compute a value (with automatic caching)
 * This is the most convenient way to use the cache!
 * 
 * @example
 * const stats = await getCached('stats:today', 60, async () => {
 *   return await expensiveDatabaseQuery()
 * })
 */
export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Cache miss - compute the value
  const value = await computeFn()
  
  // Store in cache (don't await - fire and forget)
  setCache(key, value, ttlSeconds).catch(err => {
    console.error('Failed to cache value:', err)
  })
  
  return value
}

/**
 * Invalidate cache entries by pattern
 * @param pattern - Pattern to match (e.g., 'stats:*')
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    
    // Convert pattern to SQL LIKE pattern
    const likePattern = pattern.replace('*', '%')
    
    const { data, error } = await supabase
      .from('query_cache')
      .delete()
      .like('cache_key', likePattern)
      .select()
    
    if (error) {
      console.error('Cache invalidate error:', error)
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Cache invalidate error:', error)
    return 0
  }
}

/**
 * Cleanup expired cache entries
 * Call this periodically (e.g., in a cron job)
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const supabase = getSupabaseClient()
    const now = Date.now()
    
    const { data, error } = await supabase
      .from('query_cache')
      .delete()
      .lt('expires_at', now)
      .select()
    
    if (error) {
      console.error('Cache cleanup error:', error)
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Cache cleanup error:', error)
    return 0
  }
}

