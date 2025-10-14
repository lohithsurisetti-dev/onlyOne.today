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
import PostCardSkeleton, { TrendingInfoSkeleton } from '@/components/PostCardSkeleton'

interface UserLocation {
  city: string
  state: string
  country: string
  countryCode: string
}

// Helper function to format time ago
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

interface DisplayPost {
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

interface PostCardProps {
  post: DisplayPost
  onReact?: (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => void
  onShare?: (post: DisplayPost) => void
  onGhostClick?: () => void
  userReactions?: Set<string>
}

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
  
  // Get scope icon and label with actual location name
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
  
  // Get source icon for ghost posts
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

export default function FeedPage() {
  const router = useRouter()
  const [selectedTimezone, setSelectedTimezone] = useState<string | undefined>(undefined)
  const { stats, userTimezone } = usePlatformStats(selectedTimezone) // Fetch live stats with timezone
  const [filter, setFilter] = useState<'all' | 'unique' | 'common' | 'trending'>('all')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'city' | 'state' | 'country' | 'world'>('world')
  const [reactionFilter, setReactionFilter] = useState<'all' | 'funny' | 'creative' | 'must_try'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
  const [reactionCooldowns, setReactionCooldowns] = useState<Map<string, number>>(new Map())
  const [mobileStatsExpanded, setMobileStatsExpanded] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<DisplayPost | null>(null)
  const [showLegend, setShowLegend] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingRefreshKey, setTrendingRefreshKey] = useState(0)
  const [trendingRetryAttempt, setTrendingRetryAttempt] = useState(0)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false)
  
  const postsPerPage = 24
  
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
  
  // Persist filter state across page refreshes
  useEffect(() => {
    // Load saved filter on mount
    const savedFilter = localStorage.getItem('feedFilter') as 'all' | 'unique' | 'common' | 'trending' | null
    if (savedFilter) {
      setFilter(savedFilter)
    }
  }, [])
  
  useEffect(() => {
    // Save filter whenever it changes
    localStorage.setItem('feedFilter', filter)
  }, [filter])
  
