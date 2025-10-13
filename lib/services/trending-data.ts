/**
 * Dynamic Trending Data from Real APIs
 * 
 * Sources:
 * 1. Reddit - Hot posts (no auth needed)
 * 2. Spotify Charts - Top songs (web scraping, no auth)
 * 3. Google Trends - Daily trends (unofficial npm package)
 * 4. TheSportsDB - Live sports events (free API, no auth)
 */

import googleTrends from 'google-trends-api'
import * as cheerio from 'cheerio'

export interface TrendingItem {
  content: string
  count: number
  source: 'reddit' | 'github' | 'google' | 'spotify' | 'sports' | 'curated'
}

/**
 * 1. Get trending topics from Reddit
 * Using multiple endpoints for better reliability
 */
export async function getRedditTrending(): Promise<TrendingItem[]> {
  // Try multiple endpoints in order
  const endpoints = [
    'https://www.reddit.com/r/popular/top.json?t=day&limit=50',
    'https://www.reddit.com/r/all/top.json?t=hour&limit=50',
    'https://www.reddit.com/r/all/hot.json?limit=50'
  ]
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(endpoint, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        cache: 'no-store'
      })
      
      clearTimeout(timeout)
      
      if (!response.ok) {
        console.log(`⚠️ Reddit ${endpoint.split('/')[4]} returned ${response.status}, trying next...`)
        continue
      }
      
      const data = await response.json()
      
      if (!data?.data?.children || data.data.children.length === 0) {
        console.log('⚠️ Reddit returned no data, trying next...')
        continue
      }
      
      const trends = data.data.children
        .filter((post: any) => post.data.ups > 300) // Lower threshold for more results
        .slice(0, 30)
        .map((post: any) => {
          let title = post.data.title
          if (title.length > 60) {
            title = title.substring(0, 57) + '...'
          }
          
          return {
            content: `Reading about "${title}" on Reddit`,
            count: post.data.ups * 100,
            source: 'reddit' as const
          }
        })
      
      if (trends.length > 0) {
        console.log(`✅ Reddit: ${trends.length} trends fetched from ${endpoint.split('/')[4]}`)
        return trends
      }
    } catch (error) {
      console.log(`⚠️ Reddit ${endpoint.split('/')[4]} failed, trying next...`)
      continue
    }
  }
  
  console.log('⚠️ All Reddit endpoints failed')
  return []
}

/**
 * 2. Get trending songs from Spotify Charts (Unofficial API)
 * 
 * Uses Spotify's public charts API - no authentication needed
 * Returns TODAY's actual trending songs!
 */
export async function getSpotifyTrending(): Promise<TrendingItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout (increased)
    
    // Use Spotify's undocumented public API (powers their charts website)
    const response = await fetch(
      'https://charts-spotify-com-service.spotify.com/public/v0/charts',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        cache: 'no-store'
      }
    )
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract entries from the first chart (usually global weekly)
    const chartResponses = data.chartEntryViewResponses || []
    
    if (chartResponses.length === 0) {
      throw new Error('No chart data found')
    }
    
    // Get entries from the first chart
    const entries = chartResponses[0]?.entries || []
    
    if (entries.length === 0) {
      throw new Error('No chart entries found')
    }
    
    return entries.slice(0, 30).map((entry: any, index: number) => {
      const trackName = entry.trackMetadata?.trackName || 'Unknown Track'
      const artistName = entry.trackMetadata?.artists?.[0]?.name || entry.trackMetadata?.artistName || 'Unknown Artist'
      
      // Estimate streams based on chart position
      const estimatedStreams = Math.floor((15000000 - (index * 400000)) * (Math.random() * 0.3 + 0.85))
      
      return {
        content: `Listening to "${trackName}" by ${artistName}`,
        count: Math.max(estimatedStreams, 3000000), // Minimum 3M
        source: 'spotify' as const
      }
    })
    
  } catch (error) {
    console.log('⚠️ Spotify Charts API failed, skipping')
    return []
  }
}

/**
 * 3. Get trending searches from Google Trends RSS (Official, Reliable)
 * Uses Google's official RSS feed - no auth needed!
 */
export async function getGoogleTrends(): Promise<TrendingItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    // Google Trends RSS feed (official, free, reliable)
    const response = await fetch('https://trends.google.com/trending/rss?geo=US', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal,
      cache: 'no-store'
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      console.log(`⚠️ Google Trends RSS returned ${response.status}`)
      return []
    }
    
    const xmlText = await response.text()
    
    // Extract titles and traffic from RSS XML
    const titleMatches = xmlText.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)
    const trafficMatches = xmlText.matchAll(/<ht:approx_traffic>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:approx_traffic>/g)
    
    const titles = Array.from(titleMatches)
      .slice(1) // Skip first (channel title)
      .map(match => match[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim())
    
    const trafficData = Array.from(trafficMatches)
      .map(match => match[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim())
    
    if (titles.length === 0) {
      console.log('⚠️ No trends found in Google RSS')
      return []
    }
    
    const trends = titles.slice(0, 15).map((title, index) => {
      // Parse traffic (e.g., "100K+" or "1M+")
      let count = 500000 // Default 500K
      if (trafficData[index]) {
        const trafficStr = trafficData[index].replace(/[+,]/g, '')
        if (trafficStr.includes('M')) {
          count = parseFloat(trafficStr) * 1000000
        } else if (trafficStr.includes('K')) {
          count = parseFloat(trafficStr) * 1000
        }
      }
      
      return {
        content: `Searching for "${title}"`,
        count: Math.floor(count),
        source: 'google' as const
      }
    })
    
    console.log(`✅ Google Trends RSS: ${trends.length} trends`)
    return trends
    
  } catch (error) {
    console.log('⚠️ Google Trends RSS failed, skipping')
    return []
  }
}

