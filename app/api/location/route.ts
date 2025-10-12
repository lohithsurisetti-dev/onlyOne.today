import { NextRequest, NextResponse } from 'next/server'
import { getIP } from '@/lib/utils/rate-limit'

/**
 * GET /api/location - Server-side location detection
 * 
 * Detects location based on IP address
 * Uses multiple fallback APIs to avoid rate limits
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getIP(request)
    console.log('📍 Detecting location for IP:', ip)
    
    // For localhost, detect the actual external IP
    let targetIP = ip
    if (ip === 'unknown' || ip.includes('127.0.0.1') || ip.includes('::ffff:127.0.0.1') || ip.includes('::1')) {
      console.log('🏠 Localhost detected - getting real external IP...')
      
      // Get the actual external IP using a simple service
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json', {
          signal: AbortSignal.timeout(3000)
        })
        const ipData = await ipResponse.json()
        targetIP = ipData.ip
        console.log('🌐 External IP detected:', targetIP)
      } catch (err) {
        console.log('⚠️ Could not get external IP, using demo location')
        return NextResponse.json({
          success: true,
          location: {
            city: 'Demo City',
            state: 'Demo State',
            country: 'Demo Country',
            countryCode: 'XX'
          },
          source: 'demo',
          isDevelopment: true
        })
      }
    }
    
    // Try multiple APIs in sequence
    const apis = [
      {
        name: 'ipapi.co',
        url: `https://ipapi.co/${targetIP}/json/`,
        parse: (data: any) => ({
          city: data.city || '',
          state: data.region || '',
          country: data.country_name || '',
          countryCode: data.country_code || ''
        }),
        checkError: (data: any) => data.error
      },
      {
        name: 'ip-api.com',
        url: `http://ip-api.com/json/${targetIP}`,
        parse: (data: any) => ({
          city: data.city || '',
          state: data.regionName || '',
          country: data.country || '',
          countryCode: data.countryCode || ''
        }),
        checkError: (data: any) => data.status === 'fail'
      }
    ]
    
    for (const api of apis) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch(api.url, {
          signal: controller.signal,
        })
        
        clearTimeout(timeout)
        
        if (!response.ok) {
          console.log(`❌ ${api.name} returned ${response.status}`)
          continue
        }
        
        const data = await response.json()
        
        if (api.checkError(data)) {
          console.log(`❌ ${api.name} error:`, data)
          continue
        }
        
        const location = api.parse(data)
        console.log(`✅ Location from ${api.name}:`, location)
        
        return NextResponse.json({
          success: true,
          location,
          source: api.name
        })
      } catch (err) {
        console.log(`❌ ${api.name} failed:`, err)
        continue
      }
    }
    
    // All APIs failed - return empty location (worldwide mode)
    console.log('⚠️ All location APIs failed, using worldwide mode')
    return NextResponse.json({
      success: false,
      location: {
        city: '',
        state: '',
        country: '',
        countryCode: ''
      },
      message: 'Location unavailable'
    })
    
  } catch (error) {
    console.error('❌ Location detection error:', error)
    return NextResponse.json({
      success: false,
      location: {
        city: '',
        state: '',
        country: '',
        countryCode: ''
      }
    })
  }
}