  // Auto-load location on mount if permission was previously granted
  useEffect(() => {
    const previousPermission = localStorage.getItem('locationPermission')
    if (previousPermission === 'granted') {
      // Silent load without asking again
      fetch('/api/location')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.location) {
            setUserLocation(data.location)
            console.log('📍 Auto-loaded location (permission previously granted):', data.location)
          }
        })
        .catch(err => console.error('Failed to auto-load location:', err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount
  
  // Detect user location ONLY when needed (when user clicks location-based scope filter)
  const detectUserLocation = async () => {
    // Check if permission was previously granted
    const previousPermission = localStorage.getItem('locationPermission')
    let granted = previousPermission === 'granted'
    
    // If not previously asked, ask for permission
    if (!previousPermission) {
      granted = window.confirm(
        "📍 Location Permission Required\n\n" +
        "To filter posts by your location, we need to detect your city/state/country.\n\n" +
        "• We only use your city/state/country for filtering\n" +
        "• Your exact location is never stored\n" +
        "• This is optional\n\n" +
        "Allow location detection?"
      )
      
      // Save permission choice
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
  
  // Handle share
  const handleShare = (post: DisplayPost) => {
    setSelectedPost(post)
    setShareModalOpen(true)
  }
  
  // Generate viral share message using witty library
  const getShareMessageForPost = (post: DisplayPost) => {
    return getShareMessage({
      uniquenessScore: post.score || 0,
      matchCount: post.count || 0,
      isDare: true, // Always use dare style for feed shares
    })
  }
  
  // Handle reactions with client-side throttling
  const handleReaction = async (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => {
    const reactionKey = `${postId}-${reactionType}`
    const now = Date.now()
    const cooldownTime = 1000 // 1 second between reactions
    
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
        // Toggle reaction in local state
        setUserReactions(prev => {
          const newSet = new Set(prev)
          if (newSet.has(reactionKey)) {
            newSet.delete(reactionKey)
          } else {
            newSet.add(reactionKey)
          }
          return newSet
        })
        
        // Trigger a refresh after a short delay
        setTimeout(() => {
          setRefreshKey(prev => prev + 1)
        }, 500)
      } else if (response.status === 429) {
        const data = await response.json()
        alert(data.message || 'Too many reactions. Please slow down.')
      }
    } catch (error) {
      console.error('❌ Failed to add reaction:', error)
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SERVER-SIDE PAGINATION + FILTERING (Efficient!)
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
  
  // State for posts with ghost posts injected
  const [allPosts, setAllPosts] = useState<DisplayPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  
  // Transform API posts and inject ghost posts (async)
  React.useEffect(() => {
    // Don't process posts while API is still loading
    if (apiLoading) {
      return
    }
    
    const loadPostsWithGhosts = async () => {
      setPostsLoading(true)
      // Transform real posts
      const realPosts = apiPosts.map(post => {
        // Use database values directly - they're already accurate
        // Don't recalculate based on limited feed view
        const liveUniquenessScore = post.uniqueness_score
        const liveMatchCount = post.match_count
        
        return {
          id: post.id,
          content: post.content,
          type: liveUniquenessScore >= 70 ? 'unique' as const : 'common' as const,
          time: formatTimeAgo(new Date(post.created_at)),
          scope: post.scope,
          location_city: post.location_city,
          location_state: post.location_state,
          location_country: post.location_country,
          score: liveUniquenessScore,
          count: liveMatchCount + 1, // Include self
          funny_count: post.funny_count || 0,
          creative_count: post.creative_count || 0,
          must_try_count: post.must_try_count || 0,
          total_reactions: post.total_reactions || 0,
          isGhost: false,
        }
      })
      
      // Only fetch ghost posts if we'll actually use them (for trending filter)
      // This prevents unnecessary API calls
      let postsWithGhosts: (typeof realPosts[0] | Awaited<ReturnType<typeof fetchTrendingPosts>>[0])[]
      
      // Note: Ghost posts are excluded from "All", "Unique", and "Common" filters anyway
      // So we can skip fetching when not needed
      if (filter === 'trending') {
        console.log('🔄 Fetching trending posts...')
        setTrendingLoading(true)
        setTrendingRetryAttempt(0)
        
        // Use force refresh if user clicked the refresh button (trendingRefreshKey > 0)
        const forceRefresh = trendingRefreshKey > 0
        
        // Retry logic with exponential backoff
        const fetchWithRetry = async (maxRetries = 3): Promise<any[]> => {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            setTrendingRetryAttempt(attempt)
            
            try {
              console.log(`🔄 Attempt ${attempt}/${maxRetries} - Fetching trending posts... ${forceRefresh ? '(FORCE REFRESH)' : ''}`)
              const posts = await fetchTrendingPosts(30, forceRefresh && attempt === 1) // Only force on first attempt
              
              if (posts.length > 0) {
                console.log(`✅ Got ${posts.length} trending posts on attempt ${attempt}`)
                return posts
              }
              
              console.warn(`⚠️ Attempt ${attempt} returned 0 posts`)
              
              // If not the last attempt, wait with exponential backoff
              if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Max 5 seconds
                console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}...`)
                await new Promise(resolve => setTimeout(resolve, delay))
              }
            } catch (error) {
              console.error(`❌ Attempt ${attempt} failed:`, error)
              
              // If not the last attempt, wait before retrying
              if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 1}...`)
                await new Promise(resolve => setTimeout(resolve, delay))
              }
            }
          }
          
          console.warn('⚠️ All retry attempts exhausted, returning empty array')
          return []
        }
        
        try {
          const ghostPosts = await fetchWithRetry(3)
          
          if (ghostPosts.length > 0) {
            // Mix real posts with ghost posts and shuffle
            postsWithGhosts = [...realPosts, ...ghostPosts].sort(() => Math.random() - 0.5)
          } else {
            console.warn('⚠️ No trending posts after all retries, showing real posts only')
            postsWithGhosts = realPosts
          }
        } catch (error) {
          console.error('❌ Failed to fetch trending after retries:', error)
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
        return post as DisplayPost
      })
      
      setAllPosts(displayPosts as DisplayPost[])
      setPostsLoading(false)
    }
    
    loadPostsWithGhosts()
  }, [apiPosts, apiLoading, filter, trendingRefreshKey])
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NO CLIENT-SIDE FILTERING NEEDED!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Server handles: type (unique/common), scope (city/state/country), reactions
  // Client only handles: ghost posts (trending)
  
  const filteredPosts = React.useMemo(() => {
    if (filter === 'trending') {
      // Trending: Show only ghost posts
      return allPosts.filter(post => post.isGhost)
    } else {
      // Regular: Show only real posts (already filtered by server)
      return allPosts.filter(post => !post.isGhost)
    }
  }, [allPosts, filter])
  
  // Calculate pagination
  const totalPages = filter === 'trending' 
    ? Math.ceil(filteredPosts.length / postsPerPage) // Trending: Use filtered length
    : Math.ceil(totalPosts / postsPerPage) // Regular: Use server total
  
  // Paginate (trending only, regular posts already paginated by server)
  const currentPosts = filter === 'trending'
    ? filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
    : filteredPosts // Already paginated by server!
  
  // Reset scope and reaction filters when switching to trending
  React.useEffect(() => {
    if (filter === 'trending') {
      setScopeFilter('world')
      setReactionFilter('all')
    }
  }, [filter])
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter, scopeFilter, reactionFilter])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      {/* Floating Plus Button */}
      <button
        onClick={() => router.push('/')}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="Post something new"
      >
        <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - Mobile Responsive */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-space-dark/80 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Mobile: Compact Header */}
            <div className="flex items-center gap-3 md:hidden">
              {/* Back Button */}
              <button
                onClick={() => router.push('/')}
                className="text-white/60 hover:text-white transition-colors shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Active Filter Chip */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar justify-between">
                <button
                  onClick={() => setFilterSheetOpen(true)}
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
                {userLocation && filter !== 'trending' && scopeFilter !== 'world' && (
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
            
            {/* Desktop: Full Filters */}
            <div className="hidden md:flex items-center gap-4">
              {/* Back Button - Left Aligned */}
              <button
                onClick={() => router.push('/')}
                className="text-white/60 hover:text-white transition-colors shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Filters - Center Aligned */}
              <div className="flex-1 space-y-2">
                {/* Row 1: Type + Scope Filters */}
                <div className="flex flex-wrap gap-1.5 justify-center items-center">
                  {/* Filter Label */}
                  <span className="text-xs text-white/60 font-medium mr-1">Filter:</span>
                {/* Type Filters */}
                <button
                  onClick={() => setFilter(filter === 'all' ? 'all' : 'all')}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                    filter === 'all'
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  All
                </button>
              <button
                onClick={() => setFilter(filter === 'unique' ? 'all' : 'unique')}
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
                onClick={() => setFilter(filter === 'common' ? 'all' : 'common')}
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
                onClick={() => setFilter(filter === 'trending' ? 'all' : 'trending')}
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
              
              {/* Divider */}
              <div className="w-px h-6 bg-white/20" />
              
              {/* Scope Label */}
              <span className={`text-xs font-medium mr-1 ${filter === 'trending' ? 'text-white/30' : 'text-white/60'}`}>Scope:</span>
              
              {/* Scope Filters */}
              <button
                onClick={() => filter !== 'trending' && setScopeFilter(scopeFilter === 'world' ? 'world' : 'world')}
                disabled={filter === 'trending'}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  filter === 'trending' 
                    ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                    : scopeFilter === 'world'
                      ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">World</span>
              </button>
              
              {/* Show location-based filters if location is detected, otherwise show detection button */}
              {!userLocation && filter !== 'trending' && (
              <button
                  onClick={detectUserLocation}
                  className="px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 bg-white/5 text-white/60 hover:bg-white/10 border border-white/10 hover:border-purple-400/50"
                  title="Enable location-based filters"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Detect Location</span>
                </button>
              )}
              
              {userLocation?.country && (
                <button
                  onClick={() => filter !== 'trending' && setScopeFilter(scopeFilter === 'country' ? 'world' : 'country')}
                  disabled={filter === 'trending'}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                    filter === 'trending'
                      ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                      : scopeFilter === 'country'
                        ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
                  title={filter === 'trending' ? 'Not available for trending posts' : `Filter posts from ${userLocation.country}`}
                >
                  {scopeFilter === 'country' ? (
                    <>
                      <span className="hidden sm:inline">{userLocation.country}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      <span className="hidden sm:inline">{userLocation.country}</span>
                    </>
                  )}
              </button>
              )}
              {userLocation?.state && (
              <button
                  onClick={() => filter !== 'trending' && setScopeFilter(scopeFilter === 'state' ? 'world' : 'state')}
                  disabled={filter === 'trending'}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                    filter === 'trending'
                      ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                      : scopeFilter === 'state'
                        ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
                  title={filter === 'trending' ? 'Not available for trending posts' : `Filter posts from ${userLocation.state}`}
                >
                  {scopeFilter === 'state' ? (
                    <>
                      <span className="hidden sm:inline">{userLocation.state}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="hidden sm:inline">{userLocation.state}</span>
                    </>
                  )}
              </button>
              )}
              {userLocation?.city && (
                <button
                  onClick={() => filter !== 'trending' && setScopeFilter(scopeFilter === 'city' ? 'world' : 'city')}
                  disabled={filter === 'trending'}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                    filter === 'trending'
                      ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                      : scopeFilter === 'city'
                        ? 'bg-cyan-500/30 text-white border border-cyan-400/50'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                  title={filter === 'trending' ? 'Not available for trending posts' : `Filter posts from ${userLocation.city}`}
                >
                  {scopeFilter === 'city' ? (
                    <>
                      <span className="hidden sm:inline">{userLocation.city}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 11.5A2.5 2.5 0 019.5 9 2.5 2.5 0 0112 6.5 2.5 2.5 0 0114.5 9a2.5 2.5 0 01-2.5 2.5M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"/>
                      </svg>
                      <span className="hidden sm:inline">{userLocation.city}</span>
                    </>
                  )}
                </button>
              )}
              </div>
              
              {/* Row 2: Reaction Filters */}
              <div className="flex flex-wrap gap-1.5 justify-center items-center">
                {/* Reactions Label */}
                <span className={`text-xs font-medium mr-1 ${filter === 'trending' ? 'text-white/30' : 'text-white/60'}`}>Reactions:</span>
              <button
                onClick={() => filter !== 'trending' && setReactionFilter(reactionFilter === 'funny' ? 'all' : 'funny')}
                disabled={filter === 'trending'}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  filter === 'trending'
                    ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                    : reactionFilter === 'funny'
                    ? 'bg-yellow-500/30 text-white border border-yellow-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>😂 Funny</span>
                {reactionFilter === 'funny' && filter !== 'trending' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                )}
              </button>
              <button
                onClick={() => filter !== 'trending' && setReactionFilter(reactionFilter === 'creative' ? 'all' : 'creative')}
                disabled={filter === 'trending'}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  filter === 'trending'
                    ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                    : reactionFilter === 'creative'
                    ? 'bg-purple-500/30 text-white border border-purple-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>🎨 Creative</span>
                {reactionFilter === 'creative' && filter !== 'trending' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => filter !== 'trending' && setReactionFilter(reactionFilter === 'must_try' ? 'all' : 'must_try')}
                disabled={filter === 'trending'}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                  filter === 'trending'
                    ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                    : reactionFilter === 'must_try'
                    ? 'bg-green-500/30 text-white border border-green-400/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>🔥 Must Try</span>
                {reactionFilter === 'must_try' && filter !== 'trending' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              </div>
              </div>
              
              {/* Live Post Counter - Exciting Design */}
            </div>
          </div>
        </header>
        
        
        {/* Feed Grid */}
        <main className="max-w-7xl mx-auto px-4 py-8 flex-1">
          {/* Mobile: My Posts Card */}
          <div className="lg:hidden mb-4">
            <MyPostsCard />
          </div>
          
          {/* Mobile Stats Section - Collapsible */}
          <div className="lg:hidden mb-4">
            {filter === 'trending' ? (
              trendingLoading ? (
                <TrendingInfoSkeleton />
              ) : (
                /* Trending Info - Collapsible Mobile */
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-2xl border border-orange-400/20 shadow-lg overflow-hidden">
              <button
                    onClick={() => setMobileStatsExpanded(!mobileStatsExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
                        <svg className="w-4 h-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-white">Trending Globally</h3>
                        <p className="text-[10px] text-orange-200/60">Tap to {mobileStatsExpanded ? 'hide' : 'view'}</p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-white/60 transition-transform ${mobileStatsExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {mobileStatsExpanded && currentPosts.length > 0 && (
                    <div className="px-4 pb-4 border-t border-white/10">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-3">
                        <div className="text-[10px] font-semibold text-orange-300 uppercase mb-2 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          </svg>
                          <span>Top Trending</span>
                  </div>
                        <div className="space-y-2">
                          {currentPosts.slice(0, 5).map((post, index) => (
                            <div key={post.id} className="flex items-start gap-2 text-xs">
                              <span className="text-orange-400 font-bold shrink-0 mt-0.5">#{index + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-white/80 line-clamp-2 font-medium leading-tight">{post.content}</div>
                                {post.source && (
                                  <div className="text-white/40 text-[10px] mt-0.5 capitalize">{post.source.replace('-', ' ')}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Stats Card - Collapsible Mobile */
              <div className="bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg overflow-hidden">
                <button 
                  onClick={() => setMobileStatsExpanded(!mobileStatsExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-white">Top Performers</h3>
                      <p className="text-[10px] text-white/40">Tap to {mobileStatsExpanded ? 'hide' : 'view'}</p>
                  </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-white/60 transition-transform ${mobileStatsExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {mobileStatsExpanded && (
                  <div className="border-t border-white/10 space-y-4 p-4">
                    <TopPerformersCard userLocation={userLocation} />
                    <GlobalPulseCard posts={allPosts} />
                </div>
                )}
              </div>
            )}
          </div>
        
          {/* Global Pulse Sidebar */}
          <div className="grid lg:grid-cols-[1fr,300px] gap-6">
            <div>
              {(apiLoading || postsLoading || trendingLoading) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Show 12 skeleton cards while loading */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              )}
              
              {!apiLoading && !postsLoading && !trendingLoading && filteredPosts.length === 0 && (
                <div className="text-center text-white/60 py-12">
                  <p className="text-lg mb-2">No posts found</p>
                  <p className="text-sm">
                    {filter === 'trending' 
                      ? 'Trending data is loading... Click "🔄 Refresh" to try again.' 
                      : 'Try changing your filters or be the first to post!'
                    }
                  </p>
                </div>
              )}
              
              {!apiLoading && !postsLoading && !trendingLoading && filteredPosts.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReact={handleReaction}
                  onShare={handleShare}
                  onGhostClick={() => router.push('/')}
                  userReactions={userReactions}
                />
              ))}
              </div>
            </>
          )}
              
          {/* Compact Pagination Bar (show when pagination needed OR trending active) */}
          {(totalPages > 1 || filter === 'trending') && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 bg-space-dark/95 backdrop-blur-xl rounded-full border border-white/30 shadow-2xl">
              {totalPages > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Previous page"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <span className="text-xs text-white/70 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Next page"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Refresh button for trending */}
              {filter === 'trending' && (
                <>
                  {totalPages > 1 && <div className="w-px h-4 bg-white/20" />}
                  <button
                    onClick={() => setTrendingRefreshKey(prev => prev + 1)}
                    disabled={trendingLoading}
                    className="p-1.5 rounded-full hover:bg-orange-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Refresh trending data"
                  >
                    <svg 
                      className={`w-4 h-4 text-white ${trendingLoading ? 'animate-spin' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
            </div>
            
            {/* Sidebar (Desktop Only) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                {/* My Posts Card (always show if user has posts) */}
                <MyPostsCard />
                
                {filter === 'trending' ? (
                  trendingLoading ? (
                    /* Trending Info Skeleton */
                    <TrendingInfoSkeleton />
                  ) : (
                  /* Trending Info Card */
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
                      {/* Top Trending Topics */}
                      {currentPosts.length > 0 && (
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="text-xs font-semibold text-orange-300 uppercase mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            </svg>
                            <span>Top Trending</span>
                          </div>
                          <div className="space-y-2.5">
                            {currentPosts.slice(0, 5).map((post, index) => (
                              <div key={post.id} className="flex items-start gap-2 text-xs">
                                <span className="text-orange-400 font-bold shrink-0 mt-0.5">#{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white/80 line-clamp-2 font-medium leading-tight">{post.content}</div>
                                  {post.source && (
                                    <div className="text-white/40 text-[10px] mt-1 capitalize">{post.source.replace('-', ' ')}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Data Sources */}
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-[10px] font-semibold text-white/50 uppercase mb-2">Data Sources</div>
                        <div className="space-y-2 text-xs text-white/50">
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M13.54 12a6.8 6.8 0 01-6.77 0L0 8.27v6.46A1.5 1.5 0 001.5 16.5h13A1.5 1.5 0 0016 14.73V8.27z"/>
                            </svg>
                            <span>Google Trends</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.9l-4.2-2.5L9 17.9l.8-4.7L6.4 10l4.7-.7L13.2 5l2.1 4.3 4.7.7-3.4 3.2.9 4.7z"/>
                            </svg>
                            <span>Sports & Events</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
                            </svg>
                            <span>Real-time Data</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-white/40 text-center pt-2">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                          <span>Refreshes every 10 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                ) : (
                  /* Regular Stats Cards */
                  <div className="space-y-4">
                    <TopPerformersCard userLocation={userLocation} />
                    <GlobalPulseCard posts={allPosts} />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
        
        <Footer />
      </div>
      
      {/* Share Modal */}
      {selectedPost && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false)
            setSelectedPost(null)
          }}
          content={selectedPost.content}
          score={selectedPost.isGhost ? (selectedPost.count || 0) : selectedPost.type === 'unique' ? (selectedPost.score || 0) : (selectedPost.count || 0)}
          type={selectedPost.isGhost ? 'commonality' : selectedPost.type === 'unique' ? 'uniqueness' : 'commonality'}
          message={selectedPost.isGhost 
            ? `${(selectedPost.count || 0).toLocaleString()} people did this worldwide. What did YOU do instead? 🔥`
            : getShareMessageForPost(selectedPost)
          }
          rank={
            selectedPost.isGhost
              ? 'Global Trend'
              : selectedPost.type === 'unique'
                ? `${selectedPost.score}% Unique`
                : `${selectedPost.count} People`
          }
          scope="world"
          inputType="action"
          vibe={detectVibeSync(selectedPost.content)}
          isGhost={selectedPost.isGhost}
        />
      )}
      
      {/* Mobile Filter Sheet */}
      <FilterSheet isOpen={filterSheetOpen} onClose={() => setFilterSheetOpen(false)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Filters</h2>
          
          {/* Clear All Button */}
          {(filter !== 'all' || scopeFilter !== 'world' || reactionFilter !== 'all' || selectedTimezone) && (
            <button
              onClick={() => {
                setFilter('all')
                setScopeFilter('world')
                setReactionFilter('all')
                setSelectedTimezone(undefined)
                setFilterSheetOpen(false)
              }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition-all border border-white/10"
            >
              Clear All
            </button>
          )}
        </div>
        
        {/* Type Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/60 mb-3">Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setFilter('all')
                setFilterSheetOpen(false)
              }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white/20 text-white border-2 border-white/40'
                  : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
              }`}
            >
              📋 All Posts
            </button>
            <button
              onClick={() => {
                // Toggle: if already selected, go back to 'all'
                setFilter(filter === 'unique' ? 'all' : 'unique')
                setFilterSheetOpen(false)
              }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                filter === 'unique'
                  ? 'bg-purple-500/30 text-white border-2 border-purple-400/50'
                  : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>✨ Unique</span>
              {filter === 'unique' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                // Toggle: if already selected, go back to 'all'
                setFilter(filter === 'common' ? 'all' : 'common')
                setFilterSheetOpen(false)
              }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                filter === 'common'
                  ? 'bg-blue-500/30 text-white border-2 border-blue-400/50'
                  : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>👥 Common</span>
              {filter === 'common' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                // Toggle: if already selected, go back to 'all'
                setFilter(filter === 'trending' ? 'all' : 'trending')
                setFilterSheetOpen(false)
              }}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                filter === 'trending'
                  ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border-2 border-orange-400/50'
                  : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>🔥 Trending</span>
              {filter === 'trending' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Scope Filters */}
        {filter !== 'trending' && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/60 mb-3">Location Scope</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setScopeFilter('world')
                  setFilterSheetOpen(false)
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  scopeFilter === 'world'
                    ? 'bg-cyan-500/30 text-white border-2 border-cyan-400/50'
                    : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                🌏 Worldwide
              </button>
              
              {!userLocation && (
                <button
                  onClick={() => {
                    detectUserLocation()
                    setFilterSheetOpen(false)
                  }}
                  className="px-4 py-3 rounded-xl text-sm font-medium bg-white/5 text-white/70 border-2 border-purple-400/30 hover:bg-purple-500/10 hover:border-purple-400/50 transition-all"
                >
                  📍 Detect Location
                </button>
              )}
              
              {userLocation?.country && (
                <button
                  onClick={() => {
                    // Toggle: if already selected, go back to 'world'
                    setScopeFilter(scopeFilter === 'country' ? 'world' : 'country')
                    setFilterSheetOpen(false)
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    scopeFilter === 'country'
                      ? 'bg-cyan-500/30 text-white border-2 border-cyan-400/50'
                      : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>🇺🇸 {userLocation.country}</span>
                  {scopeFilter === 'country' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
              
              {userLocation?.state && (
                <button
                  onClick={() => {
                    // Toggle: if already selected, go back to 'world'
                    setScopeFilter(scopeFilter === 'state' ? 'world' : 'state')
                    setFilterSheetOpen(false)
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    scopeFilter === 'state'
                      ? 'bg-cyan-500/30 text-white border-2 border-cyan-400/50'
                      : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>🏛️ {userLocation.state}</span>
                  {scopeFilter === 'state' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
              
              {userLocation?.city && (
                <button
                  onClick={() => {
                    // Toggle: if already selected, go back to 'world'
                    setScopeFilter(scopeFilter === 'city' ? 'world' : 'city')
                    setFilterSheetOpen(false)
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    scopeFilter === 'city'
                      ? 'bg-cyan-500/30 text-white border-2 border-cyan-400/50'
                      : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>🏙️ {userLocation.city}</span>
                  {scopeFilter === 'city' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Reaction Filters */}
        {filter !== 'trending' && (
          <div className="mb-2">
            <h3 className="text-sm font-medium text-white/60 mb-3">Reactions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setReactionFilter('all')
                  setFilterSheetOpen(false)
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  reactionFilter === 'all'
                    ? 'bg-white/20 text-white border-2 border-white/40'
                    : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                All Reactions
              </button>
              <button
                onClick={() => {
                  // Toggle: if already selected, go back to 'all'
                  setReactionFilter(reactionFilter === 'funny' ? 'all' : 'funny')
                  setFilterSheetOpen(false)
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  reactionFilter === 'funny'
                    ? 'bg-yellow-500/30 text-white border-2 border-yellow-400/50'
                    : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>😂 Funny</span>
                {reactionFilter === 'funny' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  // Toggle: if already selected, go back to 'all'
                  setReactionFilter(reactionFilter === 'creative' ? 'all' : 'creative')
                  setFilterSheetOpen(false)
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  reactionFilter === 'creative'
                    ? 'bg-purple-500/30 text-white border-2 border-purple-400/50'
                    : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>🎨 Creative</span>
                {reactionFilter === 'creative' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  // Toggle: if already selected, go back to 'all'
                  setReactionFilter(reactionFilter === 'must_try' ? 'all' : 'must_try')
                  setFilterSheetOpen(false)
                }}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  reactionFilter === 'must_try'
                    ? 'bg-green-500/30 text-white border-2 border-green-400/50'
                    : 'bg-white/5 text-white/70 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>🔥 Must Try</span>
                {reactionFilter === 'must_try' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </FilterSheet>
    </div>
  )
}
