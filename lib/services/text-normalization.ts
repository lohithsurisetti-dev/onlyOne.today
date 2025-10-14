/**
 * Advanced Text Normalization Pipeline
 * 
 * Based on GPT recommendations for production-grade text preprocessing
 * 
 * Features:
 * - Unicode normalization (NFC)
 * - Smart punctuation handling
 * - Digit/unit normalization
 * - Emoji preservation
 * - Contraction expansion
 * - British/American spelling unification
 */

/**
 * Normalize Unicode to NFC form
 * Ensures consistent character representation
 */
export function normalizeUnicode(text: string): string {
  return text.normalize('NFC')
}

/**
 * Expand contractions to full form
 * Important for negation detection!
 */
export function expandContractions(text: string): string {
  const contractions: Record<string, string> = {
    // Negations (critical!)
    "didn't": "did not",
    "don't": "do not",
    "doesn't": "does not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "won't": "will not",
    "wouldn't": "would not",
    "can't": "can not",
    "cannot": "can not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    
    // Other common contractions
    "i'm": "i am",
    "i've": "i have",
    "i'd": "i would",
    "i'll": "i will",
    "you're": "you are",
    "you've": "you have",
    "you'd": "you would",
    "you'll": "you will",
    "he's": "he is",
    "she's": "she is",
    "it's": "it is",
    "we're": "we are",
    "we've": "we have",
    "they're": "they are",
    "they've": "they have",
    "that's": "that is",
    "what's": "what is",
    "where's": "where is",
    "who's": "who is",
  }
  
  let normalized = text
  for (const [contraction, expansion] of Object.entries(contractions)) {
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi')
    normalized = normalized.replace(regex, expansion)
  }
  
  return normalized
}

/**
 * Unify British/American spelling variants
 */
export function unifySpelling(text: string): string {
  const variants: Record<string, string> = {
    'favourite': 'favorite',
    'colour': 'color',
    'honour': 'honor',
    'flavour': 'flavor',
    'neighbour': 'neighbor',
    'travelling': 'traveling',
    'cancelled': 'canceled',
    'organised': 'organized',
    'realised': 'realized',
    'centre': 'center',
    'theatre': 'theater',
    'metre': 'meter',
    'litre': 'liter',
  }
  
  let normalized = text
  for (const [british, american] of Object.entries(variants)) {
    const regex = new RegExp(`\\b${british}\\b`, 'gi')
    normalized = normalized.replace(regex, american)
  }
  
  return normalized
}

/**
 * Normalize digits and time expressions
 */
export function normalizeDigits(text: string): string {
  return text
    // "2am" → "2 am"
    .replace(/(\d+)(am|pm)/gi, '$1 $2')
    // "2.5km" → "2.5 km"
    .replace(/(\d+\.?\d*)(km|mi|kg|lb|hrs?|mins?|secs?)/gi, '$1 $2')
    // Multiple spaces → single space
    .replace(/\s+/g, ' ')
}

/**
 * Clean punctuation but preserve meaning
 */
