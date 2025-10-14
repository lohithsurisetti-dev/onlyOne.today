import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database'
import { generateDynamicHash, findSimilarInBatch as findSimilarDynamic } from './nlp-dynamic'
import { findSemanticallySimilar, hybridMatch } from './nlp-advanced'

type Post = Database['public']['Tables']['posts']['Row']
type PostInsert = Database['public']['Tables']['posts']['Insert']

// Feature flag for advanced NLP (can be toggled)
const USE_ADVANCED_NLP = process.env.USE_ADVANCED_NLP !== 'false'

/**
 * Generate a normalized content hash from post content
 * Uses dynamic NLP with stemming
 */
export function generateContentHash(content: string): string {
  const hash = generateDynamicHash(content)
  // Use coreAction (top 2 most important stems) for matching
  // This groups temporal variations: "played cricket today" = "played cricket evening"
  return hash.coreAction || hash.signature
}

/**
 * Calculate uniqueness score based on RARITY (what % of people DIDN'T do this)
 * Formula: ((totalPosts - peopleWhoDidIt) / totalPosts) * 100
 * 
 * IMPORTANT: matchCount should be TOTAL people who did it (including the user)
 * 
 * This is intuitive: If 5 out of 100 people did it, you're 95% unique!
 * 
 * Examples:
 * - 1 out of 100 = 99% unique (only you!)
 * - 5 out of 100 = 95% unique (very rare)
 * - 50 out of 100 = 50% unique (half did it)
 * - 95 out of 100 = 5% unique (almost everyone did it)
 * 
 * Edge cases:
 * - totalPosts = 0 → 100% (first post ever)
 * - totalPosts = 1 → 100% (only you)
 * - matchCount >= totalPosts → 0% (everyone did it)
 * 
 * @param totalWhoDidIt - TOTAL people who did this action (including the user!)
 * @param totalPosts - Total posts in the time period
 */
export function calculateUniquenessScore(totalWhoDidIt: number, totalPosts: number): number {
  // Edge case: No posts yet (first post)
  if (totalPosts === 0) {
    return 100
  }
  
  // Edge case: Only this post exists
  if (totalPosts === 1) {
    return 100
  }
  
  // Edge case: Total who did it can't exceed total posts
  const safeTotalWhoDidIt = Math.min(totalWhoDidIt, totalPosts)
  
  // Calculate rarity: what % of people DIDN'T do this
  const peopleWhoDidntDoIt = totalPosts - safeTotalWhoDidIt
  const uniqueness = (peopleWhoDidntDoIt / totalPosts) * 100
  
  // Round to whole number
  return Math.round(Math.max(0, Math.min(100, uniqueness)))
}

/**
 * Get total posts count for calculating rarity-based uniqueness
 * Returns total posts in the relevant scope (today, this week, etc.)
 */
export async function getTotalPostsCount(
  scope: 'today' | 'week' | 'month' | 'all' = 'today',
  location?: {
    city?: string
    state?: string
    country?: string
  }
): Promise<number> {
  const supabase = createClient()
  
  // Calculate time range
  const now = new Date()
  let startDate: Date | null = null
  
  switch (scope) {
    case 'today':
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'all':
      startDate = null // No filter
      break
  }
  
  // Build query
  let query = supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
  
  // Add time filter
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }
  
  // Add location filters if provided
  if (location?.city) {
    query = query.eq('location_city', location.city)
  } else if (location?.state) {
    query = query.eq('location_state', location.state)
  } else if (location?.country) {
    query = query.eq('location_country', location.country)
  }
  // If no location filter, it's "world" scope (all posts)
  
  const { count, error } = await query
  
  if (error) {
    console.error('Error fetching total posts:', error)
    return 1 // Default to 1 to avoid division by zero
  }
  
  return count || 1 // At least 1 (avoid division by zero)
}

/**
 * Get counts for all location levels efficiently
 */
export async function getLocationCounts(
  contentHash: string,
  location: {
    city?: string
    state?: string
    country?: string
  }
): Promise<{
  world_count: number
  city_count: number
  state_count: number
  country_count: number
}> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_location_counts', {
      p_content_hash: contentHash,
      p_city: location.city || '',
      p_state: location.state || '',
      p_country: location.country || ''
    })
    .single()
  
  if (error || !data) {
    return {
      world_count: 0,
      city_count: 0,
      state_count: 0,
      country_count: 0
    }
  }
  
  // Type assertion for RPC result
  const result = data as { world_count?: number; city_count?: number; state_count?: number; country_count?: number }
  
  return {
    world_count: result.world_count || 0,
    city_count: result.city_count || 0,
    state_count: result.state_count || 0,
    country_count: result.country_count || 0
  }
}

