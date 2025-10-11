'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import StarsBackground from '@/components/StarsBackground'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ShareModal from '@/components/ShareModal'

function CommonalityResponseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const content = searchParams.get('content') || 'Your moment'
  const [showShareModal, setShowShareModal] = useState(false)
  
  // Mock data
  const mockData = {
    commonalityScore: 89,
    count: 127,
    message: "You're one of 127 people who shared this feeling today. You're not alone 💙",
    kindredPosts: [
      { content: 'Stayed in bed till noon', time: '2 hours ago' },
      { content: 'Couldn\'t focus today', time: '4 hours ago' },
      { content: 'Felt overwhelmed', time: '5 hours ago' },
    ],
  }
  
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-6 md:p-8">
      {/* Background Stars */}
      <StarsBackground count={80} />
      
      {/* Main Response Card - Blue theme for commonality */}
      <Card variant="glow-blue" className="relative z-10 w-full max-w-[700px] animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
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
          
          {/* Commonality Visualization - Circle Cluster */}
          <div className="relative my-6 flex items-center justify-center w-[240px] h-[240px]">
            {/* Background glow */}
            <div className="absolute inset-0 bg-accent-blue/20 rounded-full blur-3xl" />
            
            {/* Cluster of dots representing people */}
            <div className="relative grid grid-cols-9 gap-2">
              {Array.from({ length: Math.min(81, mockData.count) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"
                  style={{
                    animationDelay: `${i * 20}ms`,
                    opacity: 0.6 + Math.random() * 0.4,
                  }}
                />
              ))}
            </div>
            
            {/* Count overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-space-dark/80 backdrop-blur-sm rounded-full px-6 py-3">
                <span className="text-4xl font-bold text-accent-blue">
                  {mockData.count}
                </span>
                <p className="text-xs text-text-muted mt-1">others</p>
              </div>
            </div>
          </div>
          
          {/* Context Text */}
          <h3 className="mt-6 text-xl font-normal leading-relaxed text-text-primary max-w-md">
            {mockData.message}
          </h3>
          
          {/* Badge */}
          <Badge variant="blue" size="md" className="mt-4">
            You're not alone
          </Badge>
          
          {/* Kindred Spirits Section */}
          <div className="mt-8 w-full">
            <p className="text-sm font-medium text-text-muted mb-4 text-left">
              Others who understand:
            </p>
            <div className="space-y-3">
              {mockData.kindredPosts.map((post, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-space-dark rounded-lg border border-accent-blue/20 text-left hover:border-accent-blue/40 transition-all"
                >
                  <p className="text-text-primary text-sm">{post.content}</p>
                  <span className="text-text-muted text-xs">{post.time}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 w-full space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-accent-blue to-accent-blue"
              onClick={() => setShowShareModal(true)}
            >
              Share This Moment
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              className="w-full border-accent-blue text-accent-blue"
              onClick={() => router.push('/feed')}
            >
              Connect with Others
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        content={content}
        score={mockData.commonalityScore}
        type="commonality"
        message={mockData.message}
        rank="You're not alone"
      />
    </div>
  )
}

export default function CommonalityResponsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-sky">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CommonalityResponseContent />
    </Suspense>
  )
}

