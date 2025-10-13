import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/stats/rankings - Get city and country rankings
 * Shows top 3 + user's rank for competitive engagement
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    
    // Get timezone parameters
    const timezoneOffset = searchParams.get('offset')
    const userCity = searchParams.get('userCity')
    const userCountry = searchParams.get('userCountry')
    
    // Calculate "today" in user's timezone
    let todayISO: string
    
    if (timezoneOffset) {
      const offsetMinutes = parseInt(timezoneOffset)
      const now = new Date()
      const userNow = new Date(now.getTime() - (offsetMinutes * 60 * 1000))
      const userToday = new Date(Date.UTC(
        userNow.getUTCFullYear(),
        userNow.getUTCMonth(),
        userNow.getUTCDate(),
        0, 0, 0, 0
      ))
      todayISO = new Date(userToday.getTime() + (offsetMinutes * 60 * 1000)).toISOString()
    } else {
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
      todayISO = today.toISOString()
    }
    
    // Fetch all posts from today
    const { data: todayPosts, error } = await supabase
      .from('posts')
      .select('location_city, location_state, location_country')
      .gte('created_at', todayISO)
    
    console.log('Rankings API Debug:', {
      todayISO,
      timezoneOffset,
      postsCount: todayPosts?.length || 0,
      postsWithLocation: todayPosts?.filter(p => p.location_city || p.location_state || p.location_country).length || 0
    })
    
    if (error) {
      console.error('Error fetching posts for rankings:', error)
      throw error
    }
    
    // Calculate rankings
    const cityMap = new Map<string, number>()
    const stateMap = new Map<string, number>()
    const countryMap = new Map<string, number>()
    
    todayPosts?.forEach(post => {
      // Count by city
      if (post.location_city) {
        const cityKey = `${post.location_city}, ${post.location_state || post.location_country}`
        cityMap.set(cityKey, (cityMap.get(cityKey) || 0) + 1)
      }
      
      // Count by state
      if (post.location_state) {
        stateMap.set(post.location_state, (stateMap.get(post.location_state) || 0) + 1)
      }
      
      // Count by country
      if (post.location_country) {
        countryMap.set(post.location_country, (countryMap.get(post.location_country) || 0) + 1)
      }
    })
    
    // Convert to sorted arrays
    const cityRankings = Array.from(cityMap.entries())
      .map(([city, count], index) => ({ city, count, rank: index + 1 }))
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({ ...item, rank: index + 1 }))
    
    const stateRankings = Array.from(stateMap.entries())
      .map(([state, count], index) => ({ state, count, rank: index + 1 }))
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({ ...item, rank: index + 1 }))
    
    const countryRankings = Array.from(countryMap.entries())
      .map(([country, count], index) => ({ country, count, rank: index + 1 }))
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({ ...item, rank: index + 1 }))
    
    // Find user's ranks
    const userState = searchParams.get('userState')
    const userCityKey = userCity ? `${userCity}, ${userState || userCountry}` : null
    const userCityRank = userCityKey ? cityRankings.find(c => c.city === userCityKey) : null
    const userStateRank = userState ? stateRankings.find(s => s.state === userState) : null
    const userCountryRank = userCountry ? countryRankings.find(c => c.country === userCountry) : null
    
    // Return top 5 + user's rank (if not in top 5)
    const topCities = cityRankings.slice(0, 5)
    const topStates = stateRankings.slice(0, 5)
    const topCountries = countryRankings.slice(0, 5)
    
    // Add user's rank if not in top 5
    if (userCityRank && userCityRank.rank > 5 && !topCities.find(c => c.city === userCityKey)) {
      topCities.push(userCityRank)
    }
    
    if (userStateRank && userStateRank.rank > 5 && !topStates.find(s => s.state === userState)) {
      topStates.push(userStateRank)
    }
    
    if (userCountryRank && userCountryRank.rank > 5 && !topCountries.find(c => c.country === userCountry)) {
      topCountries.push(userCountryRank)
    }
    
    return NextResponse.json({
      cities: {
        top: topCities,
        userRank: userCityRank || null,
        total: cityRankings.length
      },
      states: {
        top: topStates,
        userRank: userStateRank || null,
        total: stateRankings.length
      },
      countries: {
        top: topCountries,
        userRank: userCountryRank || null,
        total: countryRankings.length
      },
      totalPosts: todayPosts?.length || 0
    })
  } catch (error) {
    console.error('Error in GET /api/stats/rankings:', error)
    return NextResponse.json(
      { error: 'Failed to get rankings' },
      { status: 500 }
    )
  }
}

