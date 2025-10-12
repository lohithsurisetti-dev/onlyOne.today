/**
 * Dynamic Trending Data from Real APIs
 * 
 * Sources:
 * 1. Reddit - Hot posts (no auth needed)
 * 2. GitHub - Trending repositories (no auth needed)
 * 3. Google Trends - Daily trends (unofficial npm package)
 */

import googleTrends from 'google-trends-api'

export interface TrendingItem {
  content: string
  count: number
  source: 'reddit' | 'github' | 'google'
}

/**
 * 1. Get trending topics from Reddit
 */
export async function getRedditTrending(): Promise<TrendingItem[]> {
  try {
    const response = await fetch('https://www.reddit.com/r/all/hot.json?limit=25', {
      headers: { 
        'User-Agent': 'OnlyOne.today/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data.data.children
      .filter((post: any) => post.data.ups > 500) // Only popular posts
      .slice(0, 10)
      .map((post: any) => {
        // Shorten title if too long
        let title = post.data.title
        if (title.length > 60) {
          title = title.substring(0, 57) + '...'
        }
        
        return {
          content: `Reading about "${title}" on Reddit`,
          count: post.data.ups * 100, // Estimate total viewers
          source: 'reddit' as const
        }
      })
  } catch (error) {
    console.error('❌ Reddit trending fetch failed:', error)
    return []
  }
}

/**
 * 2. Get trending repositories from GitHub
 */
export async function getGitHubTrending(): Promise<TrendingItem[]> {
  try {
    // Get repos created in the last 7 days, sorted by stars
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const date = weekAgo.toISOString().split('T')[0]
    
    const response = await fetch(
      `https://api.github.com/search/repositories?q=created:>${date}&sort=stars&order=desc&per_page=15`
    )
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data.items.slice(0, 10).map((repo: any) => ({
      content: `Checking out ${repo.full_name} on GitHub`,
      count: repo.stargazers_count * 1000, // Estimate interest
      source: 'github' as const
    }))
  } catch (error) {
    console.error('❌ GitHub trending fetch failed:', error)
    return []
  }
}

/**
 * 3. Get trending searches from Google Trends
 */
export async function getGoogleTrends(): Promise<TrendingItem[]> {
  try {
    const result = await googleTrends.dailyTrends({
      geo: 'US',
    })
    
    const data = JSON.parse(result)
    const trends = data.default?.trendingSearchesDays?.[0]?.trendingSearches || []
    
    return trends.slice(0, 10).map((trend: any) => {
      // Parse traffic number (e.g., "2M+" -> 2000000)
      const traffic = trend.formattedTraffic || '10K+'
      let count = 10000
      
      if (traffic.includes('M+')) {
        count = parseFloat(traffic.replace(/[^0-9.]/g, '')) * 1000000
      } else if (traffic.includes('K+')) {
        count = parseFloat(traffic.replace(/[^0-9.]/g, '')) * 1000
      }
      
      return {
        content: `Searching for "${trend.title.query}"`,
        count: count,
        source: 'google' as const
      }
    })
  } catch (error) {
    console.error('❌ Google Trends fetch failed:', error)
    return []
  }
}

/**
 * Combine all trending sources
 */
export async function getAllTrendingData(): Promise<TrendingItem[]> {
  console.log('🔄 Fetching trending data from all sources...')
  
  const [reddit, github, google] = await Promise.allSettled([
    getRedditTrending(),
    getGitHubTrending(),
    getGoogleTrends()
  ])
  
  const allTrends: TrendingItem[] = []
  
  if (reddit.status === 'fulfilled') {
    console.log(`✅ Reddit: ${reddit.value.length} trends`)
    allTrends.push(...reddit.value)
  } else {
    console.error('❌ Reddit failed:', reddit.reason)
  }
  
  if (github.status === 'fulfilled') {
    console.log(`✅ GitHub: ${github.value.length} trends`)
    allTrends.push(...github.value)
  } else {
    console.error('❌ GitHub failed:', github.reason)
  }
  
  if (google.status === 'fulfilled') {
    console.log(`✅ Google: ${google.value.length} trends`)
    allTrends.push(...google.value)
  } else {
    console.error('❌ Google failed:', google.reason)
  }
  
  console.log(`📊 Total trending items: ${allTrends.length}`)
  
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

