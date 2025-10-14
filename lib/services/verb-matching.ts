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
  
  // Get all verbs
  const verbs = doc.verbs()
  if (!verbs.found) {
    return null
  }
  
  // Get verb array
  const verbArray = verbs.json() as any[]
  if (verbArray.length === 0) {
    return null
  }
  
  // Priority 1: Look for concrete action verbs (not be/have/do/go)
  const auxiliaryVerbs = ['be', 'am', 'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'done']
  
  for (const verb of verbArray) {
    const root = verb.normal || verb.text.toLowerCase()
    if (!auxiliaryVerbs.includes(root)) {
      // Found concrete action verb
      return root
    }
  }
  
  // Priority 2: Check for gerunds (-ing form) as nouns
  const gerunds = doc.match('#Gerund').json() as any[]
  if (gerunds.length > 0) {
    // "went jogging" → "jogging"
    return gerunds[0].normal || gerunds[0].text.toLowerCase().replace(/ing$/, '')
  }
  
  // Priority 3: If only auxiliary verbs, return the first non-be verb
  for (const verb of verbArray) {
    const root = verb.normal || verb.text.toLowerCase()
    if (!['be', 'am', 'is', 'are', 'was', 'were', 'been'].includes(root)) {
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
    return verbLower.slice(0, -3)
  }
  if (verbLower.endsWith('ed')) {
    return verbLower.slice(0, -2)
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
  
  // Check for known synonyms (food/consumption actions)
  const synonymGroups = [
    ['eat', 'have', 'consume'],
    ['make', 'cook', 'bake', 'prepare'],
    ['watch', 'see', 'view'],
    ['play', 'do'], // "played cricket" vs "did cricket"
    ['jog', 'run'], // Close enough
    ['walk', 'stroll'],
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

