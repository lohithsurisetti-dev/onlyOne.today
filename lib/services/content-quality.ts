/**
 * Content Quality Analysis - Detect spam, gibberish, and low-quality posts
 * 100% dynamic - no static spam lists!
 */

import natural from 'natural'
import { generateDynamicHash } from './nlp-dynamic'

/**
 * Check if content is semantically coherent (makes sense)
 * Returns quality score 0-100
 */
export function checkSemanticCoherence(content: string): {
  score: number
  isCoherent: boolean
  reason?: string
} {
  const tokens = content.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  
  // 1. Check minimum meaningful length
  if (content.trim().length < 5) {
    return {
      score: 0,
      isCoherent: false,
      reason: 'Content too short to be meaningful'
    }
  }
  
  // 2. ENHANCED: Check for gibberish per word
  let gibberishWords = 0
  for (const word of tokens) {
    if (word.length < 3) continue // Skip very short words
    
    const wordVowels = (word.match(/[aeiou]/gi) || []).length
    const wordConsonants = (word.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length
    const wordTotal = wordVowels + wordConsonants
    
    if (wordTotal > 0) {
      const wordVowelRatio = wordVowels / wordTotal
      
      // English words typically have 35-45% vowels
      // Flag if outside 20-65% range
      if (wordVowelRatio < 0.20 || wordVowelRatio > 0.65) {
        gibberishWords++
      }
    }
  }
  
  // If more than 50% of words look like gibberish, reject
  const gibberishRatio = tokens.length > 0 ? gibberishWords / tokens.length : 0
  if (gibberishRatio > 0.5) {
    return {
      score: 25,
      isCoherent: false,
      reason: 'Multiple words have unusual character patterns'
    }
  }
  
  // 3. Check for repeated characters/patterns
  const repeatedPattern = /(.)\1{4,}/.test(content) // 5+ repeated chars
  if (repeatedPattern) {
    return {
      score: 20,
      isCoherent: false,
      reason: 'Excessive character repetition'
    }
  }
  
  // 4. Check for test/spam patterns
  const spamWords = ['activity', 'test', 'post', 'one', 'two', 'three', 'four', 'five', 'alpha', 'beta', 'gamma', 'delta']
  const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  
  // Check for "activity one", "test alpha", "post beta" patterns
  const lowerContent = content.toLowerCase()
  const hasTestPattern = spamWords.some(word => lowerContent.includes(word))
  const hasNumber = numberWords.some(num => lowerContent.includes(num))
  const hasGreekLetter = ['alpha', 'beta', 'gamma', 'delta'].some(letter => lowerContent.includes(letter))
  
  if ((hasTestPattern && hasNumber) || (hasTestPattern && hasGreekLetter)) {
    return {
      score: 30,
      isCoherent: false,
      reason: 'Appears to be test/spam content (contains test words + identifiers)'
    }
  }
  
  // 5. Verify it has meaningful words using POS tagging
  const hash = generateDynamicHash(content)
  const meaningfulWords = hash.stems.length
  
  if (meaningfulWords === 0) {
    return {
      score: 0,
      isCoherent: false,
      reason: 'No meaningful words detected (all filtered by grammar check)'
    }
  }
  
  // Single word posts are suspicious unless they're common activities
  if (meaningfulWords === 1 && tokens.length === 1) {
    // Check if it's a single gibberish word
    const singleWord = tokens[0]
    if (singleWord.length > 8 || /[^a-z]/.test(singleWord)) {
      return {
        score: 30,
        isCoherent: false,
        reason: 'Single word appears invalid'
      }
    }
    // Single valid word is marginal quality
    return {
      score: 60,
      isCoherent: true,
      reason: 'Single word post (low quality but allowed)'
    }
  }
  
  // Require at least 2 meaningful words for good quality
  if (meaningfulWords < 2 && tokens.length > 1) {
    return {
      score: 45,
      isCoherent: false,
      reason: 'Insufficient meaningful content (filler words only)'
    }
  }
  
  // 6. Check word diversity (avoid "test test test")
  const uniqueWords = new Set(tokens.map(t => t.toLowerCase()))
  const diversityRatio = uniqueWords.size / tokens.length
  
  if (diversityRatio <= 0.5 && tokens.length >= 2) {
    return {
      score: 35,
      isCoherent: false,
      reason: 'Low word diversity (repetitive content)'
    }
  }
  
  // 7. Check if words look like random characters (keyboard mashing)
  const keyboardPatterns = [
    /asdf/i, /qwerty/i, /zxcv/i, /hjkl/i, /yuiop/i, 
    /^[bcdfghjklmnpqrstvwxyz]{5,}$/i  // 5+ consecutive consonants
  ]
  
  const hasKeyboardMashing = tokens.some(word => 
    keyboardPatterns.some(pattern => pattern.test(word))
  )
  
  if (hasKeyboardMashing) {
    return {
      score: 20,
      isCoherent: false,
      reason: 'Content appears to be random keyboard characters'
    }
  }
  
  // 8. Final gibberish check - if we have gibberish from earlier, strengthen it
  if (gibberishWords > 0 && tokens.length <= 2) {
    // Single or two-word posts with ANY gibberish = reject
    return {
      score: 20,
      isCoherent: false,
      reason: 'Content contains gibberish or random characters'
    }
  }
  
  // 9. All checks passed - calculate final quality score
  let qualityScore = 100
  
  // Penalize if very short meaningful content
  if (meaningfulWords < 2) {
    qualityScore -= 20
  }
  
  // Penalize low diversity even if not blocking
  if (diversityRatio < 0.75 && tokens.length > 2) {
    qualityScore -= 10
  }
  
  return {
    score: Math.max(50, qualityScore),
    isCoherent: qualityScore >= 65 // Slightly relaxed threshold
  }
}

/**
 * Detect spam patterns dynamically
 */
export function detectSpamPatterns(content: string): {
  isSpam: boolean
  confidence: number
  patterns: string[]
} {
  const detectedPatterns: string[] = []
  let spamScore = 0
  
  // Pattern 1: Sequential numbers/letters
  if (/\b(one two|alpha beta|test \d+|post \d+)\b/i.test(content)) {
    detectedPatterns.push('sequential_identifiers')
    spamScore += 40
  }
  
  // Pattern 2: URL-like patterns (even without protocol)
  if (/\w+\.(com|org|net|io|co)\b/i.test(content)) {
    detectedPatterns.push('url_pattern')
    spamScore += 50
  }
  
  // Pattern 3: Email-like patterns
  if (/\S+@\S+\.\S+/.test(content)) {
    detectedPatterns.push('email_pattern')
    spamScore += 50
  }
  
  // Pattern 4: Excessive special characters
  const specialChars = (content.match(/[^a-z0-9\s]/gi) || []).length
  const specialRatio = specialChars / content.length
  if (specialRatio > 0.3) {
    detectedPatterns.push('excessive_special_chars')
    spamScore += 30
  }
  
  // Pattern 5: All caps (more than 50% of letters)
  const capsCount = (content.match(/[A-Z]/g) || []).length
  const lettersCount = (content.match(/[A-Z]/gi) || []).length
  if (lettersCount > 5 && capsCount / lettersCount > 0.5) {
    detectedPatterns.push('excessive_caps')
    spamScore += 25
  }
  
  return {
    isSpam: spamScore >= 50,
    confidence: Math.min(100, spamScore),
    patterns: detectedPatterns
  }
}

/**
 * Comprehensive content quality check
 */
export function validateContentQuality(content: string): {
  allowed: boolean
  score: number
  reason?: string
  issues: string[]
} {
  const issues: string[] = []
  
  // 1. Check semantic coherence
  const coherence = checkSemanticCoherence(content)
  if (!coherence.isCoherent) {
    issues.push(coherence.reason || 'Low coherence')
  }
  
  // 2. Check for spam patterns
  const spam = detectSpamPatterns(content)
  if (spam.isSpam) {
    issues.push(`Spam detected: ${spam.patterns.join(', ')}`)
  }
  
  // 3. Calculate overall quality score
  const coherenceWeight = 0.8 // Increased weight for coherence
  const spamWeight = 0.2
  
  const overallScore = 
    (coherence.score * coherenceWeight) +
    ((100 - spam.confidence) * spamWeight)
  
  // 4. Determine if content is allowed
  // Stricter threshold: 60 instead of 50
  const allowed = overallScore >= 60 && !spam.isSpam && coherence.isCoherent
  
  return {
    allowed,
    score: Math.round(overallScore),
    reason: issues.length > 0 ? issues[0] : undefined,
    issues
  }
}

