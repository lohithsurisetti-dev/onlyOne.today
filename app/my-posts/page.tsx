'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import Footer from '@/components/Footer'
import { getMyPosts, getTodaysPosts, getMyPostsStats, clearMyPosts, refreshAllReactions } from '@/lib/utils/my-posts'
import { getSiteUrl } from '@/lib/config/site'
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
        <header className="sticky top-0 z-40 border-b border-white/10 bg-space-dark/90 backdrop-blur-md">
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
        <div className="sticky top-[73px] z-30 bg-space-dark/90 backdrop-blur-md max-w-6xl mx-auto px-4 py-4 w-full">
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
                // Determine tier based on percentile data (if available) or fall back to uniqueness score
                const isTopTier = post.percentile?.tier 
                  ? ['elite', 'rare', 'unique', 'notable'].includes(post.percentile.tier)
                  : post.uniquenessScore >= 70 // Fallback for old localStorage posts
                
                const getScopeIcon = () => {
                  const iconClass = "w-3 h-3"
                  switch (post.scope) {
                    case 'city':
                      return <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24"><path d="M12 11.5A2.5 2.5 0 019.5 9 2.5 2.5 0 0112 6.5 2.5 2.5 0 0114.5 9a2.5 2.5 0 01-2.5 2.5M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"/></svg>
                    case 'state':
                      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    case 'country':
                      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                    default:
                      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  }
                }
                
                return (
                  <a
                    key={post.id}
                    href={post.viewUrl}
                    className={`group relative rounded-xl p-3 backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col ${
                      isTopTier
                        ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-400/30 hover:border-purple-400/60'
                        : 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-400/30 hover:border-blue-400/60'
                    }`}
                    style={{ minHeight: '140px' }}
                  >
                    {/* Share Button - Top Right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const shareUrl = `${getSiteUrl()}${post.viewUrl}`
                        if (navigator.share) {
                          navigator.share({
                            title: 'OnlyOne Today',
                            text: `Check out: "${post.content}"`,
                            url: shareUrl,
                          }).catch(() => {})
                        } else {
                          navigator.clipboard.writeText(shareUrl)
                          alert('Link copied!')
                        }
                      }}
                      className="absolute top-2 right-2 opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/10 hover:bg-white/20"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>

                    {/* Content - Center */}
                    <div className="flex-1 flex items-center justify-center py-2 px-2">
                      <p className="text-white/90 text-[15px] leading-snug text-center break-words">
                        {post.content}
                      </p>
                    </div>

                    {/* Footer - Same as feed cards */}
                    <div className="space-y-1.5">
                      {/* Score Badge (percentile if available, else uniqueness score) */}
                      <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-bold text-[10px] text-white">
                            {post.percentile?.displayText || `${post.uniquenessScore}%`}
                          </span>
                        </div>
                        <span className="text-[9px] text-white/50 font-medium">
                          {post.percentile?.comparison || `${post.matchCount + 1} people`}
                        </span>
                      </div>

                      {/* Metadata & Reactions Row */}
                      <div className="space-y-1">
                        {/* Scope + Time */}
                        <div className="flex items-center justify-between text-[10px] text-white/50">
                          <span className="flex items-center gap-0.5">
                            {getScopeIcon()}
                            <span className="font-medium capitalize">{post.scope}</span>
                          </span>
                          <span className="whitespace-nowrap">
                            {new Date(post.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Reactions */}
                        {post.reactions && post.reactions.total_reactions > 0 && (
                          <div className="flex gap-1">
                            {post.reactions.funny_count > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20">
                                <span className="text-xs">😂</span>
                                <span className="text-[9px] text-white/80">{post.reactions.funny_count}</span>
                              </div>
                            )}
                            {post.reactions.creative_count > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20">
                                <span className="text-xs">🎨</span>
                                <span className="text-[9px] text-white/80">{post.reactions.creative_count}</span>
                              </div>
                            )}
                            {post.reactions.must_try_count > 0 && (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/20">
                                <span className="text-xs">🔥</span>
                                <span className="text-[9px] text-white/80">{post.reactions.must_try_count}</span>
                              </div>
                            )}
                          </div>
                        )}
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
