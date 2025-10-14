'use client'

import React, { useState, useEffect } from 'react'
import { getMyPosts, getTodaysPosts, getMyPostsStats, clearMyPosts } from '@/lib/utils/my-posts'
import type { MyPost } from '@/lib/utils/my-posts'

export default function MyPostsCard() {
  const [todaysPosts, setTodaysPosts] = useState<MyPost[]>([])
  const [stats, setStats] = useState<ReturnType<typeof getMyPostsStats> | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Load posts from localStorage
    const posts = getTodaysPosts()
    const postStats = getMyPostsStats()
    setTodaysPosts(posts)
    setStats(postStats)
  }, [])

  // Refresh when window gains focus (in case user posted in another tab)
  useEffect(() => {
    const handleFocus = () => {
      setTodaysPosts(getTodaysPosts())
      setStats(getMyPostsStats())
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (!stats || stats.totalToday === 0) {
    return null // Don't show if no posts
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-purple-400/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-sm font-bold text-white">Your Posts Today</h3>
          <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
            {stats.totalToday}
          </span>
        </div>
        
        <svg 
          className={`w-4 h-4 text-white/60 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Stats Summary (always visible) */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/40 mb-0.5">Avg</div>
          <div className="text-lg font-bold text-purple-300">{stats.avgUniqueness}%</div>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-2">
          <div className="text-purple-300/60 mb-0.5">Unique</div>
          <div className="text-lg font-bold text-purple-300">{stats.totalUnique}</div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-2">
          <div className="text-blue-300/60 mb-0.5">Common</div>
          <div className="text-lg font-bold text-blue-300">{stats.totalCommon}</div>
        </div>
      </div>

      {/* Expanded Posts List */}
      {expanded && (
        <div className="border-t border-purple-400/20 p-4 space-y-2 max-h-[400px] overflow-y-auto">
          {todaysPosts.map((post) => (
            <a
              key={post.id}
              href={post.viewUrl}
              className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors border border-white/10 hover:border-purple-400/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 truncate mb-1">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <span className="capitalize">{post.scope}</span>
                    <span>•</span>
                    <span>{new Date(post.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${post.uniquenessScore >= 70 ? 'text-purple-300' : 'text-blue-300'}`}>
                    {post.uniquenessScore}%
                  </div>
                  <div className="text-[10px] text-white/40">
                    {post.matchCount + 1} total
                  </div>
                </div>
              </div>
            </a>
          ))}
          
          {/* Clear button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Clear all your posts? This cannot be undone.')) {
                clearMyPosts()
                setTodaysPosts([])
                setStats(getMyPostsStats())
              }
            }}
            className="w-full mt-3 py-2 text-xs text-red-300/60 hover:text-red-300 transition-colors"
          >
            Clear My Posts
          </button>
        </div>
      )}
    </div>
  )
}

