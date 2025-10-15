'use client'

import React, { useMemo } from 'react'

interface Props {
  posts: any[]
}

export default function GlobalPulseCard({ posts }: Props) {
  // Memoize expensive calculations to prevent re-computing on every render
  const stats = useMemo(() => {
    const totalPosts = posts.length
    const uniquePosts = posts.filter(p => !p.isGhost && (p.score || 0) >= 70).length
    const commonPosts = posts.filter(p => !p.isGhost && (p.score || 0) < 70).length
    const ghostPosts = posts.filter(p => p.isGhost).length
    
    return { totalPosts, uniquePosts, commonPosts, ghostPosts }
  }, [posts])
  
  // Memoize card counting
  const sortedCards = useMemo(() => {
    const cardCounts: Record<string, number> = {}
    posts.forEach(post => {
      if (!post.isGhost) {
        const key = post.content || 'Unknown'
        cardCounts[key] = (cardCounts[key] || 0) + 1
      }
    })
    
    return Object.entries(cardCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [posts])
  
  // Memoize most unique post
  const mostUniquePost = useMemo(() => {
    return posts
      .filter(p => !p.isGhost)
      .sort((a, b) => (b.score || 0) - (a.score || 0))[0]
  }, [posts])

  return (
    <div className="bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden p-4">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Global Pulse
      </h3>
      
      <div className="space-y-3">
        {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-2 text-[10px]">
            <div className="bg-white/5 rounded p-2 text-center border border-white/5">
              <div className="text-white/40 mb-0.5">Total</div>
              <div className="text-base font-bold text-white">{stats.totalPosts}</div>
            </div>
            
            <div className="bg-purple-500/10 rounded p-2 text-center border border-purple-400/20">
              <div className="text-purple-300/60 mb-0.5">Unique</div>
              <div className="text-base font-bold text-purple-300">{stats.uniquePosts}</div>
            </div>
            
            <div className="bg-blue-500/10 rounded p-2 text-center border border-blue-400/20">
              <div className="text-blue-300/60 mb-0.5">Common</div>
              <div className="text-base font-bold text-blue-300">{stats.commonPosts}</div>
            </div>
            
            {stats.ghostPosts > 0 && (
              <div className="bg-orange-500/10 rounded p-2 text-center border border-orange-400/20">
                <div className="text-orange-300/60 mb-0.5">Trend</div>
                <div className="text-base font-bold text-orange-300">{stats.ghostPosts}</div>
              </div>
            )}
          </div>
        
        {/* Most Common Cards */}
        {sortedCards.length > 0 && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] font-semibold text-white/40 uppercase mb-2">Most Common</div>
            <div className="space-y-1.5">
              {sortedCards.map(([card, count], index) => (
                <div key={card} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-yellow-300">{index === 0 ? '🔥' : '•'}</span>
                    <span className="text-white/80 truncate">{card}</span>
                  </div>
                  <span className="text-blue-300 font-bold ml-2">{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Most Unique Card */}
        {mostUniquePost && (
          <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
            <div className="text-[10px] font-semibold text-purple-300/70 uppercase mb-2">Most Unique</div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-purple-200 truncate flex-1">✨ {mostUniquePost.content}</span>
              <span className="text-purple-300 font-bold ml-2">{Math.round(mostUniquePost.score || 0)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

