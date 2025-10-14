/**
 * Composite Similarity Scoring
 * 
 * Based on GPT's production-grade recommendation:
 * S = 0.45*E + 0.35*J + 0.20*T + N + R
 * 
 * Where:
 * E = Embedding cosine similarity
 * J = Character n-gram Jaccard
 * T = Token overlap (weighted)
 * N = Negation consistency penalty
 * R = Time intent bonus
 */

import { ngramJaccard, tokenOverlap } from './text-normalization'

export interface SimilarityInputs {
  content1: string
  content2: string
  vectorSimilarity: number
  hasNegation1: boolean
  hasNegation2: boolean
  timeTags1: string[]
  timeTags2: string[]
  levenshteinSimilarity?: number
}

export interface SimilarityResult {
  compositeScore: number
  vectorScore: number
  jaccardScore: number
  tokenScore: number
  negationPenalty: number
  timeBonus: number
  breakdown: string
}

/**
 * Calculate composite similarity using multiple signals
 * More robust than single-metric approaches
 */
export function calculateCompositeSimilarity(inputs: SimilarityInputs): SimilarityResult {
  const {
    content1,
    content2,
    vectorSimilarity,
    hasNegation1,
    hasNegation2,
    timeTags1,
    timeTags2,
    levenshteinSimilarity
  } = inputs
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. EMBEDDING SIMILARITY (Semantic)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const E = vectorSimilarity
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. JACCARD SIMILARITY (Character n-grams)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const J = ngramJaccard(content1, content2, 3)
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. TOKEN OVERLAP (Word-level)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const T = tokenOverlap(content1, content2)
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. NEGATION CONSISTENCY (Critical!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // If negations differ → apply penalty
  // "didn't exercise" ≠ "did exercise"
  let N = 0
  if (hasNegation1 !== hasNegation2) {
    N = -0.25 // 25% penalty for negation mismatch
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. TIME INTENT BONUS (Helps distinguish timing)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // If both mention same time → bonus
  // "ate breakfast" vs "ate dinner" should differ
  let R = 0
  if (timeTags1.length > 0 && timeTags2.length > 0) {
    const timeIntersection = timeTags1.filter(t => timeTags2.includes(t))
    if (timeIntersection.length > 0) {
      R = 0.05 // Small bonus if time intent matches
    } else {
      // Different time expressions → slight penalty
      R = -0.05
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPOSITE SCORE (Weighted combination)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Weights: Embedding (45%), Jaccard (35%), Token (20%)
  // Plus negation penalty and time bonus
  const baseScore = (E * 0.45) + (J * 0.35) + (T * 0.20)
  const compositeScore = Math.max(0, Math.min(1, baseScore + N + R))
  
  const breakdown = `E:${(E*100).toFixed(0)}% J:${(J*100).toFixed(0)}% T:${(T*100).toFixed(0)}% N:${N.toFixed(2)} R:${R.toFixed(2)}`
  
  return {
    compositeScore,
    vectorScore: E,
    jaccardScore: J,
    tokenScore: T,
    negationPenalty: N,
    timeBonus: R,
    breakdown
  }
}

/**
 * Get scope-aware threshold
 * Broader scopes require stricter matching to prevent false positives
 */
export function getScopeThreshold(scope: 'city' | 'state' | 'country' | 'world'): number {
  const thresholds = {
    city: 0.65,    // Most lenient (small pool, less noise)
    state: 0.70,   // Moderate
    country: 0.75, // Stricter (larger pool)
    world: 0.78    // Strictest (global pool, most paraphrases)
  }
  
  return thresholds[scope]
}

/**
 * Check if two posts should match based on composite similarity
 * Respects negation and uses scope-aware thresholds
 */
export function shouldMatch(
  similarity: SimilarityResult,
  scope: 'city' | 'state' | 'country' | 'world',
  verbsMatch: boolean
): {
  shouldMatch: boolean
  reason: string
  score: number
} {
  const threshold = getScopeThreshold(scope)
  const score = similarity.compositeScore
  
  // Gate 1: Verbs must match (already checked by caller)
  if (!verbsMatch) {
    return {
      shouldMatch: false,
      reason: 'Different action verbs',
      score: 0
    }
  }
  
  // Gate 2: Negation mismatch → auto-reject
  if (similarity.negationPenalty < 0) {
    return {
      shouldMatch: false,
      reason: 'Negation mismatch (did vs did not)',
      score
    }
  }
  
  // Gate 3: Composite score above scope threshold
  if (score >= threshold) {
    return {
      shouldMatch: true,
      reason: `Composite ${(score * 100).toFixed(0)}% >= ${(threshold * 100).toFixed(0)}% (${scope})`,
      score
    }
  }
  
  // Gate 4: Very high embedding similarity (bypass for strong semantic matches)
  if (similarity.vectorScore >= 0.90) {
    return {
      shouldMatch: true,
      reason: `Strong semantic match (${(similarity.vectorScore * 100).toFixed(0)}%)`,
      score
    }
  }
  
  return {
    shouldMatch: false,
    reason: `Score ${(score * 100).toFixed(0)}% < threshold ${(threshold * 100).toFixed(0)}%`,
    score
  }
}

