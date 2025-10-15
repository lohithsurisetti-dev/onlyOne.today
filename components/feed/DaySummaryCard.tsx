'use client'

import React from 'react'
import { DisplayPost } from './PostCard'

export interface DaySummaryPost extends DisplayPost {
  activities?: string[]
  activityCount?: number
  input_type: 'day'
}

export interface DaySummaryCardProps {
  post: DaySummaryPost
  onShare?: (post: DaySummaryPost) => void
}

const DaySummaryCard = React.memo(({ post, onShare }: DaySummaryCardProps) => {
  const isTopTier = post.percentile?.tier && ['elite', 'rare', 'unique', 'notable'].includes(post.percentile.tier)
  const scopeInfo = getScopeInfo(post.scope, post)
  
  return (
    <div
      className={`group relative rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col min-h-[220px] ${
        isTopTier
          ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-400/40 hover:border-purple-400/70'
          : 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-400/40 hover:border-blue-400/70'
      }`}
    >
      {/* Day Summary Badge - Top Left */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full border border-indigo-300/40 backdrop-blur-sm">
        <svg className="w-3.5 h-3.5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-semibold text-indigo-100">Day Summary</span>
      </div>

      {/* Share Button - Top Right */}
      {onShare && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onShare(post)
          }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      )}

      {/* Main Content - Center */}
      <div className="flex-1 flex flex-col justify-center items-center mt-8 mb-3">
        <p className="text-white/90 text-sm leading-relaxed text-center line-clamp-2 mb-3 px-2">
          {post.content}
        </p>

        {/* Activities Breakdown */}
        {post.activities && post.activities.length > 0 && (
          <div className="w-full mt-2">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs text-white/60 font-medium">
                {post.activityCount} {post.activityCount === 1 ? 'Activity' : 'Activities'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center max-h-[60px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent px-2">
              {post.activities.slice(0, 8).map((activity, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/70 border border-white/20 backdrop-blur-sm"
                >
                  {activity.length > 20 ? activity.substring(0, 20) + '...' : activity}
                </span>
              ))}
              {post.activities.length > 8 && (
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/50 border border-white/20">
                  +{post.activities.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="space-y-2.5">
        {/* Percentile Badge - Prominent */}
        {post.percentile && (
          <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md border ${
            isTopTier
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300/30'
              : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-300/30'
          }`}>
            <span className="text-lg">{post.percentile.badge}</span>
            <div className="flex flex-col">
              <span className={`text-sm font-bold ${
                isTopTier ? 'text-purple-200' : 'text-blue-200'
              }`}>
                {post.percentile.displayText}
              </span>
              <span className="text-xs text-white/60">
                {post.percentile.comparison}
              </span>
            </div>
          </div>
        )}

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 text-white/50">
            {scopeInfo.iconSvg}
            <span className="capitalize">{scopeInfo.label}</span>
          </div>
          <span className="text-white/50">{post.time}</span>
        </div>
      </div>
    </div>
  )
})

DaySummaryCard.displayName = 'DaySummaryCard'

// Helper function (same as PostCard)
const getScopeInfo = (scope?: string, post?: any) => {
  const scopes: Record<string, { iconSvg: JSX.Element; getLabel: (p?: any) => string }> = {
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

export default DaySummaryCard

