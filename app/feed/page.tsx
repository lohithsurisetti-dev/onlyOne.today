'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StarsBackground from '@/components/StarsBackground'
import ShareModal from '@/components/ShareModal'
import TopPerformersCard from '@/components/TopPerformersCard'
import GlobalPulseCard from '@/components/GlobalPulseCard'
import MyPostsCard from '@/components/MyPostsCard'
import Footer from '@/components/Footer'
import FilterSheet from '@/components/FilterSheet'
import TimezonePills from '@/components/TimezonePills'
import { useRecentPosts } from '@/lib/hooks/usePosts'
import { usePlatformStats } from '@/lib/hooks/useStats'
import { getShareMessage } from '@/lib/services/witty-messages'
import { detectVibeSync } from '@/lib/services/vibe-detector'
import { formatGhostPost, isGhostPost } from '@/lib/services/ghost-posts'
import { fetchTrendingPosts } from '@/lib/services/trending-client'
import { TrendingInfoSkeleton } from '@/components/PostCardSkeleton'

// ============================================================================
// EXTRACTED COMPONENTS
// ============================================================================
import FilterBar, { FilterType, ScopeFilter, ReactionFilter, LocationData } from '@/components/feed/FilterBar'
import PostGrid from '@/components/feed/PostGrid'
import PaginationControls from '@/components/feed/PaginationControls'
import { DisplayPost } from '@/components/feed/PostCard'

// ============================================================================
// TYPES
// ============================================================================

