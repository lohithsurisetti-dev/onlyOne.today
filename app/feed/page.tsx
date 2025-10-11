'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import Badge from '@/components/ui/Badge'
import { Plus } from 'lucide-react'

// Mock posts data
const mockPosts = [
  { id: 1, content: 'Listened to vinyl while everyone streamed', type: 'unique', time: '2m ago', score: 94 },
  { id: 2, content: 'Took a 3 PM nap', type: 'common', time: '5m ago', count: 45 },
  { id: 3, content: 'Wrote a letter by hand', type: 'unique', time: '12m ago', score: 98 },
  { id: 4, content: 'Didn\'t watch the Super Bowl', type: 'unique', time: '18m ago', score: 91 },
  { id: 5, content: 'Cooked dinner from scratch', type: 'common', time: '22m ago', count: 67 },
  { id: 6, content: 'Read a physical book', type: 'unique', time: '28m ago', score: 85 },
  { id: 7, content: 'Went for a walk without my phone', type: 'unique', time: '35m ago', score: 92 },
  { id: 8, content: 'Felt anxious today', type: 'common', time: '40m ago', count: 127 },
  { id: 9, content: 'Didn\'t check social media', type: 'unique', time: '45m ago', score: 88 },
  { id: 10, content: 'Called an old friend', type: 'common', time: '50m ago', count: 34 },
  { id: 11, content: 'Watched the sunset', type: 'common', time: '1h ago', count: 89 },
  { id: 12, content: 'Played board games instead of video games', type: 'unique', time: '1h ago', score: 90 },
  { id: 13, content: 'Baked bread from scratch', type: 'unique', time: '1h ago', score: 87 },
  { id: 14, content: 'Didn\'t use any apps today', type: 'unique', time: '1h ago', score: 95 },
  { id: 15, content: 'Had coffee with a friend', type: 'common', time: '2h ago', count: 78 },
  { id: 16, content: 'Wrote in a journal', type: 'common', time: '2h ago', count: 56 },
  { id: 17, content: 'Listened to a podcast while cooking', type: 'common', time: '2h ago', count: 112 },
  { id: 18, content: 'Didn\'t buy anything online', type: 'unique', time: '2h ago', score: 82 },
  { id: 19, content: 'Cleaned my room', type: 'common', time: '3h ago', count: 43 },
  { id: 20, content: 'Learned a new word', type: 'unique', time: '3h ago', score: 89 },
  { id: 21, content: 'Exercised for 30 minutes', type: 'common', time: '3h ago', count: 156 },
  { id: 22, content: 'Didn\'t take any selfies', type: 'unique', time: '4h ago', score: 76 },
  { id: 23, content: 'Watered my plants', type: 'common', time: '4h ago', count: 89 },
  { id: 24, content: 'Read the news in print', type: 'unique', time: '4h ago', score: 93 },
  { id: 25, content: 'Had a phone conversation', type: 'common', time: '5h ago', count: 67 },
  { id: 26, content: 'Didn\'t use GPS to navigate', type: 'unique', time: '5h ago', score: 84 },
  { id: 27, content: 'Made my bed', type: 'common', time: '6h ago', count: 134 },
  { id: 28, content: 'Listened to the radio', type: 'unique', time: '6h ago', score: 91 },
  { id: 29, content: 'Took a cold shower', type: 'unique', time: '6h ago', score: 88 },
  { id: 30, content: 'Watched a movie alone', type: 'common', time: '7h ago', count: 98 },
  { id: 31, content: 'Didn\'t use any delivery apps', type: 'unique', time: '8h ago', score: 86 },
  { id: 32, content: 'Listened to a full album', type: 'common', time: '8h ago', count: 73 },
  { id: 33, content: 'Wrote poetry', type: 'unique', time: '9h ago', score: 92 },
  { id: 34, content: 'Didn\'t check notifications', type: 'unique', time: '9h ago', score: 89 },
  { id: 35, content: 'Had a video call with family', type: 'common', time: '10h ago', count: 156 },
  { id: 36, content: 'Read news without social media', type: 'unique', time: '10h ago', score: 84 },
  { id: 37, content: 'Cooked without a recipe', type: 'unique', time: '11h ago', score: 91 },
  { id: 38, content: 'Exercised at home', type: 'common', time: '11h ago', count: 234 },
  { id: 39, content: 'Didn\'t use GPS today', type: 'unique', time: '12h ago', score: 87 },
  { id: 40, content: 'Listened to classical music', type: 'common', time: '12h ago', count: 89 },
  { id: 41, content: 'Wrote in a gratitude journal', type: 'common', time: '13h ago', count: 67 },
  { id: 42, content: 'Didn\'t buy anything online', type: 'unique', time: '13h ago', score: 83 },
  { id: 43, content: 'Had a phone conversation', type: 'common', time: '14h ago', count: 145 },
  { id: 44, content: 'Read a magazine', type: 'unique', time: '14h ago', score: 88 },
  { id: 45, content: 'Didn\'t take any photos', type: 'unique', time: '15h ago', score: 94 },
]

interface PostCardProps {
  post: typeof mockPosts[0]
  style: React.CSSProperties
}

const PostCard = React.memo(({ post, style }: PostCardProps) => {
  const isUnique = post.type === 'unique'
  
  const cardClasses = isUnique 
    ? "absolute p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-purple-400/40 shadow-lg hover:scale-110 hover:rotate-1 hover:z-20 transition-all duration-300 ease-bounce cursor-pointer will-change-transform group animate-pulse"
    : "absolute p-4 rounded-2xl bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-md border border-blue-400/40 shadow-lg hover:scale-110 hover:rotate-1 hover:z-20 transition-all duration-300 ease-bounce cursor-pointer will-change-transform group animate-pulse"
  
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
      
      <p className="text-text-primary text-sm leading-relaxed mb-3 line-clamp-2 group-hover:text-white transition-colors duration-200">
        {post.content}
      </p>
      
      <div className="flex items-center justify-between">
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
      
      {/* Subtle glow effect */}
      <div className={glowClasses} />
    </div>
  )
})

export default function FeedPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unique' | 'common'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const postsPerPage = 12
  
  const filteredPosts = mockPosts.filter(post => {
    if (filter === 'all') return true
    if (filter === 'unique') return post.type === 'unique'
    if (filter === 'common') return post.type === 'common'
    return true
  })
  
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
        <div className="flex justify-center gap-3">
          {(['all', 'unique', 'common'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                backdrop-blur-md border
                ${filter === filterType
                  ? 'bg-white/20 border-white/40 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20'
                }
              `}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Floating Posts Container */}
      <div className="relative w-full overflow-y-auto" style={{ 
        minHeight: 'calc(100vh - 160px)', 
        height: 'calc(100vh - 160px)',
        scrollBehavior: 'smooth'
      }}>
        <div className="relative w-full" style={{ height: 'calc(150vh - 160px)' }}>
          {currentPosts.map((post, index) => (
            <PostCard
              key={`${post.id}-${refreshKey}`}
              post={post}
              style={cardPositions[index]}
            />
          ))}
        </div>
        
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

