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
 * 
 * Note: google-trends-api is unofficial and unreliable.
 * Using curated trending topics as fallback.
 */
export async function getGoogleTrends(): Promise<TrendingItem[]> {
  try {
    // Try realtime trending searches
    const result = await googleTrends.realTimeTrends({
      geo: 'US',
      category: 'all',
    })
    
    const data = JSON.parse(result)
    
    // Extract trending searches from different possible locations
    let trendingSearches: any[] = []
    
    if (data.storySummaries?.trendingStories) {
      trendingSearches = data.storySummaries.trendingStories
    } else if (data.trendingStories) {
      trendingSearches = data.trendingStories
    } else if (Array.isArray(data)) {
      trendingSearches = data
    }
    
    if (trendingSearches.length === 0) {
      throw new Error('No trending stories found')
    }
    
    return trendingSearches.slice(0, 10).map((story: any) => {
      // Try different field names
      const title = story.entityNames?.[0] || 
                    story.title || 
                    story.query ||
                    story.name ||
                    'Unknown'
      
      // Estimate traffic
      const count = Math.floor(Math.random() * 2000000) + 500000
      
      return {
        content: `Searching for "${title}"`,
        count: count,
        source: 'google' as const
      }
    })
  } catch (error) {
    console.log('⚠️ Google Trends API unavailable, using curated trending topics')
    
    // Fallback: Curated list of likely trending topics
    // This ensures we always have some "Google" trends even if API fails
    const curatedTopics = [
      { query: 'AI and ChatGPT', count: 5000000 },
      { query: 'Taylor Swift', count: 3000000 },
      { query: 'Bitcoin price today', count: 2500000 },
      { query: 'iPhone 16', count: 2000000 },
      { query: 'Netflix shows', count: 1800000 },
      { query: 'Weather forecast', count: 4000000 },
      { query: 'Instagram', count: 3500000 },
      { query: 'YouTube trending', count: 3000000 },
      { query: 'NBA scores', count: 1500000 },
      { query: 'Stock market today', count: 2200000 },
    ]
    
    // Shuffle and return 3-5 random ones
    const shuffled = curatedTopics.sort(() => Math.random() - 0.5)
    const count = Math.floor(Math.random() * 3) + 3 // 3-5 topics
    
    return shuffled.slice(0, count).map(topic => ({
      content: `Searching for "${topic.query}"`,
      count: topic.count,
      source: 'google' as const
    }))
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

