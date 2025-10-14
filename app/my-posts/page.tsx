'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import Footer from '@/components/Footer'
import { getMyPosts, getTodaysPosts, getMyPostsStats, clearMyPosts, refreshAllReactions } from '@/lib/utils/my-posts'
import type { MyPost } from '@/lib/utils/my-posts'

export default function MyPostsPage() {
  const router = useRouter()
  const [allPosts, setAllPosts] = useState<MyPost[]>([])
  const [todaysPosts, setTodaysPosts] = useState<MyPost[]>([])
  const [stats, setStats] = useState<ReturnType<typeof getMyPostsStats> | null>(null)
  const [tab, setTab] = useState<'today' | 'all'>('today')
  const [loadingReactions, setLoadingReactions] = useState(false)

  useEffect(() => {
    loadPosts()
    loadReactions()
  }, [])

  const loadPosts = () => {
    const all = getMyPosts()
    const today = getTodaysPosts()
    const postStats = getMyPostsStats()
    
    setAllPosts(all)
    setTodaysPosts(today)
    setStats(postStats)
  }

  const loadReactions = async () => {
    setLoadingReactions(true)
    await refreshAllReactions()
    loadPosts()
    setLoadingReactions(false)
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
          <div className="max-w-6xl mx-auto px-4 py-4">
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
                  <p className="text-white/50 text-xs mt-0.5">Stored locally on your device</p>
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
          <div className="max-w-6xl mx-auto px-4 py-6 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                <div className="text-white/50 text-xs mb-1">Today</div>
                <div className="text-2xl font-bold text-white">{stats.totalToday}</div>
              </div>
              <div className="bg-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-purple-400/20 text-center">
                <div className="text-purple-300/70 text-xs mb-1">Avg Score</div>
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
        <div className="max-w-6xl mx-auto px-4 pb-4 w-full">
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
        <main className="max-w-6xl mx-auto px-4 pb-8 flex-1 w-full">
          {displayPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-bold text-white mb-2">
                {tab === 'today' ? 'No posts today yet' : 'No posts yet'}
              </h2>
              <p className="text-white/60 mb-6">
                {tab === 'today' 
                  ? 'Create your first post to see it here!'
                  : 'Your post history will appear here'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayPosts.map((post) => {
                const isUnique = post.uniquenessScore >= 70
                
                return (
                  <a
                    key={post.id}
                    href={post.viewUrl}
                    className={`group relative rounded-2xl p-4 backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col justify-between min-h-[160px] ${
                      isUnique
                        ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-400/30 hover:border-purple-400/60'
                        : 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-400/30 hover:border-blue-400/60'
                    }`}
                  >
                    {/* Share Button - Top Right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const shareUrl = `${window.location.origin}${post.viewUrl}`
                        if (navigator.share) {
                          navigator.share({
                            title: 'OnlyOne.Today',
                            text: `Check out: "${post.content}"`,
                            url: shareUrl,
                          }).catch(() => {})
                        } else {
                          navigator.clipboard.writeText(shareUrl)
                          alert('Link copied!')
                        }
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/10 hover:bg-white/20"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>

                    {/* Content - Center */}
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-white/90 text-sm leading-relaxed text-center line-clamp-3">
                        {post.content}
                      </p>
                    </div>

                    {/* Bottom Section */}
                    <div className="space-y-2">
                      {/* Metrics Row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-purple-300/80">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span className="font-medium">{post.uniquenessScore}%</span>
                          </div>
                          <span className="text-white/30">·</span>
                          <div className="flex items-center gap-1 text-blue-300/80">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium">{post.matchCount + 1}</span>
                          </div>
                        </div>
                        <span className="text-white/50">
                          {new Date(post.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Reactions & Scope Row */}
                      <div className="flex items-center justify-between">
                        {/* Reactions */}
                        {post.reactions && post.reactions.total_reactions > 0 ? (
                          <div className="flex gap-1">
                            {post.reactions.funny_count > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-yellow-500/20 text-white/80">
                                <span className="text-xs">😂</span>
                                <span className="text-[10px]">{post.reactions.funny_count}</span>
                              </div>
                            )}
                            {post.reactions.creative_count > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-purple-500/20 text-white/80">
                                <span className="text-xs">🎨</span>
                                <span className="text-[10px]">{post.reactions.creative_count}</span>
                              </div>
                            )}
                            {post.reactions.must_try_count > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-green-500/20 text-white/80">
                                <span className="text-xs">🔥</span>
                                <span className="text-[10px]">{post.reactions.must_try_count}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div></div>
                        )}
                        {/* Scope */}
                        <span className="text-white/40 text-[10px] capitalize">{post.scope}</span>
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
