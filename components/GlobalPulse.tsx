'use client'

import React from 'react'

interface GlobalPulseProps {
  posts: any[]
  className?: string
}

export default function GlobalPulse({ posts, className = '' }: GlobalPulseProps) {
  // Calculate stats from posts
  const stats = React.useMemo(() => {
    if (posts.length === 0) {
      return {
        totalPosts: 0,
        avgUniqueness: 0,
        perfectUnique: 0,
        mostCommon: { content: '', count: 0 },
        topVibes: [],
      }
    }
    
    // Filter out ghost posts for stats
    const realPosts = posts.filter(p => !p.isGhost)
    
    // Average uniqueness
    const totalUniqueness = realPosts.reduce((sum, p) => sum + (p.score || 0), 0)
    const avgUniqueness = Math.round(totalUniqueness / realPosts.length)
    
    // Perfect unique count (100%)
    const perfectUnique = realPosts.filter(p => (p.score || 0) === 100).length
    
    // Most common (lowest uniqueness or highest count)
    const sortedByCommon = [...realPosts].sort((a, b) => (b.count || 0) - (a.count || 0))
    const mostCommon = sortedByCommon[0] || { content: 'Nothing yet', count: 0 }
    
    // Top vibes (would need vibe data)
    const topVibes = [
      { vibe: '🌙 Night Owl', count: Math.floor(realPosts.length * 0.25) },
      { vibe: '🍳 Foodie', count: Math.floor(realPosts.length * 0.20) },
      { vibe: '🎨 Creative', count: Math.floor(realPosts.length * 0.15) },
    ].filter(v => v.count > 0)
    
    return {
      totalPosts: realPosts.length,
      avgUniqueness,
      perfectUnique,
      mostCommon,
      topVibes,
    }
  }, [posts])
  
  return (
    <div className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🌍</span>
        <h3 className="text-xl font-bold text-white">Today's Global Pulse</h3>
      </div>
      
      <div className="space-y-4">
        {/* Total Activity */}
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">Total Activities</span>
          <span className="text-white font-bold text-lg">{stats.totalPosts}</span>
        </div>
        
        {/* Average Uniqueness */}
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">Average Uniqueness</span>
          <span className="text-purple-300 font-bold text-lg">{stats.avgUniqueness}%</span>
        </div>
        
        {/* Perfect Unique */}
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">Totally Unique (100%)</span>
          <span className="text-pink-300 font-bold text-lg">{stats.perfectUnique} people</span>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-white/10 my-4" />
        
        {/* Most Common Activity */}
        {stats.mostCommon.count > 1 && (
          <div>
            <span className="text-white/70 text-xs block mb-2">Most Common Activity:</span>
            <div className="bg-white/5 rounded-lg p-3 border border-blue-400/20">
              <p className="text-white/90 text-sm mb-1 line-clamp-1">{stats.mostCommon.content}</p>
              <span className="text-blue-300 text-xs">👥 {stats.mostCommon.count} people</span>
            </div>
          </div>
        )}
        
        {/* Top Vibes */}
        {stats.topVibes.length > 0 && (
          <div>
            <span className="text-white/70 text-xs block mb-2">Top Vibes Today:</span>
            <div className="space-y-1.5">
              {stats.topVibes.slice(0, 3).map((vibe, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{vibe.vibe}</span>
                  <span className="text-white/50">{vibe.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {stats.totalPosts === 0 && (
          <div className="text-center py-4">
            <p className="text-white/60 text-sm">
              No posts yet today. Be the first! ✨
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

