'use client'

import React, { useState, useEffect } from 'react'

interface TimezoneStats {
  timezone: string
  label: string
  emoji: string
  offset: number
  postsToday: number
  localTime: string
}

interface TimezonePillsProps {
  selectedTimezone?: string
  onTimezoneSelect: (timezone: string | undefined) => void
  userTimezone?: string
}

export default function TimezonePills({ selectedTimezone, onTimezoneSelect, userTimezone }: TimezonePillsProps) {
  const [timezoneData, setTimezoneData] = useState<TimezoneStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimezoneStats = async () => {
      try {
        const response = await fetch('/api/stats/timezones', {
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          setTimezoneData(data.timezones || [])
        }
      } catch (error) {
        console.error('Failed to fetch timezone stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTimezoneStats()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchTimezoneStats, 60000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="border-b border-white/10 bg-space-dark/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-white/40 text-xs overflow-x-auto hide-scrollbar">
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Loading global activity...
          </div>
        </div>
      </div>
    )
  }

  // Add user's timezone as first item (if not already in list)
  const myTimezoneData = {
    timezone: userTimezone || 'UTC',
    label: 'My Time',
    emoji: '📍',
    offset: new Date().getTimezoneOffset(),
    postsToday: 0, // Will show from stats
    localTime: ''
  }

  const allTimezones = [myTimezoneData, ...timezoneData]

  return (
    <div className="border-b border-white/10 bg-gradient-to-r from-space-dark/80 via-space-darker/80 to-space-dark/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {allTimezones.slice(0, 8).map((tz, index) => {
            const isActive = index === 0 ? !selectedTimezone : selectedTimezone === tz.timezone
            const isMyTime = index === 0
            
            return (
              <button
                key={tz.timezone}
                onClick={() => onTimezoneSelect(isMyTime ? undefined : tz.timezone)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5
                  ${isActive
                    ? index === 0 
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white border-2 border-purple-400/50 shadow-lg shadow-purple-500/20'
                      : 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                <span className="text-base">{tz.emoji}</span>
                <span className="font-semibold">{tz.label}</span>
                {tz.postsToday > 0 && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className={`font-bold ${
                      index === 0 && isActive ? 'text-purple-200' :
                      index === 1 ? 'text-yellow-300' :
                      index === 2 ? 'text-orange-300' :
                      'text-white/70'
                    }`}>
                      {tz.postsToday}
                    </span>
                  </>
                )}
                {index === 0 && tz.postsToday > 0 && !isMyTime && (
                  <svg className="w-3 h-3 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

