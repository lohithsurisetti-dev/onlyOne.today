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

interface TimezoneData {
  timezones: TimezoneStats[]
  mostActive: TimezoneStats
  totalGlobal: number
}

export default function TimezoneLeaderboard() {
  const [data, setData] = useState<TimezoneData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimezoneStats = async () => {
      try {
        const response = await fetch('/api/stats/timezones', {
          cache: 'no-store'
        })
        
        if (response.ok) {
          const stats = await response.json()
          setData(stats)
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
      <div className="bg-space-mid/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Loading global activity...
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl p-5 border border-white/10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Global Activity
        </h3>
        <div className="text-xs text-white/50">
          {data.totalGlobal} posts today
        </div>
      </div>

      {/* Most Active Badge */}
      {data.mostActive && data.mostActive.postsToday > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{data.mostActive.emoji}</span>
              <div>
                <div className="text-sm font-bold text-white">{data.mostActive.label}</div>
                <div className="text-xs text-white/60">{data.mostActive.localTime}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-purple-300">{data.mostActive.postsToday}</div>
              <div className="text-xs text-white/50">🔥 Most Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Timezone List */}
      <div className="space-y-2">
        {data.timezones.slice(0, 8).map((tz, index) => (
          <div
            key={tz.timezone}
            className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{tz.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{tz.label}</div>
                <div className="text-xs text-white/50">{tz.localTime}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${
                index === 0 ? 'text-purple-300' :
                index === 1 ? 'text-blue-300' :
                index === 2 ? 'text-cyan-300' :
                'text-white/70'
              }`}>
                {tz.postsToday}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Indicator */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/40">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>Live updates every 60s</span>
      </div>
    </div>
  )
}

