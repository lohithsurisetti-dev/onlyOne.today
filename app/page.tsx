'use client'

import React, { useState, useEffect } from 'react'
import { EnhancedInput } from '@/components/EnhancedInput'
import StarsBackground from '@/components/StarsBackground'
import { LocationDetectorSilent } from '@/components/LocationDetectorSilent'
import Footer from '@/components/Footer'
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
      // This will throw an error if validation/moderation fails
      const result = await createPost({
        content: data.content,
        inputType: data.inputType,
        scope: data.scope,
        // Use detected location (if available)
        locationCity: userLocation?.city,
        locationState: userLocation?.state,
        locationCountry: userLocation?.country,
      })

      // Success! Store result and navigate
      sessionStorage.setItem('postResult', JSON.stringify(result))

      // 💾 Save to "My Posts" history (localStorage)
      const { saveMyPost } = await import('@/lib/utils/my-posts')
      saveMyPost({
        id: result.post.id,
        content: data.content,
        uniquenessScore: result.uniquenessScore,
        matchCount: result.matchCount,
        scope: data.scope,
        timestamp: new Date().toISOString(),
        viewUrl: `/response?postId=${result.post.id}`,
        reactions: {
          funny_count: 0,
          creative_count: 0,
          must_try_count: 0,
          total_reactions: 0,
        },
      })

      // Navigate to unified response page
      const isUnique = result.uniquenessScore >= 70
      const params = new URLSearchParams({
        postId: result.post.id,
        content: data.content,
        type: data.inputType,
        scope: data.scope,
        view: isUnique ? 'unique' : 'common', // Let response page know which view to show
      })
      
      router.push(`/response?${params.toString()}`)
    } catch (err) {
      // Error caught - display immediately
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
          <div className="bg-white/5 backdrop-blur-sm rounded-full border border-white/10 px-4 py-2 hover:bg-white/10 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-white text-xs font-medium">Install app for more features</span>
            <button className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors border border-white/10">
              Install
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="text-center pt-12 pb-6 sm:pb-8 px-4 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3">
            OnlyOne Today
          </h1>
          <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
            While the world follows the trend, you did something no one else did.
          </p>
          
          {/* Live Post Counter - Mobile: Below subtitle, Desktop: Top right */}
          {stats && (
            <>
              {/* Mobile: Centered below subtitle */}
              <div className="sm:hidden mt-4 flex justify-center">
                <div className="relative">
                  {/* Pulsing Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-50 blur-xl animate-pulse"></div>
                  
                  {/* Counter Badge */}
                  <div className="relative flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 backdrop-blur-sm shadow-lg shadow-purple-500/30">
                    <span className="text-lg font-bold text-white leading-none">{stats.today.totalPosts}</span>
                    <span className="text-[10px] text-purple-200/80 font-medium whitespace-nowrap">posts today</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop: Absolute top right */}
              <div className="hidden sm:block absolute top-20 right-6">
                <div className="relative group">
                  {/* Pulsing Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-50 blur-xl animate-pulse"></div>
                  
                  {/* Counter Badge */}
                  <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 backdrop-blur-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-105">
                    <span className="text-2xl font-bold text-white leading-none">{stats.today.totalPosts}</span>
                    <span className="text-xs text-purple-200/80 font-medium whitespace-nowrap">posts today</span>
                  </div>
                </div>
              </div>
            </>
          )}
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
                <button className="sm:hidden px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:border-white/40 transition-all duration-300 backdrop-blur-sm hover:scale-105 inline-flex items-center justify-center space-x-2 min-h-[50px]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-sm font-medium">Install app for more exciting features</span>
                </button>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
}
