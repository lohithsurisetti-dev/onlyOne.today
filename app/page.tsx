'use client'

import React, { useState, useEffect } from 'react'
import { EnhancedInput } from '@/components/EnhancedInput'
import StarsBackground from '@/components/StarsBackground'
import { LocationDetectorSilent } from '@/components/LocationDetectorSilent'
import { useRouter } from 'next/navigation'
import { useCreatePost } from '@/lib/hooks/usePosts'
import { usePlatformStats } from '@/lib/hooks/useStats'

interface LocationData {
  city: string
  state: string
  country: string
  countryCode: string
}

export default function Home() {
  const router = useRouter()
  const { createPost, loading, error } = useCreatePost()
  const { stats } = usePlatformStats()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedScope, setSelectedScope] = useState<'city' | 'state' | 'country' | 'world'>('world')
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)

  // Check if permission was previously granted on mount
  useEffect(() => {
    const previousPermission = localStorage.getItem('locationPermission')
    if (previousPermission === 'granted') {
      setLocationPermissionGranted(true)
    }
  }, [])

  // Handle scope changes
  const handleScopeChange = async (scope: 'city' | 'state' | 'country' | 'world') => {
    // If user selects a location-based scope, ask for permission first
    if (scope !== 'world') {
      // Check if permission was previously granted
      const previousPermission = localStorage.getItem('locationPermission')
      let granted = previousPermission === 'granted'
      
      // If not previously asked, ask now
      if (!previousPermission && !locationPermissionAsked) {
        setLocationPermissionAsked(true)
        
        granted = window.confirm(
          "📍 Location Permission Required\n\n" +
          "To compare your action with others in your area, we need to detect your location.\n\n" +
          "• We only use your city/state/country\n" +
          "• Your exact location is never stored\n" +
          "• This is optional - you can choose 'Worldwide' instead\n\n" +
          "Allow location detection?"
        )
        
        // Save permission choice
        localStorage.setItem('locationPermission', granted ? 'granted' : 'denied')
      }
      
      if (!granted) {
        // Permission denied - revert to world
        setLocationPermissionGranted(false)
        setSelectedScope('world')
        alert("Location permission denied. Using 'Worldwide' scope instead.")
        return
      }
      
      setLocationPermissionGranted(true)
    }
    
    setSelectedScope(scope)
    // Reset location error when scope changes
    if (scope === 'world') {
      setLocationError(null)
    }
  }

  // Handle location detection
  const handleLocationDetected = (location: LocationData) => {
    setUserLocation(location)
    setLocationError(null)
    console.log('📍 Location detected:', location)
  }

  const handleLocationError = (error: string) => {
    // Treat location error as "worldwide mode" - not actually an error
    setLocationError('worldwide')
    console.log('📍 Using worldwide mode (location detection unavailable)')
  }
  
  // Check if current scope needs location AND permission was granted
  const needsLocation = selectedScope !== 'world' && locationPermissionGranted

  const handleSubmit = async (data: {
    content: string
    inputType: 'action' | 'day'
    scope: 'city' | 'state' | 'country' | 'world'
    location?: string
  }) => {
    setIsSubmitting(true)
    setModerationError(null) // Clear previous errors

    try {
      // Create the post via API with location data
      const result = await createPost({
        content: data.content,
        inputType: data.inputType,
        scope: data.scope,
        // Use detected location (if available)
        locationCity: userLocation?.city,
        locationState: userLocation?.state,
        locationCountry: userLocation?.country,
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
      } else if (error) {
        // Show moderation or other errors
        setModerationError(error)
      }
    } catch (err) {
      console.error('Error submitting post:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit post. Please try again.'
      setModerationError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Desktop: Install Button at Top Right */}
        <div className="hidden sm:block absolute top-0 right-0 p-6 z-20">
          <button className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-full border border-purple-400/30 px-4 py-2 hover:bg-purple-500/30 hover:border-purple-400/60 transition-all flex items-center gap-2 hover:scale-105">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-white text-sm font-medium">Install • 5+ Features</span>
          </button>
        </div>

        {/* Header */}
        <header className="text-center pt-12 pb-6 sm:pb-8 px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3">
            OnlyOne.today
          </h1>
          <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
            While the world follows the trend, you did something no one else did.
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Main Input Section */}
            <div className="space-y-6">
              <EnhancedInput 
                onSubmit={handleSubmit}
                onScopeChange={handleScopeChange}
                userLocation={userLocation}
                locationError={locationError}
                isLoading={isSubmitting}
                error={moderationError}
                stats={stats}
              />
              
              {/* Location Detection - Runs silently in background when needed */}
              {needsLocation && !userLocation && (
                <LocationDetectorSilent
                  onLocationDetected={handleLocationDetected}
                  onLocationError={handleLocationError}
                />
              )}
              
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => router.push('/feed')}
                  className="px-8 py-3.5 md:px-6 md:py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white/90 hover:text-white hover:border-purple-400/60 transition-all duration-300 backdrop-blur-sm hover:scale-105 inline-flex items-center justify-center space-x-2 min-h-[50px] md:min-h-0"
                >
                  <span className="text-base md:text-sm font-medium">Explore Feed</span>
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                
                {/* Install Button - Mobile: Next to Explore Feed, Desktop: Hidden (shown at top-right) */}
                <button className="sm:hidden px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white hover:bg-purple-500/30 hover:border-purple-400/60 transition-all duration-300 backdrop-blur-sm hover:scale-105 inline-flex items-center justify-center space-x-2 min-h-[50px]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-base font-medium">Install • 5+ Features</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
