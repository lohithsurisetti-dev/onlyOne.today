'use client'

import { useEffect } from 'react'

interface LocationData {
  city: string
  state: string
  country: string
  countryCode: string
}

interface LocationDetectorSilentProps {
  onLocationDetected: (location: LocationData) => void
  onLocationError: (error: string) => void
}

/**
 * Silent location detector - runs in background without UI
 */
export const LocationDetectorSilent: React.FC<LocationDetectorSilentProps> = ({
  onLocationDetected,
  onLocationError
}) => {
  useEffect(() => {
    const detectLocation = async () => {
      console.log('📍 Starting location detection...')
      try {
        // Use our server-side API to avoid CORS and rate limit issues
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 6000) // 6 seconds
        
        const response = await fetch('/api/location', {
          signal: controller.signal,
          cache: 'no-store'
        })
        
        clearTimeout(timeout)
        console.log('📍 Got response from location API')

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const data = await response.json()
        console.log('📍 API response:', data)

        if (!data.success || !data.location) {
          throw new Error(data.message || 'Location unavailable')
        }

        const locationData: LocationData = {
          city: data.location.city || '',
          state: data.location.state || '',
          country: data.location.country || '',
          countryCode: data.location.countryCode || ''
        }

        console.log('✅ Location detected successfully:', locationData)
        onLocationDetected(locationData)
      } catch (err) {
        console.error('❌ Location detection failed:', err)
        onLocationError('failed')
        
        // Set empty location as fallback (worldwide mode)
        onLocationDetected({
          city: '',
          state: '',
          country: '',
          countryCode: ''
        })
      }
    }

    detectLocation()
  }, [onLocationDetected, onLocationError])

  // No UI - runs silently
  return null
}

