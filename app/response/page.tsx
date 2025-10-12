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
  const [showShareModal, setShowShareModal] = useState(false)
  const [postResult, setPostResult] = useState<CreatePostResult | null>(null)
  const [shareType, setShareType] = useState<'uniqueness' | 'commonality'>('uniqueness')
  const [vibe, setVibe] = useState<string>('')
  const [temporal, setTemporal] = useState<TemporalUniqueness | null>(null)
  const [loadingTemporal, setLoadingTemporal] = useState(false)
  
  // Load post result from sessionStorage
  useEffect(() => {
    const storedResult = sessionStorage.getItem('postResult')
    if (storedResult) {
      setPostResult(JSON.parse(storedResult))
    }
  }, [])
  
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
  
  const getScopeText = (scope: string) => {
    switch (scope) {
      case 'city': return 'in your city'
      case 'state': return 'in your state'
      case 'country': return 'in your country'
      default: return 'worldwide'
    }
  }

  const getScopeEmoji = (scope: string) => {
    switch (scope) {
      case 'city': return '🏙️'
      case 'state': return '🏛️'
      case 'country': return '🏳️'
      default: return '🌍'
    }
  }

  // Calculate display data
  const uniquenessScore = postResult?.uniquenessScore ?? 94
  const matchCount = postResult?.matchCount ?? 0
  const similarCount = matchCount + 1
  const commonalityScore = 100 - uniquenessScore
  
  const isUnique = uniquenessScore >= 70
  
  // Use witty messages!
  const message = getWittyResponse({
    uniquenessScore,
    matchCount,
    vibe,
    scope,
  })
  
  const rank = getWittyRank(uniquenessScore, scope)
  
  const vibeCelebration = vibe ? getVibeCelebration(vibe) : ''
  
  const handleShare = () => {
    setShowShareModal(true)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      {/* Floating Plus Button */}
      <button
        onClick={() => router.push('/')}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="Post another"
      >
        <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Compact Card */}
        <div className="w-full max-w-md bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          
          {/* Heading */}
          <h1 className="text-3xl font-bold text-white text-center mb-6">
            Your Result ✨
          </h1>
          
          {/* Vibe Badge - Hero */}
          {vibe && (
            <div className="flex justify-center mb-4">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30 backdrop-blur-sm">
                <span className="text-sm font-medium text-white">{vibe}</span>
              </div>
            </div>
          )}
          
          {/* Scope & Type Badges */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm px-3 py-1 bg-white/10 rounded-full text-white/80 flex items-center gap-1">
              <span>{getScopeEmoji(scope)}</span>
              <span className="text-xs">{scope === 'world' ? 'Worldwide' : scope}</span>
            </span>
            <span className="text-xs px-3 py-1 bg-white/10 rounded-full text-white/60">
              {inputType === 'day' ? 'Daily' : 'Action'}
            </span>
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {content}
          </h2>
          
          {/* Vibe Celebration */}
          {vibeCelebration && (
            <p className="text-center text-purple-300/80 text-sm italic mb-6">
              {vibeCelebration}
            </p>
          )}

          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShareType('uniqueness')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                shareType === 'uniqueness'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              Uniqueness {uniquenessScore}%
            </button>
            <button
              onClick={() => setShareType('commonality')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                shareType === 'commonality'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              Commonality {commonalityScore}%
            </button>
          </div>

          {/* Score Display */}
          <div className="mb-6">
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  shareType === 'uniqueness'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}
                style={{ 
                  width: `${shareType === 'uniqueness' ? uniquenessScore : commonalityScore}%` 
                }}
              />
            </div>
          </div>

          {/* Message */}
          <p className="text-center text-white/90 text-sm mb-2 leading-relaxed">
            {message}
          </p>
          
          <p className="text-center text-white/60 text-xs mb-6">
            {rank}
          </p>
          
          {/* Temporal Uniqueness Stats */}
          {temporal && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white/80">📊 Across Time</span>
                <span className="text-xs text-white/60">{getTemporalEmoji(temporal)} {temporal.trend}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                {formatTemporalStats(temporal).map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xs text-white/50 mb-1">{stat.icon}</div>
                    <div className="text-lg font-bold text-purple-300">{stat.uniqueness}%</div>
                    <div className="text-xs text-white/40">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-white/70 italic text-center">
                {temporal.insight}
              </p>
            </div>
          )}
          
          {loadingTemporal && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-center text-white/50 text-xs">
                Loading temporal analysis...
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleShare}
            >
              Share {shareType === 'uniqueness' ? 'Uniqueness' : 'Commonality'}
            </Button>
            
            <button
              onClick={() => router.push('/feed')}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
            >
              See What Others Did
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full py-2 text-white/60 hover:text-white text-xs transition-all"
            >
              Post Another
            </button>
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