/**
 * Calculate hierarchical scores for display
 * Returns the best achievement + secondary context
 */
export interface HierarchicalScore {
  primary: {
    level: 'city' | 'state' | 'country' | 'world'
    score: number
    count: number
    label: string
    icon: string
  }
  secondary: {
    level: 'city' | 'state' | 'country' | 'world'
    score: number
    count: number
    label: string
    icon: string
  }
}

export async function getHierarchicalScores(
  post: {
    content_hash: string
    location_city?: string | null
    location_state?: string | null
    location_country?: string | null
  }
): Promise<HierarchicalScore> {
  // Get counts for all levels
  const counts = await getLocationCounts(post.content_hash, {
    city: post.location_city || undefined,
    state: post.location_state || undefined,
    country: post.location_country || undefined
  })
  
  // Get total posts for each scope (for rarity calculation)
  const [totalWorld, totalCountry, totalState, totalCity] = await Promise.all([
    getTotalPostsCount('today'), // World total
    getTotalPostsCount('today', { country: post.location_country || undefined }),
    getTotalPostsCount('today', { state: post.location_state || undefined }),
    getTotalPostsCount('today', { city: post.location_city || undefined })
  ])
  
  // Calculate scores for each level using rarity
  // Note: counts are "others", so add 1 for total who did it
  const levels = [
    {
      level: 'city' as const,
      score: calculateUniquenessScore(counts.city_count + 1, totalCity),
      count: counts.city_count,
      label: post.location_city || 'City',
      icon: '🏙️'
    },
    {
      level: 'state' as const,
      score: calculateUniquenessScore(counts.state_count + 1, totalState),
      count: counts.state_count,
      label: post.location_state || 'State',
      icon: '🗺️'
    },
    {
      level: 'country' as const,
      score: calculateUniquenessScore(counts.country_count + 1, totalCountry),
      count: counts.country_count,
      label: post.location_country || 'Country',
      icon: '🌍'
    },
    {
      level: 'world' as const,
      score: calculateUniquenessScore(counts.world_count + 1, totalWorld),
      count: counts.world_count,
      label: 'World',
      icon: '🌐'
    }
  ]
  
  // Find best unique score (70%+)
  const uniqueScores = levels
    .filter(l => l.score >= 70)
    .sort((a, b) => b.score - a.score)
  
  if (uniqueScores.length > 0) {
    // Show best unique achievement + next level for context
    const primaryIndex = levels.indexOf(uniqueScores[0])
    const secondary = levels[Math.min(primaryIndex + 1, levels.length - 1)]
    
    return {
      primary: uniqueScores[0],
      secondary
    }
  } else {
    // Nothing unique, show most specific (city) + global context
    return {
      primary: levels[0],
      secondary: levels[3]
    }
  }
}

/**
 * Create a new post with efficient global scoring
 * Uses aggregate table for O(1) lookups
 */
