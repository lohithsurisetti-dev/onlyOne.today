'use client'

import React, { useState, useEffect } from 'react'
import { Select } from './ui/Select'

interface LocationData {
  city: string
  state: string
  country: string
  countryCode: string
}

interface LocationDetectorProps {
  onLocationDetected: (location: LocationData) => void
  onLocationError: (error: string) => void
}

export const LocationDetector: React.FC<LocationDetectorProps> = ({
  onLocationDetected,
  onLocationError
}) => {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectLocation = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try ipapi.co first (with timeout)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      })
      
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.reason || 'Failed to detect location')
      }

      const locationData: LocationData = {
        city: data.city || 'Unknown City',
        state: data.region || 'Unknown State',
        country: data.country_name || 'Unknown Country',
        countryCode: data.country_code || 'XX'
      }

      setLocation(locationData)
      onLocationDetected(locationData)
    } catch (err) {
      console.error('Location detection failed:', err)
      
      // Graceful fallback - location is optional
      const errorMessage = err instanceof Error && err.name === 'AbortError' 
        ? 'Location detection timed out. Using worldwide comparison.'
        : 'Could not detect location. Using worldwide comparison.'
      
      setError(errorMessage)
      onLocationError(errorMessage)
      
      // Set a default "worldwide" location so app can continue
      const defaultLocation: LocationData = {
        city: '',
        state: '',
        country: '',
        countryCode: ''
      }
      onLocationDetected(defaultLocation)
    } finally {
      setLoading(false)
    }
  }

  // Auto-detect location on component mount
  useEffect(() => {
    detectLocation()
  }, [])

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          <span className="ml-2 text-text-secondary">Detecting your location...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400 text-lg mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-yellow-400 text-sm font-medium">
                Location detection unavailable
              </p>
              <p className="text-yellow-300/70 text-xs mt-1">
                No worries! You can still use the app with worldwide comparisons.
              </p>
              <button
                onClick={detectLocation}
                className="mt-2 text-yellow-400 hover:text-yellow-300 text-xs underline"
              >
                Try detecting again
              </button>
            </div>
          </div>
        </div>
      )}

      {location && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✅</span>
            <span className="text-green-400 text-sm">
              Detected: {location.city}, {location.state}, {location.country}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get scope options based on detected location
export const getScopeOptions = (location: LocationData | null) => [
  {
    value: 'world',
    label: 'Worldwide',
    icon: '🌍',
    description: 'Compare with everyone globally'
  },
  {
    value: 'country',
    label: location?.country || 'Your Country',
    icon: '🏳️',
    description: `Compare within ${location?.country || 'your country'}`
  },
  {
    value: 'state',
    label: location?.state || 'Your State/Region',
    icon: '🏛️',
    description: `Compare within ${location?.state || 'your state or region'}`
  },
  {
    value: 'city',
    label: location?.city || 'Your City',
    icon: '🏙️',
    description: `Compare within ${location?.city || 'your city'}`
  }
]
