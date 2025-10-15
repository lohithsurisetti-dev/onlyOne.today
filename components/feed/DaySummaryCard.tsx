'use client'

import React, { useState } from 'react'
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
  const [showModal, setShowModal] = useState(false)
  const isTopTier = post.percentile?.tier && ['elite', 'rare', 'unique', 'notable'].includes(post.percentile.tier)
  const scopeInfo = getScopeInfo(post.scope, post)
  
  return (
    <>
      {/* Card - Compact Size (Same as Action Card) */}
      <div
        onClick={() => setShowModal(true)}
        className={`group relative rounded-2xl p-4 backdrop-blur-md border transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col cursor-pointer min-h-[160px] ${
          isTopTier
            ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-400/30 hover:border-purple-400/60'
            : 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-400/30 hover:border-blue-400/60'
        }`}
      >
        {/* Day Summary Badge - Top Left (Compact) */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full border border-indigo-300/40 backdrop-blur-sm">
          <svg className="w-3 h-3 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-semibold text-indigo-100">{post.activityCount || 0}</span>
        </div>

        {/* Share Button - Top Right */}
        {onShare && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onShare(post)
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/10 hover:bg-white/20"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        )}

        {/* Main Content - Compact & Centered */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <p className="text-white/90 text-sm sm:text-base leading-relaxed text-center line-clamp-2 mb-2 px-1">
            {post.content}
          </p>
          
          {/* Activity Count Indicator */}
          {post.activities && post.activities.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="font-medium">Tap to see {post.activityCount} activities</span>
            </div>
          )}
        </div>

        {/* Bottom Section - Compact */}
        <div className="space-y-2">
          {/* Percentile Badge */}
          {post.percentile && (
            <div className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-md border ${
              isTopTier
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300/30'
                : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-300/30'
            }`}>
              <span className="text-base">{post.percentile.badge}</span>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${
                  isTopTier ? 'text-purple-200' : 'text-blue-200'
                }`}>
                  {post.percentile.displayText}
                </span>
                <span className="text-[10px] text-white/60">
                  {post.percentile.comparison}
                </span>
              </div>
            </div>
          )}

          {/* Metadata Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-white/50">
              {scopeInfo.iconSvg}
              <span className="capitalize text-[10px]">{scopeInfo.label}</span>
            </div>
            <span className="text-white/50 text-[10px]">{post.time}</span>
          </div>
        </div>
      </div>

      {/* Modal - Full Details */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setShowModal(false)}
        >
          <div 
            className={`relative max-w-2xl w-full rounded-3xl p-6 border-2 shadow-2xl max-h-[90vh] overflow-y-auto ${
              isTopTier
                ? 'bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-purple-400/50'
                : 'bg-gradient-to-br from-blue-900/95 to-cyan-900/95 border-blue-400/50'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Day Summary</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  isTopTier
                    ? 'bg-purple-500/30 text-purple-200'
                    : 'bg-blue-500/30 text-blue-200'
                }`}>
                  {post.percentile?.displayText || 'N/A'}
                </span>
              </div>
              
              <p className="text-white/90 text-base leading-relaxed">
                "{post.content}"
              </p>
            </div>

            {/* Activities List */}
            {post.activities && post.activities.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 className="text-sm font-semibold text-white/80">
                    {post.activityCount} {post.activityCount === 1 ? 'Activity' : 'Activities'} Detected
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {post.activities.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm"
                    >
                      <span className="text-white/40 font-mono text-xs">#{idx + 1}</span>
                      <span className="text-white/90 text-sm flex-1">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Section */}
            <div className={`p-4 rounded-xl border ${
              isTopTier
                ? 'bg-purple-500/10 border-purple-400/30'
                : 'bg-blue-500/10 border-blue-400/30'
            }`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/50 mb-1">Ranking</p>
                  <p className={`text-lg font-bold ${
                    isTopTier ? 'text-purple-200' : 'text-blue-200'
                  }`}>
                    {post.percentile?.displayText}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Comparison</p>
                  <p className="text-sm text-white/80">
                    {post.percentile?.comparison}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Scope</p>
                  <div className="flex items-center gap-1.5 text-white/80">
                    {scopeInfo.iconSvg}
                    <span className="text-sm capitalize">{scopeInfo.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Shared</p>
                  <p className="text-sm text-white/80">{post.time}</p>
                </div>
              </div>
            </div>

            {/* Share Button in Modal */}
            {onShare && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowModal(false)
                    onShare(post)
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share This Day
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
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