export async function createPost(data: {
  content: string
  inputType: 'action' | 'day'
  scope: 'city' | 'state' | 'country' | 'world'
  locationCity?: string
  locationState?: string
  locationCountry?: string
}) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Generate content hash
  const contentHash = generateContentHash(data.content)

  // Find similar posts GLOBALLY (simplified - no scope filtering)
  const similarPosts = await findSimilarPostsGlobal({
    contentHash,
    content: data.content,
  })

  const matchCount = similarPosts.length
  
  // Get total posts today for rarity calculation
  const totalPostsToday = await getTotalPostsCount('today')
  // matchCount = others who did it, +1 for user = total who did it
  const totalWhoDidIt = matchCount + 1
  const uniquenessScore = calculateUniquenessScore(totalWhoDidIt, totalPostsToday)

  console.log(`📊 Creating post: "${data.content.substring(0, 30)}..." - ${matchCount} out of ${totalPostsToday} posts today did this, ${uniquenessScore}% unique`)

  // Insert the new post
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      content: data.content,
      input_type: data.inputType,
      scope: data.scope,
      location_city: data.locationCity,
      location_state: data.locationState,
      location_country: data.locationCountry,
      content_hash: contentHash,
      uniqueness_score: uniquenessScore,
      match_count: matchCount,
      is_anonymous: true,
    } as PostInsert)
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    throw new Error('Failed to create post')
  }

  // Update aggregate counts table (FAST - single query)
  if (data.locationCity && data.locationState && data.locationCountry) {
    const { error: countError } = await adminClient
      .rpc('increment_content_counts', {
        p_content_hash: contentHash,
        p_city: data.locationCity,
        p_state: data.locationState,
        p_country: data.locationCountry
      })
    
    if (countError) {
      console.error('❌ Failed to update aggregate counts:', countError)
      // Non-critical error, continue
    } else {
      console.log(`✅ Updated aggregate counts for all location levels`)
    }
  }

  // IMPORTANT: Recalculate LIVE score right after insertion
  // Between finding similar posts and now, more posts might have been created
  // This ensures we return the most up-to-date score to the user
  const { count: finalCount, error: recountError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('content_hash', contentHash)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  
  let finalMatchCount = matchCount
  let finalUniquenessScore = uniquenessScore
  let finalTotalPosts = totalPostsToday
  
  if (!recountError && finalCount) {
    // Recalculate with actual current matches
    finalMatchCount = finalCount - 1 // Exclude self (this is "others")
    
    // Get updated total posts (including this new post)
    const updatedTotalPostsToday = await getTotalPostsCount('today')
    // finalMatchCount = others, +1 for user = total who did it
    const totalWhoDidIt = finalMatchCount + 1
    finalUniquenessScore = calculateUniquenessScore(totalWhoDidIt, updatedTotalPostsToday)
    finalTotalPosts = updatedTotalPostsToday
    
    if (finalMatchCount !== matchCount) {
      console.log(`📊 Score updated after insertion: ${matchCount} → ${finalMatchCount} matches out of ${updatedTotalPostsToday} total, ${uniquenessScore}% → ${finalUniquenessScore}%`)
    }
  }

  // Create post matches (if any similar posts found)
  if (similarPosts.length > 0 && post) {
    const matches = similarPosts.map(sp => ({
      post_id: post.id,
      matched_post_id: sp.id,
      similarity_score: sp.similarity_score,
    }))

    await supabase.from('post_matches').insert(matches)
    
    // Update match counts for ALL similar posts (no hierarchy protection)
    const postIds = similarPosts.map(sp => sp.id)
    
    const { error: updateError } = await adminClient
      .rpc('increment_match_counts', {
        post_ids: postIds
      })
    
    if (updateError) {
      console.error('❌ Batch update failed:', updateError)
    } else {
      console.log(`✅ Updated ${postIds.length} matching posts`)
    }
  }

  return {
    post: {
      ...post,
      total_posts_today: finalTotalPosts // Add total for context
    },
    similarPosts,
    matchCount: finalMatchCount,    // Return LIVE count, not initial
    uniquenessScore: finalUniquenessScore, // Return LIVE score, not initial
    totalPostsToday: finalTotalPosts, // For display
  }
}

/**
 * Find similar posts GLOBALLY (simplified, no scope filtering)
 * This is used for creating posts and calculating global uniqueness
 */
export async function findSimilarPostsGlobal(params: {
  contentHash: string
  content: string
  limit?: number
}) {
  const supabase = createClient()
  const { contentHash, content, limit = 20 } = params

  // Get all recent posts from database (NO scope filtering)
  const { data: allPosts, error } = await supabase
    .from('posts')
    .select('id, content, content_hash, uniqueness_score, match_count, scope')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(limit)

  if (error) {
    console.error('Error finding similar posts:', error)
    return []
  }

  if (!allPosts || allPosts.length === 0) {
    return []
  }
  
  // OPTIMIZATION: Quick check for exact hash matches first
  const exactMatches = allPosts.filter(p => p.content_hash === contentHash)
  if (exactMatches.length > 0) {
    console.log(`⚡ Found ${exactMatches.length} exact matches (fast path)`)
    return exactMatches.map(p => ({
      ...p,
      similarity_score: 1.0,
      match_type: 'exact' as const,
    })).slice(0, limit)
  }

  // Use dynamic NLP for similarity matching
  // Threshold 0.75: Catches core action matches (0.85) but not weak partials
  const similarPosts = findSimilarDynamic(
    content,
    allPosts.map(p => ({ id: p.id, content: p.content })),
    0.75 // Raised from 0.6 for tighter matching
  ).map(result => {
    const original = allPosts.find(p => p.id === result.id)!
    return {
      ...original,
      similarity_score: result.similarity,
      match_type: result.similarity >= 0.95 ? 'exact' as const :
                  result.similarity >= 0.85 ? 'core_action' as const :
                  'similar' as const,
    }
  }).slice(0, limit)

  console.log(`🔍 Found ${similarPosts.length} similar posts (threshold: 0.75)`)
  if (similarPosts.length > 0) {
    console.log(`   Core actions: ${similarPosts.filter(p => p.match_type === 'core_action').length}`)
    console.log(`   Exact: ${similarPosts.filter(p => p.match_type === 'exact').length}`)
  }

  return similarPosts
}

