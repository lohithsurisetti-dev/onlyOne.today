/**
 * Content Moderation Service
 * 
 * Balanced moderation approach:
 * - Prevent obvious policy violations (contact info, explicit content)
 * - Don't be overly strict to maintain engagement
 * - Focus on safety without killing creativity
 */

export interface ModerationResult {
  allowed: boolean
  reason?: string
  severity?: 'low' | 'medium' | 'high'
}

/**
 * Moderate user-generated content
 */
export function moderateContent(content: string): ModerationResult {
  if (!content || content.trim().length === 0) {
    return { allowed: false, reason: 'Content cannot be empty', severity: 'low' }
  }
  
  const text = content.toLowerCase().trim()
  
  // 1. Check for phone numbers (various formats)
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // 123-456-7890, 123.456.7890, 123 456 7890
    /\b\d{10}\b/, // 1234567890
    /\b\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/, // +1-123-456-7890
    /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/, // (123) 456-7890
    /\b\d{3}[-.\s]?\d{4}\b/, // Simple: 123-4567 or 1234567
  ]
  
  for (const pattern of phonePatterns) {
    if (pattern.test(content)) {
      return { 
        allowed: false, 
        reason: 'Phone numbers are not allowed for your safety', 
        severity: 'high' 
      }
    }
  }
  
  // 2. Check for email addresses
  const emailPattern = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i
  if (emailPattern.test(content)) {
    return { 
      allowed: false, 
      reason: 'Email addresses are not allowed for your safety', 
      severity: 'high' 
    }
  }
  
  // 3. Check for URLs (http/https/www)
  const urlPatterns = [
    /https?:\/\//i,
    /www\./i,
    /\b[a-z0-9-]+\.(com|org|net|io|co|app|dev|me|info|biz)\b/i,
  ]
  
  for (const pattern of urlPatterns) {
    if (pattern.test(content)) {
      return { 
        allowed: false, 
        reason: 'URLs and links are not allowed', 
        severity: 'medium' 
      }
    }
  }
  
  // 4. Check for social media handles
  const socialHandlePatterns = [
    /@[a-z0-9_]{3,}/i, // Twitter/Instagram/etc handles
    /\b(instagram|twitter|facebook|snapchat|tiktok|telegram|whatsapp)\b/i,
  ]
  
  for (const pattern of socialHandlePatterns) {
    if (pattern.test(content)) {
      return { 
        allowed: false, 
        reason: 'Social media handles and usernames are not allowed', 
        severity: 'medium' 
      }
    }
  }
  
  // 5. Check for explicit sexual content (comprehensive but not overly strict)
  
  // 5a. Direct explicit terms
  const explicitSexualTerms = [
    'porn',
    'xxx',
    'nsfw',
    'nude',
    'naked',
    'sex video',
    'explicit',
    'onlyfans',
    'pornhub',
    'xvideos',
  ]
  
  for (const term of explicitSexualTerms) {
    if (text.includes(term)) {
      return { 
        allowed: false, 
        reason: 'Content contains inappropriate material', 
        severity: 'high' 
      }
    }
  }
  
  // 5b. Sexual activity patterns (catches euphemisms and creative phrasing)
  const adultContentPatterns = [
    // Sexual acts (explicit - no ambiguity)
    /\b(cum|cumming|orgasm|climax|ejaculat)/i, // Removed word boundary at end for word variants
    /\b(masturbat|jerk(ing|ed)?\s+off|jack(ing|ed)?\s+off|beat(ing)?\s+off)/i, // Catches masturbate, masturbated, masturbating
    /\b(fuck|fucking|fucked)\b/i,
    
    // Sexual positions with partner context (doggy, missionary, etc.)
    /\b(doggy|missionary|cowgirl|reverse\s+cowgirl|69|sixty\s*nine)\b.*\b(with|gf|bf|girlfriend|boyfriend|partner|bae)\b/i,
    /\b(with|gf|bf|girlfriend|boyfriend|partner|bae)\b.*\b(doggy|missionary|cowgirl|reverse\s+cowgirl|69|sixty\s*nine)\b/i,
    /\b(did|doing|tried|had)\s+(doggy|missionary|cowgirl|reverse\s+cowgirl)\b/i,
    
    // Sexual context patterns
    /\b(horny|aroused|turned\s+on)\b.*\b(watch|look|see|view)/i,
    /\b(watch|look|see|view)\b.*\b(horny|aroused|turned\s+on)\b/i,
    
    // "came" in SEXUAL context only (more precise patterns)
    /\b(came|coming)\b\s+(\d+|multiple|several|many)\s+times?\b/i, // "came 9 times"
    /\b\d+\s*times?\b.*\b(came|coming)\b(?!\s+(home|back|to|from|in\s+first|close))/i, // "9 times came"
    /\b(came|coming)\b\s+(while|when|as)\s+(watch|look|see|view)/i, // "came while watching"
    /\b(watch|look|see|view)\b.*\b(came|coming)\b(?!\s+(home|back|to|from))/i, // "watching X came"
    /\b(came|coming)\b.*\b(orgasm|climax)\b/i, // "came to orgasm"
    
    // Quantified sexual acts (other than "came")
    /\b(orgasm|climax|masturbat|jerk\s+off)\w*.*\b\d+\s*times?\b/i, // Added \w* for word variants
    /\b\d+\s*times?\b.*\b(orgasm|climax|masturbat|jerk\s+off)/i,
    
    // Sexual content consumption
    /\b(watch|view|look|see)\b.*\b(porn|xxx|nsfw|adult\s+(video|content|film))\b/i,
    /\b(porn|xxx|nsfw|adult\s+(video|content|film))\b.*\b(watch|view|look|see)\b/i,
    
    // References to adult performers (generic patterns)
    /\b(pornstar|porn\s+star|adult\s+(star|actress|actor|performer))\b/i,
    /\b(looking\s+at|watching|viewing)\b.*\b(getting\s+off|orgasm)/i,
    
    // Body parts in sexual context
    /\b(dick|cock|penis|pussy|vagina|tits|boobs|breast)\b/i,
    
    // Sexual gratification phrases
    /\b(getting\s+off|get\s+off|got\s+off)\b/i,
  ]
  
  for (const pattern of adultContentPatterns) {
    if (pattern.test(content)) {
      return { 
        allowed: false, 
        reason: 'Content contains inappropriate material', 
        severity: 'high' 
      }
    }
  }
  
  // 6. Check for violence and threats (focused on serious cases)
  const violentThreats = [
    'kill myself',
    'suicide',
    'end my life',
    'hurt myself',
    'self harm',
    'terroris', // catches terrorist, terrorism
    'bomb',
    'shoot up',
    'mass shooting',
  ]
  
  for (const term of violentThreats) {
    if (text.includes(term)) {
      return { 
        allowed: false, 
        reason: 'Content contains concerning language. Please seek help if needed.', 
        severity: 'high' 
      }
    }
  }
  
  // 7. Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters (aaaaaaaaaa)
    /\b(buy now|click here|limited time|free money|make \$\d+|get rich)\b/i,
    /\b(viagra|cialis|crypto|bitcoin|investment)\b/i,
  ]
  
  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { 
        allowed: false, 
        reason: 'Content appears to be spam', 
        severity: 'medium' 
      }
    }
  }
  
  // 8. Check for extreme hate speech (focused on clear cases)
  const hateSlurs: string[] = [
    // Note: This is a basic list. In production, use a more comprehensive database
    // and consider context. We're being conservative here.
  ]
  
  for (const slur of hateSlurs) {
    if (text.includes(slur)) {
      return { 
        allowed: false, 
        reason: 'Content contains hate speech or offensive language', 
        severity: 'high' 
      }
    }
  }
  
  // 9. Check for excessive length (anti-spam)
  if (content.length > 500) {
    return { 
      allowed: false, 
      reason: 'Content is too long. Please keep it brief.', 
      severity: 'low' 
    }
  }
  
  // 10. Check for too short (likely not meaningful)
  if (content.trim().length < 3) {
    return { 
      allowed: false, 
      reason: 'Content is too short. Please be more descriptive.', 
      severity: 'low' 
    }
  }
  
  // All checks passed
  return { allowed: true }
}

