# Dynamic Trending Data Integration Guide

## Overview

Replace static ghost posts with **real-time trending data** from open-source APIs.

---

## Available Free/Open-Source APIs

### 1. **Google Trends (Unofficial)**

#### Option A: google-trends-api (npm package)
```bash
npm install google-trends-api
```

**Usage:**
```typescript
import googleTrends from 'google-trends-api'

// Get trending searches in real-time
const trending = await googleTrends.dailyTrends({
  geo: 'US',
})

// Parse and extract trending topics
const trends = JSON.parse(trending)
const topics = trends.default.trendingSearchesDays[0].trendingSearches
```

**Example Output:**
```json
{
  "title": { "query": "Taylor Swift" },
  "articles": [...],
  "formattedTraffic": "2M+"
}
```

**Ghost Post Example:**
```
"Listening to Taylor Swift (2M+ searches today)"
```

#### Option B: SerpApi (Free tier: 100 searches/month)
- More reliable but needs API key
- https://serpapi.com/google-trends-api

---

### 2. **Spotify Trending (Web Scraping)**

#### Spotify Charts (Public)
**URL:** `https://charts.spotify.com/charts/view/regional-global-daily/latest`

**Method:** Web scraping (no API key needed)

```typescript
// lib/services/spotify-trending.ts
import cheerio from 'cheerio'

export async function getSpotifyTrending() {
  const response = await fetch('https://charts.spotify.com/charts/view/regional-global-daily/latest')
  const html = await response.text()
  const $ = cheerio.load(html)
  
  const trending = []
  $('.chart-table-row').slice(0, 10).each((i, el) => {
    const song = $(el).find('.chart-table-track-name').text()
    const artist = $(el).find('.chart-table-artist-name').text()
    trending.push({
      type: 'music',
      content: `Listening to ${song} by ${artist}`,
      count: Math.floor(Math.random() * 5000000) + 1000000 // Estimate
    })
  })
  
  return trending
}
```

**Install:**
```bash
npm install cheerio
```

---

### 3. **Reddit Trending (Official API - No Auth Required)**

**API:** `https://www.reddit.com/r/all/hot.json`

**Usage:**
```typescript
export async function getRedditTrending() {
  const response = await fetch('https://www.reddit.com/r/all/hot.json?limit=20')
  const data = await response.json()
  
  const trending = data.data.children.map(post => ({
    type: 'social',
    content: post.data.title,
    count: post.data.ups, // Upvotes
    subreddit: post.data.subreddit
  }))
  
  return trending.filter(t => t.count > 1000) // Only popular posts
}
```

**Ghost Post Example:**
```
"Reading about [trending topic] on Reddit (5K upvotes)"
```

---

### 4. **Twitter/X Trending (Unofficial)**

#### Option A: Nitter (Twitter scraper)
**URL:** `https://nitter.net/explore/trending`

```typescript
export async function getTwitterTrending() {
  const response = await fetch('https://nitter.net/api/v1/trends')
  const data = await response.json()
  
  return data.trends.map(trend => ({
    type: 'social',
    content: `Talking about ${trend.name}`,
    count: trend.tweet_volume || 10000
  }))
}
```

#### Option B: RapidAPI Twitter (Free tier available)
- https://rapidapi.com/twitter/api/twitter154

---

### 5. **YouTube Trending (Official API - Free)**

**API:** YouTube Data API v3
**Free Quota:** 10,000 units/day (enough for ~100 requests)

**Setup:**
1. Get API key: https://console.cloud.google.com/apis/credentials
2. Enable YouTube Data API v3

**Usage:**
```typescript
export async function getYouTubeTrending() {
  const apiKey = process.env.YOUTUBE_API_KEY
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=20&key=${apiKey}`
  )
  const data = await response.json()
  
  return data.items.map(video => ({
    type: 'video',
    content: `Watching ${video.snippet.title}`,
    count: parseInt(video.statistics.viewCount)
  }))
}
```

---

### 6. **GitHub Trending (No Auth)**

**API:** `https://api.github.com/search/repositories?q=created:>YYYY-MM-DD&sort=stars`

```typescript
export async function getGitHubTrending() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = yesterday.toISOString().split('T')[0]
  
  const response = await fetch(
    `https://api.github.com/search/repositories?q=created:>${date}&sort=stars&order=desc`
  )
  const data = await response.json()
  
  return data.items.slice(0, 10).map(repo => ({
    type: 'tech',
    content: `Checking out ${repo.name} on GitHub`,
    count: repo.stargazers_count
  }))
}
```

---

### 7. **News Headlines (NewsAPI - Free tier)**

**API:** NewsAPI.org
**Free Quota:** 100 requests/day

**Setup:**
1. Get API key: https://newsapi.org/register
2. Add to `.env.local`: `NEWS_API_KEY=your_key`

**Usage:**
```typescript
export async function getNewsTrending() {
  const apiKey = process.env.NEWS_API_KEY
  const response = await fetch(
    `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`
  )
  const data = await response.json()
  
  return data.articles.slice(0, 10).map(article => ({
    type: 'news',
    content: `Reading about ${article.title}`,
    count: Math.floor(Math.random() * 1000000) + 100000 // Estimate
  }))
}
```

---

## Recommended Implementation Strategy

### Phase 1: No API Keys (Start Here)

**Best Free Options (No Keys Needed):**
1. ✅ **Reddit API** (easiest, no auth)
2. ✅ **GitHub Trending** (simple, reliable)
3. ✅ **Google Trends npm package** (works but unofficial)

### Phase 2: With Free API Keys

**Add these for better data:**
4. ✅ **YouTube API** (official, 10K requests/day)
5. ✅ **NewsAPI** (100 requests/day)

### Phase 3: Enhanced (Optional)

6. ⚠️ **Spotify scraping** (requires cheerio, may break)
7. ⚠️ **Twitter/Nitter** (unofficial, may be unstable)

---

## Implementation Example

### File: `lib/services/trending-data.ts`

```typescript
/**
 * Dynamic Trending Data from Real APIs
 */