/**
 * Find similar posts based on content hash and scope (LEGACY - for compatibility)
 * Now uses fuzzy matching for better results
 */
export async function findSimilarPosts(params: {
  contentHash: string
  content: string
  scope: 'city' | 'state' | 'country' | 'world'
  locationCity?: string
  locationState?: string
  locationCountry?: string
  limit?: number
}) {
  const supabase = createClient()
  const { contentHash, content, scope, locationCity, locationState, locationCountry, limit = 20 } = params // REDUCED: 50→20 for speed

  // Get all recent posts from database based on scope (OPTIMIZED)
  let query = supabase
    .from('posts')
    .select('id, content, content_hash, uniqueness_score, match_count, scope') // Include scope for hierarchy checks
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(limit) // OPTIMIZED: Reduced limit for faster queries

  // Apply HIERARCHICAL scope filters
  // Hierarchy: City → State → Country → World
  // Lower scopes are NOT affected by higher scopes
  // Higher scopes ARE affected by all lower scopes
  
  if (scope === 'city' && locationCity) {
    // City: Only compare with city posts in same city (most protected)
    query = query.eq('scope', 'city').eq('location_city', locationCity)
    console.log(`🔍 City scope: Only comparing with city='${locationCity}'`)
    
  } else if (scope === 'state' && locationState) {
    // State: Compare with state + city posts in that state
    query = query.in('scope', ['state', 'city']).eq('location_state', locationState)
    console.log(`🔍 State scope: Comparing with state + city in '${locationState}'`)
    
  } else if (scope === 'country' && locationCountry) {
    // Country: Compare with country + state + city posts in that country
    query = query.in('scope', ['country', 'state', 'city']).eq('location_country', locationCountry)
    console.log(`🔍 Country scope: Comparing with country + state + city in '${locationCountry}'`)
    
  } else if (scope === 'world') {
    // World: Compare with EVERYTHING (all scopes)
    // No scope filter - sees all posts globally
    console.log(`🔍 World scope: Comparing with ALL posts globally`)
  }

  const { data: allPosts, error } = await query

  if (error) {
    console.error('Error finding similar posts:', error)
    return []
  }

  if (!allPosts || allPosts.length === 0) {
    return []
  }

  // OPTIMIZATION: Quick check for exact hash matches first (avoid expensive NLP)
  const exactMatches = allPosts.filter(p => p.content_hash === contentHash)
  if (exactMatches.length > 0) {
    console.log(`⚡ Found ${exactMatches.length} exact matches (fast path)`)
    return exactMatches.map(p => ({
      ...p,
      similarity_score: 1.0,
      match_type: 'exact' as const,
    })).slice(0, limit)
  }

  // Intelligent similarity matching (client-side) - only if no exact matches
  let similarPosts

  if (USE_ADVANCED_NLP && allPosts.length > 0) {
    try {
      // OPTIMIZATION: Limit AI processing to top 15 candidates for speed
      // More posts = slower AI processing
      const candidatesForAI = allPosts.slice(0, 15)
      
      // Use advanced semantic matching for best accuracy
      const results = await findSemanticallySimilar(
        content,
        candidatesForAI.map(p => ({ id: p.id, content: p.content })),
        0.7 // 70% semantic similarity threshold
      )

      similarPosts = results.map(result => {
        const original = allPosts.find(p => p.id === result.id)!
        return {
          ...original,
          similarity_score: result.similarity,
          match_type: result.similarity >= 0.9 ? 'exact' as const :
                      result.similarity >= 0.8 ? 'high' as const :
                      'similar' as const,
        }
      }).slice(0, limit)
    } catch (error) {
      console.error('Advanced NLP failed, falling back to dynamic matching:', error)
      // Fallback to dynamic NLP
      similarPosts = findSimilarDynamic(
        content,
        allPosts.map(p => ({ id: p.id, content: p.content })),
        0.75 // Raised for tighter matching
      ).map(result => {
        const original = allPosts.find(p => p.id === result.id)!
        return {
          ...original,
          similarity_score: result.similarity,
          match_type: result.similarity >= 0.9 ? 'exact' as const :
                      result.similarity >= 0.75 ? 'high' as const :
                      'similar' as const,
        }
      }).slice(0, limit)
    }
  } else {
    // Use fast dynamic matching
    similarPosts = findSimilarDynamic(
      content,
      allPosts.map(p => ({ id: p.id, content: p.content })),
      0.75 // Raised for tighter matching
    ).map(result => {
      const original = allPosts.find(p => p.id === result.id)!
      return {
        ...original,
        similarity_score: result.similarity,
        match_type: result.similarity >= 0.9 ? 'exact' as const :
                    result.similarity >= 0.75 ? 'high' as const :
                    'similar' as const,
      }
    }).slice(0, limit)
  }

  return similarPosts
}

