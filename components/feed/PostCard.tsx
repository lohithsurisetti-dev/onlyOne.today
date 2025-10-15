'use client'

import React, { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface DisplayPost {
  id: string | number
  content: string
  type: 'unique' | 'common'
  time: string
  scope?: 'city' | 'state' | 'country' | 'world'
  location_city?: string | null
  location_state?: string | null
  location_country?: string | null
  score?: number
  count?: number
  source?: 'reddit' | 'spotify' | 'google' | 'github' | 'google-trends' | 'youtube' | 'twitter' | 'curated' | 'sports'
  funny_count?: number
  creative_count?: number
  must_try_count?: number
  total_reactions?: number
  isGhost?: boolean
}

export interface PostCardProps {
  post: DisplayPost
  onReact?: (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => void
  onShare?: (post: DisplayPost) => void
  onGhostClick?: () => void
  userReactions?: Set<string>
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get scope icon and label with actual location name
 */
const getScopeInfo = (scope?: string, post?: DisplayPost) => {
  const scopes: Record<string, { iconSvg: JSX.Element; getLabel: (p?: DisplayPost) => string }> = {
    'city': { 
      iconSvg: (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 11.5A2.5 2.5 0 019.5 9 2.5 2.5 0 0112 6.5 2.5 2.5 0 0114.5 9a2.5 2.5 0 01-2.5 2.5M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"/>
        </svg>
      ),
      getLabel: (p) => p?.location_city || 'City' 
    },
    'state': { 
      iconSvg: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      getLabel: (p) => p?.location_state || 'State' 
    },
    'country': { 
      iconSvg: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      getLabel: (p) => p?.location_country || 'Country' 
    },
    'world': { 
      iconSvg: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      getLabel: () => 'World' 
    },
  }
  const scopeData = scopes[scope || 'world'] || scopes['world']
  return {
    iconSvg: scopeData.iconSvg,
    label: scopeData.getLabel(post)
  }
}

/**
 * Get source icon for ghost posts
 */
const getSourceIcon = (source?: string) => {
  const icons: Record<string, JSX.Element> = {
    'spotify': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
    'reddit': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
    ),
    'google': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    'github': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
    'youtube': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    'twitter': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    'instagram': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
      </svg>
    ),
    'sports': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
      </svg>
    ),
    'curated': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  }
  return icons[source || ''] || (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ============================================================================
// POST CARD COMPONENT
// ============================================================================

const PostCard = React.memo(({ post, onReact, onShare, onGhostClick, userReactions }: PostCardProps) => {
  const uniquenessScore = post.score || 0
  const commonalityScore = 100 - uniquenessScore
  const matchCount = post.count || 0
  const isGhost = post.isGhost || false
  const [expanded, setExpanded] = useState(false)
  
  const [reactions, setReactions] = useState({
    funny: post.funny_count || 0,
    creative: post.creative_count || 0,
    must_try: post.must_try_count || 0,
  })
  
  // Determine if content needs truncation
  const needsTruncation = post.content.length > 80
  const displayContent = expanded || !needsTruncation ? post.content : post.content.substring(0, 80) + '...'
  
  const handleReaction = async (reactionType: 'funny' | 'creative' | 'must_try') => {
    // Ghost posts can't be reacted to
    if (isGhost) return
    
    if (onReact) {
      onReact(post.id, reactionType)
      
      // Optimistic update
      setReactions(prev => ({
        ...prev,
        [reactionType]: userReactions?.has(`${post.id}-${reactionType}`) 
          ? Math.max(0, prev[reactionType] - 1)
          : prev[reactionType] + 1
      }))
    }
  }
  
  // Determine gradient based on dominant trait
  const getCardStyle = () => {
    // Special styling for ghost posts
    if (isGhost) {
      return 'bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-400/40 hover:border-orange-400/70 shadow-orange-500/10'
    }
    
    // Unique posts (70%+)
    if (uniquenessScore >= 70) {
      return 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-400/30 hover:border-purple-400/60'
    } 
    // Common posts (< 70%)
    else {
      return 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-400/30 hover:border-blue-400/60'
    }
  }
  
  return (
    <div
      className={`group relative rounded-2xl p-4 md:p-3 backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col justify-between ${getCardStyle()}`}
      style={{ minHeight: '160px' }}
    >
      {/* Source Icon for Ghost Posts - Top Center (Fixed Position) */}
      {isGhost && post.source && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-70 group-hover:opacity-90 transition-opacity">
          {getSourceIcon(post.source)}
        </div>
      )}
      
      {/* Share Button - Top Right (Always visible on mobile, hover on desktop) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onShare?.(post)
        }}
        className="absolute top-2 right-2 opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:opacity-100 transition-opacity p-3 md:p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
        title="Share this post"
      >
        <svg className="w-5 h-5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      
      {/* Content - Center Aligned */}
      <div className="flex-1 flex items-center justify-center">
        <div className={isGhost ? 'mt-4' : ''}>
          <p className={`text-base md:text-sm leading-relaxed md:leading-snug text-center ${isGhost ? 'text-white/60 italic' : 'text-white/90'} group-hover:text-white`}>
            {displayContent}
          </p>
          {needsTruncation && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-sm md:text-xs text-purple-300/70 hover:text-purple-300 mt-1 block mx-auto"
            >
              Read more
            </button>
          )}
        </div>
      </div>
      
      {/* Footer - Show Both Metrics (Bottom Aligned) */}
      <div className={`flex items-center text-xs mb-1.5 ${isGhost ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-purple-300/80">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="font-medium">{uniquenessScore}%</span>
          </span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-1 text-blue-300/80">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-medium">{isGhost ? matchCount.toLocaleString() : matchCount}</span>
          </span>
        </div>
        {!isGhost && <span className="text-white/50">{post.time}</span>}
      </div>
      
      {/* Reactions - Hidden for ghost posts */}
      {!isGhost && (
        <div className="flex items-center justify-between">
        <div className="flex gap-1.5 md:gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleReaction('funny')
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 md:px-1.5 md:py-0.5 rounded-full text-sm md:text-xs transition-all min-h-[44px] md:min-h-0 ${
              userReactions?.has(`${post.id}-funny`)
                ? 'bg-yellow-500/40 scale-105'
                : 'bg-white/5 hover:bg-yellow-500/20 hover:scale-105'
            }`}
          >
            <span className="text-base md:text-xs">😂</span>
            {reactions.funny > 0 && <span className="text-white/80">{reactions.funny}</span>}
          </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleReaction('creative')
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 md:px-1.5 md:py-0.5 rounded-full text-sm md:text-xs transition-all min-h-[44px] md:min-h-0 ${
            userReactions?.has(`${post.id}-creative`)
              ? 'bg-purple-500/40 scale-105'
              : 'bg-white/5 hover:bg-purple-500/20 hover:scale-105'
          }`}
        >
          <span className="text-base md:text-xs">🎨</span>
          {reactions.creative > 0 && <span className="text-white/80">{reactions.creative}</span>}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleReaction('must_try')
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 md:px-1.5 md:py-0.5 rounded-full text-sm md:text-xs transition-all min-h-[44px] md:min-h-0 ${
            userReactions?.has(`${post.id}-must_try`)
              ? 'bg-green-500/40 scale-105'
              : 'bg-white/5 hover:bg-green-500/20 hover:scale-105'
          }`}
        >
          <span className="text-base md:text-xs">🔥</span>
          {reactions.must_try > 0 && <span className="text-white/80">{reactions.must_try}</span>}
        </button>
          </div>
          
          {/* Scope Badge - Right Aligned, Very Small */}
          <span className="flex items-center gap-0.5 text-white/40 text-[10px]" title={`Compared in ${getScopeInfo(post.scope, post).label}`}>
            <span className="scale-75">
              {getScopeInfo(post.scope, post).iconSvg}
            </span>
            <span className="font-medium">{getScopeInfo(post.scope, post).label}</span>
          </span>
        </div>
      )}
      
    </div>
  )
})

PostCard.displayName = 'PostCard'

export default PostCard

