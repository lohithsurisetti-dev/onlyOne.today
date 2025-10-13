'use client'

import React, { useState, useEffect } from 'react'

interface RankingData {
  cities: {
    top: Array<{ city: string; count: number; rank: number }>
    userRank: { city: string; count: number; rank: number } | null
    total: number
  }
  states: {
    top: Array<{ state: string; count: number; rank: number }>
    userRank: { state: string; count: number; rank: number } | null
    total: number
  }
  countries: {
    top: Array<{ country: string; count: number; rank: number }>
    userRank: { country: string; count: number; rank: number } | null
    total: number
  }
  totalPosts: number
}

interface Props {
  posts: any[]
  currentFilter: string
  userLocation?: { city?: string; state?: string; country?: string } | null
}

export default function GlobalStatsCard({ posts, currentFilter, userLocation }: Props) {
  const [rankings, setRankings] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const offset = new Date().getTimezoneOffset()
        const params = new URLSearchParams({
          offset: offset.toString(),
          ...(userLocation?.city && { userCity: userLocation.city }),
          ...(userLocation?.state && { userState: userLocation.state }),
          ...(userLocation?.country && { userCountry: userLocation.country }),
        })
        
        const response = await fetch(`/api/stats/rankings?${params}`, {
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          setRankings(data)
        }
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
    const interval = setInterval(fetchRankings, 60000)
    return () => clearInterval(interval)
  }, [userLocation])

  // Calculate stats from posts
  const totalPosts = posts.length
  const uniquePosts = posts.filter(p => !p.isGhost && (p.score || 0) >= 70).length
  const commonPosts = posts.filter(p => !p.isGhost && (p.score || 0) < 70).length
  const ghostPosts = posts.filter(p => p.isGhost).length

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankColor = (rank: number, isUser: boolean) => {
    if (isUser) return 'text-purple-300'
    if (rank === 1) return 'text-yellow-300'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-300'
    return 'text-white/70'
  }

  return (
    <div className="bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden">
      {/* Top Rankings - 3 Columns Side by Side */}
      {rankings && !loading && (
        <div className="p-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Today's Top Performers
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Countries */}
            <div>
              <div className="text-[10px] font-semibold text-white/40 uppercase mb-2 text-center">Countries</div>
              <div className="space-y-1.5">
                {rankings.countries.top.slice(0, 5).map((item) => {
                  const isUser = item.country === userLocation?.country
                  return (
                    <div
                      key={item.country}
                      className={`flex items-center justify-between px-2 py-1 rounded text-[11px] ${
                        isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="shrink-0">{getMedalEmoji(item.rank)}</span>
                        <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/70'}`}>
                          {item.country}
                        </span>
                      </div>
                      <span className={`font-bold ml-1 ${getRankColor(item.rank, isUser)}`}>
                        {item.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cities */}
            <div>
              <div className="text-[10px] font-semibold text-white/40 uppercase mb-2 text-center">Cities</div>
              <div className="space-y-1.5">
                {rankings.cities.top.slice(0, 5).map((item) => {
                  const isUser = item.city.startsWith(userLocation?.city || '__none__')
                  const cityName = item.city.split(',')[0] // Show just city name
                  return (
                    <div
                      key={item.city}
                      className={`flex items-center justify-between px-2 py-1 rounded text-[11px] ${
                        isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="shrink-0">{getMedalEmoji(item.rank)}</span>
                        <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/70'}`}>
                          {cityName}
                        </span>
                      </div>
                      <span className={`font-bold ml-1 ${getRankColor(item.rank, isUser)}`}>
                        {item.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* States */}
            <div>
              <div className="text-[10px] font-semibold text-white/40 uppercase mb-2 text-center">States</div>
              <div className="space-y-1.5">
                {rankings.states.top.slice(0, 5).map((item) => {
                  const isUser = item.state === userLocation?.state
                  return (
                    <div
                      key={item.state}
                      className={`flex items-center justify-between px-2 py-1 rounded text-[11px] ${
                        isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="shrink-0">{getMedalEmoji(item.rank)}</span>
                        <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/70'}`}>
                          {item.state}
                        </span>
                      </div>
                      <span className={`font-bold ml-1 ${getRankColor(item.rank, isUser)}`}>
                        {item.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Pulse - Compact */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Current Feed
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <div className="text-white/50 mb-1">Total</div>
            <div className="text-lg font-bold text-white">{totalPosts}</div>
          </div>
          
          <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-400/20">
            <div className="text-purple-300/70 mb-1">Unique</div>
            <div className="text-lg font-bold text-purple-300">{uniquePosts}</div>
          </div>
          
          <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-400/20">
            <div className="text-blue-300/70 mb-1">Common</div>
            <div className="text-lg font-bold text-blue-300">{commonPosts}</div>
          </div>
          
          {ghostPosts > 0 && (
            <div className="bg-orange-500/10 rounded-lg p-2 border border-orange-400/20">
              <div className="text-orange-300/70 mb-1">Trending</div>
              <div className="text-lg font-bold text-orange-300">{ghostPosts}</div>
            </div>
          )}
        </div>
      </div>

      {/* Live Indicator */}
      <div className="px-4 pb-3 flex items-center justify-center gap-2 text-xs text-white/40">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>Live updates</span>
      </div>
    </div>
  )
}