/**
 * Get recent posts for the feed with REAL-TIME score calculation
 */
export async function getRecentPosts(params: {
  filter?: 'all' | 'unique' | 'common'
  limit?: number
  offset?: number
}) {
  const supabase = createClient()
  const { filter = 'all', limit = 25, offset = 0 } = params

  let query = supabase
    .from('posts')
    .select('id, content, input_type, scope, location_city, location_state, location_country, uniqueness_score, match_count, funny_count, creative_count, must_try_count, total_reactions, created_at, content_hash')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    .limit(limit) // Explicit limit for speed

  // Note: We'll recalculate scores after fetching, so filter is applied post-processing
  const { data, error } = await query

  if (error) {
    console.error('Error getting recent posts:', error)
    throw new Error('Failed to get posts')
  }

  if (!data || data.length === 0) {
    return []
  }

  // Get total posts today once (for rarity calculation)
  const totalPostsToday = await getTotalPostsCount('today')
  
  // REAL-TIME SCORE CALCULATION:
  // Recalculate scores based on CURRENT matches (not frozen scores)
  const postsWithFreshScores = await Promise.all(
    data.map(async (post) => {
      // Count how many posts have the same content_hash (globally)
      const { count, error: countError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('content_hash', post.content_hash)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (countError) {
        console.error('Error counting matches:', countError)
        return post // Return original if count fails
      }

      // Calculate fresh score based on RARITY
      // Subtract 1 because count includes the post itself (actualMatches = "others")
      const actualMatches = (count || 1) - 1
      // actualMatches = others, +1 for user = total who did it
      const totalWhoDidIt = actualMatches + 1
      const freshScore = calculateUniquenessScore(totalWhoDidIt, totalPostsToday)

      return {
        ...post,
        match_count: actualMatches,
        uniqueness_score: freshScore
      }
    })
  )

  // Apply filter AFTER recalculation
  let filteredPosts = postsWithFreshScores
  if (filter === 'unique') {
    filteredPosts = postsWithFreshScores.filter(p => p.uniqueness_score >= 70)
  } else if (filter === 'common') {
    filteredPosts = postsWithFreshScores.filter(p => p.uniqueness_score < 70)
  }

  return filteredPosts
}

/**
 * Get a single post by ID
 */
export async function getPostById(postId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) {
    console.error('Error getting post:', error)
    throw new Error('Failed to get post')
  }

  return data
}

/**
 * Get trending content hashes (most common activities today)
 */
export async function getTrendingContentHashes(limit: number = 10) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('content_hash, content')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('match_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error getting trending hashes:', error)
    return []
  }

  // Group by content_hash and count occurrences
  const hashCounts = (data || []).reduce((acc, post) => {
    acc[post.content_hash] = (acc[post.content_hash] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(hashCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([hash, count]) => ({ hash, count }))
}

