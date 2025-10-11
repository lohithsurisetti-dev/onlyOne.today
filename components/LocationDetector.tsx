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
      // Using a free geolocation API
      const response = await fetch('https://ipapi.co/json/')
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect location'
      setError(errorMessage)
      onLocationError(errorMessage)
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
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">
            {error}
          </p>
          <button
            onClick={detectLocation}
            className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
          >
            Try again
          </button>
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
