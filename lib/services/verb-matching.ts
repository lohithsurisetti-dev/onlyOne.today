/**
 * Verb-Focused Matching System
 * 
 * PROBLEM: Full-text embeddings confuse similar contexts with similar actions
 * Example: "watching cricket" vs "playing cricket" = 89% similar (TOO HIGH!)
 * 
 * SOLUTION: Extract and compare ACTION VERBS first, then verify context
 * 
 * This ensures:
 * - "watching" ≠ "playing" (different actions, even if same context)
 * - "playing" = "played" (same action, different tense)
 * - "went jogging" = "did jog" (same action, different structure)
 */

import nlp from 'compromise'
import { distance } from 'fastest-levenshtein'

/**
 * Extract the main action verb from text
 * Returns the root form (lemmatized) of the primary action verb
 */
export function extractActionVerb(text: string): string | null {
  const doc = nlp(text)
  const textLower = text.toLowerCase().trim()
  
  // Special patterns for common structures
  
  // Pattern 1: "went for a [noun]" → Extract the noun
  const wentForPattern = text.match(/\b(went|did|got)\s+for\s+a\s+(\w+)\b/i)
  if (wentForPattern) {
    // "went for a jog" → "jog", "went for a swim" → "swim"
    return wentForPattern[2].toLowerCase()
  }
  
  // Pattern 2: "went/did [verb/gerund]" → Extract the action
  const wentPattern = text.match(/\b(went|did|got)\s+(\w+ing|\w+)\b/i)
  if (wentPattern && wentPattern[2].toLowerCase() !== 'to' && wentPattern[2].toLowerCase() !== 'for') {
    // "went jogging" → "jogging", "did jog" → "jog"
    return wentPattern[2].toLowerCase()
  }
  
  // Pattern 3: "had a [sport/game]" → Extract the sport
  const hadGamePattern = text.match(/\b(had|played)\s+a?\s*(\w+)\s+(game|match)\b/i)
  if (hadGamePattern) {
    // "had a tennis game" → "tennis", "played a basketball match" → "basketball"
    return hadGamePattern[2].toLowerCase()
  }
  
  // Pattern 4: "[phrasal verb]" → Keep as is
  if (textLower.includes('worked out')) {
    return 'worked out'
  }
  if (textLower.includes('hit the gym')) {
    return 'worked out' // Synonym
  }
  if (textLower.includes('went to the gym')) {
    return 'worked out' // Synonym
  }
  
  // Regex fallback: Look for common action verbs anywhere in text
  // This handles cases where compromise.js fails
  const commonActionVerbs = [
    'played', 'play', 'playing',
    'cooked', 'cook', 'cooking',
    'baked', 'bake', 'baking',
    'made', 'make', 'making',
    'ate', 'eat', 'eating',
    'had', 'have', 'having',
    'watched', 'watch', 'watching',
    'walked', 'walk', 'walking',
    'ran', 'run', 'running',
    'swam', 'swim', 'swimming',
    'jogged', 'jog', 'jogging',
  ]
  
  for (const actionVerb of commonActionVerbs) {
    if (textLower.includes(actionVerb)) {
      return actionVerb
    }
  }
  
  // Get all verbs from compromise
  const verbs = doc.verbs()
  if (!verbs.found) {
    return null
  }
  
  // Get verb array
  const verbArray = verbs.json() as any[]
  if (verbArray.length === 0) {
    return null
  }
  
  // Priority 1: Look for gerunds (-ing form) - these are often the main action
  const gerunds = doc.match('#Gerund').json() as any[]
  if (gerunds.length > 0) {
    // "went jogging", "enjoy playing" → "jogging", "playing"
    return gerunds[0].normal || gerunds[0].text.toLowerCase()
  }
  
  // Priority 2: Look for concrete action verbs (not be/have/do/go/get)
  const auxiliaryVerbs = ['be', 'am', 'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'done', 'go', 'goes', 'went', 'gone', 'get', 'gets', 'got', 'gotten']
  
  for (const verb of verbArray) {
    const root = verb.normal || verb.text.toLowerCase()
    if (!auxiliaryVerbs.includes(root)) {
      // Found concrete action verb
      return root
    }
  }
  
  // Priority 3: If only auxiliary verbs, return the most meaningful one
  for (const verb of verbArray) {
    const root = verb.normal || verb.text.toLowerCase()
    // Prefer have/do over be
    if (['have', 'has', 'had', 'do', 'does', 'did'].includes(root)) {
      return root
    }
  }
  
  // Fallback: Return first verb
  return verbArray[0].normal || verbArray[0].text.toLowerCase()
}

/**
 * Stem a verb to its root form
 * Simple stemming (can be enhanced with NLP library)
 */
export function stemVerb(verb: string): string {
  const stems: Record<string, string> = {
    // -ing forms
    'watching': 'watch',
    'playing': 'play',
    'jogging': 'jog',
    'running': 'run',
    'cooking': 'cook',
    'baking': 'bake',
    'eating': 'eat',
    'drinking': 'drink',
    'swimming': 'swim',
    'walking': 'walk',
    
    // -ed forms
    'watched': 'watch',
    'played': 'play',
    'jogged': 'jog',
    'cooked': 'cook',
    'baked': 'bake',
    'walked': 'walk',
    'swam': 'swim',
    
    // Irregular past tense
    'ate': 'eat',
    'had': 'have',
    'made': 'make',
    'took': 'take',
    'went': 'go',
    'did': 'do',
    'saw': 'see',
    'ran': 'run',
  }
  
  const verbLower = verb.toLowerCase().trim()
  
  // Check direct mapping
  if (stems[verbLower]) {
    return stems[verbLower]
  }
  
  // Try removing common suffixes
  if (verbLower.endsWith('ing')) {
    const stem = verbLower.slice(0, -3)
    // Handle double consonants: "jogging" → "jog", "swimming" → "swim"
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      return stem.slice(0, -1)
    }
    return stem
  }
  if (verbLower.endsWith('ed')) {
    const stem = verbLower.slice(0, -2)
    // Handle "e" additions: "baked" → "bake"
    if (stem.length >= 2) {
      return stem
    }
    return verbLower.slice(0, -1)
  }
  if (verbLower.endsWith('s')) {
    return verbLower.slice(0, -1)
  }
  
  return verbLower
}

