'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import StarsBackground from '@/components/StarsBackground'
import Card from '@/components/ui/Card'
import CircularProgress from '@/components/ui/CircularProgress'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ShareModal from '@/components/ShareModal'

function ResponseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const content = searchParams.get('content') || 'Your moment'
  const inputType = searchParams.get('type') || 'action'
  const scope = searchParams.get('scope') || 'world'
  const [showShareModal, setShowShareModal] = useState(false)
  
  // Mock data - will be replaced with real API data
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

  const mockData = {
    uniquenessScore: 94,
    commonalityScore: 6,
    similarCount: 3,
    trendContext: `While millions followed trends ${getScopeText(scope)}, you did something unique ✨`,
    rank: `Top 1% most unique ${getScopeText(scope)}`,
    timestamp: '2 minutes ago',
    scope: scope,
    scopeEmoji: getScopeEmoji(scope),
    inputType: inputType,
  }
  
  const handleShare = () => {
    setShowShareModal(true)
  }
  
  const handleFeed = () => {
    router.push('/feed')
  }
  
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-6 md:p-8">
      {/* Background Stars */}
      <StarsBackground count={80} />
      
      {/* Main Response Card */}
      <Card variant="glow" className="relative z-10 w-full max-w-[700px] animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          {/* Scope Badge */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-lg">{mockData.scopeEmoji}</span>
            <Badge variant="secondary" className="text-xs">
              {mockData.scope === 'world' ? 'Worldwide' : 
               mockData.scope === 'country' ? 'Your Country' :
               mockData.scope === 'state' ? 'Your State' : 'Your City'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {mockData.inputType === 'day' ? 'Daily Routine' : 'Single Action'}
            </Badge>
          </div>
          
          {/* Label */}
          <p className="text-sm font-medium uppercase tracking-widest text-text-muted">
            Your moment
          </p>
          
          {/* User's Post */}
          <h3 className="mt-2 text-2xl font-medium text-text-primary">
            {content}
          </h3>
          
          {/* Divider */}
          <div className="my-6 h-px w-full max-w-xs bg-white/10" />
          
          {/* Circular Progress */}
          <CircularProgress 
            value={mockData.uniquenessScore}
            size={200}
            strokeWidth={12}
            gradient={true}
            className="my-6"
          />
          
          {/* Score Label */}
          <p className="text-sm font-medium text-text-muted">
            Uniqueness Score
          </p>
          
          {/* Context Text */}
          <h3 className="mt-6 text-xl font-normal leading-relaxed text-text-primary max-w-md">
            {mockData.trendContext}
          </h3>
          
          {/* Rank Badge */}
          <Badge variant="purple" size="md" className="mt-4">
            {mockData.rank}
          </Badge>
          
          {/* Secondary Metrics */}
          <div className="mt-8 flex w-full items-center justify-between border-t border-white/10 pt-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-blue" />
              <span>👥 {mockData.similarCount} others also skipped it</span>
            </div>
            <span>Posted {mockData.timestamp}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 w-full space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleShare}
            >
              Share This Moment
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleFeed}
            >
              See What Others Did
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        content={content}
        score={mockData.uniquenessScore}
        type="uniqueness"
        message={mockData.trendContext}
        rank={mockData.rank}
        scope={mockData.scope}
        inputType={mockData.inputType}
      />
    </div>
  )
}

export default function ResponsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-sky">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResponseContent />
    </Suspense>
  )
}