/**
 * 4. Get trending sports events
 */
export async function getSportsTrending(): Promise<TrendingItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout (increased)
    
    // TheSportsDB API - Free tier, no auth needed
    // Get recent and upcoming events from major leagues
    const leagues = [
      { id: '4328', name: 'English Premier League' },      // Soccer
      { id: '4387', name: 'NBA' },                         // Basketball
      { id: '4424', name: 'NFL' },                         // American Football
      { id: '4380', name: 'MLB' },                         // Baseball
      { id: '4332', name: 'UEFA Champions League' },       // Soccer
      { id: '4391', name: 'NHL' },                         // Hockey
    ]
    
    const allEvents: TrendingItem[] = []
    
    // Fetch events from multiple leagues in parallel
    const eventPromises = leagues.map(async (league) => {
      try {
        // Get next/upcoming events
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league.id}`,
          { 
            signal: controller.signal,
            // @ts-ignore - Next.js specific
            next: { revalidate: 600 } // Cache for 10 minutes
          }
        )
        
        if (!response.ok) return []
        
        const data = await response.json()
        
        if (!data.events || data.events.length === 0) return []
        
        return data.events.slice(0, 5).map((event: any) => {
          const homeTeam = event.strHomeTeam || 'Unknown'
          const awayTeam = event.strAwayTeam || 'Unknown'
          const score = event.intHomeScore && event.intAwayScore 
            ? `${event.intHomeScore}-${event.intAwayScore}`
            : ''
          
          const content = score
            ? `Watched ${homeTeam} vs ${awayTeam} (${score})`
            : `Following ${homeTeam} vs ${awayTeam}`
          
          return {
            content,
            count: Math.floor(Math.random() * 500000) + 100000, // 100k-600k viewers
            source: 'sports' as const
          }
        })
      } catch (err) {
        return []
      }
    })
    
    const results = await Promise.all(eventPromises)
    clearTimeout(timeout)
    
    // Flatten and shuffle
    results.forEach(events => allEvents.push(...events))
    
    if (allEvents.length === 0) {
      throw new Error('No sports events found')
    }
    
    console.log(`🏀 Sports: ${allEvents.length} events`)
    return allEvents.sort(() => Math.random() - 0.5).slice(0, 15)
    
  } catch (error) {
    console.log('⚠️ Sports API failed, skipping')
    return []
  }
}

/**
 * Combine all trending sources
 */
export async function getAllTrendingData(): Promise<TrendingItem[]> {
  console.log('🔄 Fetching trending data from all sources...')
  
  const [reddit, spotify, google, sports] = await Promise.allSettled([
    getRedditTrending(),
    getSpotifyTrending(),
    getGoogleTrends(),
    getSportsTrending()
  ])
  
  const allTrends: TrendingItem[] = []
  
  if (reddit.status === 'fulfilled') {
    console.log(`✅ Reddit: ${reddit.value.length} trends`)
    allTrends.push(...reddit.value)
  } else {
    console.error('❌ Reddit failed:', reddit.reason)
  }
  
  if (spotify.status === 'fulfilled') {
    console.log(`✅ Spotify: ${spotify.value.length} trends`)
    allTrends.push(...spotify.value)
  } else {
    console.error('❌ Spotify failed:', spotify.reason)
  }
  
  if (google.status === 'fulfilled') {
    console.log(`✅ Google: ${google.value.length} trends`)
    allTrends.push(...google.value)
  } else {
    console.error('❌ Google failed:', google.reason)
  }
  
  if (sports.status === 'fulfilled') {
    console.log(`✅ Sports: ${sports.value.length} events`)
    allTrends.push(...sports.value)
  } else {
    console.error('❌ Sports failed:', sports.reason)
  }
  
  console.log(`📊 Total trending items: ${allTrends.length}`)
  
  // If we got NO data from any source, this shouldn't happen due to fallbacks
  if (allTrends.length === 0) {
    console.error('🚨 CRITICAL: All trending sources failed! This should not happen.')
  }
  
  // Shuffle for variety
  return allTrends.sort(() => Math.random() - 0.5)
}

/**
 * Get formatted trending data for ghost posts
 */
export async function getTrendingForGhostPosts(count: number = 10): Promise<Array<{
  content: string
  count: number
  source: string
}>> {
  const trends = await getAllTrendingData()
  
  // Return random selection
  return trends.slice(0, count)
}

