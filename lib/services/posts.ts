import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database'
import { generateDynamicHash, findSimilarInBatch as findSimilarDynamic } from './nlp-dynamic'
import { findSemanticallySimilar, hybridMatch } from './nlp-advanced'
import { generateEmbedding } from './embeddings'

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
 * Calculate uniqueness score based on ACTION RARITY within scope
 * Formula: 100 - (matchCount * 10), minimum 0
 * 
 * This is ACTION-BASED, not population-based!
 * Focuses on how many OTHERS did the same action in your scope.
 * 
 * Examples:
 * - 0 others = 100% unique (only you in scope!)
 * - 1 other = 90% unique (very rare)
 * - 2 others = 80% unique (rare)
 * - 5 others = 50% unique (medium)
 * - 10+ others = 0% unique (very common)
 * 
 * @param matchCount - Number of OTHERS who did this (excluding you!)
 */
export function calculateUniquenessScore(matchCount: number): number {
  return Math.max(0, 100 - (matchCount * 10))
}

/**
 * Get the start of today (midnight) in ISO format
 * Ensures consistent "today" definition across the app
 */
export function getTodayStart(): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

/**
 * Apply scope-aware filtering to a Supabase query
 * 
 * CORRECT HIERARCHY:
 * - City posts compete only with city posts in that city
 * - State posts see: cities in state + other state posts
 * - Country posts see: cities + states + countries in that country
 * - World posts see: EVERYTHING
 * 
 * KEY: Lower scope posts don't "bubble up" to broader scopes automatically
 * Only the BROADER scope claims look downward!
 */