// 1. Reddit Trending (No Auth)
export async function getRedditTrending() {
  try {
    const response = await fetch('https://www.reddit.com/r/all/hot.json?limit=20', {
      headers: { 'User-Agent': 'OnlyOne.today/1.0' }
    })
    const data = await response.json()
    
    return data.data.children
      .filter(post => post.data.ups > 1000)
      .slice(0, 10)
      .map(post => ({
        content: `Reading about "${post.data.title.substring(0, 50)}..." on Reddit`,
        count: post.data.ups * 100, // Estimate total viewers
        source: 'reddit'
      }))
  } catch (error) {
    console.error('Reddit trending fetch failed:', error)
    return []
  }
}

// 2. GitHub Trending (No Auth)
export async function getGitHubTrending() {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const date = yesterday.toISOString().split('T')[0]
    
    const response = await fetch(
      `https://api.github.com/search/repositories?q=created:>${date}&sort=stars&order=desc&per_page=10`
    )
    const data = await response.json()
    
    return data.items.map(repo => ({
      content: `Checking out ${repo.name} on GitHub`,
      count: repo.stargazers_count * 1000, // Estimate interest
      source: 'github'
    }))
  } catch (error) {
    console.error('GitHub trending fetch failed:', error)
    return []
  }
}

// 3. Google Trends (npm package)
export async function getGoogleTrends() {
  try {
    const googleTrends = require('google-trends-api')
    const result = await googleTrends.dailyTrends({ geo: 'US' })
    const data = JSON.parse(result)
    
    const trends = data.default.trendingSearchesDays[0].trendingSearches
    
    return trends.slice(0, 10).map(trend => ({
      content: `Searching for "${trend.title.query}"`,
      count: parseInt(trend.formattedTraffic.replace(/[^0-9]/g, '')) * 1000,
      source: 'google'
    }))
  } catch (error) {
    console.error('Google Trends fetch failed:', error)
    return []
  }
}

// Combine all sources
export async function getAllTrendingData() {
  const [reddit, github, google] = await Promise.allSettled([
    getRedditTrending(),
    getGitHubTrending(),
    getGoogleTrends()
  ])
  
  const allTrends = [
    ...(reddit.status === 'fulfilled' ? reddit.value : []),
    ...(github.status === 'fulfilled' ? github.value : []),
    ...(google.status === 'fulfilled' ? google.value : [])
  ]
  
  // Shuffle and return
  return allTrends.sort(() => Math.random() - 0.5)
}
```

---

## Update Ghost Posts Service

### File: `lib/services/ghost-posts.ts`

```typescript
import { getAllTrendingData } from './trending-data'

// Cache trending data (refresh every 10 minutes)
let trendingCache: any[] = []
let lastFetch = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export async function getGhostPosts(count: number = 10) {
  const now = Date.now()
  
  // Fetch new trending data if cache expired
  if (now - lastFetch > CACHE_DURATION || trendingCache.length === 0) {
    console.log('🔄 Fetching fresh trending data...')
    trendingCache = await getAllTrendingData()
    lastFetch = now
  }
  
  // Return random selection from cache
  const shuffled = [...trendingCache].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((trend, i) => ({
    id: `ghost-${now}-${i}`,
    content: trend.content,
    count: trend.count,
    score: 5, // Low uniqueness (trending = common)
    type: 'common',
    isGhost: true,
    time: 'now',
    source: trend.source
  }))
}
```

---

## Installation

```bash
# Required for Google Trends
npm install google-trends-api

# Optional for Spotify scraping
npm install cheerio

# Update environment variables
echo "YOUTUBE_API_KEY=your_key_here" >> .env.local
echo "NEWS_API_KEY=your_key_here" >> .env.local
```

---

## Cron Job (Refresh Trending Data)

### File: `app/api/cron/trending/route.ts`

```typescript
import { getAllTrendingData } from '@/lib/services/trending-data'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Fetch and cache trending data
  const trends = await getAllTrendingData()
  
  console.log(`✅ Refreshed ${trends.length} trending items`)
  
  return Response.json({ 
    success: true, 
    count: trends.length,
    sources: [...new Set(trends.map(t => t.source))]
  })
}
```

### Vercel Cron Config (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/trending",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

---

## Cost Analysis

| Source | Free Tier | Quota | Reliability |
|--------|-----------|-------|-------------|
| Reddit | ✅ Free Forever | Unlimited | ⭐⭐⭐⭐⭐ |
| GitHub | ✅ Free Forever | 5000/hr | ⭐⭐⭐⭐⭐ |
| Google Trends (npm) | ✅ Free | Unofficial | ⭐⭐⭐ |
| YouTube | ✅ 10K/day | Need key | ⭐⭐⭐⭐ |
| NewsAPI | ✅ 100/day | Need key | ⭐⭐⭐⭐ |
| Spotify | ⚠️ Scraping | May break | ⭐⭐ |

**Recommendation:** Start with **Reddit + GitHub** (both free, unlimited, reliable)

---

## Next Steps

1. ✅ Install: `npm install google-trends-api`
2. ✅ Create: `lib/services/trending-data.ts`
3. ✅ Update: `lib/services/ghost-posts.ts`
4. ✅ Test: `curl http://localhost:3000/api/cron/trending`
5. ✅ Deploy: Will auto-refresh every 10 minutes

---

**Last Updated:** January 2025  
**Status:** Ready to implement  
**Difficulty:** Easy (Reddit + GitHub) → Medium (with API keys)

