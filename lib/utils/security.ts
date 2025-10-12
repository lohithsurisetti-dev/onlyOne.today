/**
 * Security Utilities
 * 
 * Additional security layers for the application
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Security Headers Configuration
 * Protects against common web vulnerabilities
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions policy (disable dangerous features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; ')
  )
  
  return response
}

/**
 * Validate request body size
 * Prevents DOS attacks via large payloads
 */
export async function validateBodySize(
  request: NextRequest,
  maxSizeKB: number = 50
): Promise<{ valid: boolean; error?: string }> {
  try {
    const contentLength = request.headers.get('content-length')
    
    if (contentLength) {
      const sizeKB = parseInt(contentLength) / 1024
      
      if (sizeKB > maxSizeKB) {
        return {
          valid: false,
          error: `Request body too large. Maximum size: ${maxSizeKB}KB`
        }
      }
    }
    
    return { valid: true }
  } catch {
    return { valid: true } // If we can't check, allow (fail open for usability)
  }
}

/**
 * Validate JSON body
 * Prevents malformed JSON attacks
 */
export async function validateJSON(request: NextRequest): Promise<{
  valid: boolean
  data?: any
  error?: string
}> {
  try {
    const body = await request.json()
    return { valid: true, data: body }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON format'
    }
  }
}

/**
 * Sanitize input strings
 * Remove potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Limit consecutive whitespace
    .replace(/\s{3,}/g, '  ')
}

/**
 * Validate string input
 */
export function validateString(
  value: any,
  options: {
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    required?: boolean
  } = {}
): { valid: boolean; error?: string } {
  const {
    minLength = 0,
    maxLength = 1000,
    pattern,
    required = true
  } = options
  
  // Check if required
  if (required && (!value || typeof value !== 'string')) {
    return { valid: false, error: 'Field is required' }
  }
  
  if (!value) return { valid: true }
  
  // Check type
  if (typeof value !== 'string') {
    return { valid: false, error: 'Must be a string' }
  }
  
  // Check length
  if (value.length < minLength) {
    return { valid: false, error: `Minimum length is ${minLength} characters` }
  }
  
  if (value.length > maxLength) {
    return { valid: false, error: `Maximum length is ${maxLength} characters` }
  }
  
  // Check pattern
  if (pattern && !pattern.test(value)) {
    return { valid: false, error: 'Invalid format' }
  }
  
  return { valid: true }
}

/**
 * Validate enum values
 */
export function validateEnum<T>(
  value: any,
  allowedValues: readonly T[],
  fieldName: string = 'value'
): { valid: boolean; error?: string } {
  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      error: `Invalid ${fieldName}. Allowed: ${allowedValues.join(', ')}`
    }
  }
  
  return { valid: true }
}

/**
 * Check for SQL injection patterns (defense in depth)
 * Note: Supabase handles this, but good to check anyway
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /('|")\s*(OR|AND)\s*('|")/i,
    /UNION.*SELECT/i,
    /1\s*=\s*1/,
    /'\s*OR\s*'1'\s*=\s*'1/i,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check for XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, etc.
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
    /eval\(/gi,
    /expression\(/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Validate and sanitize location data
 */
export function validateLocation(location: any): {
  valid: boolean
  sanitized?: { city?: string; state?: string; country?: string }
  error?: string
} {
  if (!location) {
    return { valid: true, sanitized: {} }
  }
  
  const sanitized: any = {}
  
  // Validate city
  if (location.city) {
    if (typeof location.city !== 'string' || location.city.length > 100) {
      return { valid: false, error: 'Invalid city name' }
    }
    sanitized.city = sanitizeInput(location.city)
  }
  
  // Validate state
  if (location.state) {
    if (typeof location.state !== 'string' || location.state.length > 100) {
      return { valid: false, error: 'Invalid state name' }
    }
    sanitized.state = sanitizeInput(location.state)
  }
  
  // Validate country
  if (location.country) {
    if (typeof location.country !== 'string' || location.country.length > 100) {
      return { valid: false, error: 'Invalid country name' }
    }
    sanitized.country = sanitizeInput(location.country)
  }
  
  return { valid: true, sanitized }
}

/**
 * Create a secure error response
 * Don't expose internal details
 */
export function createSecureErrorResponse(
  error: unknown,
  publicMessage: string = 'An error occurred',
  statusCode: number = 500
): NextResponse {
  // Log the real error server-side
  console.error('❌ Error:', error)
  
  // Return generic message to client
  return NextResponse.json(
    { error: publicMessage },
    { status: statusCode }
  )
}

/**
 * Honeypot field validation
 * Catches simple bots
 */
export function validateHoneypot(honeypotValue: any): boolean {
  // Honeypot should be empty (legitimate users won't fill it)
  return !honeypotValue || honeypotValue === ''
}

/**
 * Simple timing attack prevention
 * Add random delay to responses to prevent timing analysis
 */
export async function addRandomDelay(minMs: number = 10, maxMs: number = 50): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  await new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Environment variable validation
 * Ensure critical env vars are set
 */
export function validateEnvironment(): {
  valid: boolean
  missing?: string[]
} {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    return { valid: false, missing }
  }
  
  return { valid: true }
}