/**
 * Check if two verbs represent the same action
 * Uses stemming + synonym detection + typo tolerance
 */
export function areSameAction(verb1: string | null, verb2: string | null): boolean {
  if (!verb1 || !verb2) {
    return false
  }
  
  const stem1 = stemVerb(verb1)
  const stem2 = stemVerb(verb2)
  
  // Exact match after stemming
  if (stem1 === stem2) {
    return true
  }
  
  // Check for known synonyms
  const synonymGroups = [
    ['eat', 'have', 'consume'],
    ['make', 'cook', 'bake', 'prepare'],
    ['watch', 'see', 'view'],
    ['jog', 'run'], // "jogging" ≈ "running"
    ['walk', 'stroll'],
    ['worked out', 'workout', 'exercise'], // Gym activities
    // Sports are compared by name, not verb
    ['tennis', 'basketball', 'football', 'cricket', 'volleyball'], // Same sport = same action
  ]
  
  for (const group of synonymGroups) {
    if (group.includes(stem1) && group.includes(stem2)) {
      return true
    }
  }
  
  // Typo tolerance: Levenshtein distance <= 2 on verb stems
  const verbDistance = distance(stem1, stem2)
  if (verbDistance <= 2 && stem1.length >= 3) {
    return true
  }
  
  return false
}

/**
 * Verb-focused similarity check
 * Returns true if posts represent the same action
 */
export function isSameActionPost(content1: string, content2: string): {
  isSame: boolean
  verb1: string | null
  verb2: string | null
  reason: string
} {
  const verb1 = extractActionVerb(content1)
  const verb2 = extractActionVerb(content2)
  
  if (!verb1 || !verb2) {
    return {
      isSame: false,
      verb1,
      verb2,
      reason: 'No verbs found'
    }
  }
  
  const same = areSameAction(verb1, verb2)
  
  return {
    isSame: same,
    verb1,
    verb2,
    reason: same ? `Same action: ${stemVerb(verb1)}` : `Different actions: ${stemVerb(verb1)} ≠ ${stemVerb(verb2)}`
  }
}

/**
 * Get similarity score for debugging
 */
export function getVerbSimilarity(content1: string, content2: string): {
  verb1: string | null
  verb2: string | null
  stem1: string
  stem2: string
  areSame: boolean
  distance: number
} {
  const verb1 = extractActionVerb(content1)
  const verb2 = extractActionVerb(content2)
  
  if (!verb1 || !verb2) {
    return {
      verb1,
      verb2,
      stem1: '',
      stem2: '',
      areSame: false,
      distance: 999
    }
  }
  
  const stem1 = stemVerb(verb1)
  const stem2 = stemVerb(verb2)
  
  return {
    verb1,
    verb2,
    stem1,
    stem2,
    areSame: areSameAction(verb1, verb2),
    distance: distance(stem1, stem2)
  }
}

