'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import DaySummaryCard, { DaySummaryPost } from '@/components/feed/DaySummaryCard'
import Footer from '@/components/Footer'
import { useRecentPosts } from '@/lib/hooks/usePosts'
import { useDetectLocation } from '@/lib/hooks/useDetectLocation'

export default function DaySummariesPage() {
  const router = useRouter()
  
  // Location detection
  const { location, locationError } = useDetectLocation()
  const [scopeFilter, setScopeFilter] = useState<'city' | 'state' | 'country' | 'world'>('world')
  const [currentPage, setCurrentPage] = useState(1)
  const POSTS_PER_PAGE = 12

  // Fetch posts (only day summaries)
  const { posts, total, loading, error, refetch } = useRecentPosts({
    limit: 100, // Fetch more to filter client-side
    scopeFilter,
    location: scopeFilter !== 'world' ? location : undefined,
  })

  // Filter to only show day summaries
  const daySummaries = useMemo(() => {
    return posts.filter(post => (post as any).input_type === 'day') as DaySummaryPost[]
  }, [posts])

  // Pagination
  const totalPages = Math.ceil(daySummaries.length / POSTS_PER_PAGE)
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE
    return daySummaries.slice(start, start + POSTS_PER_PAGE)
  }, [daySummaries, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [scopeFilter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-space-darker/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Back Button + Title */}
              <div className="flex items-center gap-3">
                <Link
                  href="/feed"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    Day Summaries
                  </h1>
                  <p className="text-xs text-white/60">
                    {daySummaries.length} {daySummaries.length === 1 ? 'day' : 'days'} shared today
                  </p>
                </div>
              </div>

              {/* Home Button */}
              <Link
                href="/"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-white shadow-lg transition-all"
              >
                + Share Your Day
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
          {/* Scope Filter */}
          <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pb-2">
            {(['world', 'country', 'state', 'city'] as const).map((scope) => (
              <button
                key={scope}
                onClick={() => setScopeFilter(scope)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  scopeFilter === scope
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {scope.charAt(0).toUpperCase() + scope.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-[220px] bg-white/5 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Failed to load day summaries</p>
              <button
                onClick={() => refetch()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && daySummaries.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Day Summaries Yet</h2>
              <p className="text-white/60 mb-6">Be the first to share your day!</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-white shadow-lg transition-all"
              >
                Share Your Day
              </Link>
            </div>
          )}

          {/* Day Summaries Grid */}
          {!loading && !error && paginatedPosts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {paginatedPosts.map((post) => (
                  <DaySummaryCard
                    key={post.id}
                    post={post}
                    onShare={(p) => {
                      // Implement share functionality
                      if (navigator.share) {
                        navigator.share({
                          title: 'OnlyOne Today - Day Summary',
                          text: p.content,
                          url: window.location.origin,
                        }).catch(() => {})
                      }
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <span className="px-4 py-2 bg-white/10 rounded-lg text-white font-medium">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}

