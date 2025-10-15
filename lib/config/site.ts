/**
 * Site Configuration - Single Source of Truth
 * All URLs, emails, and site metadata come from here
 */

// Get base URL from environment or fallback to window.location.origin in browser
export const getSiteUrl = (): string => {
  // 1. Try environment variable (set in Vercel/local .env)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // 2. In browser, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // 3. Fallback for server-side rendering
  return 'https://onlyonetoday.com'
}

// Site metadata
export const SITE_CONFIG = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'OnlyOne.Today',
  url: getSiteUrl(),
  description: 'Discover what makes you unique! Share your daily actions and see how you compare to the world.',
  email: {
    hello: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@onlyonetoday.com',
    support: 'support@onlyonetoday.com',
  },
  social: {
    twitter: '@onlyonetoday', // Update when you create account
    instagram: '@onlyonetoday', // Update when you create account
  },
  legal: {
    companyName: 'OnlyOne.Today',
    foundedYear: 2025,
  },
} as const

// Helper to get full URL for a path
export const getFullUrl = (path: string): string => {
  const baseUrl = getSiteUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

// Helper to get share URL for a post
export const getPostShareUrl = (postId: string): string => {
  return getFullUrl(`/response?postId=${postId}`)
}

// Helper to get OG image URL
export const getOgImageUrl = (params: Record<string, string>): string => {
  const queryString = new URLSearchParams(params).toString()
  return getFullUrl(`/api/og-image?${queryString}`)
}