interface UserLocation {
  city: string
  state: string
  country: string
  countryCode: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`
    }
  }
  
  return 'just now'
}

// ============================================================================
// MAIN FEED PAGE COMPONENT
// ============================================================================

export default function FeedPage() {
  const router = useRouter()
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Timezone & Stats
  const [selectedTimezone, setSelectedTimezone] = useState<string | undefined>(undefined)
  const { stats, userTimezone } = usePlatformStats(selectedTimezone)
  
  // Filters
  const [filter, setFilter] = useState<FilterType>('all')
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('world')
  const [reactionFilter, setReactionFilter] = useState<ReactionFilter>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 24
  
  // UI State
  const [refreshKey, setRefreshKey] = useState(0)
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
  const [reactionCooldowns, setReactionCooldowns] = useState<Map<string, number>>(new Map())
  const [mobileStatsExpanded, setMobileStatsExpanded] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<DisplayPost | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false)
  
  // Location
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  
  // Trending
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingRefreshKey, setTrendingRefreshKey] = useState(0)
  const [trendingRetryAttempt, setTrendingRetryAttempt] = useState(0)
  
  // Posts
  const [allPosts, setAllPosts] = useState<DisplayPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  
  // Popular timezones for quick switching
  const popularTimezones = [
    { name: 'auto', label: 'My Time', emoji: '📍' },
    { name: 'America/New_York', label: 'NYC', emoji: '🗽' },
    { name: 'America/Los_Angeles', label: 'LA', emoji: '🌴' },
    { name: 'Europe/London', label: 'London', emoji: '🇬🇧' },
    { name: 'Asia/Tokyo', label: 'Tokyo', emoji: '🇯🇵' },
    { name: 'Asia/Dubai', label: 'Dubai', emoji: '🇦🇪' },
    { name: 'Australia/Sydney', label: 'Sydney', emoji: '🇦🇺' },
  ]
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EFFECTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Persist filter state
  useEffect(() => {
    const savedFilter = localStorage.getItem('feedFilter') as FilterType | null
    if (savedFilter) {
      setFilter(savedFilter)
    }
  }, [])
  
  useEffect(() => {
    localStorage.setItem('feedFilter', filter)
  }, [filter])
  
  // Auto-load location on mount if permission was previously granted
  useEffect(() => {
    const previousPermission = localStorage.getItem('locationPermission')
    if (previousPermission === 'granted') {
      fetch('/api/location')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.location) {
            setUserLocation(data.location)
            console.log('📍 Auto-loaded location:', data.location)
          }
        })
        .catch(err => console.error('Failed to auto-load location:', err))
    }
  }, [])
  
  // Reset scope and reaction filters when switching to trending
  useEffect(() => {
    if (filter === 'trending') {
      setScopeFilter('world')
      setReactionFilter('all')
    }
  }, [filter])
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, scopeFilter, reactionFilter])
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOCATION DETECTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const detectUserLocation = async () => {
    const previousPermission = localStorage.getItem('locationPermission')
    let granted = previousPermission === 'granted'
    
    if (!previousPermission) {
      granted = window.confirm(
        "📍 Location Permission Required\n\n" +
        "To filter posts by your location, we need to detect your city/state/country.\n\n" +
        "• We only use your city/state/country for filtering\n" +
        "• Your exact location is never stored\n" +
        "• This is optional\n\n" +
        "Allow location detection?"
      )
      
      localStorage.setItem('locationPermission', granted ? 'granted' : 'denied')
    }
    
    if (!granted) {
      alert("Location permission denied. You can only use 'Worldwide' filter.")
      setScopeFilter('world')
      return
    }
    
    try {
      const response = await fetch('/api/location')
      const data = await response.json()
      if (data.success && data.location) {
        setUserLocation(data.location)
        console.log('📍 User location detected:', data.location)
      }
    } catch (error) {
      console.error('Failed to detect location:', error)
      alert("Failed to detect location. Using 'Worldwide' filter instead.")
      setScopeFilter('world')
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleShare = (post: DisplayPost) => {
    setSelectedPost(post)
    setShareModalOpen(true)
  }
  
  const getShareMessageForPost = (post: DisplayPost) => {
    return getShareMessage({
      uniquenessScore: post.score || 0,
      matchCount: post.count || 0,
      isDare: true,
    })
  }
  
  const handleReaction = async (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => {
    const reactionKey = `${postId}-${reactionType}`
    const now = Date.now()
    const cooldownTime = 1000
    
    // Check cooldown
    const lastReactionTime = reactionCooldowns.get(reactionKey) || 0
    if (now - lastReactionTime < cooldownTime) {
      console.log('⏱️ Reaction throttled (too fast)')
      return
    }
    
    // Update cooldown
    setReactionCooldowns(prev => new Map(prev).set(reactionKey, now))
    
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: String(postId), reactionType }),
      })
      
      if (response.ok) {
        setUserReactions(prev => {
          const newSet = new Set(prev)
          if (newSet.has(reactionKey)) {
            newSet.delete(reactionKey)
          } else {
            newSet.add(reactionKey)
          }
          return newSet
        })
        
        setTimeout(() => setRefreshKey(prev => prev + 1), 500)
      } else if (response.status === 429) {
        const data = await response.json()
        alert(data.message || 'Too many reactions. Please slow down.')
      }
    } catch (error) {
      console.error('❌ Failed to add reaction:', error)
    }
  }
  
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }
  
  const handleScopeFilterChange = async (newScope: ScopeFilter) => {
    // If switching to a location-based scope, ensure we have location
    if (newScope !== 'world' && newScope !== 'all' && !userLocation) {
      await detectUserLocation()
    }
    setScopeFilter(newScope)
    setCurrentPage(1)
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA FETCHING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const apiFilter = filter === 'trending' ? 'all' : filter
  const offset = (currentPage - 1) * postsPerPage
  const { 
    posts: apiPosts, 
    total: totalPosts, 
    loading: apiLoading, 
    error 
  } = useRecentPosts(
    apiFilter, 
    postsPerPage, 
    offset, 
    refreshKey,
    scopeFilter,
    reactionFilter,
    userLocation || undefined
  )
  
  // Transform API posts and inject ghost posts for trending
  useEffect(() => {
    if (apiLoading) return
    
    const loadPostsWithGhosts = async () => {
      setPostsLoading(true)
      
      // Transform real posts
      const realPosts: DisplayPost[] = apiPosts.map(post => ({
          id: post.id,
          content: post.content,
        type: post.uniqueness_score >= 70 ? 'unique' : 'common',
          time: formatTimeAgo(new Date(post.created_at)),
        scope: post.scope,
        location_city: post.location_city,
        location_state: post.location_state,
        location_country: post.location_country,
        score: post.uniqueness_score,
        count: post.match_count + 1,
          funny_count: post.funny_count || 0,
          creative_count: post.creative_count || 0,
          must_try_count: post.must_try_count || 0,
          total_reactions: post.total_reactions || 0,
          isGhost: false,
      }))
      
      let postsWithGhosts: DisplayPost[]
      
      // Fetch ghost posts only for trending
      if (filter === 'trending') {
        console.log('🔄 Fetching trending posts...')
        setTrendingLoading(true)
        setTrendingRetryAttempt(0)
        
        const forceRefresh = trendingRefreshKey > 0
        
        // Retry logic with exponential backoff
        const fetchWithRetry = async (maxRetries = 3): Promise<any[]> => {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            setTrendingRetryAttempt(attempt)
            
            try {
              console.log(`🔄 Attempt ${attempt}/${maxRetries}${forceRefresh ? ' (FORCE REFRESH)' : ''}`)
              const posts = await fetchTrendingPosts(30, forceRefresh && attempt === 1)
              
              if (posts.length > 0) {
                console.log(`✅ Got ${posts.length} trending posts`)
                return posts
              }
              
              console.warn(`⚠️ Attempt ${attempt} returned 0 posts`)
              
              if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                console.log(`⏳ Waiting ${delay}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, delay))
              }
            } catch (error) {
              console.error(`❌ Attempt ${attempt} failed:`, error)
              
              if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                await new Promise(resolve => setTimeout(resolve, delay))
              }
            }
          }
          
          console.warn('⚠️ All retry attempts exhausted')
          return []
        }
        
        try {
          const ghostPosts = await fetchWithRetry(3)
          
          if (ghostPosts.length > 0) {
            postsWithGhosts = [...realPosts, ...ghostPosts].sort(() => Math.random() - 0.5)
          } else {
            console.warn('⚠️ No trending posts, showing real posts only')
            postsWithGhosts = realPosts
          }
        } catch (error) {
          console.error('❌ Failed to fetch trending:', error)
          postsWithGhosts = realPosts
        } finally {
          setTrendingLoading(false)
          setTrendingRetryAttempt(0)
        }
      } else {
        postsWithGhosts = realPosts
      }
      
      // Convert ghost posts to display format
      const displayPosts = postsWithGhosts.map(post => {
        if (isGhostPost(post)) {
          return formatGhostPost(post)
        }
        return post
      })
      
      setAllPosts(displayPosts)
      setPostsLoading(false)
    }
    
    loadPostsWithGhosts()
  }, [apiPosts, apiLoading, filter, trendingRefreshKey])
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST FILTERING & PAGINATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const filteredPosts = React.useMemo(() => {
    if (filter === 'trending') {
      return allPosts.filter(post => post.isGhost)
    } else {
      return allPosts.filter(post => !post.isGhost)
    }
  }, [allPosts, filter])
  
  const totalPages = filter === 'trending' 
    ? Math.ceil(filteredPosts.length / postsPerPage)
    : Math.ceil(totalPosts / postsPerPage)
  
  const currentPosts = filter === 'trending'
    ? filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
    : filteredPosts
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      {/* Floating Plus Button */}
      <button
        onClick={() => router.push('/')}
        className="fixed bottom-24 right-6 z-50 group"
        title="Post something new"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-40 blur-xl group-hover:opacity-60 transition-all duration-300 animate-pulse"></div>
        
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 shadow-2xl hover:shadow-purple-500/60 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border-2 border-white/20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
          
          <svg className="w-7 h-7 text-white relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        </div>
      </button>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Filter Bar */}
        <FilterBar
          filter={filter}
          scopeFilter={scopeFilter}
          reactionFilter={reactionFilter}
          onFilterChange={handleFilterChange}
          onScopeFilterChange={handleScopeFilterChange}
          onReactionFilterChange={setReactionFilter}
          userLocation={userLocation || undefined}
          trendingLoading={trendingLoading}
          trendingRetryAttempt={trendingRetryAttempt}
          filterSheetOpen={filterSheetOpen}
          onFilterSheetToggle={setFilterSheetOpen}
          onBackClick={() => router.push('/')}
        />
        
        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          <div className="flex gap-6">
            {/* Posts Grid */}
            <div className="flex-1">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-white mb-4">
                  <p className="font-semibold">❌ Error loading posts</p>
                  <p className="text-sm text-white/70">{error}</p>
                </div>
              )}
              
              <PostGrid
                posts={currentPosts}
                loading={postsLoading || apiLoading}
                onReact={handleReaction}
                onShare={handleShare}
                userReactions={userReactions}
                emptyMessage={
                  filter === 'trending'
                    ? "No trending posts available right now. Check back soon!"
                    : "No posts yet. Be the first to share what you did today!"
                }
              />
            </div>
            
            {/* Sidebar (Desktop Only) */}
            <aside className="hidden lg:block w-80">
              <div className="sticky top-24 space-y-4">
                <MyPostsCard />
                
                {filter === 'trending' ? (
                  trendingLoading ? (
                    <TrendingInfoSkeleton />
                  ) : (
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl border border-orange-400/20 shadow-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                          <svg className="w-6 h-6 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Trending Globally</h3>
                          <p className="text-xs text-orange-200/60">What the world is talking about</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {currentPosts.length > 0 && (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-xs font-semibold text-orange-300 uppercase mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                              </svg>
                              <span>Top Trending</span>
                            </div>
                            
                            <div className="space-y-2">
                              {currentPosts.slice(0, 5).map((post, idx) => (
                                <div key={post.id} className="flex items-start gap-2 text-white/80 text-sm">
                                  <span className="text-orange-300 font-bold text-xs mt-0.5">#{idx + 1}</span>
                                  <p className="line-clamp-2 text-xs">{post.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-white/40 text-xs italic text-center">
                          Powered by live data from Spotify, Reddit, YouTube, Sports & more
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    <GlobalPulseCard posts={filteredPosts} />
                    <TopPerformersCard userLocation={userLocation || undefined} />
                  </>
                )}
              </div>
            </aside>
          </div>
        </main>
        
        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          showTrendingRefresh={filter === 'trending'}
          onTrendingRefresh={() => setTrendingRefreshKey(prev => prev + 1)}
          trendingLoading={trendingLoading}
        />
        
        {/* Footer */}
        <Footer />
      </div>
      
      {/* Share Modal */}
      {shareModalOpen && selectedPost && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false)
            setSelectedPost(null)
          }}
          content={selectedPost.content}
          score={selectedPost.score || 0}
          type={selectedPost.type === 'unique' ? 'uniqueness' : 'commonality'}
          message={getShareMessageForPost(selectedPost)}
          rank={(selectedPost.score ?? 0) >= 95 ? '🏆 Legendary' : (selectedPost.score ?? 0) >= 70 ? '✨ Unique' : '👥 Common'}
          vibe={detectVibeSync(selectedPost.content)}
          scope={selectedPost.scope}
        />
      )}
      
      {/* Mobile Filter Sheet - Comprehensive */}
      {filterSheetOpen && (
        <FilterSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
        >
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Filters & View</h2>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* TYPE FILTERS */}
            <div>
              <label className="text-sm font-medium text-white/80 block mb-3">Post Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['all', 'unique', 'common', 'trending'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      filter === f
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {f === 'all' ? '📋 All' :
                     f === 'unique' ? '✨ Unique' :
                     f === 'common' ? '👥 Common' :
                     '🔥 Trending'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* SCOPE FILTERS */}
            {filter !== 'trending' && (
              <div>
                <label className="text-sm font-medium text-white/80 block mb-3">Location Scope</label>
                <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={async () => {
                      if (!userLocation) await detectUserLocation()
                      handleScopeFilterChange('city')
                    }}
                    disabled={!userLocation?.city}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      scopeFilter === 'city'
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : !userLocation?.city
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    📍 {userLocation?.city || 'City'}
                </button>
              <button
                    onClick={async () => {
                      if (!userLocation) await detectUserLocation()
                      handleScopeFilterChange('state')
                    }}
                    disabled={!userLocation?.state}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      scopeFilter === 'state'
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : !userLocation?.state
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    🗺️ {userLocation?.state || 'State'}
              </button>
              <button
                    onClick={async () => {
                      if (!userLocation) await detectUserLocation()
                      handleScopeFilterChange('country')
                    }}
                    disabled={!userLocation?.country}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      scopeFilter === 'country'
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : !userLocation?.country
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    🏳️ {userLocation?.country || 'Country'}
              </button>
              <button
                    onClick={() => handleScopeFilterChange('world')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      scopeFilter === 'world'
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    🌍 World
              </button>
                </div>
              </div>
            )}
            
            {/* REACTION FILTERS */}
            {filter !== 'trending' && (
              <div>
                <label className="text-sm font-medium text-white/80 block mb-3">Filter by Reactions</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReactionFilter('all')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      reactionFilter === 'all'
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    All Posts
                  </button>
              <button
                    onClick={() => setReactionFilter('funny')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  reactionFilter === 'funny'
                        ? 'bg-yellow-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                😂 Funny
              </button>
              <button
                    onClick={() => setReactionFilter('creative')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  reactionFilter === 'creative'
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                🎨 Creative
              </button>
              <button
                    onClick={() => setReactionFilter('must_try')}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  reactionFilter === 'must_try'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                🔥 Must Try
              </button>
              </div>
              </div>
            )}
            
            {/* ANALYTICS SECTION */}
            <div className="border-t border-white/10 pt-6">
              <label className="text-sm font-medium text-white/80 block mb-3">Quick Stats</label>
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Total Posts Today</span>
                  <span className="text-white font-bold">{stats?.today?.totalPosts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Unique Posts</span>
                  <span className="text-purple-300 font-bold">{stats?.today?.uniquePosts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">All Time</span>
                  <span className="text-white/50 font-bold">{stats?.allTime?.totalPosts || 0}</span>
                </div>
              </div>
              
              {/* My Posts Link */}
                  <button
                onClick={() => {
                  setFilterSheetOpen(false)
                  router.push('/my-posts')
                }}
                className="w-full mt-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 rounded-lg p-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-white font-medium">Your Posts</span>
                  </div>
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
            
            {/* APPLY BUTTON */}
            <button
              onClick={() => setFilterSheetOpen(false)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg"
            >
              Apply Filters
            </button>
          </div>
        </FilterSheet>
      )}
    </div>
  )
}
