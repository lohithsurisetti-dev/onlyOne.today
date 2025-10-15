'use client'

import React from 'react'
import PostCard, { DisplayPost } from './PostCard'
import DaySummaryCard, { DaySummaryPost } from './DaySummaryCard'

// ============================================================================
// TYPES
// ============================================================================

export interface PostGridProps {
  posts: DisplayPost[]
  loading?: boolean
  onReact?: (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => void
  onShare?: (post: DisplayPost) => void
  userReactions?: Set<string>
  emptyMessage?: string
  loadingMessage?: string
}

// ============================================================================
// POST GRID COMPONENT
// ============================================================================

export default function PostGrid({
  posts,
  loading = false,
  onReact,
  onShare,
  userReactions,
  emptyMessage = "No posts yet. Be the first to share what you did today!",
  loadingMessage = "Loading posts...",
}: PostGridProps) {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="rounded-2xl border border-white/10 p-4 backdrop-blur-md animate-pulse"
            style={{ minHeight: '160px' }}
          >
            <div className="h-4 bg-white/10 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-2/3 mx-auto"></div>
          </div>
        ))}
      </div>
    )
  }
  
  // Empty state
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <svg 
          className="w-24 h-24 text-white/10 mb-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
        <p className="text-white/50 text-center text-lg">{emptyMessage}</p>
      </div>
    )
  }
  
  // Posts grid - Use appropriate card component based on input_type
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-3">
      {posts.map((post) => {
        const postType = (post as any).input_type
        
        // Render DaySummaryCard for day summaries, PostCard for actions
        if (postType === 'day') {
          return (
            <DaySummaryCard
              key={post.id}
              post={post as DaySummaryPost}
              onShare={onShare}
              onReact={onReact}
              userReactions={userReactions}
            />
          )
        }
        
        // Default: Render as action card
        return (
          <PostCard
            key={post.id}
            post={post}
            onReact={onReact}
            onShare={onShare}
            userReactions={userReactions}
          />
        )
      })}
    </div>
  )
}

