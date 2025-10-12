'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import Badge from '@/components/ui/Badge'
import { Plus } from 'lucide-react'
import { useRecentPosts, type Post } from '@/lib/hooks/usePosts'

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

// No mock data - always use real API data

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
  style: React.CSSProperties
  onReact?: (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => void
  userReactions?: Set<string>
}

const PostCard = React.memo(({ post, style, onReact, userReactions }: PostCardProps) => {
  const isUnique = post.type === 'unique'
  const [reactions, setReactions] = useState({
    funny: (post as any).funny_count || 0,
    creative: (post as any).creative_count || 0,
    must_try: (post as any).must_try_count || 0,
  })
  
  const handleReaction = async (reactionType: 'funny' | 'creative' | 'must_try') => {
    if (onReact) {
      onReact(post.id, reactionType)
      
      // Optimistic update
      setReactions(prev => ({
        ...prev,
        [reactionType]: userReactions?.has(`${post.id}-${reactionType}`) 
          ? Math.max(0, prev[reactionType as keyof typeof prev] - 1)
          : prev[reactionType as keyof typeof prev] + 1
      }))
    }
  }
  
  const cardClasses = isUnique 
    ? "absolute p-3 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-purple-400/40 shadow-lg hover:scale-105 hover:z-20 transition-all duration-300 will-change-transform group animate-pulse"
    : "absolute p-3 rounded-2xl bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-md border border-blue-400/40 shadow-lg hover:scale-105 hover:z-20 transition-all duration-300 will-change-transform group animate-pulse"
  
  const glowClasses = isUnique
    ? "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-200 bg-gradient-to-br from-purple-400 to-pink-400"
    : "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-200 bg-gradient-to-br from-blue-400 to-cyan-400"
  
  return (
    <div
      className={cardClasses}
      style={{
        ...style,
        transform: 'translateZ(0)',
      }}
    >
      {/* Floating particles around unique cards */}
      {isUnique && (
        <div className="absolute -top-2 -right-2 w-2 h-2 bg-yellow-400 rounded-full opacity-70" />
      )}
      
      <p className="text-text-primary text-sm leading-relaxed mb-2 line-clamp-2 group-hover:text-white transition-colors duration-200">
        {post.content}
      </p>
      
      <div className="flex items-center justify-between mb-2">
        <Badge 
          variant={isUnique ? 'purple' : 'blue'} 
          size="sm"
          className="text-xs"
        >
          {isUnique ? `✨ ${post.score}` : `👥 ${post.count}`}
        </Badge>
        
        <span className="text-text-muted text-xs group-hover:text-text-primary transition-colors duration-200">
          {post.time}
        </span>
      </div>
      
      {/* Reaction Buttons - Small and Compact */}
      <div className="flex items-center gap-1 pt-1.5 border-t border-white/5 relative z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleReaction('funny')
          }}
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
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
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
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
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
            userReactions?.has(`${post.id}-must_try`)
              ? 'bg-green-500/40 scale-105'
              : 'bg-white/5 hover:bg-green-500/20 hover:scale-105'
          }`}
        >
          <span className="text-xs">🔥</span>
          {reactions.must_try > 0 && <span className="text-xs text-white/80">{reactions.must_try}</span>}
        </button>
      </div>
      
      {/* Subtle glow effect */}
      <div className={glowClasses} />
    </div>
  )
})

export default function FeedPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unique' | 'common'>('all')
  const [reactionFilter, setReactionFilter] = useState<'all' | 'funny' | 'creative' | 'must_try'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
  
  const postsPerPage = 12
  
  // Handle reactions
  const handleReaction = async (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => {
    console.log('🎯 Reaction clicked:', postId, reactionType)
    const reactionKey = `${postId}-${reactionType}`
    
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: String(postId), reactionType }),
      })
      
      console.log('📡 Reaction API response:', response.status)
      
      if (response.ok) {
        console.log('✅ Reaction successful!')
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
        
        // Trigger a refresh after a short delay to show updated counts
        setTimeout(() => {
          setRefreshKey(prev => prev + 1)
        }, 500)
      } else {
        const errorData = await response.json()
        console.error('❌ Reaction failed:', errorData)
      }
    } catch (error) {
      console.error('❌ Failed to add reaction:', error)
    }
  }
  
  // Fetch real posts from API
  const { posts: apiPosts, loading, error } = useRecentPosts(filter, 100, 0, refreshKey)
  
  // Transform API posts to display format
  const allPosts: DisplayPost[] = React.useMemo(() => {
    console.log('🔄 Transforming posts:', apiPosts.length, 'API posts')
    
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
      // Filter by type (unique/common)
      let passesTypeFilter = true
      if (filter === 'unique') passesTypeFilter = post.type === 'unique'
      else if (filter === 'common') passesTypeFilter = post.type === 'common'
      
      // Filter by reaction type
      let passesReactionFilter = true
      if (reactionFilter === 'funny') passesReactionFilter = (post.funny_count || 0) > 0
      else if (reactionFilter === 'creative') passesReactionFilter = (post.creative_count || 0) > 0
      else if (reactionFilter === 'must_try') passesReactionFilter = (post.must_try_count || 0) > 0
      
      return passesTypeFilter && passesReactionFilter
    })
    
    // Sort by reaction count if filtering by reaction
    if (reactionFilter !== 'all') {
      filtered = filtered.sort((a, b) => {
        const aCount = reactionFilter === 'funny' ? (a.funny_count || 0) :
                       reactionFilter === 'creative' ? (a.creative_count || 0) :
                       (a.must_try_count || 0)
        const bCount = reactionFilter === 'funny' ? (b.funny_count || 0) :
                       reactionFilter === 'creative' ? (b.creative_count || 0) :
                       (b.must_try_count || 0)
        return bCount - aCount // Highest first
      })
    }
    
    return filtered
  }, [allPosts, filter, reactionFilter])
  
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const currentPosts = filteredPosts.slice(startIndex, endIndex)
  
  // Pre-calculate all positions to avoid recursive calls
  const cardPositions = React.useMemo(() => {
    const positions: Array<{
      top: string
      left: string
      width: string
      animationDelay: string
      zIndex: number
    }> = []
    
    const cardWidth = 250
    const minDistance = 280 // Minimum distance between cards (in pixels)
    const viewportWidth = 1200
    const viewportHeight = 800
    
    for (let index = 0; index < currentPosts.length; index++) {
      const colsPerRow = 3
      const col = index % colsPerRow
      const row = Math.floor(index / colsPerRow)
      const baseLeft = 10 + (col * 30) // 10%, 40%, 70%
      const baseTop = 15 + (row * 22) // 15%, 37%, 59%, 81%
      
      let bestPosition = null
      let maxAttempts = 50
      let attempts = 0
      
      while (attempts < maxAttempts && !bestPosition) {
        // Add small random movement for organic feel
        const moveOffsetX = (Math.random() - 0.5) * 6 // ±3% slow movement
        const moveOffsetY = (Math.random() - 0.5) * 4 // ±2% slow movement
        
        const leftPercent = Math.max(8, Math.min(70, baseLeft + moveOffsetX))
        const topPercent = Math.max(12, Math.min(75, baseTop + moveOffsetY))
        
        const leftPx = (leftPercent / 100) * viewportWidth
        const topPx = (topPercent / 100) * viewportHeight
        
        // Check collision with all previously placed cards
        let hasCollision = false
        
        for (let i = 0; i < positions.length; i++) {
          const existingLeftPx = (parseFloat(positions[i].left) / 100) * viewportWidth
          const existingTopPx = (parseFloat(positions[i].top) / 100) * viewportHeight
          
          const distance = Math.sqrt(
            Math.pow(leftPx - existingLeftPx, 2) + 
            Math.pow(topPx - existingTopPx, 2)
          )
          
          if (distance < minDistance) {
            hasCollision = true
            break
          }
        }
        
        if (!hasCollision) {
          bestPosition = {
            top: `${topPercent}%`,
            left: `${leftPercent}%`,
            width: `${cardWidth}px`,
            animationDelay: `${index * 0.15}s`,
            zIndex: index + 1,
          }
        }
        
        attempts++
      }
      
      // Fallback to grid position if no collision-free position found
      if (!bestPosition) {
        bestPosition = {
          top: `${baseTop}%`,
          left: `${baseLeft}%`,
          width: `${cardWidth}px`,
          animationDelay: `${index * 0.15}s`,
          zIndex: index + 1,
        }
      }
      
      positions.push(bestPosition)
    }
    
    return positions
  }, [currentPosts.length, refreshKey])
  
  return (
    <div className="relative min-h-screen w-full bg-gradient-sky overflow-x-hidden">
        {/* Background Stars */}
        <StarsBackground count={150} />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-space-dark/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center relative">
            {/* Back button - absolute positioned */}
            <button
              onClick={() => router.push('/')}
              className="absolute left-0 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            {/* Title - centered */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              What Others Did Today
            </h1>
          </div>
        </div>
      </header>
      
      {/* Filter Pills - Below Header with Glassmorphism */}
      <div className="sticky top-[72px] z-20 bg-gradient-to-b from-space-dark/50 to-transparent backdrop-blur-sm py-4">
        <div className="flex justify-center gap-2 flex-wrap px-4">
          {/* All Posts */}
          <button
            onClick={() => {
              setFilter('all')
              setReactionFilter('all')
            }}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              backdrop-blur-md border
              ${filter === 'all' && reactionFilter === 'all'
                ? 'bg-white/20 border-white/40 text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
              }
            `}
          >
            All
          </button>
          
          {/* Type Filters */}
          <button
            onClick={() => {
              setFilter('unique')
              setReactionFilter('all')
            }}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              backdrop-blur-md border
              ${filter === 'unique' && reactionFilter === 'all'
                ? 'bg-purple-500/30 border-purple-400/40 text-purple-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-purple-500/20 hover:text-purple-300'
              }
            `}
          >
            ✨ Unique
          </button>
          
          <button
            onClick={() => {
              setFilter('common')
              setReactionFilter('all')
            }}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              backdrop-blur-md border
              ${filter === 'common' && reactionFilter === 'all'
                ? 'bg-blue-500/30 border-blue-400/40 text-blue-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-blue-500/20 hover:text-blue-300'
              }
            `}
          >
            👥 Common
          </button>
          
          {/* Divider */}
          <div className="h-6 w-px bg-white/10"></div>
          
          {/* Reaction Filters */}
          <button
            onClick={() => {
              setFilter('all')
              setReactionFilter('funny')
            }}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              backdrop-blur-md border flex items-center gap-1
              ${reactionFilter === 'funny'
                ? 'bg-yellow-500/30 border-yellow-400/40 text-yellow-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-yellow-500/20 hover:text-yellow-300'
              }
            `}
          >
            <span>😂</span> Funny
          </button>
          
          <button
            onClick={() => {
              setFilter('all')
              setReactionFilter('creative')
            }}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              backdrop-blur-md border flex items-center gap-1
              ${reactionFilter === 'creative'
                ? 'bg-purple-500/30 border-purple-400/40 text-purple-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-purple-500/20 hover:text-purple-300'
              }
            `}
          >
            <span>🎨</span> Creative
          </button>
          
          <button
            onClick={() => {
              setFilter('all')
              setReactionFilter('must_try')
            }}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              backdrop-blur-md border flex items-center gap-1
              ${reactionFilter === 'must_try'
                ? 'bg-green-500/30 border-green-400/40 text-green-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-green-500/20 hover:text-green-300'
              }
            `}
          >
            <span>🔥</span> Must Try
          </button>
        </div>
      </div>
      
      {/* Floating Posts Container */}
      <div className="relative w-full overflow-y-auto" style={{ 
        minHeight: 'calc(100vh - 200px)', 
        height: 'calc(100vh - 200px)',
        scrollBehavior: 'smooth'
      }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-white/60">Loading posts...</p>
            </div>
          </div>
        ) : currentPosts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/60 text-lg mb-2">No posts yet</p>
              <p className="text-white/40 text-sm">Be the first to share something!</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full" style={{ height: 'calc(150vh - 200px)' }}>
            {currentPosts.map((post, index) => (
              <PostCard
                key={`${post.id}-${refreshKey}`}
                post={post}
                style={cardPositions[index]}
                onReact={handleReaction}
                userReactions={userReactions}
              />
            ))}
          </div>
        )}
        
        {/* Decorative connecting lines (optional) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" style={{ zIndex: 0 }}>
          {currentPosts.slice(0, -1).map((_, index) => {
            if (index % 3 === 0 && index + 1 < currentPosts.length && cardPositions[index] && cardPositions[index + 1]) {
              const pos1 = cardPositions[index]
              const pos2 = cardPositions[index + 1]
              const x1 = parseFloat(pos1.left) + 15
              const y1 = parseFloat(pos1.top) + 10
              const x2 = parseFloat(pos2.left) + 15
              const y2 = parseFloat(pos2.top) + 10
              
              return (
                <line
                  key={index}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="#4a5568"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )
            }
            return null
          })}
        </svg>
      </div>
      
      {/* Pagination Controls */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center space-x-4 bg-space-dark/90 backdrop-blur-md rounded-full px-6 py-3 border border-white/10">
          {/* Previous Page */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${currentPage === 1 
                ? 'bg-space-light text-text-muted cursor-not-allowed' 
                : 'bg-accent-purple text-white hover:bg-accent-purple/80'
              }
            `}
          >
            ← Prev
          </button>
          
          {/* Page Info */}
          <div className="text-text-primary text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          
          {/* Next Page */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${currentPage === totalPages 
                ? 'bg-space-light text-text-muted cursor-not-allowed' 
                : 'bg-accent-purple text-white hover:bg-accent-purple/80'
              }
            `}
          >
            Next →
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="px-4 py-2 rounded-full text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue/80 transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/')}
        className="
          fixed bottom-8 right-8 z-40
          w-16 h-16 rounded-full
          bg-gradient-to-r from-accent-purple to-accent-pink
          text-white shadow-glow
          flex items-center justify-center
          hover:scale-110 transition-transform
        "
        aria-label="Post your moment"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  )
}

