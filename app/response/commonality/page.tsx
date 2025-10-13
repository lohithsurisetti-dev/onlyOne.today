'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import StarsBackground from '@/components/StarsBackground'
import Button from '@/components/ui/Button'
import ShareModal from '@/components/ShareModal'
import type { CreatePostResult } from '@/lib/hooks/usePosts'

function CommonalityResponseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const content = searchParams.get('content') || 'Your moment'
  const inputType = searchParams.get('type') || 'action'
  const scope = searchParams.get('scope') || 'world'
  const [showShareModal, setShowShareModal] = useState(false)
  const [postResult, setPostResult] = useState<CreatePostResult | null>(null)
  
  // Load post result from sessionStorage
  useEffect(() => {
    const storedResult = sessionStorage.getItem('postResult')
    if (storedResult) {
      setPostResult(JSON.parse(storedResult))
    }
  }, [])
  
  // Calculate display data
  const commonalityScore = postResult ? 100 - postResult.uniquenessScore : 89
  const count = postResult ? postResult.matchCount + 1 : 127
  
  const getScopeText = (scope: string) => {
    switch (scope) {
      case 'city': return 'in your city'
      case 'state': return 'in your state'
      case 'country': return 'in your country'
      default: return 'worldwide'
    }
  }
  
  // Mock data
  const mockData = {
    commonalityScore,
    count,
    message: count === 2
      ? `You and 1 other person ${getScopeText(scope)} did this today. You're connected!`
      : `You're one of ${count} people ${getScopeText(scope)} who did this today. You're not alone`,
    kindredPosts: postResult?.similarPosts?.slice(0, 3).map(post => ({
      content: post.content,
      time: new Date(post.created_at).toLocaleString(),
    })) || [
      { content: 'Stayed in bed till noon', time: '2 hours ago' },
      { content: 'Couldn\'t focus today', time: '4 hours ago' },
      { content: 'Felt overwhelmed', time: '5 hours ago' },
    ],
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      {/* Floating Plus Button */}
      <button
        onClick={() => router.push('/')}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="Post another"
      >
        <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      <div className="relative z-10 h-screen flex items-center justify-center px-4 py-4">
        {/* Main Card - Horizontal Layout, Fixed Height */}
        <div className="w-full max-w-5xl h-full max-h-[90vh] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header - Compact */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <svg className="w-5 h-5 text-blue-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-wider text-white/60">Commonality</span>
            </div>
            
            <h2 className="text-lg lg:text-xl font-bold text-white mb-2 line-clamp-2">
              {content}
            </h2>
          </div>
          
          {/* Main Content - Split Layout, Flex Grow */}
          <div className="flex-1 grid lg:grid-cols-2 gap-4 overflow-hidden">
            {/* Left: Commonality Visualization */}
            <div className="flex flex-col items-center justify-center">
              {/* Circular Progress Indicator with gradient */}
              <div className="relative w-32 h-32 mb-4">
                {/* Subtle glow */}
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
                <svg className="w-full h-full transform -rotate-90 relative">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-white/10"
                  />
                  {/* Progress circle with gradient */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#blueGradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - mockData.commonalityScore / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-1">
                    {mockData.commonalityScore}%
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full backdrop-blur-sm">
                    <svg className="w-3 h-3 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-xs font-bold text-white">{mockData.count}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Message & Kindred Posts */}
            <div className="flex flex-col justify-center">
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <p className="text-white/90 text-sm leading-relaxed line-clamp-2" suppressHydrationWarning>
                  {mockData.message}
                </p>
              </div>
              
              {/* Kindred Spirits */}
              {mockData.kindredPosts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-medium text-white/70">Others too:</span>
                  </div>
                  <div className="space-y-2">
                    {mockData.kindredPosts.map((post, index) => (
                      <div
                        key={index}
                        className="p-2.5 bg-white/5 rounded-lg border border-blue-400/20 hover:border-blue-400/40 transition-colors"
                      >
                        <p className="text-white/80 text-sm mb-0.5 line-clamp-1">{post.content}</p>
                        <span className="text-white/40 text-xs">{post.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons - Larger */}
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 py-2.5 text-sm hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                  onClick={() => setShowShareModal(true)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </div>
                </Button>
                
                <button
                  onClick={() => router.push('/feed')}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Feed</span>
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
        score={mockData.commonalityScore}
        type="commonality"
        message={mockData.message}
        rank="You're not alone"
        scope={scope}
        inputType={inputType}
      />
    </div>
  )
}

export default function CommonalityResponsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest">
        <svg className="w-8 h-8 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    }>
      <CommonalityResponseContent />
    </Suspense>
  )
}

