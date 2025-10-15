'use client'

import React from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type FilterType = 'all' | 'unique' | 'common' | 'trending'
export type ScopeFilter = 'all' | 'city' | 'state' | 'country' | 'world'
export type ReactionFilter = 'all' | 'funny' | 'creative' | 'must_try'

export interface LocationData {
  city?: string
  state?: string
  country?: string
}

export interface FilterBarProps {
  // Filter states
  filter: FilterType
  scopeFilter: ScopeFilter
  reactionFilter: ReactionFilter
  
  // Filter setters
  onFilterChange: (filter: FilterType) => void
  onScopeFilterChange: (scope: ScopeFilter) => void
  onReactionFilterChange: (reaction: ReactionFilter) => void
  
  // Location data
  userLocation?: LocationData
  
  // Loading states
  trendingLoading?: boolean
  trendingRetryAttempt?: number
  
  // Mobile filter sheet
  filterSheetOpen?: boolean
  onFilterSheetToggle?: (open: boolean) => void
  
  // Back navigation
  onBackClick?: () => void
}

// ============================================================================
// FILTER BAR COMPONENT
// ============================================================================

export default function FilterBar({
  filter,
  scopeFilter,
  reactionFilter,
  onFilterChange,
  onScopeFilterChange,
  onReactionFilterChange,
  userLocation,
  trendingLoading = false,
  trendingRetryAttempt = 0,
  filterSheetOpen = false,
  onFilterSheetToggle,
  onBackClick,
}: FilterBarProps) {
  const isTrending = filter === 'trending'
  
  // Toggle filter (active filters become 'all')
  const toggleFilter = (targetFilter: FilterType) => {
    onFilterChange(filter === targetFilter ? 'all' : targetFilter)
  }
  
  // Toggle scope filter (active becomes 'world')
  const toggleScopeFilter = (targetScope: ScopeFilter) => {
    onScopeFilterChange(scopeFilter === targetScope ? 'world' : targetScope)
  }
  
  // Toggle reaction filter (active becomes 'all')
  const toggleReactionFilter = (targetReaction: ReactionFilter) => {
    onReactionFilterChange(reactionFilter === targetReaction ? 'all' : targetReaction)
  }
  
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-space-dark/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* MOBILE HEADER */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Back Button */}
          {onBackClick && (
            <button
              onClick={onBackClick}
              className="text-white/60 hover:text-white transition-colors shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Active Filter Chip */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar justify-between">
            <button
              onClick={() => onFilterSheetToggle?.(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                filter === 'all' ? 'bg-white/20 text-white border border-white/30' :
                filter === 'unique' ? 'bg-purple-500/30 text-white border border-purple-400/50' :
                filter === 'common' ? 'bg-blue-500/30 text-white border border-blue-400/50' :
                'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50'
              }`}
            >
              {filter === 'all' ? '📋 All' :
               filter === 'unique' ? '✨ Unique' :
               filter === 'common' ? '👥 Common' :
               '🔥 Trending'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Location Chip */}
            {userLocation && !isTrending && scopeFilter !== 'world' && (
              <span className="px-3 py-1.5 rounded-full text-xs bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 whitespace-nowrap">
                📍 {scopeFilter === 'city' ? userLocation.city :
                    scopeFilter === 'state' ? userLocation.state :
                    userLocation.country}
              </span>
            )}
            
            {/* Trending Loading Indicator */}
            {trendingLoading && (
              <span className="px-3 py-1.5 rounded-full text-xs bg-orange-500/20 text-orange-200 border border-orange-400/30 whitespace-nowrap flex items-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Loading...
              </span>
            )}
          </div>
        </div>
        
        {/* DESKTOP FILTERS */}
        <div className="hidden md:flex items-center gap-4">
          {/* Back Button */}
          {onBackClick && (
            <button
              onClick={onBackClick}
              className="text-white/60 hover:text-white transition-colors shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Filters */}
          <div className="flex-1 space-y-2">
            {/* Row 1: Type + Scope Filters */}
            <div className="flex flex-wrap gap-1.5 justify-center items-center">
              <span className="text-xs text-white/60 font-medium mr-1">Filter:</span>
              
              {/* Type Filters */}
              <button
                onClick={() => toggleFilter('all')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                All
              </button>
              
              <button
                onClick={() => toggleFilter('unique')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  filter === 'unique'
                    ? 'bg-purple-500/30 text-white border border-purple-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {filter === 'unique' ? (
                  <>
                    <span className="hidden sm:inline">Unique</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="hidden sm:inline">Unique</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => toggleFilter('common')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  filter === 'common'
                    ? 'bg-blue-500/30 text-white border border-blue-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {filter === 'common' ? (
                  <>
                    <span className="hidden sm:inline">Common</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="hidden sm:inline">Common</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => toggleFilter('trending')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  filter === 'trending'
                    ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border border-orange-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {filter === 'trending' ? (
                  <>
                    <span className="hidden sm:inline">Trending</span>
                    {trendingLoading ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="hidden sm:inline">Trending</span>
                  </>
                )}
              </button>
              
              {/* Separator */}
              <div className="w-px h-4 bg-white/20 mx-1"></div>
              
              {/* Scope Filters */}
              <span className="text-xs text-white/60 font-medium">Scope:</span>
              
              <button
                onClick={() => toggleScopeFilter('city')}
                disabled={isTrending || !userLocation?.city}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  scopeFilter === 'city'
                    ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                    : isTrending || !userLocation?.city
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {scopeFilter === 'city' ? (
                  <>
                    <span className="hidden sm:inline">{userLocation?.city || 'City'}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 11.5A2.5 2.5 0 019.5 9 2.5 2.5 0 0112 6.5 2.5 2.5 0 0114.5 9a2.5 2.5 0 01-2.5 2.5M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"/>
                    </svg>
                    <span className="hidden sm:inline">{userLocation?.city || 'City'}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => toggleScopeFilter('state')}
                disabled={isTrending || !userLocation?.state}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  scopeFilter === 'state'
                    ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                    : isTrending || !userLocation?.state
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {scopeFilter === 'state' ? (
                  <>
                    <span className="hidden sm:inline">{userLocation?.state || 'State'}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="hidden sm:inline">{userLocation?.state || 'State'}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => toggleScopeFilter('country')}
                disabled={isTrending || !userLocation?.country}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  scopeFilter === 'country'
                    ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                    : isTrending || !userLocation?.country
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {scopeFilter === 'country' ? (
                  <>
                    <span className="hidden sm:inline">{userLocation?.country || 'Country'}</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    <span className="hidden sm:inline">{userLocation?.country || 'Country'}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => toggleScopeFilter('world')}
                disabled={isTrending}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  scopeFilter === 'world'
                    ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                    : isTrending
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {scopeFilter === 'world' ? (
                  <>
                    <span className="hidden sm:inline">World</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">World</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Row 2: Reaction Filters */}
            <div className="flex flex-wrap gap-1.5 justify-center items-center">
              <span className="text-xs text-white/60 font-medium mr-1">Reactions:</span>
              
              <button
                onClick={() => toggleReactionFilter('funny')}
                disabled={isTrending}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  reactionFilter === 'funny'
                    ? 'bg-yellow-500/30 text-white border border-yellow-400/50'
                    : isTrending
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="text-xs">😂</span>
                <span className="hidden sm:inline">Funny</span>
                {reactionFilter === 'funny' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => toggleReactionFilter('creative')}
                disabled={isTrending}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  reactionFilter === 'creative'
                    ? 'bg-purple-500/30 text-white border border-purple-400/50'
                    : isTrending
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="text-xs">🎨</span>
                <span className="hidden sm:inline">Creative</span>
                {reactionFilter === 'creative' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => toggleReactionFilter('must_try')}
                disabled={isTrending}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  reactionFilter === 'must_try'
                    ? 'bg-green-500/30 text-white border border-green-400/50'
                    : isTrending
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="text-xs">🔥</span>
                <span className="hidden sm:inline">Must Try</span>
                {reactionFilter === 'must_try' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

