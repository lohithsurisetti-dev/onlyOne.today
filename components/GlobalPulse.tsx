'use client'

import React from 'react'

interface GlobalPulseProps {
  posts: any[]
  className?: string
  currentFilter?: 'all' | 'unique' | 'common' | 'trending'
}

export default function GlobalPulse({ posts, className = '', currentFilter = 'all' }: GlobalPulseProps) {
  // Calculate stats from posts based on current filter
  const stats = React.useMemo(() => {
    if (posts.length === 0) {
      return {
        totalPosts: 0,
        avgUniqueness: 0,
        perfectUnique: 0,
        mostCommon: { content: '', count: 0 },
        topVibes: [],
        isGhostView: false,
        totalReach: 0,
        topTrending: null,
      }
    }
    
    const isGhostView = currentFilter === 'trending'
    
    if (isGhostView) {
      // Stats for ghost/trending posts
      const ghostPosts = posts.filter(p => p.isGhost)
      
      // Calculate total reach (sum of all people counts)
      const totalReach = ghostPosts.reduce((sum, p) => sum + (p.count || 0), 0)
      
      // Top trending (highest count)
      const sortedByReach = [...ghostPosts].sort((a, b) => (b.count || 0) - (a.count || 0))
      const topTrending = sortedByReach[0] || null
      
      return {
        totalPosts: ghostPosts.length,
        avgUniqueness: 0,
        perfectUnique: 0,
        mostCommon: { content: '', count: 0 },
        topVibes: [],
        isGhostView: true,
        totalReach,
        topTrending,
      }
    }
    
    // Filter out ghost posts for regular stats
    const realPosts = posts.filter(p => !p.isGhost)
    
    // Calculate tier distribution (more meaningful than average)
    const eliteCount = realPosts.filter(p => p.percentile?.tier === 'elite').length
    const rareCount = realPosts.filter(p => p.percentile?.tier === 'rare').length
    const uniqueCount = realPosts.filter(p => p.percentile?.tier === 'unique').length
    const notableCount = realPosts.filter(p => p.percentile?.tier === 'notable').length
    
    // Top 25% percentage (rare/unique actions)
    const avgUniqueness = Math.round((eliteCount + rareCount + uniqueCount + notableCount) / realPosts.length * 100) || 0
    
    // "Only you!" posts (< 0.1% percentile)
    const perfectUnique = realPosts.filter(p => 
      p.percentile?.tier === 'elite' && p.percentile?.percentile < 0.1
    ).length
    
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
      isGhostView: false,
      totalReach: 0,
      topTrending: null,
    }
  }, [posts, currentFilter])
  
  // Format large numbers (e.g., 2300000 -> 2.3M)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }
  
  return (
    <div className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{stats.isGhostView ? '🔥' : '🌍'}</span>
        <h3 className="text-xl font-bold text-white">
          {stats.isGhostView ? 'Trending Right Now' : 'Today\'s Global Pulse'}
        </h3>
      </div>
      
      <div className="space-y-4">
        {stats.isGhostView ? (
          // Trending view stats
          <>
            {/* Total Trending Activities */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Trending Activities</span>
              <span className="text-orange-300 font-bold text-lg">{stats.totalPosts}</span>
            </div>
            
            {/* Total Global Reach */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Total People Doing This</span>
              <span className="text-orange-300 font-bold text-lg">{formatNumber(stats.totalReach)}</span>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-white/10 my-4" />
            
            {/* Top Trending */}
            {stats.topTrending && (
              <div>
                <span className="text-white/70 text-xs block mb-2">🔥 Most Trending:</span>
                <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-lg p-3 border border-orange-400/30">
                  <p className="text-white/90 text-sm mb-1 line-clamp-2 italic">{stats.topTrending.content}</p>
                  <span className="text-orange-300 text-xs font-medium">👥 {formatNumber(stats.topTrending.count)} people</span>
                </div>
              </div>
            )}
            
            {/* Info Message */}
            <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-400/20">
              <p className="text-orange-300/90 text-xs leading-relaxed">
                These are global trends happening right now. Post your unique version! 🎯
              </p>
            </div>
          </>
        ) : (
          // Regular view stats
          <>
            {/* Total Activity */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Total Activities</span>
              <span className="text-white font-bold text-lg">{stats.totalPosts}</span>
            </div>
            
            {/* Elite/Rare Actions (Top 25%) */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Rare Actions (Top 25%)</span>
              <span className="text-purple-300 font-bold text-lg">{stats.avgUniqueness}%</span>
            </div>
            
            {/* Only You Actions */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">"Only You!" Actions</span>
              <span className="text-pink-300 font-bold text-lg">{stats.perfectUnique} {stats.perfectUnique === 1 ? 'person' : 'people'}</span>
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
            
            {/* Empty State */}
            {stats.totalPosts === 0 && (
              <div className="text-center py-4">
                <p className="text-white/60 text-sm">
                  No posts yet today. Be the first! ✨
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

