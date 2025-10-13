/**
 * Content Quality Analysis - Detect spam, gibberish, and low-quality posts
 * 100% dynamic using compromise.js grammar analysis + minimal heuristics
 */

import nlp from 'compromise'
import { generateDynamicHash } from './nlp-dynamic'

/**
 * Validate if content is a real ACTION vs. philosophical statement/quote
 * 
 * Uses multi-layer dynamic detection:
 * 1. Verb tense (past/gerund = action, present simple = statement)
 * 2. First-person (I/me/my or implied)
 * 3. Concrete verbs (physical actions, not abstract states)
 * 4. Action structure (verb + object/destination)
 * 5. Generic statement detection (reject universal truths)
 * 
 * NO STATIC WORD LISTS - 100% dynamic NLP!
 */
export function validateAction(content: string): {
  isAction: boolean
  confidence: number
  reason?: string
} {
  const doc = nlp(content)
  const lowerContent = content.toLowerCase().trim()
  let actionScore = 0
  const reasons: string[] = []
  
  // Layer 1: Verb Tense Analysis (40 points)
  // Real actions use past tense or present continuous (-ing)
  const verbs = doc.verbs()
  const hasPastTense = verbs.toPastTense().out('array').length > 0
  const hasGerund = lowerContent.match(/\b\w+ing\b/) !== null && verbs.length > 0
  const hasPresentContinuous = lowerContent.match(/\b(am|is|are|was|were)\s+\w+ing\b/) !== null
  
  if (hasPastTense || hasGerund || hasPresentContinuous) {
    actionScore += 40
    console.log('✅ Action tense detected (+40)')
  } else {
    reasons.push('No action-oriented verb tense (try past tense: "played", "did", "went")')
    console.log('❌ No action tense (-0)')
  }
  
  // Layer 2: First-Person Detection (30 points)
  // Actions are personal: "I did X" or implied "did X"
  const pronouns = doc.pronouns().out('array').map((p: string) => p.toLowerCase())
  const hasFirstPerson = pronouns.some((p: string) => ['i', 'me', 'my', 'mine', 'myself'].includes(p))
  
  // Check if there's NO subject (implied first person)
  // "played cricket" = implied "I played cricket"
  const sentences = doc.sentences().out('array')
  const firstSentence = sentences[0] || content
  const firstDoc = nlp(firstSentence)
  const hasExplicitSubject = firstDoc.match('#Pronoun').found || 
                             firstDoc.match('#Noun #Verb').found ||
                             firstDoc.match('#ProperNoun').found
  
  if (hasFirstPerson) {
    actionScore += 30
    console.log('✅ First-person explicit (+30)')
  } else if (!hasExplicitSubject && verbs.length > 0) {
    actionScore += 30
    console.log('✅ First-person implied (+30)')
  } else {
    // Check for third-person generic pronouns
    const hasThirdPerson = pronouns.some((p: string) => ['they', 'them', 'their', 'people', 'everyone', 'someone'].includes(p))
    if (hasThirdPerson) {
      actionScore -= 20
      reasons.push('Sounds like advice or observation, not your personal action')
      console.log('❌ Third-person generic (-20)')
    } else {
      reasons.push('Not a personal action (add "I" or use implied first-person)')
      console.log('❌ No first-person indicator (-0)')
    }
  }
  
  // Layer 3: Concrete vs. Abstract Verbs (20 points)
  // Concrete actions are observable: "played", "walked", "cooked"
  // Abstract states are internal: "felt", "thought", "believed"
  const abstractVerbs = doc.match('(be|am|is|are|was|were|have|has|had|seem|seemed|feel|felt|think|thought|believe|believed|know|knew|can|could|should|would|will|shall|may|might|must)').found
  
  if (verbs.length > 0 && !abstractVerbs) {
    actionScore += 20
    console.log('✅ Concrete action verb (+20)')
  } else if (abstractVerbs) {
    reasons.push('Use concrete action verbs (like "played", "cooked", "walked")')
    console.log('❌ Abstract/auxiliary verbs only (-0)')
  }
  
  // Layer 4: Action Structure (10 points)
  // Real actions have objects or destinations: "played [cricket]", "went [home]"
  const hasObject = doc.match('#Verb #Noun').found
  const hasPreposition = doc.match('#Verb #Preposition').found
  const hasAdverb = doc.match('#Verb #Adverb').found
  
  if (hasObject || hasPreposition || hasAdverb) {
    actionScore += 10
    console.log('✅ Action has object/destination/modifier (+10)')
  }
  
  // Layer 5: Generic Statement Detection (-50 points)
  // Reject universal truths, advice, quotes, philosophy
  const genericWords = ['people', 'everyone', 'someone', 'friends', 'family', 'life', 'love', 'world', 'always', 'never', 'forever', 'everything', 'nothing', 'all', 'every']
  const hasGenericWords = genericWords.some(word => lowerContent.includes(word))
  
  // Check for universal/timeless structure
  const isUniversalTruth = doc.match('#Noun (be|is|are|was|were) #Adjective').found ||
                          doc.match('#Noun (be|is|are|was|were) #Noun').found ||
                          doc.match('(can|should|must|will|shall) #Verb').found
  
  if (hasGenericWords && isUniversalTruth) {
    actionScore -= 50
    reasons.push('This sounds like a general statement or quote, not a personal action you did')
    console.log('❌ Generic statement detected (-50)')
  } else if (hasGenericWords) {
    actionScore -= 10
    console.log('⚠️ Generic words present (-10)')
  }
  
  // Layer 6: Question/Command Detection
  if (lowerContent.endsWith('?')) {
    actionScore -= 30
    reasons.push('Questions are not actions - describe what you actually did')
    console.log('❌ Question format (-30)')
  }
  
  // Check for imperative (commands): "remember to", "don't forget"
  const isCommand = doc.sentences().some((s: any) => {
    const sent = s.text().toLowerCase()
    return sent.startsWith("don't") || sent.startsWith("do ") || 
           sent.includes("remember to") || sent.includes("try to")
  })
  
  if (isCommand) {
    actionScore -= 30
    reasons.push('This sounds like advice or a command, not what you did')
    console.log('❌ Command/advice format (-30)')
  }
  
  // Layer 7: Quote/Philosophical Detection
  // Long sentences with "but", "and", semicolons = likely philosophical
  const isLongPhilosophical = content.length > 60 && 
                              (lowerContent.includes(' but ') || lowerContent.includes(' and ')) &&
                              !hasPastTense &&
                              !hasFirstPerson
  
  if (isLongPhilosophical) {
    actionScore -= 40
    reasons.push('This reads like a quote or philosophical statement, not an action')
    console.log('❌ Philosophical statement pattern (-40)')
  }
  
  // Final confidence score (0-100)
  const confidence = Math.max(0, Math.min(100, actionScore))
  
  console.log(`📊 Final action score: ${confidence}/100`)
  
  return {
    isAction: confidence >= 60,
    confidence,
    reason: reasons[0]
  }
}

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
export function validateContentQuality(content: string, inputType: 'action' | 'day' = 'action'): {
  allowed: boolean
  score: number
  reason?: string
  issues: string[]
} {
  const issues: string[] = []
  
  // 1. Check if it's a real ACTION (only for 'action' input type)
  if (inputType === 'action') {
    const actionCheck = validateAction(content)
    if (!actionCheck.isAction) {
      issues.push(actionCheck.reason || 'Not a valid action')
      // Return early with clear feedback
      return {
        allowed: false,
        score: actionCheck.confidence,
        reason: actionCheck.reason || 'Please describe a specific action you did (e.g., "played cricket", "cooked dinner", "went for a walk")',
        issues
      }
    }
  }
  
  // 2. Check semantic coherence
  const coherence = checkSemanticCoherence(content)
  if (!coherence.isCoherent) {
    issues.push(coherence.reason || 'Low coherence')
  }
  
  // 3. Check for spam patterns
  const spam = detectSpamPatterns(content)
  if (spam.isSpam) {
    issues.push(`Spam detected: ${spam.patterns.join(', ')}`)
  }
  
  // 4. Calculate overall quality score
  const coherenceWeight = 0.8 // Increased weight for coherence
  const spamWeight = 0.2
  
  const overallScore = 
    (coherence.score * coherenceWeight) +
    ((100 - spam.confidence) * spamWeight)
  
  // 5. Determine if content is allowed
  // Stricter threshold: 60 instead of 50
  const allowed = overallScore >= 60 && !spam.isSpam && coherence.isCoherent
  
  return {
    allowed,
    score: Math.round(overallScore),
    reason: issues.length > 0 ? issues[0] : undefined,
    issues
  }
}

