/**
 * Activity Extraction for Day Summaries
 * 
 * Extracts individual activities from a multi-activity day summary.
 * Uses NLP to split, clean, and validate each activity.
 */

import nlp from 'compromise'

export interface ExtractedActivity {
  original: string // Original text
  cleaned: string // Cleaned activity text
  hasVerb: boolean
  wordCount: number
}

/**
 * Extract individual activities from a day summary
 * 
 * Example:
 *   "I made coffee, walked the dog, and read a book"
 *   → ["made coffee", "walked the dog", "read a book"]
 */
export function extractActivities(dayText: string): string[] {
  if (!dayText || typeof dayText !== 'string') {
    return []
  }
  
  // 1. Split by common delimiters
  // Handle: commas, "and", "then", "and then"
  const clauses = dayText
    .split(/,\s*and\s+|,\s+|\s+and\s+then\s+|\s+then\s+|\s+and\s+/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  // 2. Clean each clause
  const cleaned = clauses.map(clause => {
    let cleaned = clause
    
    // Remove temporal markers at the start
    cleaned = cleaned.replace(/^(this morning|this afternoon|this evening|tonight|today|later|after that|before that|first|next|finally|lastly|also)\s+/gi, '')
    
    // Remove "I" at the start
    cleaned = cleaned.replace(/^I\s+/i, '')
    
    // Remove subordinate clauses (everything after "before", "after", "while", "when")
    // But keep the main action
    // Example: "made coffee before sunrise" → "made coffee"
    cleaned = cleaned.replace(/\s+(before|after|while|when|as|since)\s+.+$/i, '')
    
    // Remove "by" constructions
    // "ended the day by cooking" → "cooking"
    cleaned = cleaned.replace(/^.+\s+by\s+/i, '')
    
    // Remove extra whitespace
    cleaned = cleaned.trim()
    
    return cleaned
  })
  
  // 3. Validate each is an action (has verb and is not too short/long)
  const activities: string[] = []
  
  for (const activity of cleaned) {
    if (!activity || activity.length < 3) continue
    
    // Use compromise to check for verbs
    const doc = nlp(activity)
    const hasVerb = doc.verbs().length > 0
    
    // Word count check
    const wordCount = activity.split(/\s+/).length
    const isValidLength = wordCount >= 2 && wordCount <= 15
    
    // Check it's not just a single word or gibberish
    if (hasVerb && isValidLength) {
      activities.push(activity)
    }
  }
  
  // 4. Deduplicate (case-insensitive)
  const deduped: string[] = []
  const seen = new Set<string>()
  
  for (const activity of activities) {
    const normalized = activity.toLowerCase().trim()
    if (!seen.has(normalized)) {
      deduped.push(activity)
      seen.add(normalized)
    }
  }
  
  return deduped
}

/**
 * Validate a day summary has enough activities
 */
export function validateDaySummary(text: string): {
  isValid: boolean
  error?: string
  activityCount?: number
} {
  const activities = extractActivities(text)
  
  if (activities.length < 2) {
    return {
      isValid: false,
      error: 'Please describe at least 2 activities for a day summary. For a single action, use "Action" type instead.',
      activityCount: activities.length
    }
  }
  
  if (activities.length > 15) {
    return {
      isValid: false,
      error: 'Please keep your day summary under 15 activities. Focus on the main highlights!',
      activityCount: activities.length
    }
  }
  
  // Check for repetition (same activity multiple times)
  const uniqueActivities = new Set(activities.map(a => a.toLowerCase()))
  if (uniqueActivities.size < activities.length * 0.7) {
    return {
      isValid: false,
      error: 'Please list different activities, not the same one multiple times.',
      activityCount: activities.length
    }
  }
  
  return {
    isValid: true,
    activityCount: activities.length
  }
}

/**
 * Get detailed extraction info for debugging
 */
export function extractActivitiesDetailed(dayText: string): ExtractedActivity[] {
  const clauses = dayText
    .split(/,\s*and\s+|,\s+|\s+and\s+then\s+|\s+then\s+|\s+and\s+/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  return clauses.map(clause => {
    const cleaned = clause
      .replace(/^(this morning|this afternoon|this evening|tonight|today|later|after that|before that|first|next|finally|lastly|also)\s+/gi, '')
      .replace(/^I\s+/i, '')
      .replace(/\s+(before|after|while|when|as|since)\s+.+$/i, '')
      .replace(/^.+\s+by\s+/i, '')
      .trim()
    
    const doc = nlp(cleaned)
    const hasVerb = doc.verbs().length > 0
    const wordCount = cleaned.split(/\s+/).length
    
    return {
      original: clause,
      cleaned,
      hasVerb,
      wordCount
    }
  })
}

