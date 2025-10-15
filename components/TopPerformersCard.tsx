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
  userLocation?: { city?: string; state?: string; country?: string } | null
  alwaysExpanded?: boolean // If true, always show content (for mobile dropdowns)
}

export default function TopPerformersCard({ userLocation, alwaysExpanded = false }: Props) {
  const [rankings, setRankings] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState(alwaysExpanded)

  const fetchRankings = async () => {
    try {
      setRefreshing(true)
      setLoading(true)
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
        setLastRefreshed(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Auto-fetch when expanded or alwaysExpanded
  useEffect(() => {
    if ((expanded || alwaysExpanded) && !rankings) {
      fetchRankings()
    }
  }, [expanded, alwaysExpanded, userLocation])

  const getRankDisplay = (rank: number) => {
    return `#${rank}`
  }

  const getRankColor = (rank: number, isUser: boolean) => {
    if (isUser) return 'text-purple-300'
    if (rank === 1) return 'text-yellow-300'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-300'
    return 'text-white/70'
  }

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'United States': '🇺🇸', 'USA': '🇺🇸', 'Canada': '🇨🇦', 'Mexico': '🇲🇽',
      'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'Germany': '🇩🇪', 'France': '🇫🇷',
      'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Japan': '🇯🇵', 'China': '🇨🇳',
      'India': '🇮🇳', 'Brazil': '🇧🇷', 'Australia': '🇦🇺',
    }
    return flags[country] || '🌍'
  }

  const getStateAbbr = (state: string) => {
    const abbr: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    }
    return abbr[state] || state
  }

  const hasRankings = rankings && (
    rankings.countries.top.length > 0 ||
    rankings.cities.top.length > 0 ||
    rankings.states.top.length > 0
  )

  return (
    <div className={alwaysExpanded ? '' : 'bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden'}>
      {/* Collapsible Header (hide if alwaysExpanded) */}
      {!alwaysExpanded && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white">Today's Top Performers</h3>
              <p className="text-[10px] text-white/40">Tap to {expanded ? 'hide' : 'view'}</p>
            </div>
          </div>
          
          <svg 
            className={`w-5 h-5 text-white/60 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Content (always show if alwaysExpanded, otherwise only when expanded) */}
      {(expanded || alwaysExpanded) && (
        <div className={alwaysExpanded ? '' : 'border-t border-white/10 p-4 max-h-[500px] overflow-y-auto'}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] text-white/40">
                <span>📍 Location-enabled users</span>
                {lastRefreshed && (
                  <span className="ml-2 text-white/30">
                    • Updated {lastRefreshed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  fetchRankings()
                }}
                disabled={refreshing || loading}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                title="Refresh rankings"
              >
                <svg 
                  className={`w-4 h-4 text-purple-300 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-white/40 text-sm">
              <div className="animate-pulse">Loading rankings...</div>
            </div>
          ) : !hasRankings ? (
            <div className="text-center py-8 text-white/40 text-sm">
              <p className="mb-2">📍 No location data yet</p>
              <p className="text-xs">Rankings will appear as users post from different locations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Countries */}
              {rankings!.countries.top.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <h4 className="text-[10px] font-bold text-white/60 uppercase mb-2">🌍 Top Countries</h4>
                  <div className="space-y-1.5">
                    {rankings!.countries.top.slice(0, 3).map((item) => {
                      const isUser = item.country === userLocation?.country
                      return (
                        <div
                          key={item.country}
                          className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] ${
                            isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-xs font-bold ${getRankColor(item.rank, isUser)}`}>
                              {getRankDisplay(item.rank)}
                            </span>
                            <span className="text-base">{getCountryFlag(item.country)}</span>
                            <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/80'}`}>
                              {item.country}
                            </span>
                          </div>
                          <span className={`font-bold ${getRankColor(item.rank, isUser)}`}>
                            {item.count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* States */}
              {rankings!.states.top.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <h4 className="text-[10px] font-bold text-white/60 uppercase mb-2">🗺️ Top States</h4>
                  <div className="space-y-1.5">
                    {rankings!.states.top.slice(0, 3).map((item) => {
                      const isUser = item.state === userLocation?.state
                      return (
                        <div
                          key={item.state}
                          className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] ${
                            isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-xs font-bold ${getRankColor(item.rank, isUser)}`}>
                              {getRankDisplay(item.rank)}
                            </span>
                            <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/80'}`}>
                              {getStateAbbr(item.state)}
                            </span>
                          </div>
                          <span className={`font-bold ${getRankColor(item.rank, isUser)}`}>
                            {item.count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cities */}
              {rankings!.cities.top.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <h4 className="text-[10px] font-bold text-white/60 uppercase mb-2">🏙️ Top Cities</h4>
                  <div className="space-y-1.5">
                    {rankings!.cities.top.slice(0, 3).map((item) => {
                      const isUser = item.city === userLocation?.city
                      return (
                        <div
                          key={item.city}
                          className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] ${
                            isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-xs font-bold ${getRankColor(item.rank, isUser)}`}>
                              {getRankDisplay(item.rank)}
                            </span>
                            <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/80'}`}>
                              {item.city}
                            </span>
                          </div>
                          <span className={`font-bold ${getRankColor(item.rank, isUser)}`}>
                            {item.count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

