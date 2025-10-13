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
  // Use signature (sorted stems) for consistent matching
  return hash.signature
}

/**
 * Calculate uniqueness score based on match count
 * Formula: 100 - (match_count * 10), minimum 0
 */
export function calculateUniquenessScore(matchCount: number): number {
  return Math.max(0, 100 - (matchCount * 10))
}

/**
 * Create a new post and find similar posts
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

  // Generate content hash
  const contentHash = generateContentHash(data.content)

  // Find similar posts before inserting
  const similarPosts = await findSimilarPosts({
    contentHash,
    content: data.content,
    scope: data.scope,
    locationCity: data.locationCity,
    locationState: data.locationState,
    locationCountry: data.locationCountry,
  })
  
  const matchCount = similarPosts.length
  const uniquenessScore = calculateUniquenessScore(matchCount)

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

  // Create post matches (if any similar posts found)
  if (similarPosts.length > 0 && post) {
    const matches = similarPosts.map(sp => ({
      post_id: post.id,
      matched_post_id: sp.id,
      similarity_score: sp.similarity_score,
    }))

    await supabase.from('post_matches').insert(matches)
    
    // IMPORTANT: Update uniqueness scores for matching posts
    // HIERARCHY RULE: Only update posts at SAME or HIGHER level (never lower/more specific)
    // Example: World post can update world posts, but NOT city posts
    const scopeHierarchy = { city: 0, state: 1, country: 2, world: 3 }
    const newPostScopeLevel = scopeHierarchy[data.scope]
    
    const postsToUpdate = similarPosts.filter(sp => {
      const similarPostScopeLevel = scopeHierarchy[sp.scope as keyof typeof scopeHierarchy]
      // Only update if similar post is at same or higher (more general) level
      return similarPostScopeLevel >= newPostScopeLevel
    })
    
    if (postsToUpdate.length > 0) {
      console.log(`🔄 Updating ${postsToUpdate.length}/${similarPosts.length} posts (respecting hierarchy)...`)
      
      const adminClient = createAdminClient()
      
      // OPTIMIZATION: Batch update instead of sequential updates (10x faster!)
      // Use Postgres to increment match_count and recalculate uniqueness in a single query
      const postIds = postsToUpdate.map(sp => sp.id)
      
      // Use RPC for atomic batch update with calculation
      // Formula: uniqueness_score = GREATEST(0, 100 - ((match_count + 1) * 10))
      const { error: updateError } = await adminClient
        .rpc('increment_match_counts', {
          post_ids: postIds
        })
      
      if (updateError) {
        console.error('❌ Batch update failed, falling back to individual updates:', updateError)
        
        // Fallback to sequential updates if RPC fails
        for (const similarPost of postsToUpdate) {
          const newMatchCount = (similarPost.match_count || 0) + 1
          const newUniquenessScore = calculateUniquenessScore(newMatchCount)
          
          await adminClient
            .from('posts')
            .update({
              match_count: newMatchCount,
              uniqueness_score: newUniquenessScore,
            })
            .eq('id', similarPost.id)
        }
      }
      
      console.log(`✅ Updated ${postsToUpdate.length} posts (${similarPosts.length - postsToUpdate.length} protected by hierarchy)`)
    } else {
      console.log(`🛡️ All ${similarPosts.length} similar posts protected by hierarchy (lower scope)`)
    }
  }

  return {
    post,
    similarPosts,
    matchCount,
    uniquenessScore,
  }
}

/**
 * Find similar posts based on content hash and scope
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
        0.6
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
      0.6
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
 * Get recent posts for the feed (OPTIMIZED)
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

  // Apply filter
  if (filter === 'unique') {
    query = query.gte('uniqueness_score', 70)
  } else if (filter === 'common') {
    query = query.lt('uniqueness_score', 70)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting recent posts:', error)
    throw new Error('Failed to get posts')
  }

  return data || []
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

