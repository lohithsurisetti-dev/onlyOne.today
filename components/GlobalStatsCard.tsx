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
  
  // Find most common cards
  const cardCounts: Record<string, number> = {}
  posts.forEach(post => {
    if (!post.isGhost) {
      const key = post.content || 'Unknown'
      cardCounts[key] = (cardCounts[key] || 0) + 1
    }
  })
  
  const sortedCards = Object.entries(cardCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  
  // Find most unique card (highest score)
  const mostUniquePost = posts
    .filter(p => !p.isGhost)
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0]

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
      'United States': '🇺🇸',
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'Mexico': '🇲🇽',
      'United Kingdom': '🇬🇧',
      'UK': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'Brazil': '🇧🇷',
      'Australia': '🇦🇺',
      'Russia': '🇷🇺',
      'South Korea': '🇰🇷',
      'Netherlands': '🇳🇱',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
      'Poland': '🇵🇱',
      'Portugal': '🇵🇹',
      'Greece': '🇬🇷',
      'Turkey': '🇹🇷',
      'Israel': '🇮🇱',
      'UAE': '🇦🇪',
      'Saudi Arabia': '🇸🇦',
      'Singapore': '🇸🇬',
      'Thailand': '🇹🇭',
      'Vietnam': '🇻🇳',
      'Philippines': '🇵🇭',
      'Indonesia': '🇮🇩',
      'Malaysia': '🇲🇾',
      'New Zealand': '🇳🇿',
      'Argentina': '🇦🇷',
      'Chile': '🇨🇱',
      'Colombia': '🇨🇴',
      'South Africa': '🇿🇦',
      'Egypt': '🇪🇬',
      'Nigeria': '🇳🇬',
      'Kenya': '🇰🇪',
    }
    return flags[country] || '🌍'
  }

  const getStateAbbr = (state: string) => {
    const abbr: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    }
    return abbr[state] || state
  }

  const hasRankings = rankings && (
    rankings.countries.top.length > 0 ||
    rankings.cities.top.length > 0 ||
    rankings.states.top.length > 0
  )

  return (
    <div className="bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden">
      {/* Top Rankings - 3 Columns Side by Side */}
      <div className="p-4 border-b border-white/10">
        <div className="mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Today's Top Performers
          </h3>
          <p className="text-[10px] text-white/40 mt-1 ml-7">
            Only includes users with location services enabled
          </p>
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
          <div className="space-y-4">
            {/* Countries Leaderboard */}
            {rankings.countries.top.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <h4 className="text-[10px] font-bold text-white/60 uppercase mb-2 flex items-center gap-1.5">
                  <span>🌍</span>
                  <span>Top Countries</span>
                </h4>
                <div className="space-y-1.5">
                  {rankings.countries.top.slice(0, 3).map((item, index) => {
                    const isUser = item.country === userLocation?.country
                    return (
                      <div
                        key={item.country}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-colors ${
                          isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`text-xs font-bold shrink-0 ${getRankColor(item.rank, isUser)}`}>
                            {getRankDisplay(item.rank)}
                          </span>
                          <span className="text-base shrink-0">{getCountryFlag(item.country)}</span>
                          <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/80'}`}>
                            {item.country}
                          </span>
                        </div>
                        <span className={`font-bold ml-2 ${getRankColor(item.rank, isUser)}`}>
                          {item.count}
                        </span>
                      </div>
                    )
                  })}
                  {/* User's rank if not in top 3 */}
                  {rankings.countries.userRank && rankings.countries.userRank.rank > 3 && (
                    <>
                      <div className="border-t border-purple-400/20 my-1"></div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded text-[11px] bg-purple-500/20 border border-purple-400/30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-purple-300 shrink-0">
                            {getRankDisplay(rankings.countries.userRank.rank)}
                          </span>
                          <span className="text-base shrink-0">{getCountryFlag(rankings.countries.userRank.country)}</span>
                          <span className="truncate text-purple-200 font-semibold">
                            {rankings.countries.userRank.country}
                          </span>
                        </div>
                        <span className="font-bold text-purple-300 ml-2">
                          {rankings.countries.userRank.count}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Cities Leaderboard */}
            {rankings.cities.top.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <h4 className="text-[10px] font-bold text-white/60 uppercase mb-2 flex items-center gap-1.5">
                  <span>🏙️</span>
                  <span>Top Cities</span>
                </h4>
                <div className="space-y-1.5">
                  {rankings.cities.top.slice(0, 3).map((item, index) => {
                    const isUser = item.city.startsWith(userLocation?.city || '__none__')
                    const cityName = item.city.split(',')[0]
                    return (
                      <div
                        key={item.city}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-colors ${
                          isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`text-xs font-bold shrink-0 ${getRankColor(item.rank, isUser)}`}>
                            {getRankDisplay(item.rank)}
                          </span>
                          <span className={`truncate ${isUser ? 'text-purple-200 font-semibold' : 'text-white/80'}`}>
                            {cityName}
                          </span>
                        </div>
                        <span className={`font-bold ml-2 ${getRankColor(item.rank, isUser)}`}>
                          {item.count}
                        </span>
                      </div>
                    )
                  })}
                  {/* User's rank if not in top 3 */}
                  {rankings.cities.userRank && rankings.cities.userRank.rank > 3 && (
                    <>
                      <div className="border-t border-purple-400/20 my-1"></div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded text-[11px] bg-purple-500/20 border border-purple-400/30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-purple-300 shrink-0">
                            {getRankDisplay(rankings.cities.userRank.rank)}
                          </span>
                          <span className="truncate text-purple-200 font-semibold">
                            {rankings.cities.userRank.city.split(',')[0]}
                          </span>
                        </div>
                        <span className="font-bold text-purple-300 ml-2">
                          {rankings.cities.userRank.count}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* States Leaderboard */}
            {rankings.states.top.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <h4 className="text-[10px] font-bold text-white/60 uppercase mb-2 flex items-center gap-1.5">
                  <span>🗺️</span>
                  <span>Top States</span>
                </h4>
                <div className="space-y-1.5">
                  {rankings.states.top.slice(0, 3).map((item, index) => {
                    const isUser = item.state === userLocation?.state
                    return (
                      <div
                        key={item.state}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-colors ${
                          isUser ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`text-xs font-bold shrink-0 ${getRankColor(item.rank, isUser)}`}>
                            {getRankDisplay(item.rank)}
                          </span>
                          <span className={`font-mono ${isUser ? 'text-purple-200 font-semibold' : 'text-white/80'}`}>
                            {getStateAbbr(item.state)}
                          </span>
                        </div>
                        <span className={`font-bold ml-2 ${getRankColor(item.rank, isUser)}`}>
                          {item.count}
                        </span>
                      </div>
                    )
                  })}
                  {/* User's rank if not in top 3 */}
                  {rankings.states.userRank && rankings.states.userRank.rank > 3 && (
                    <>
                      <div className="border-t border-purple-400/20 my-1"></div>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded text-[11px] bg-purple-500/20 border border-purple-400/30">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-purple-300 shrink-0">
                            {getRankDisplay(rankings.states.userRank.rank)}
                          </span>
                          <span className="font-mono text-purple-200 font-semibold">
                            {getStateAbbr(rankings.states.userRank.state)}
                          </span>
                        </div>
                        <span className="font-bold text-purple-300 ml-2">
                          {rankings.states.userRank.count}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Pulse - Detailed */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Global Pulse
        </h3>
        
        <div className="space-y-3">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-2 text-[10px]">
            <div className="bg-white/5 rounded p-2 text-center border border-white/5">
              <div className="text-white/40 mb-0.5">Total</div>
              <div className="text-base font-bold text-white">{totalPosts}</div>
            </div>
            
            <div className="bg-purple-500/10 rounded p-2 text-center border border-purple-400/20">
              <div className="text-purple-300/60 mb-0.5">Unique</div>
              <div className="text-base font-bold text-purple-300">{uniquePosts}</div>
            </div>
            
            <div className="bg-blue-500/10 rounded p-2 text-center border border-blue-400/20">
              <div className="text-blue-300/60 mb-0.5">Common</div>
              <div className="text-base font-bold text-blue-300">{commonPosts}</div>
            </div>
            
            {ghostPosts > 0 && (
              <div className="bg-orange-500/10 rounded p-2 text-center border border-orange-400/20">
                <div className="text-orange-300/60 mb-0.5">Trend</div>
                <div className="text-base font-bold text-orange-300">{ghostPosts}</div>
              </div>
            )}
          </div>
          
          {/* Most Common Cards */}
          {sortedCards.length > 0 && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <div className="text-[10px] font-semibold text-white/40 uppercase mb-2">Most Common</div>
              <div className="space-y-1.5">
                {sortedCards.map(([card, count], index) => (
                  <div key={card} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-yellow-300">{index === 0 ? '🔥' : '•'}</span>
                      <span className="text-white/80 truncate">{card}</span>
                    </div>
                    <span className="text-blue-300 font-bold ml-2">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Most Unique Card */}
          {mostUniquePost && (
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
              <div className="text-[10px] font-semibold text-purple-300/70 uppercase mb-2">Most Unique</div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-purple-200 truncate flex-1">✨ {mostUniquePost.content}</span>
                <span className="text-purple-300 font-bold ml-2">{Math.round(mostUniquePost.score || 0)}%</span>
              </div>
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