/**
 * Clean and sanitize content (for display)
 */
export function sanitizeContent(content: string): string {
  // Remove excessive whitespace
  let cleaned = content.trim().replace(/\s+/g, ' ')
  
  // Remove any remaining potentially dangerous characters
  // But keep emojis and special characters that make content fun
  cleaned = cleaned.replace(/<script[^>]*>.*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<[^>]+>/g, '') // Remove HTML tags
  
  return cleaned
}

/**
 * Get user-friendly error message for moderation failures
 */
export function getModerationMessage(result: ModerationResult): string {
  if (result.allowed) return ''
  
  const messages: Record<string, string> = {
    'Phone numbers are not allowed for your safety': 
      '📵 Oops! Phone numbers aren\'t allowed here. Let\'s keep it mysterious! ✨',
    'Email addresses are not allowed for your safety': 
      '📧 Hey there! Email addresses aren\'t allowed. Stay anonymous and have fun!',
    'URLs and links are not allowed': 
      '🔗 Links aren\'t welcome here! Just share your awesome action instead!',
    'Social media handles and usernames are not allowed': 
      '📱 Social handles stay secret here! Let your action do the talking! 🎭',
    'Content contains inappropriate material': 
      '🌟 Let\'s keep things fun and friendly for everyone! Try something more wholesome?',
    'Content contains concerning language. Please seek help if needed.': 
      '💜 We noticed some heavy stuff. If you need support, please reach out to a crisis helpline. You matter!',
    'Content appears to be spam': 
      '🎪 This looks a bit spammy! Share a real action - we\'d love to hear what you did!',
    'Content contains hate speech or offensive language': 
      '🌈 Kindness is our vibe here! How about sharing something positive instead?',
    'Content is too long. Please keep it brief.': 
      '📖 Story time is great, but let\'s keep it snappy! Under 500 characters please!',
    'Content is too short. Please be more descriptive.': 
      '✍️ We\'re curious! Tell us more - what did you do? Paint us a picture!',
    'Content cannot be empty': 
      '🎬 Action! We need something here. What awesome thing did you do today?',
  }
  
  return messages[result.reason || ''] || result.reason || 'Content not allowed'
}

