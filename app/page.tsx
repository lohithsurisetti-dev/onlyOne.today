'use client'

import React from 'react'
import { EnhancedInput } from '@/components/EnhancedInput'
import StarsBackground from '@/components/StarsBackground'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const handleSubmit = async (data: {
    content: string
    inputType: 'action' | 'day'
    scope: 'city' | 'state' | 'country' | 'world'
    location?: string
  }) => {
    // Navigate to response page with enhanced data
    const params = new URLSearchParams({
      content: data.content,
      type: data.inputType,
      scope: data.scope,
    })
    
    router.push(`/response?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <EnhancedInput onSubmit={handleSubmit} />
        
        {/* See What Others Did Button */}
        <button
          onClick={() => router.push('/feed')}
          className="mt-8 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white/90 hover:text-white hover:border-purple-400/60 transition-all duration-300 backdrop-blur-sm hover:scale-105 flex items-center space-x-2"
        >
          <span className="text-sm font-medium">See what others did today</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

