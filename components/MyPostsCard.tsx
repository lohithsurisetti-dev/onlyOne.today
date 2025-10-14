'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getMyPostsStats } from '@/lib/utils/my-posts'

export default function MyPostsCard() {
  const [stats, setStats] = useState<ReturnType<typeof getMyPostsStats> | null>(null)

  useEffect(() => {
    // Load stats from localStorage
    const postStats = getMyPostsStats()
    setStats(postStats)
  }, [])

  // Refresh when window gains focus (in case user posted in another tab)
  useEffect(() => {
    const handleFocus = () => {
      setStats(getMyPostsStats())
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (!stats || stats.totalToday === 0) {
    return null // Don't show if no posts
  }

  return (
    <Link
      href="/my-posts"
      className="block bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-purple-400/20 hover:border-purple-400/40 transition-all hover:scale-[1.02] p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-sm font-bold text-white">Your Posts</h3>
          <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
            {stats.totalToday}
          </span>
        </div>
        
        <svg 
          className="w-4 h-4 text-white/40"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/40 mb-0.5">Avg</div>
          <div className="text-base font-bold text-purple-300">{stats.avgUniqueness}%</div>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-2">
          <div className="text-purple-300/60 mb-0.5">Unique</div>
          <div className="text-base font-bold text-purple-300">{stats.totalUnique}</div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-2">
          <div className="text-blue-300/60 mb-0.5">Common</div>
          <div className="text-base font-bold text-blue-300">{stats.totalCommon}</div>
        </div>
      </div>
      
      <p className="text-white/30 text-[10px] mt-3 text-center">
        Tap to view all posts →
      </p>
    </Link>
  )
}

