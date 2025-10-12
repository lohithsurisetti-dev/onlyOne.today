import { createClient } from '@/lib/supabase/client'

export interface TrendingItem {
  id: string
  source: string
  category: string
  title: string
  description: string | null
  rank: number | null
  metadata: any
}

/**
 * Get cached trending data or fetch fresh if expired
 */
export async function getTrendingContext(
  source?: string,
  category?: string
): Promise<TrendingItem[]> {
  const supabase = createClient()

  let query = supabase
    .from('trending_context')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('rank', { ascending: true })

  if (source) {
    query = query.eq('source', source)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.limit(20)

  if (error) {
    console.error('Error fetching trending context:', error)
    return []
  }

  return data || []
}

/**
 * Save trending data to cache
 */
export async function saveTrendingContext(items: Array<{
  source: string
  category: string
  title: string
  description?: string
  rank?: number
  metadata?: any
  expiresIn?: number // seconds
}>) {
  const supabase = createClient()

  const now = new Date()
  const records = items.map(item => ({
    source: item.source,
    category: item.category,
    title: item.title,
    description: item.description || null,
    rank: item.rank || null,
    metadata: item.metadata || null,
    expires_at: new Date(now.getTime() + (item.expiresIn || 3600) * 1000).toISOString(),
  }))

  const { error } = await supabase
    .from('trending_context')
    .insert(records)

  if (error) {
    console.error('Error saving trending context:', error)
  }
}

/**
 * Fetch trending music from Spotify
 * NOTE: Requires Spotify API credentials
 */
export async function fetchSpotifyTrending(): Promise<Array<{
  source: string
  category: string
  title: string
  description: string
  rank: number
  metadata: any
}>> {
  // This is a placeholder - implement with actual Spotify API
  // You'll need to:
  // 1. Get Spotify API credentials
  // 2. Implement OAuth flow
  // 3. Fetch top tracks/playlists
  
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('Spotify credentials not configured')
    return []
  }

  try {
    // Get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    })

    const { access_token } = await tokenResponse.json()

    // Fetch top tracks (example: Global Top 50 playlist)
    const playlistResponse = await fetch(
      'https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=20',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    )

    const playlist = await playlistResponse.json()

    return playlist.items.map((item: any, index: number) => ({
      source: 'spotify',
      category: 'music',
      title: `${item.track.name} by ${item.track.artists[0].name}`,
      description: `Album: ${item.track.album.name}`,
      rank: index + 1,
      metadata: {
        track_id: item.track.id,
        artist: item.track.artists[0].name,
        album: item.track.album.name,
        preview_url: item.track.preview_url,
      },
    }))
  } catch (error) {
    console.error('Error fetching Spotify trending:', error)
    return []
  }
}

/**
 * Fetch trending topics from Google Trends
 * NOTE: This is a simplified example - actual implementation would use google-trends-api
 */
export async function fetchGoogleTrends(): Promise<Array<{
  source: string
  category: string
  title: string
  description: string
  rank: number
  metadata: any
}>> {
  // Placeholder for Google Trends integration
  // You can use the unofficial `google-trends-api` npm package
  
  try {
    // Example using google-trends-api (install it first: npm install google-trends-api)
    // const googleTrends = require('google-trends-api')
    // const results = await googleTrends.dailyTrends({ geo: 'US' })
    
    // For now, return empty array
    console.warn('Google Trends integration not implemented')
    return []
  } catch (error) {
    console.error('Error fetching Google Trends:', error)
    return []
  }
}

/**
 * Generate a witty message comparing user's post to trending topics
 */
export function generateTrendingMessage(
  userContent: string,
  trendingItems: TrendingItem[]
): string {
  if (trendingItems.length === 0) {
    return "While the world moved on, you did something uniquely you. ✨"
  }

  // Find if user's content relates to any trending topic
  const userLower = userContent.toLowerCase()
  const relatedTrend = trendingItems.find(item => {
    const titleLower = item.title.toLowerCase()
    // Simple keyword matching
    const keywords = titleLower.split(' ').filter(word => word.length > 3)
    return keywords.some(keyword => userLower.includes(keyword))
  })

  if (relatedTrend) {
    // User did something related to trends
    return `Everyone's talking about "${relatedTrend.title}" — you're right there with them! 🌟`
  } else {
    // User did something different
    const topTrend = trendingItems[0]
    return `While everyone streamed "${topTrend.title}", you stayed extraordinary. 🎵✨`
  }
}

/**
 * Refresh all trending data
 * Call this periodically (e.g., every hour) via a cron job
 */
export async function refreshTrendingData() {
  console.log('Refreshing trending data...')

  try {
    // Fetch from multiple sources
    const [spotifyTrends] = await Promise.all([
      fetchSpotifyTrending(),
      // Add more sources here:
      // fetchGoogleTrends(),
      // fetchTwitterTrending(),
    ])

    // Save to cache
    const allTrends = [
      ...spotifyTrends,
    ]

    if (allTrends.length > 0) {
      await saveTrendingContext(allTrends)
      console.log(`Saved ${allTrends.length} trending items`)
    }
  } catch (error) {
    console.error('Error refreshing trending data:', error)
  }
}

