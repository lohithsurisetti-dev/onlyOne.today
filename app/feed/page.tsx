'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import { useRecentPosts } from '@/lib/hooks/usePosts'

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`
    }
  }
  
  return 'just now'
}

interface DisplayPost {
  id: string | number
  content: string
  type: 'unique' | 'common'
  time: string
  score?: number
  count?: number
  funny_count?: number
  creative_count?: number
  must_try_count?: number
  total_reactions?: number
}

interface PostCardProps {
  post: DisplayPost
  onReact?: (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => void
  userReactions?: Set<string>
}

const PostCard = React.memo(({ post, onReact, userReactions }: PostCardProps) => {
  const isUnique = post.type === 'unique'
  const [reactions, setReactions] = useState({
    funny: post.funny_count || 0,
    creative: post.creative_count || 0,
    must_try: post.must_try_count || 0,
  })
  
  const handleReaction = async (reactionType: 'funny' | 'creative' | 'must_try') => {
    if (onReact) {
      onReact(post.id, reactionType)
      
      // Optimistic update
      setReactions(prev => ({
        ...prev,
        [reactionType]: userReactions?.has(`${post.id}-${reactionType}`) 
          ? Math.max(0, prev[reactionType] - 1)
          : prev[reactionType] + 1
      }))
    }
  }
  
  return (
    <div
      className={`group relative rounded-2xl p-4 backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        isUnique
          ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-400/30 hover:border-purple-400/60'
          : 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-400/30 hover:border-blue-400/60'
      }`}
    >
      {/* Content */}
      <p className="text-white/90 text-sm leading-relaxed mb-3 line-clamp-2 group-hover:text-white">
        {post.content}
      </p>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-white/60 mb-2">
        <span className="flex items-center gap-1">
          {isUnique ? (
            <>
              <span>✨</span>
              <span>Unique {post.score}%</span>
            </>
          ) : (
            <>
              <span>👥</span>
              <span>{post.count} people</span>
            </>
          )}
        </span>
        <span>{post.time}</span>
      </div>
      
      {/* Reactions */}
      <div className="flex gap-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleReaction('funny')
          }}
          className={`flex items-center gap-0.5 px-2 py-1 rounded-full transition-all ${
            userReactions?.has(`${post.id}-funny`)
              ? 'bg-yellow-500/40 scale-105'
              : 'bg-white/5 hover:bg-yellow-500/20 hover:scale-105'
          }`}
        >
          <span className="text-xs">😂</span>
          {reactions.funny > 0 && <span className="text-xs text-white/80">{reactions.funny}</span>}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleReaction('creative')
          }}
          className={`flex items-center gap-0.5 px-2 py-1 rounded-full transition-all ${
            userReactions?.has(`${post.id}-creative`)
              ? 'bg-purple-500/40 scale-105'
              : 'bg-white/5 hover:bg-purple-500/20 hover:scale-105'
          }`}
        >
          <span className="text-xs">🎨</span>
          {reactions.creative > 0 && <span className="text-xs text-white/80">{reactions.creative}</span>}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleReaction('must_try')
          }}
          className={`flex items-center gap-0.5 px-2 py-1 rounded-full transition-all ${
            userReactions?.has(`${post.id}-must_try`)
              ? 'bg-green-500/40 scale-105'
              : 'bg-white/5 hover:bg-green-500/20 hover:scale-105'
          }`}
        >
          <span className="text-xs">🔥</span>
          {reactions.must_try > 0 && <span className="text-xs text-white/80">{reactions.must_try}</span>}
        </button>
      </div>
    </div>
  )
})

PostCard.displayName = 'PostCard'

export default function FeedPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unique' | 'common'>('all')
  const [reactionFilter, setReactionFilter] = useState<'all' | 'funny' | 'creative' | 'must_try'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
  
  const postsPerPage = 24
  
  // Handle reactions
  const handleReaction = async (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => {
    const reactionKey = `${postId}-${reactionType}`
    
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: String(postId), reactionType }),
      })
      
      if (response.ok) {
        // Toggle reaction in local state
        setUserReactions(prev => {
          const newSet = new Set(prev)
          if (newSet.has(reactionKey)) {
            newSet.delete(reactionKey)
          } else {
            newSet.add(reactionKey)
          }
          return newSet
        })
        
        // Trigger a refresh after a short delay
        setTimeout(() => {
          setRefreshKey(prev => prev + 1)
        }, 500)
      }
    } catch (error) {
      console.error('❌ Failed to add reaction:', error)
    }
  }
  
  // Fetch real posts from API
  const { posts: apiPosts, loading, error } = useRecentPosts(filter, 100, 0, refreshKey)
  
  // Transform API posts to display format
  const allPosts: DisplayPost[] = React.useMemo(() => {
    return apiPosts.map(post => ({
      id: post.id,
      content: post.content,
      type: post.uniqueness_score >= 70 ? 'unique' as const : 'common' as const,
      time: formatTimeAgo(new Date(post.created_at)),
      score: post.uniqueness_score,
      count: post.match_count + 1,
      funny_count: post.funny_count || 0,
      creative_count: post.creative_count || 0,
      must_try_count: post.must_try_count || 0,
      total_reactions: post.total_reactions || 0,
    }))
  }, [apiPosts])
  
  const filteredPosts = React.useMemo(() => {
    let filtered = allPosts.filter(post => {
      // Filter by type
      let passesTypeFilter = true
      if (filter === 'unique') passesTypeFilter = post.type === 'unique'
      else if (filter === 'common') passesTypeFilter = post.type === 'common'
      
      // Filter by reaction
      let passesReactionFilter = true
      if (reactionFilter === 'funny') passesReactionFilter = (post.funny_count || 0) > 0
      else if (reactionFilter === 'creative') passesReactionFilter = (post.creative_count || 0) > 0
      else if (reactionFilter === 'must_try') passesReactionFilter = (post.must_try_count || 0) > 0
      
      return passesTypeFilter && passesReactionFilter
    })
    
    // Sort by reaction count if filtering
    if (reactionFilter !== 'all') {
      filtered = filtered.sort((a, b) => {
        const aCount = reactionFilter === 'funny' ? (a.funny_count || 0) :
                       reactionFilter === 'creative' ? (a.creative_count || 0) :
                       (a.must_try_count || 0)
        const bCount = reactionFilter === 'funny' ? (b.funny_count || 0) :
                       reactionFilter === 'creative' ? (b.creative_count || 0) :
                       (b.must_try_count || 0)
        return bCount - aCount
      })
    }
    
    return filtered
  }, [allPosts, filter, reactionFilter])
  
  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const currentPosts = filteredPosts.slice(startIndex, endIndex)
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter, reactionFilter])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-space-dark/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <button
                onClick={() => router.push('/')}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Title */}
              <h1 className="text-xl font-bold text-white">
                Explore Feed
              </h1>
              
              <div className="w-6" /> {/* Spacer */}
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {/* Type Filters */}
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unique')}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  filter === 'unique'
                    ? 'bg-purple-500/30 text-white border border-purple-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                ✨ Unique
              </button>
              <button
                onClick={() => setFilter('common')}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  filter === 'common'
                    ? 'bg-blue-500/30 text-white border border-blue-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                👥 Common
              </button>
              
              {/* Divider */}
              <div className="w-px bg-white/20 mx-2" />
              
              {/* Reaction Filters */}
              <button
                onClick={() => setReactionFilter(reactionFilter === 'funny' ? 'all' : 'funny')}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  reactionFilter === 'funny'
                    ? 'bg-yellow-500/30 text-white border border-yellow-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                😂 Funny
              </button>
              <button
                onClick={() => setReactionFilter(reactionFilter === 'creative' ? 'all' : 'creative')}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  reactionFilter === 'creative'
                    ? 'bg-purple-500/30 text-white border border-purple-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                🎨 Creative
              </button>
              <button
                onClick={() => setReactionFilter(reactionFilter === 'must_try' ? 'all' : 'must_try')}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  reactionFilter === 'must_try'
                    ? 'bg-green-500/30 text-white border border-green-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                🔥 Must Try
              </button>
            </div>
          </div>
        </header>
        
        {/* Feed Grid */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {loading && (
            <div className="text-center text-white/60 py-12">
              Loading posts...
            </div>
          )}
          
          {!loading && filteredPosts.length === 0 && (
            <div className="text-center text-white/60 py-12">
              <p className="text-lg mb-2">No posts found</p>
              <p className="text-sm">Try changing your filters or be the first to post!</p>
            </div>
          )}
          
          {!loading && filteredPosts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onReact={handleReaction}
                    userReactions={userReactions}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 mb-8 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:border-purple-400/60 transition-all"
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-white font-medium px-6">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:border-purple-400/60 transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
