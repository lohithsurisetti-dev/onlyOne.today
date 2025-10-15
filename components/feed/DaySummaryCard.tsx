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
  onReact?: (postId: string | number, reactionType: 'funny' | 'creative' | 'must_try') => void
  userReactions?: Set<string>
}

const DaySummaryCard = React.memo(({ post, onShare, onReact, userReactions }: DaySummaryCardProps) => {
  const [showModal, setShowModal] = useState(false)
  const isTopTier = post.percentile?.tier && ['elite', 'rare', 'unique', 'notable'].includes(post.percentile.tier)
  const scopeInfo = getScopeInfo(post.scope, post)
  
  const [reactions, setReactions] = useState({
    funny: post.funny_count || 0,
    creative: post.creative_count || 0,
    must_try: post.must_try_count || 0,
  })
  
  const handleReaction = async (reactionType: 'funny' | 'creative' | 'must_try') => {
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
        {/* Day Summary Icon - Top Left (Tiny, No Background) */}
        <div className="absolute top-2 left-2">
          <svg className="w-3 h-3 text-indigo-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Share Button - Top Right (Visible on Mobile, Hover on Desktop) */}
        {onShare && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onShare(post)
            }}
            className="absolute top-2 right-2 opacity-60 md:opacity-0 md:group-hover:opacity-100 hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            title="Share this day"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        )}

        {/* Main Content - Compact & Centered */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed text-center line-clamp-2 mb-2 px-1">
            {post.content}
          </p>
          
          {/* Hint: Tap to view & react */}
          <div className="flex items-center gap-1 text-[10px] text-white/40 mt-1">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span className="font-medium">Tap to view & react</span>
          </div>
        </div>

        {/* Bottom Section - Compact (Same as Action Card) */}
        <div className="space-y-1.5">
          {/* Percentile Badge - Exactly Like Action Card */}
          {post.percentile && (
            <div className="flex items-center justify-between px-2.5 py-2 md:px-2 md:py-1.5 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-1.5 md:gap-1">
                <svg className="w-4 h-4 md:w-3 md:h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-xs md:text-[10px] text-white">{post.percentile.displayText}</span>
              </div>
              <span className="text-[10px] md:text-[9px] text-white/50 font-medium">{post.percentile.comparison}</span>
            </div>
          )}

          {/* Metadata Row - Clean & Simple */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-white/50">
              {scopeInfo.iconSvg}
              <span className="capitalize text-[10px]">{scopeInfo.label}</span>
            </div>
            <span className="text-white/50 text-[10px]">{post.time}</span>
          </div>
        </div>
      </div>

      {/* Modal - Premium Design */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-space-darker/98 via-space-dark/98 to-space-darker/98 backdrop-blur-2xl border border-white/10 animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Glow Effect */}
            <div className={`absolute inset-0 opacity-20 pointer-events-none ${
              isTopTier
                ? 'bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent'
                : 'bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent'
            }`} />

            {/* Content Container */}
            <div className="relative z-10 p-8">
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all group"
              >
                <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header Section */}
              <div className="mb-8">
                {/* Title Bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-400/30">
                      <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                      Day Summary
                    </h2>
                  </div>
                  
                  {/* Ranking Badge - Compact */}
                  {post.percentile && (
                    <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-sm ${
                      isTopTier
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/40'
                        : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/40'
                    }`}>
                      <p className={`text-sm font-bold ${
                        isTopTier ? 'text-purple-200' : 'text-blue-200'
                      }`}>
                        {post.percentile.displayText}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <p className="text-white/90 text-lg leading-relaxed italic">
                  "{post.content}"
                </p>
              </div>

              {/* Activities Section */}
              {post.activities && post.activities.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <p className="text-xs text-white/50 uppercase tracking-wider font-medium">
                      {post.activityCount} {post.activityCount === 1 ? 'Activity' : 'Activities'}
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  
                  <div className="space-y-2">
                    {post.activities.map((activity, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start gap-3 px-4 py-3 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isTopTier
                            ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-purple-200'
                            : 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 text-blue-200'
                        }`}>
                          {idx + 1}
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed flex-1 pt-0.5">{activity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Bar */}
              <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                {/* Comparison */}
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Comparison</p>
                  <p className="text-sm font-semibold text-white/90">{post.percentile?.comparison || 'N/A'}</p>
                </div>
                
                {/* Divider */}
                <div className="w-px h-8 bg-white/10" />
                
                {/* Scope */}
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Scope</p>
                  <div className="flex items-center gap-1.5">
                    {scopeInfo.iconSvg}
                    <span className="text-sm font-semibold text-white/90 capitalize">{scopeInfo.label}</span>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="w-px h-8 bg-white/10" />
                
                {/* Time */}
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Shared</p>
                  <p className="text-sm font-semibold text-white/90">{post.time}</p>
                </div>
              </div>

              {/* Reactions Section - Simple & Clean */}
              {onReact && (
                <div className="mb-6">
                  <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-3">React</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleReaction('funny')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                        userReactions?.has(`${post.id}-funny`)
                          ? 'bg-yellow-500/20 border border-yellow-400/40'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <span className="text-lg">😂</span>
                      <span className="text-xs text-white/80">Funny</span>
                      {reactions.funny > 0 && <span className="text-[10px] text-white/50">({reactions.funny})</span>}
                    </button>
                    
                    <button
                      onClick={() => handleReaction('creative')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                        userReactions?.has(`${post.id}-creative`)
                          ? 'bg-purple-500/20 border border-purple-400/40'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <span className="text-lg">🎨</span>
                      <span className="text-xs text-white/80">Creative</span>
                      {reactions.creative > 0 && <span className="text-[10px] text-white/50">({reactions.creative})</span>}
                    </button>
                    
                    <button
                      onClick={() => handleReaction('must_try')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                        userReactions?.has(`${post.id}-must_try`)
                          ? 'bg-green-500/20 border border-green-400/40'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <span className="text-lg">🔥</span>
                      <span className="text-xs text-white/80">Must Try</span>
                      {reactions.must_try > 0 && <span className="text-[10px] text-white/50">({reactions.must_try})</span>}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {onShare && (
                  <button
                    onClick={() => {
                      setShowModal(false)
                      onShare(post)
                    }}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 border border-purple-400/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-sm">Share</span>
                  </button>
                )}
                
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-semibold text-white shadow-lg transition-all border border-white/20"
                >
                  <span className="text-sm">Close</span>
                </button>
              </div>
            </div>
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


