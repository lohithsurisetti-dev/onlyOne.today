/**
 * Day Summary Matching Logic
 * 
 * Compares day summaries by calculating activity overlap using semantic embeddings.
 * Reuses existing similarity functions from action matching.
 */

import { cosineSimilarity } from './composite-similarity'
import { distance as levenshtein } from 'fastest-levenshtein'

export interface DayMatchResult {
  postId: string
  similarity: number // Overlap percentage (0.0 to 1.0)
  matchedActivities: number // Count of overlapping activities
  totalActivities: number // Total activities in compared day
  matchDetails: Array<{
    userActivity: string
    matchedActivity: string
    similarity: number
  }>
}

/**
 * Calculate similarity between two days based on activity overlap
 * 
 * Algorithm:
 * 1. For each activity in day A, find best semantic match in day B
 * 2. Use vector similarity (70%) + string similarity (30%)
 * 3. Count matches above threshold (0.75)
 * 4. Calculate overlap percentage: matches / min(activitiesA, activitiesB)
 * 
 * @param userActivities - User's extracted activities
 * @param userEmbeddings - User's activity embeddings
 * @param otherActivities - Other day's activities
 * @param otherEmbeddings - Other day's embeddings
 * @param scope - Geographical scope (affects threshold)
 * @returns Overlap percentage (0.0 to 1.0)
 */
export function calculateDayOverlap(
  userActivities: string[],
  userEmbeddings: number[][],
  otherActivities: string[],
  otherEmbeddings: number[][],
  scope: 'city' | 'state' | 'country' | 'world' = 'world'
): {
  overlapPercentage: number
  matchedActivities: number
  matchDetails: Array<{ userActivity: string; matchedActivity: string; similarity: number }>
} {
  if (!userActivities.length || !otherActivities.length) {
    return { overlapPercentage: 0, matchedActivities: 0, matchDetails: [] }
  }
  
  // Semantic match threshold (same as action matching)
  const SEMANTIC_THRESHOLD = 0.75
  
  const matches: Array<{ userActivity: string; matchedActivity: string; similarity: number }> = []
  const usedOtherIndices = new Set<number>()
  
  // For each user activity, find best match in other day
  for (let i = 0; i < userActivities.length; i++) {
    let bestMatchIndex = -1
    let bestSimilarity = 0
    
    for (let j = 0; j < otherActivities.length; j++) {
      if (usedOtherIndices.has(j)) continue // Already matched
      
      // Vector similarity (semantic understanding)
      const vectorSim = cosineSimilarity(userEmbeddings[i], otherEmbeddings[j])
      
      // String similarity (typo tolerance)
      const maxLen = Math.max(userActivities[i].length, otherActivities[j].length)
      const lev = levenshtein(userActivities[i].toLowerCase(), otherActivities[j].toLowerCase())
      const stringSim = 1 - (lev / maxLen)
      
      // Composite similarity (same as action matching: 70% vector + 30% string)
      const compositeSim = (vectorSim * 0.7) + (stringSim * 0.3)
      
      if (compositeSim > bestSimilarity) {
        bestSimilarity = compositeSim
        bestMatchIndex = j
      }
    }
    
    // If best match is above threshold, count it
    if (bestSimilarity >= SEMANTIC_THRESHOLD && bestMatchIndex !== -1) {
      matches.push({
        userActivity: userActivities[i],
        matchedActivity: otherActivities[bestMatchIndex],
        similarity: bestSimilarity
      })
      usedOtherIndices.add(bestMatchIndex)
    }
  }
  
  // Calculate overlap percentage
  // Use minimum to be fair (if user has 3 activities and other has 10, we compare against 3)
  const minActivities = Math.min(userActivities.length, otherActivities.length)
  const overlapPercentage = matches.length / minActivities
  
  return {
    overlapPercentage,
    matchedActivities: matches.length,
    matchDetails: matches
  }
}

/**
 * Find similar day summaries from a list of candidates
 * 
 * @param userActivities - User's activities
 * @param userEmbeddings - User's activity embeddings
 * @param candidateDays - Array of other days to compare
 * @param scope - Geographical scope
 * @param threshold - Minimum overlap to be considered "similar" (default 0.70 = 70%)
 * @returns Array of similar days with their overlap scores
 */
export function findSimilarDays(
  userActivities: string[],
  userEmbeddings: number[][],
  candidateDays: Array<{
    id: string
    activities: string[]
    embeddings: number[][]
    [key: string]: any
  }>,
  scope: 'city' | 'state' | 'country' | 'world' = 'world',
  threshold: number = 0.70
): DayMatchResult[] {
  const similarDays: DayMatchResult[] = []
  
  for (const day of candidateDays) {
    if (!day.activities || !day.embeddings) continue
    
    const overlap = calculateDayOverlap(
      userActivities,
      userEmbeddings,
      day.activities,
      day.embeddings,
      scope
    )
    
    // Only include if overlap meets threshold
    if (overlap.overlapPercentage >= threshold) {
      similarDays.push({
        postId: day.id,
        similarity: overlap.overlapPercentage,
        matchedActivities: overlap.matchedActivities,
        totalActivities: day.activities.length,
        matchDetails: overlap.matchDetails
      })
    }
  }
  
  // Sort by similarity (highest first)
  return similarDays.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Get scope-aware threshold for day matching
 * Slightly more lenient than action matching since days are more complex
 */
export function getDayScopeThreshold(scope: 'city' | 'state' | 'country' | 'world'): number {
  switch (scope) {
    case 'city':
      return 0.75 // Stricter in cities (tight-knit)
    case 'state':
      return 0.70 // Moderate
    case 'country':
      return 0.65 // More lenient
    case 'world':
    default:
      return 0.60 // Most lenient (diverse global days)
  }
}

/**
 * Categorize activities by rarity for display
 * 
 * @param activities - User's activities
 * @param allDays - All day summaries to compare against
 * @returns Categorized activities (unique vs common)
 */
export function categorizeActivitiesByRarity(
  userActivities: string[],
  similarDays: DayMatchResult[]
): {
  unique: string[] // Activities that rarely appear in similar days
  common: string[] // Activities that frequently appear
} {
  const unique: string[] = []
  const common: string[] = []
  
  for (const activity of userActivities) {
    // Count how many similar days have this activity
    let appearanceCount = 0
    
    for (const day of similarDays) {
      const hasActivity = day.matchDetails.some(
        detail => detail.userActivity === activity
      )
      if (hasActivity) {
        appearanceCount++
      }
    }
    
    // If appears in < 30% of similar days, it's unique to user
    const percentage = appearanceCount / Math.max(similarDays.length, 1)
    if (percentage < 0.3) {
      unique.push(activity)
    } else {
      common.push(activity)
    }
  }
  
  return { unique, common }
}

