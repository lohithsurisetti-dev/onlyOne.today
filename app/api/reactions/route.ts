import { NextRequest, NextResponse } from 'next/server'
import { addReaction, type ReactionType } from '@/lib/services/reactions'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getIP, RateLimitPresets, createRateLimitResponse } from '@/lib/utils/rate-limit'

/**
 * POST /api/reactions - Add or remove a reaction
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (async - Supabase-backed)
    const ip = getIP(request)
    const rateLimitResult = await rateLimit(ip, 'reactions', RateLimitPresets.REACTIONS)
    
    if (!rateLimitResult.success) {
      console.log(`⚠️ Rate limit exceeded for reactions from IP: ${ip}`)
      return createRateLimitResponse(rateLimitResult)
    }
    
    const body = await request.json()
    const { postId, reactionType } = body

    // Validation
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    if (!['funny', 'creative', 'must_try'].includes(reactionType)) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      )
    }

    // Add/remove reaction
    const result = await addReaction(postId, reactionType as ReactionType)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add reaction' },
        { status: 500 }
      )
    }

    // Manually update counts (server-side with service role)
    const supabase = createAdminClient()
    
    // Count all reactions for this post
    const { data: reactions, error: reactionsError } = await supabase
      .from('post_reactions')
      .select('reaction_type')
      .eq('post_id', postId)
    
    console.log('📊 Reactions for post:', postId, reactions?.length)
    
    if (reactionsError) {
      console.error('❌ Failed to fetch reactions:', reactionsError)
    }
    
    if (reactions) {
      const funnyCount = reactions.filter(r => r.reaction_type === 'funny').length
      const creativeCount = reactions.filter(r => r.reaction_type === 'creative').length
      const mustTryCount = reactions.filter(r => r.reaction_type === 'must_try').length
      
      const updates = {
        funny_count: funnyCount,
        creative_count: creativeCount,
        must_try_count: mustTryCount,
        total_reactions: reactions.length
      }
      
      console.log('🔄 Updating post with counts:', updates)
      
      const { error: updateError } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
      
      if (updateError) {
        console.error('❌ Failed to update counts:', updateError)
      } else {
        console.log('✅ Reaction counts updated successfully!')
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/reactions:', error)
    return NextResponse.json(
      { error: 'Failed to process reaction' },
      { status: 500 }
    )
  }
}

