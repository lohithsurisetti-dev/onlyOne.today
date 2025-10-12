'use client'

import React, { useState } from 'react'
import { EnhancedInput } from '@/components/EnhancedInput'
import StarsBackground from '@/components/StarsBackground'
import { useRouter } from 'next/navigation'
import { useCreatePost } from '@/lib/hooks/usePosts'

export default function Home() {
  const router = useRouter()
  const { createPost, loading, error } = useCreatePost()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: {
    content: string
    inputType: 'action' | 'day'
    scope: 'city' | 'state' | 'country' | 'world'
    location?: string
  }) => {
    setIsSubmitting(true)

    try {
      // Create the post via API
      const result = await createPost({
        content: data.content,
        inputType: data.inputType,
        scope: data.scope,
        // TODO: Add real location detection
        locationCity: undefined,
        locationState: undefined,
        locationCountry: undefined,
      })

      if (result) {
        // Store result in sessionStorage to pass to response page
        sessionStorage.setItem('postResult', JSON.stringify(result))

        // Navigate to appropriate response page
        const isUnique = result.uniquenessScore >= 70
        const params = new URLSearchParams({
          postId: result.post.id,
          content: data.content,
          type: data.inputType,
          scope: data.scope,
        })

        if (isUnique) {
          router.push(`/response?${params.toString()}`)
        } else {
          router.push(`/response/commonality?${params.toString()}`)
        }
      }
    } catch (err) {
      console.error('Error submitting post:', err)
      alert('Failed to submit post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar with Install Button */}
        <div className="absolute top-0 right-0 p-4 sm:p-6 z-20">
          <div className="bg-white/5 backdrop-blur-sm rounded-full border border-white/10 px-4 py-2 hover:bg-white/10 transition-colors flex items-center gap-2">
            <span className="text-sm">✨</span>
            <span className="text-white text-xs font-medium hidden sm:inline">Install app for more features</span>
            <button className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors border border-white/10">
              Install
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="text-center pt-12 pb-8 px-4">
          <h1 className="text-5xl font-bold text-white mb-3">
            OnlyOne.today
          </h1>
          <p className="text-white/70 text-lg">
            While the world follows the trend, you did something no one else did.
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Main Input Section */}
            <div className="space-y-6">
              <EnhancedInput onSubmit={handleSubmit} isLoading={isSubmitting} />
              
              <div className="flex justify-center">
                <button
                  onClick={() => router.push('/feed')}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white/90 hover:text-white hover:border-purple-400/60 transition-all duration-300 backdrop-blur-sm hover:scale-105 inline-flex items-center space-x-2"
                >
                  <span className="text-sm font-medium">Explore Feed</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
