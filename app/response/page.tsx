'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import StarsBackground from '@/components/StarsBackground'
import Button from '@/components/ui/Button'
import ShareModal from '@/components/ShareModal'
import type { CreatePostResult } from '@/lib/hooks/usePosts'
import { detectVibeSync } from '@/lib/services/vibe-detector'
import { getWittyResponse, getWittyRank, getVibeCelebration } from '@/lib/services/witty-messages'
import { calculateTemporalUniqueness, formatTemporalStats, getTemporalEmoji, type TemporalUniqueness } from '@/lib/services/temporal-uniqueness'

function ResponseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const content = searchParams.get('content') || 'Your moment'
  const inputType = searchParams.get('type') || 'action'
  const scope = searchParams.get('scope') || 'world'
  const postId = searchParams.get('postId')
  const viewParam = searchParams.get('view') // 'unique' or 'common'
  const [showShareModal, setShowShareModal] = useState(false)
  const [postResult, setPostResult] = useState<CreatePostResult | null>(null)
  const [vibe, setVibe] = useState<string>('')
  const [temporal, setTemporal] = useState<TemporalUniqueness | null>(null)
  const [loadingTemporal, setLoadingTemporal] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [rank, setRank] = useState<string>('')
  const [vibeCelebration, setVibeCelebration] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  
  // Auto-detect view type from uniqueness score (fallback if no view param)
  const [shareType, setShareType] = useState<'uniqueness' | 'commonality'>('uniqueness')
  
  // Set client-side flag to prevent hydration errors
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Load post result from sessionStorage
  useEffect(() => {
    const storedResult = sessionStorage.getItem('postResult')
    if (storedResult) {
      const result = JSON.parse(storedResult)
      setPostResult(result)
      
      // Auto-set shareType based on view param or uniqueness score
      if (viewParam === 'common') {
        setShareType('commonality')
      } else if (viewParam === 'unique') {
        setShareType('uniqueness')
      } else {
        // Fallback: auto-detect from score
        setShareType(result.uniquenessScore >= 70 ? 'uniqueness' : 'commonality')
      }
    }
  }, [viewParam])
  
  // Detect vibe
  useEffect(() => {
    if (content) {
      const detectedVibe = detectVibeSync(content)
      setVibe(detectedVibe)
    }
  }, [content])
  
  // Load temporal uniqueness
  useEffect(() => {
    async function loadTemporal() {
      if (postResult?.post?.content_hash) {
        setLoadingTemporal(true)
        try {
          const result = await calculateTemporalUniqueness(
            postResult.post.content_hash,
            content,
            postResult.post.scope || 'world',
            {
              city: postResult.post.location_city || undefined,
              state: postResult.post.location_state || undefined,
              country: postResult.post.location_country || undefined,
            }
          )
          setTemporal(result)
        } catch (error) {
          console.error('Failed to load temporal uniqueness:', error)
        }
        setLoadingTemporal(false)
      }
    }
    loadTemporal()
  }, [postResult, content])
  
  // Generate witty messages on client only (to avoid hydration errors)
  useEffect(() => {
    if (isClient && postResult) {
      const uniquenessScore = postResult.uniquenessScore ?? 94
      const matchCount = postResult.matchCount ?? 0
      
      const newMessage = getWittyResponse({
        uniquenessScore,
        matchCount,
        vibe,
        scope,
      })
      setMessage(newMessage)
      
      const newRank = getWittyRank(uniquenessScore, scope)
      setRank(newRank)
      
      const newVibeCelebration = vibe ? getVibeCelebration(vibe) : ''
      setVibeCelebration(newVibeCelebration)
    }
  }, [isClient, postResult, vibe, scope])
  
  const getScopeText = (scope: string) => {
    switch (scope) {
      case 'city': return 'in your city'
      case 'state': return 'in your state'
      case 'country': return 'in your country'
      default: return 'worldwide'
    }
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'city': 
        return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 11.5A2.5 2.5 0 019.5 9 2.5 2.5 0 0112 6.5 2.5 2.5 0 0114.5 9a2.5 2.5 0 01-2.5 2.5M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"/></svg>
      case 'state': 
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
      case 'country': 
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
      default: 
        return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    }
  }
  
  const getTemporalIconSVG = (iconEmoji: string) => {
    const icons: Record<string, JSX.Element> = {
      '📅': <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      '📆': <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      '🗓️': <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      '♾️': <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      '📈': <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      '📉': <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
      '➡️': <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
    }
    return icons[iconEmoji] || <span className="text-lg">{iconEmoji}</span>
  }

  // Calculate display data
  const uniquenessScore = postResult?.uniquenessScore ?? 94
  const matchCount = postResult?.matchCount ?? 0
  const similarCount = matchCount + 1
  const commonalityScore = 100 - uniquenessScore
  
  const isUnique = uniquenessScore >= 70
  
  // Auto-set initial view to the dominant score
  // If user navigated from submit, respect their view param
  // Otherwise default to showing the more impressive metric
  useEffect(() => {
    if (postResult && !viewParam) {
      // No explicit view param - show dominant score
      setShareType(isUnique ? 'uniqueness' : 'commonality')
    }
  }, [postResult, viewParam, isUnique])
  
  const handleShare = () => {
    setShowShareModal(true)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        {/* Main Container - Centered Single Card */}
        <div className="max-w-2xl w-full">
          {/* Single Unified Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            
            {/* Hero Section with Circular Progress */}
            <div className="relative bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 p-6 text-center">
              {/* Animated glow */}
              <div className={`absolute inset-0 ${
                shareType === 'uniqueness' 
                  ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5' 
                  : 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5'
              } animate-pulse`} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Badges */}
                <div className="flex items-center justify-center gap-2 mb-4">
          {vibe && (
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full border border-purple-400/50 text-xs font-medium text-white backdrop-blur-md shadow-lg">
                      {vibe}
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-white flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                    {getScopeIcon(scope)}
                    <span className="text-xs font-medium">{scope === 'world' ? 'Worldwide' : scope}</span>
            </span>
          </div>

                {/* Circular Progress - Compact */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-44 h-44">
                    {/* Reduced glow ring */}
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
                      shareType === 'uniqueness' ? 'bg-purple-500/30' : 'bg-blue-500/30'
                    }`} />
                    
                    <svg className="w-full h-full transform -rotate-90 relative">
                      <circle
                        cx="88"
                        cy="88"
                        r="78"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="88"
                        cy="88"
                        r="78"
                        stroke={shareType === 'uniqueness' ? 'url(#purpleGradient)' : 'url(#blueGradient)'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 78}`}
                        strokeDashoffset={`${2 * Math.PI * 78 * (1 - (shareType === 'uniqueness' ? uniquenessScore : commonalityScore) / 100)}`}
                        strokeLinecap="round"
                        style={{ 
                          transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease'
                        }}
                      />
                      <defs>
                        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="50%" stopColor="#d946ef" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="50%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">
                        {shareType === 'uniqueness' ? 'Unique' : 'Common'}
                      </div>
                      <div className={`text-4xl font-black mb-1 transition-all ${
                        shareType === 'uniqueness' 
                          ? 'bg-gradient-to-br from-purple-300 via-pink-300 to-purple-400 bg-clip-text text-transparent' 
                          : 'bg-gradient-to-br from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent'
                      }`}>
                        {shareType === 'uniqueness' ? uniquenessScore : commonalityScore}%
                      </div>
                      <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                        <span className="text-xs font-medium text-white/80">
                          {shareType === 'uniqueness' ? `${matchCount + 1} did this` : `${matchCount} others`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Title with Label */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
                    Your Action
                  </div>
                  <h2 className="text-xl font-bold text-white line-clamp-2">
                    "{content}"
          </h2>
                </div>

                {/* View Toggle - Minimal */}
                <div className="inline-flex gap-1.5 p-1 bg-white/10 rounded-full backdrop-blur-md">
            <button
              onClick={() => setShareType('uniqueness')}
                    className={`px-5 py-1.5 rounded-full transition-all text-xs font-medium ${
                shareType === 'uniqueness'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Unique
                    </div>
            </button>
            <button
              onClick={() => setShareType('commonality')}
                    className={`px-5 py-1.5 rounded-full transition-all text-xs font-medium ${
                shareType === 'commonality'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Common
                    </div>
            </button>
          </div>
              </div>
            </div>

            {/* Message Section */}
            <div className="px-6 py-5 border-t border-white/10">
              <div className="text-center max-w-xl mx-auto">
                <p className="text-lg text-white/90 leading-relaxed italic font-light" suppressHydrationWarning>
                  "{message || 'Loading...'}"
                </p>
              </div>
              </div>
              
            {/* Temporal Stats Section */}
            {temporal && (
              <div className="px-6 pb-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">Across Time</h3>
                    {getTemporalIconSVG(getTemporalEmoji(temporal))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                    {formatTemporalStats(temporal).map((stat: { label: string; icon: string; uniqueness: number }, idx: number) => {
                      // Show uniqueness% or commonality% based on current view
                      const displayValue = shareType === 'uniqueness' 
                        ? stat.uniqueness 
                        : 100 - stat.uniqueness // Swap to commonality%
                      
                      return (
                        <div key={idx} className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {getTemporalIconSVG(stat.icon)}
                            <span className="text-xs font-medium text-white/60">{stat.label}</span>
                          </div>
                          <div className="text-xl font-bold text-white">{displayValue}%</div>
                        </div>
                      )
                    })}
              </div>
              
                  {temporal.insight && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-white/70 leading-relaxed italic">{temporal.insight}</p>
            </div>
          )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-2.5">
                <button
              onClick={handleShare}
                  className={`py-3 rounded-xl font-semibold text-sm transition-all shadow-lg hover:scale-105 ${
                    shareType === 'uniqueness'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-purple-500/50'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-blue-500/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </div>
                </button>
            
            <button
              onClick={() => router.push('/feed')}
                  className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Feed</span>
                  </div>
            </button>

            <button
              onClick={() => router.push('/')}
                  className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Post</span>
                  </div>
            </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        content={content}
        score={shareType === 'uniqueness' ? uniquenessScore : commonalityScore}
        type={shareType}
        message={message}
        rank={rank}
        scope={scope}
        inputType={inputType}
        vibe={vibe}
      />
    </div>
  )
}

export default function ResponsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResponseContent />
    </Suspense>
  )
}
