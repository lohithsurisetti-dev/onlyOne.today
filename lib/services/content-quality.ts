/**
 * Content Quality Analysis - Detect spam, gibberish, and low-quality posts
 * 100% dynamic using compromise.js grammar analysis + minimal heuristics
 */

import nlp from 'compromise'
import { generateDynamicHash } from './nlp-dynamic'

/**
 * Check if content is semantically coherent using compromise.js
 * 100% dynamic - learns from grammar, not word lists!
 */
export function checkSemanticCoherence(content: string): {
  score: number
  isCoherent: boolean
  reason?: string
} {
  const tokens = content.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  
  // Parse content with compromise.js
  const doc = nlp(content)
  
  // 1. Check minimum meaningful length
  if (content.trim().length < 5) {
    return {
      score: 0,
      isCoherent: false,
      reason: 'Content too short to be meaningful'
    }
  }
  
  // 2. DYNAMIC: Use compromise.js for semantic validation
  // Extract verbs and nouns
  const verbs = doc.verbs().out('array')
  const nouns = doc.nouns().out('array')
  
  // Get adjectives and other parts
  const adjectives = doc.adjectives().out('array')
  
  // Total meaningful components recognized by compromise
  const recognizedComponents = verbs.length + nouns.length + adjectives.length
  
  // For quality scoring: having verbs + nouns is better
  const hasGoodStructure = verbs.length > 0 && nouns.length > 0
  
  // 3. Check for gibberish using vowel/consonant ratio (only for longer words)
  let gibberishWords = 0
  for (const word of tokens) {
    if (word.length < 5) continue // Skip short words
    
    const wordVowels = (word.match(/[aeiou]/gi) || []).length
    const wordConsonants = (word.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length
    const wordTotal = wordVowels + wordConsonants
    
    if (wordTotal > 0) {
      const wordVowelRatio = wordVowels / wordTotal
      
      // English words typically have 35-45% vowels
      // For longer words (5+), flag if outside 15-70% range
      if (wordVowelRatio < 0.15 || wordVowelRatio > 0.70) {
        gibberishWords++
      }
    }
  }
  
  // If more than 50% of LONGER words look like gibberish, reject
  const longerWords = tokens.filter(t => t.length >= 5).length
  const gibberishRatio = longerWords > 0 ? gibberishWords / longerWords : 0
  if (gibberishRatio > 0.5 && longerWords > 0) {
    return {
      score: 25,
      isCoherent: false,
      reason: 'Multiple words have unusual character patterns'
    }
  }
  
  // 4. Check for repeated characters/patterns
  const repeatedPattern = /(.)\1{4,}/.test(content) // 5+ repeated chars
  if (repeatedPattern) {
    return {
      score: 20,
      isCoherent: false,
      reason: 'Excessive character repetition'
    }
  }
  
  // 5. Check word diversity (avoid "test test test")
  const uniqueWords = new Set(tokens.map(t => t.toLowerCase()))
  const diversityRatio = uniqueWords.size / tokens.length
  
  if (diversityRatio <= 0.5 && tokens.length >= 2) {
    return {
      score: 35,
      isCoherent: false,
      reason: 'Low word diversity (repetitive content)'
    }
  }
  
  // 6. Check if words look like random characters (keyboard mashing)
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
  
  // 7. Final gibberish check - if we have gibberish from earlier, strengthen it
  if (gibberishWords > 0 && tokens.length <= 2) {
    // Single or two-word posts with ANY gibberish = reject
    return {
      score: 20,
      isCoherent: false,
      reason: 'Content contains gibberish or random characters'
    }
  }
  
  // 8. Calculate final quality score
  let qualityScore = 100
  
  // Bonus for having both verbs and nouns (complete thought)
  if (hasGoodStructure) {
    qualityScore += 10
  }
  
  // Penalize if no recognized components
  if (recognizedComponents === 0) {
    qualityScore = 0
  } else if (recognizedComponents < 2) {
    qualityScore -= 20
  }
  
  // Penalize low diversity even if not blocking
  if (diversityRatio < 0.75 && tokens.length > 2) {
    qualityScore -= 10
  }
  
  // Penalize if gibberish detected
  if (gibberishWords > 0) {
    qualityScore -= (gibberishWords * 15)
  }
  
  return {
    score: Math.max(50, Math.min(110, qualityScore)),
    isCoherent: qualityScore >= 60 && recognizedComponents > 0
  }
}

/**
 * Detect spam patterns dynamically using sequence detection
 */
export function detectSpamPatterns(content: string): {
  isSpam: boolean
  confidence: number
  patterns: string[]
} {
  const detectedPatterns: string[] = []
  let spamScore = 0
  
  // Pattern 1: Sequential number words (one, two, three pattern)
  const numberSequences = [
    ['one', 'two'], ['two', 'three'], ['three', 'four'],
    ['alpha', 'beta'], ['beta', 'gamma'], ['gamma', 'delta']
  ]
  
  const lowerContent = content.toLowerCase()
  const hasSequence = numberSequences.some(seq => 
    lowerContent.includes(seq[0]) && lowerContent.includes(seq[1])
  )
  
  if (hasSequence) {
    detectedPatterns.push('sequential_identifiers')
    spamScore += 50
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

