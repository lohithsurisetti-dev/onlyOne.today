import { createClient } from '@/lib/supabase/client'

export type ReactionType = 'funny' | 'creative' | 'must_try'

export interface PostReaction {
  id: string
  post_id: string
  reaction_type: ReactionType
  session_id: string
  created_at: string
}

export interface PostWithReactions {
  id: string
  content: string
  funny_count: number
  creative_count: number
  must_try_count: number
  total_reactions: number
}

/**
 * Generate a session ID for anonymous reactions
 * Uses browser's sessionStorage or creates a new one
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  
  let sessionId = sessionStorage.getItem('onlyone_session_id')
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem('onlyone_session_id', sessionId)
  }
  
  return sessionId
}

/**
 * Add a reaction to a post
 */
export async function addReaction(
  postId: string,
  reactionType: ReactionType
): Promise<{ success: boolean; toggled?: boolean; error?: string }> {
  const supabase = createClient()
  const sessionId = getSessionId()

  // Check if user already reacted
  const { data: existing } = await supabase
    .from('post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('session_id', sessionId)
    .eq('reaction_type', reactionType)
    .single()

  if (existing) {
    // Remove reaction (toggle off)
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('id', existing.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Manually decrement the count
    const countField = `${reactionType}_count`
    
    const { data: postData } = await supabase
      .from('posts')
      .select(`${countField}, total_reactions`)
      .eq('id', postId)
      .single()
    
    if (postData) {
      const updates: any = {
        total_reactions: Math.max(0, ((postData as any).total_reactions || 0) - 1)
      }
      updates[countField] = Math.max(0, ((postData as any)[countField] || 0) - 1)
      
      await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
      
      console.log('✅ Reaction count decremented:', updates)
    }

    return { success: true, toggled: true }
  }

  // Add new reaction
  const { error } = await supabase
    .from('post_reactions')
    .insert({
      post_id: postId,
      reaction_type: reactionType,
      session_id: sessionId,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Manually update the count on posts table
  const countField = `${reactionType}_count`
  
  // Get current post data
  const { data: postData } = await supabase
    .from('posts')
    .select(`${countField}, total_reactions`)
    .eq('id', postId)
    .single()
  
  if (postData) {
    const updates: any = {
      total_reactions: ((postData as any).total_reactions || 0) + 1
    }
    updates[countField] = ((postData as any)[countField] || 0) + 1
    
    await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
    
    console.log('✅ Reaction count incremented:', updates)
  }

  return { success: true, toggled: false }
}

/**
 * Get user's reactions for multiple posts
 */
export async function getUserReactions(
  postIds: string[]
): Promise<Map<string, Set<ReactionType>>> {
  const supabase = createClient()
  const sessionId = getSessionId()

  const { data, error } = await supabase
    .from('post_reactions')
    .select('post_id, reaction_type')
    .in('post_id', postIds)
    .eq('session_id', sessionId)

  if (error || !data) {
    return new Map()
  }

  const reactionsMap = new Map<string, Set<ReactionType>>()

  data.forEach(reaction => {
    if (!reactionsMap.has(reaction.post_id)) {
      reactionsMap.set(reaction.post_id, new Set())
    }
    reactionsMap.get(reaction.post_id)!.add(reaction.reaction_type as ReactionType)
  })

  return reactionsMap
}

/**
 * Get posts filtered by reaction type
 */
export async function getTopReactionPosts(
  reactionType: ReactionType,
  limit: number = 25
): Promise<PostWithReactions[]> {
  const supabase = createClient()

  let orderColumn = 'total_reactions'
  if (reactionType === 'funny') orderColumn = 'funny_count'
  else if (reactionType === 'creative') orderColumn = 'creative_count'
  else if (reactionType === 'must_try') orderColumn = 'must_try_count'

  const { data, error } = await supabase
    .from('posts')
    .select('id, content, input_type, scope, uniqueness_score, funny_count, creative_count, must_try_count, total_reactions, created_at')
    .gt(orderColumn, 0)
    .order(orderColumn, { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error getting top reaction posts:', error)
    return []
  }

  return data || []
}

/**
 * Get reaction breakdown for a post
 */
export async function getPostReactionCounts(
  postId: string
): Promise<{
  funny: number
  creative: number
  must_try: number
  total: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('funny_count, creative_count, must_try_count, total_reactions')
    .eq('id', postId)
    .single()

  if (error || !data) {
    return { funny: 0, creative: 0, must_try: 0, total: 0 }
  }

  return {
    funny: data.funny_count || 0,
    creative: data.creative_count || 0,
    must_try: data.must_try_count || 0,
    total: data.total_reactions || 0,
  }
}