export function applyScopeFilter(
  query: any,
  userScope: 'city' | 'state' | 'country' | 'world',
  location?: {
    city?: string
    state?: string
    country?: string
  }
) {
  if (userScope === 'world') {
    // World scope: Match ALL posts everywhere (no filter)
    return query
  }
  
  if (userScope === 'country' && location?.country) {
    // Country scope: Match posts at ANY level in this country
    // Uses OR logic: (city in country) OR (state in country) OR (country-level)
    return query
      .eq('location_country', location.country)
      .in('scope', ['city', 'state', 'country']) // Exclude world posts
  }
  
  if (userScope === 'state' && location?.state) {
    // State scope: Match city posts in state + state posts
    return query
      .eq('location_state', location.state)
      .in('scope', ['city', 'state']) // Exclude country/world
  }
  
  if (userScope === 'city' && location?.city) {
    // City scope: Match ONLY city posts in this city
    return query
      .eq('scope', 'city')
      .eq('location_city', location.city)
  }
  
  // Fallback: no additional filter (acts like world)
  return query
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
  
  // Calculate scores for each level (ACTION-BASED)
  // counts represent "others", score based on that
  const levels = [
    {
      level: 'city' as const,
      score: calculateUniquenessScore(counts.city_count),
      count: counts.city_count,
      label: post.location_city || 'City',
      icon: '🏙️'
    },
    {
      level: 'state' as const,
      score: calculateUniquenessScore(counts.state_count),
      count: counts.state_count,
      label: post.location_state || 'State',
      icon: '🗺️'
    },
    {
      level: 'country' as const,
      score: calculateUniquenessScore(counts.country_count),
      count: counts.country_count,
      label: post.location_country || 'Country',
      icon: '🌍'
    },
    {
      level: 'world' as const,
      score: calculateUniquenessScore(counts.world_count),
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

  // Find similar posts with SCOPE-AWARE matching
  const similarPosts = await findSimilarPostsGlobal({
    contentHash,
    content: data.content,
    scope: data.scope,
    location: {
      city: data.locationCity,
      state: data.locationState,
      country: data.locationCountry
    }
  })
  
  const matchCount = similarPosts.length // This is "others" who did it in scope
  const uniquenessScore = calculateUniquenessScore(matchCount)

  console.log(`📊 Creating post: "${data.content.substring(0, 30)}..." - ${matchCount} others in ${data.scope} did this, ${uniquenessScore}% unique`)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GENERATE EMBEDDING (Lazy: only if there are potential matches OR for quality)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let embedding: number[] | null = null
  
  // OPTIMIZATION: Lazy embedding generation
  // Only generate if initial search found potential matches
  // This saves ~70% of storage (most posts are unique!)
  const shouldGenerateEmbedding = matchCount > 0 || data.content.length > 20
  
  if (shouldGenerateEmbedding) {
    try {
      console.log('🔮 Generating embedding vector...')
      const start = Date.now()
      embedding = await generateEmbedding(data.content)
      const duration = Date.now() - start
      console.log(`✅ Embedding generated in ${duration}ms (384 dimensions)`)
    } catch (error) {
      console.error('⚠️ Embedding generation failed (will use NLP fallback):', error)
      // Continue without embedding - NLP fallback will work
    }
  } else {
    console.log('ℹ️ Skipping embedding (no initial matches - truly unique!)')
  }

  // Insert the new post with embedding
  const insertData = {
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
    embedding: embedding, // Pass array directly, Supabase will handle vector type
  }
  
  console.log(`🔍 Inserting post with embedding: ${embedding ? 'YES' : 'NO'}`)
  
  const { data: post, error } = await supabase
    .from('posts')
    .insert(insertData as any)
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating post:', error)
    throw new Error('Failed to create post')
  }
  
  console.log(`✅ Post inserted with ID: ${post?.id}, embedding saved: ${post?.embedding ? 'YES' : 'NO'}`)

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

  // IMPORTANT: Recalculate LIVE score right after insertion (scope-aware)
  // Between finding similar posts and now, more posts might have been created
  let countQuery = supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('content_hash', contentHash)
    .gte('created_at', getTodayStart())
  
  // Apply same scope filter as initial search
  countQuery = applyScopeFilter(countQuery, data.scope, {
    city: data.locationCity,
    state: data.locationState,
    country: data.locationCountry
  })
  
  const { count: finalCount, error: recountError } = await countQuery
  
  let finalMatchCount = matchCount
  let finalUniquenessScore = uniquenessScore
  
  if (!recountError && finalCount) {
    // Recalculate with actual current matches in scope
    finalMatchCount = finalCount - 1 // Exclude self (this is "others" in scope)
    finalUniquenessScore = calculateUniquenessScore(finalMatchCount)
    
    if (finalMatchCount !== matchCount) {
      console.log(`📊 Score updated after insertion: ${matchCount} → ${finalMatchCount} others in ${data.scope}, ${uniquenessScore}% → ${finalUniquenessScore}%`)
    }
  }

  // Create post matches (if any similar posts found)
  if (similarPosts.length > 0 && post) {
    const matches = similarPosts.map((sp: any) => ({
      post_id: post.id,
      matched_post_id: sp.id,
      similarity_score: sp.similarity_score,
    }))

    await supabase.from('post_matches').insert(matches)
    
    // Update match counts for ALL similar posts (no hierarchy protection)
    const postIds = similarPosts.map((sp: any) => sp.id)
    
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
    post,
    similarPosts,
    matchCount: finalMatchCount,    // Return LIVE count (others in scope)
    uniquenessScore: finalUniquenessScore, // Return LIVE score
  }
}

/**
 * Find similar posts with VECTOR EMBEDDINGS + SCOPE-AWARE matching
 * 
 * PRIMARY: Vector similarity (semantic, typo-resistant, anti-gaming)
 * FALLBACK: Traditional NLP (if embeddings fail)
 * 
 * Implements hierarchy: World includes all, City only includes that city
 */
export async function findSimilarPostsGlobal(params: {
  contentHash: string
  content: string
  scope?: 'city' | 'state' | 'country' | 'world'
  location?: {
    city?: string
    state?: string
    country?: string
  }
  limit?: number
  useEmbeddings?: boolean
}) {
  const supabase = createClient()
  const { contentHash, content, scope = 'world', location, limit = 20, useEmbeddings = true } = params

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // METHOD 1: VECTOR EMBEDDINGS (Semantic Similarity)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (useEmbeddings) {
    try {
      console.log('🔮 Using vector embeddings for similarity search...')
      
      // Generate embedding for user's content
      const queryEmbedding = await generateEmbedding(content)
      
      // Call RPC function for vector similarity search
      const { data: vectorMatches, error: rpcError } = await supabase.rpc(
        'match_posts_by_embedding',
        {
          query_embedding: queryEmbedding as any,
          match_threshold: 0.90, // 90% similarity = same action
          match_limit: limit,
          scope_filter: scope,
          filter_city: location?.city || null,
          filter_state: location?.state || null,
          filter_country: location?.country || null,
          today_only: true
        }
      )
      
      // Log RPC response for debugging
      if (rpcError) {
        console.error('⚠️ Vector search RPC error:', rpcError)
      } else {
        console.log(`📊 Vector search returned ${vectorMatches?.length || 0} results`)
      }
      
      if (!rpcError && vectorMatches && vectorMatches.length > 0) {
        console.log(`✨ Vector search found ${vectorMatches.length} semantic matches (avg similarity: ${(vectorMatches.reduce((acc: number, p: any) => acc + p.similarity, 0) / vectorMatches.length).toFixed(2)})`)
        
        return vectorMatches.map((p: any) => ({
          id: p.id,
          content: p.content,
          content_hash: p.content_hash,
          scope: p.scope,
          location_city: p.location_city,
          location_state: p.location_state,
          location_country: p.location_country,
          similarity_score: p.similarity,
          match_type: p.similarity >= 0.98 ? 'exact' as const :
                      p.similarity >= 0.93 ? 'core_action' as const :
                      'similar' as const,
        }))
      }
      
      console.log('ℹ️ No vector matches found, falling back to NLP...')
    } catch (error) {
      console.error('⚠️ Vector search failed, falling back to NLP:', error)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // METHOD 2: TRADITIONAL NLP (Fallback)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('🔍 Using traditional NLP for similarity search...')
  
  // Get posts from database with SCOPE-AWARE filtering
  let query = supabase
    .from('posts')
    .select('id, content, content_hash, uniqueness_score, match_count, scope, location_city, location_state, location_country')
    .gte('created_at', getTodayStart()) // Today only
    .limit(limit)
  
  // Apply scope filter
  query = applyScopeFilter(query, scope, location)
  
  const { data: allPosts, error } = await query

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

  console.log(`🔍 NLP found ${similarPosts.length} similar posts (threshold: 0.75)`)
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
    .gte('created_at', getTodayStart()) // TODAY ONLY (calendar day)
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

  // REAL-TIME SCORE CALCULATION (SCOPE-AWARE):
  // Recalculate scores based on CURRENT matches in EACH post's scope
  // Note: Posts were matched using vector embeddings during creation (if available)
  // This recount ensures scores are always current
  const postsWithFreshScores = await Promise.all(
    data.map(async (post) => {
      // Build scope-aware count query for THIS post's scope
      let countQuery = supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('content_hash', post.content_hash)
        .gte('created_at', getTodayStart())
      
      // Apply scope filter based on THIS post's scope
      countQuery = applyScopeFilter(countQuery, post.scope as any, {
        city: post.location_city || undefined,
        state: post.location_state || undefined,
        country: post.location_country || undefined
      })
      
      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('Error counting matches:', countError)
        return post // Return original if count fails
      }

      // Calculate fresh score (ACTION-BASED)
      // Subtract 1 because count includes the post itself
      const actualMatches = (count || 1) - 1 // This is "others" in scope
      const freshScore = calculateUniquenessScore(actualMatches)

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

