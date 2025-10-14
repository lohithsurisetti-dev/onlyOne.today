'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import Footer from '@/components/Footer'
import { getMyPosts, getTodaysPosts, getMyPostsStats, clearMyPosts } from '@/lib/utils/my-posts'
import type { MyPost } from '@/lib/utils/my-posts'

export default function MyPostsPage() {
  const router = useRouter()
  const [allPosts, setAllPosts] = useState<MyPost[]>([])
  const [todaysPosts, setTodaysPosts] = useState<MyPost[]>([])
  const [stats, setStats] = useState<ReturnType<typeof getMyPostsStats> | null>(null)
  const [tab, setTab] = useState<'today' | 'all'>('today')

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = () => {
    const all = getMyPosts()
    const today = getTodaysPosts()
    const postStats = getMyPostsStats()
    
    setAllPosts(all)
    setTodaysPosts(today)
    setStats(postStats)
  }

  const handleClear = () => {
    if (confirm('Clear all your posts? This cannot be undone.')) {
      clearMyPosts()
      loadPosts()
    }
  }

  const displayPosts = tab === 'today' ? todaysPosts : allPosts

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-white/10 bg-space-dark/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Go back"
                >
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Your Posts
                  </h1>
                  <p className="text-white/50 text-xs mt-0.5">Your personal history (stored locally)</p>
                </div>
              </div>
              
              {allPosts.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-red-300/60 hover:text-red-300 transition-colors px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20 hover:border-red-500/40"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Stats */}
        {stats && stats.totalToday > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                <div className="text-white/50 text-xs mb-1">Today</div>
                <div className="text-2xl font-bold text-white">{stats.totalToday}</div>
              </div>
              <div className="bg-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-purple-400/20 text-center">
                <div className="text-purple-300/70 text-xs mb-1">Avg Uniqueness</div>
                <div className="text-2xl font-bold text-purple-300">{stats.avgUniqueness}%</div>
              </div>
              <div className="bg-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-purple-400/20 text-center">
                <div className="text-purple-300/70 text-xs mb-1">Unique</div>
                <div className="text-2xl font-bold text-purple-300">{stats.totalUnique}</div>
              </div>
              <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-400/20 text-center">
                <div className="text-blue-300/70 text-xs mb-1">Common</div>
                <div className="text-2xl font-bold text-blue-300">{stats.totalCommon}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="flex gap-2 bg-white/5 rounded-xl p-1 border border-white/10 inline-flex">
            <button
              onClick={() => setTab('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'today'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Today ({todaysPosts.length})
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              All Time ({allPosts.length})
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        <main className="max-w-7xl mx-auto px-4 pb-8 flex-1">
          {displayPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-bold text-white mb-2">
                {tab === 'today' ? 'No posts today yet' : 'No posts yet'}
              </h2>
              <p className="text-white/60 mb-6">
                {tab === 'today' 
                  ? 'Create your first post to see it here!'
                  : 'Your post history will appear here (stored locally)'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayPosts.map((post) => {
                const isUnique = post.uniquenessScore >= 70
                return (
                  <a
                    key={post.id}
                    href={post.viewUrl}
                    className="block bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl hover:border-purple-400/30 transition-all hover:scale-[1.02] p-4"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        isUnique 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      }`}>
                        {isUnique ? '✨ Unique' : '👥 Common'}
                      </div>
                      <div className="text-white/40 text-xs capitalize">{post.scope}</div>
                    </div>

                    {/* Content */}
                    <p className="text-white/90 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className={`text-2xl font-bold ${
                          isUnique ? 'text-purple-300' : 'text-blue-300'
                        }`}>
                          {post.uniquenessScore}%
                        </div>
                        <div className="text-white/40 text-xs">
                          · {post.matchCount + 1} total
                        </div>
                      </div>
                      <div className="text-white/40 text-xs">
                        {new Date(post.timestamp).toLocaleTimeString([], { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}

