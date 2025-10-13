'use client'

import React, { useState } from 'react'
import Button from './ui/Button'
import TextArea from './ui/TextArea'
import { RadioGroup } from './ui/RadioGroup'
import { Select } from './ui/Select'
import Card from './ui/Card'

interface LocationData {
  city: string
  state: string
  country: string
  countryCode: string
}

interface EnhancedInputProps {
  onSubmit: (data: {
    content: string
    inputType: 'action' | 'day'
    scope: 'city' | 'state' | 'country' | 'world'
    location?: string
  }) => void
  onScopeChange?: (scope: 'city' | 'state' | 'country' | 'world') => void
  userLocation?: LocationData | null
  locationError?: string | null
  isLoading?: boolean
  error?: string | null
  stats?: {
    today: {
      totalPosts: number
      uniquePosts: number
      blockedPosts: number
    }
    allTime: {
      totalPosts: number
    }
  } | null
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({ 
  onSubmit, 
  onScopeChange, 
  userLocation, 
  locationError, 
  isLoading = false, 
  error = null, 
  stats = null 
}) => {
  const [inputType, setInputType] = useState<'action' | 'day'>('action')
  const [scope, setScope] = useState<'city' | 'state' | 'country' | 'world'>('world')
  const [content, setContent] = useState('')
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  
  // Notify parent when scope changes
  const handleScopeChange = (newScope: 'city' | 'state' | 'country' | 'world') => {
    setScope(newScope)
    if (onScopeChange) {
      onScopeChange(newScope)
    }
  }

  const inputTypeOptions = [
    {
      value: 'action',
      label: 'Single Action',
      description: 'Share one specific thing you did today'
    },
    {
      value: 'day',
      label: 'Daily Routine',
      description: 'Share your entire day or routine'
    }
  ]

  const scopeOptions = [
    {
      value: 'world',
      label: 'Worldwide',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      description: 'Compare with everyone globally'
    },
    {
      value: 'country',
      label: 'Your Country',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>,
      description: 'Compare within your country'
    },
    {
      value: 'state',
      label: 'Your State/Region',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
      description: 'Compare within your state or region'
    },
    {
      value: 'city',
      label: 'Your City',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 11.5A2.5 2.5 0 019.5 9 2.5 2.5 0 0112 6.5 2.5 2.5 0 0114.5 9a2.5 2.5 0 01-2.5 2.5M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"/></svg>,
      description: 'Compare within your city'
    }
  ]

  const handleSubmit = async () => {
    if (!content.trim()) return
    
    // Client-side throttling: minimum 3 seconds between submissions
    const now = Date.now()
    const timeSinceLastSubmit = now - lastSubmitTime
    const minDelay = 3000 // 3 seconds
    
    if (timeSinceLastSubmit < minDelay) {
      const remainingSeconds = Math.ceil((minDelay - timeSinceLastSubmit) / 1000)
      alert(`Please wait ${remainingSeconds} more second${remainingSeconds > 1 ? 's' : ''} before submitting again.`)
      return
    }
    
    setLastSubmitTime(now)

    await onSubmit({
      content: content.trim(),
      inputType,
      scope,
    })
  }

  const getPlaceholder = () => {
    if (inputType === 'action') {
      return 'e.g., "played cricket", "baked banana bread", "didn\'t check social media"'
    } else {
      return 'e.g., "woke up at 6am, had coffee, worked from home, went for a walk, cooked dinner, read a book"'
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card className="p-5 sm:p-6 space-y-4 sm:space-y-5">
        {/* Header Inside Card */}
        <div className="text-center mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
            What did you do today?
          </h2>
        </div>
        
        {/* Content Input - Main Focus */}
        <div>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholder()}
            rows={inputType === 'action' ? 3 : 4}
            className="w-full"
          />
          
          {/* Error Message - Below Input */}
          {error && (
            <p className="text-red-400 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Compact Options Row - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
          {/* Input Type - Compact */}
          <div>
            <label className="block text-sm sm:text-xs font-medium text-text-secondary mb-2">
              Type
            </label>
            <Select
              options={[
                { 
                  value: 'action', 
                  label: 'Single Action', 
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                },
                { 
                  value: 'day', 
                  label: 'Daily Routine', 
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                }
              ]}
              value={inputType}
              onChange={(value) => setInputType(value as 'action' | 'day')}
              className="text-sm"
            />
          </div>

          {/* Scope - Compact */}
          <div>
            <label className="block text-sm sm:text-xs font-medium text-text-secondary mb-2">
              Compare with
            </label>
            <Select
              options={scopeOptions}
              value={scope}
              onChange={(value) => handleScopeChange(value as any)}
              className="text-sm"
            />
            
            {/* Location status - shown only when scope needs location */}
            {scope !== 'world' && (
              <div className="mt-2 text-xs text-white/60">
                {userLocation?.city ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">
                      {userLocation.city}, {userLocation.state}, {userLocation.country}
                    </span>
                    <span className="sm:hidden">
                      {userLocation.city}, {userLocation.state}
                    </span>
                  </span>
                ) : locationError ? (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Location unavailable - comparing worldwide instead</span>
                    <span className="sm:hidden">Using worldwide</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Detecting location...</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button - Mobile Touch Optimized */}
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading}
          variant="primary"
          className="w-full py-4 sm:py-3 text-base sm:text-sm font-medium min-h-[50px]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </div>
          ) : (
            'Discover'
          )}
        </Button>
        
        {/* Compact Info Inside Card */}
        <div className="text-center pt-2">
          <p className="text-white/50 text-sm sm:text-base mb-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="hidden sm:inline">Uniqueness</span>
              <span className="sm:hidden">Unique</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Commonality</span>
              <span className="sm:hidden">Common</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Anonymous</span>
            </span>
          </p>
          
          {/* Live Stats */}
          {stats && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{stats.today.totalPosts} today</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>{stats.today.uniquePosts} unique</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{stats.today.blockedPosts} blocked</span>
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export { EnhancedInput }