export function cleanPunctuation(text: string): string {
  return text
    // Keep apostrophes in contractions
    .replace(/[^\w\s'@#:]/g, ' ')
    // Multiple spaces → single
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Detect and extract emoji patterns
 * Returns text with emojis converted to tags
 */
export function normalizeEmojis(text: string): {
  text: string
  emojis: string[]
} {
  const emojiMap: Record<string, string> = {
    '😀': ':smile:',
    '😁': ':grin:',
    '😂': ':joy:',
    '🤣': ':rofl:',
    '😊': ':blush:',
    '😍': ':heart_eyes:',
    '🥰': ':smiling_face_with_hearts:',
    '😎': ':sunglasses:',
    '🤔': ':thinking:',
    '😴': ':sleeping:',
    '😋': ':yum:',
    '🍕': ':pizza:',
    '🍔': ':burger:',
    '🍦': ':ice_cream:',
    '🍿': ':popcorn:',
    '🏃': ':running:',
    '⚽': ':soccer:',
    '🏀': ':basketball:',
    '🎾': ':tennis:',
    '🏊': ':swimming:',
    '🚴': ':biking:',
    '📚': ':books:',
    '🎮': ':video_game:',
    '🎬': ':movie:',
    '🎵': ':music:',
    '☕': ':coffee:',
    '🌅': ':sunrise:',
    '🌃': ':night:',
  }
  
  const emojis: string[] = []
  let normalized = text
  
  for (const [emoji, tag] of Object.entries(emojiMap)) {
    if (text.includes(emoji)) {
      emojis.push(tag)
      normalized = normalized.replace(new RegExp(emoji, 'g'), ` ${tag} `)
    }
  }
  
  // Clean up spacing
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return { text: normalized, emojis }
}

/**
 * Main normalization pipeline
 * Applies all transformations in optimal order
 */
export function normalizeText(text: string): {
  normalized: string
  original: string
  emojis: string[]
  hasNegation: boolean
  timeExpressions: string[]
} {
  const original = text
  
  // Step 1: Unicode normalization (foundation)
  let normalized = normalizeUnicode(text)
  
  // Step 2: Expand contractions (before emoji, to preserve meaning)
  normalized = expandContractions(normalized)
  
  // Step 3: Extract emojis (preserve as tags)
  const { text: withEmojis, emojis } = normalizeEmojis(normalized)
  normalized = withEmojis
  
  // Step 4: Unify spelling variants
  normalized = unifySpelling(normalized)
  
  // Step 5: Normalize digits and units
  normalized = normalizeDigits(normalized)
  
  // Step 6: Clean punctuation (keep apostrophes)
  normalized = cleanPunctuation(normalized)
  
  // Step 7: Detect negation (after expansion!)
  const hasNegation = /\b(not|no|never|neither|nobody|nothing|nowhere)\b/i.test(normalized)
  
  // Step 8: Extract time expressions
  const timeExpressions = extractTimeExpressions(normalized)
  
  // Step 9: Final cleanup
  normalized = normalized
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  
  return {
    normalized,
    original,
    emojis,
    hasNegation,
    timeExpressions
  }
}

/**
 * Extract time expressions from text
 */
export function extractTimeExpressions(text: string): string[] {
  const timePatterns = [
    // Time of day
    { pattern: /\b(morning|early morning)\b/i, tag: 'morning' },
    { pattern: /\b(afternoon|this afternoon)\b/i, tag: 'afternoon' },
    { pattern: /\b(evening|this evening)\b/i, tag: 'evening' },
    { pattern: /\b(night|tonight|last night)\b/i, tag: 'night' },
    
    // Specific times
    { pattern: /\b(\d{1,2})\s*(am|a\.m\.)\b/i, tag: 'early_hours' },
    { pattern: /\b(\d{1,2})\s*(pm|p\.m\.)\b/i, tag: 'daytime' },
    
    // Relative time
    { pattern: /\b(today|this day)\b/i, tag: 'today' },
    { pattern: /\b(yesterday)\b/i, tag: 'yesterday' },
    { pattern: /\b(earlier|before|just now)\b/i, tag: 'recent' },
    { pattern: /\b(later|after)\b/i, tag: 'future' },
  ]
  
  const tags: string[] = []
  const textLower = text.toLowerCase()
  
  for (const { pattern, tag } of timePatterns) {
    if (pattern.test(textLower)) {
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    }
  }
  
  return tags
}

/**
 * Calculate n-gram Jaccard similarity
 * Used in composite scoring
 */
export function ngramJaccard(text1: string, text2: string, n: number = 3): number {
  const getNgrams = (text: string): Set<string> => {
    const ngrams = new Set<string>()
    const clean = text.toLowerCase().replace(/\s+/g, '')
    for (let i = 0; i <= clean.length - n; i++) {
      ngrams.add(clean.substring(i, i + n))
    }
    return ngrams
  }
  
  const ngrams1 = getNgrams(text1)
  const ngrams2 = getNgrams(text2)
  
  if (ngrams1.size === 0 || ngrams2.size === 0) {
    return 0
  }
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)))
  const union = new Set([...ngrams1, ...ngrams2])
  
  return intersection.size / union.size
}

/**
 * Calculate token overlap (weighted by importance)
 */
export function tokenOverlap(text1: string, text2: string): number {
  const getTokens = (text: string): string[] => {
    return text.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  }
  
  const tokens1 = getTokens(text1)
  const tokens2 = getTokens(text2)
  
  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0
  }
  
  const set1 = new Set(tokens1)
  const set2 = new Set(tokens2)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size
}

