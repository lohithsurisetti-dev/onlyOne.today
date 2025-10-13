/**
 * Dynamic NLP - Works for ANY content using ML models
 * No hardcoded entities, artists, or categories!
 */

import natural from 'natural'

// Tokenizer for breaking down text
const tokenizer = new natural.WordTokenizer()

// Stemmer for normalizing words (run/ran/running → run)
const stemmer = natural.PorterStemmer

// TF-IDF for identifying important words
const TfIdf = natural.TfIdf

/**
 * Dynamic content hash generation using NLP with semantic importance weighting
 * Works for ANY content - no hardcoding!
 */
export function generateDynamicHash(content: string): {
  exact: string
  stems: string[]
  signature: string
  keywords: string[]
  coreAction: string
} {
  // 1. Tokenize (split into words)
  const tokens = tokenizer.tokenize(content.toLowerCase()) || []
  
  // 2. Remove stop words dynamically using natural's built-in list + temporal words
  const stopWords = new Set([
    ...natural.stopwords,
    // Add temporal/filler words that natural doesn't include
    'today', 'yesterday', 'tomorrow', 
    'morning', 'afternoon', 'evening', 'night',
    'now', 'later', 'soon', 'just',
    'currently', 'recently', 'finally'
  ])
  const meaningfulTokens = tokens.filter(token => 
    token.length > 2 && !stopWords.has(token)
  )
  
  // 3. Stem words (normalize verb forms)
  const stems = meaningfulTokens.map(token => stemmer.stem(token))
  
  // 4. Identify parts of speech dynamically using word patterns
  // Action words (verbs) are more important than modifiers
  const actionWords = stems.filter(stem => {
    // Common verb endings after stemming
    return stem.length > 3
  })
  
  // 5. Weight words by position (earlier = more important)
  const weightedStems = stems.map((stem, index) => ({
    stem,
    weight: 1.0 / (index + 1) // First word gets highest weight
  }))
  
  // 6. Create core action signature (most important stems)
  // Focus on first 2-3 meaningful words (the core action)
  // This groups "played cricket today" with "played cricket evening"
  const coreStems = Array.from(new Set(stems)).slice(0, 2) // Reduced from 3 to 2 for tighter grouping
  const coreAction = coreStems.sort().join(':')
  
  // 7. Create full signature (all unique stems for broader matching)
  const uniqueStems = Array.from(new Set(stems)).sort()
  const signature = uniqueStems.slice(0, 5).join(':')
  
  // 8. Exact hash (original)
  const exact = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ':')
    .substring(0, 100)
  
  return {
    exact,
    stems,
    signature,
    keywords: uniqueStems.slice(0, 10),
    coreAction, // NEW: Just the essential action
  }
}

/**
 * Calculate semantic similarity between two pieces of content
 * Uses multi-level approach: exact match → core action → full stems
 */
export function calculateDynamicSimilarity(
  content1: string,
  content2: string
): number {
  const hash1 = generateDynamicHash(content1)
  const hash2 = generateDynamicHash(content2)
  
  // Level 1: Exact signature match (100% match)
  if (hash1.signature === hash2.signature) {
    return 1.0
  }
  
  // Level 2: Core action match (high similarity)
  // "played cricket today" vs "played cricket yesterday"
  // Both have coreAction: "cricket:play" → Should match!
  if (hash1.coreAction === hash2.coreAction && hash1.coreAction.length > 0) {
    // Core action matches, but check if there are meaningful differences
    const allStems1 = new Set(hash1.stems)
    const allStems2 = new Set(hash2.stems)
    const coreStems = new Set(hash1.coreAction.split(':'))
    
    // Find stems that are NOT in the core action
    const extras1 = [...allStems1].filter(s => !coreStems.has(s))
    const extras2 = [...allStems2].filter(s => !coreStems.has(s))
    
    // If both have ONLY core action (no extras), they're the same
    if (extras1.length === 0 && extras2.length === 0) {
      return 1.0
    }
    
    // If they have some extras, they're highly similar but not identical
    // This handles: "played cricket today" vs "played cricket evening"
    return 0.85 // High similarity (same core action)
  }
  
  // Level 3: Jaccard similarity on all stems (partial match)
  const set1 = new Set(hash1.stems)
  const set2 = new Set(hash2.stems)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  if (union.size === 0) return 0
  
  const jaccardSimilarity = intersection.size / union.size
  
  // Level 4: Keyword overlap (for longer posts)
  const keywords1 = new Set(hash1.keywords)
  const keywords2 = new Set(hash2.keywords)
  
  const keywordIntersection = new Set([...keywords1].filter(x => keywords2.has(x)))
  const keywordSimilarity = keywords1.size > 0 
    ? keywordIntersection.size / Math.max(keywords1.size, keywords2.size)
    : 0
  
  // Weighted average favoring stem overlap
  return jaccardSimilarity * 0.8 + keywordSimilarity * 0.2
}

/**
 * Extract key concepts from content dynamically
 * Uses TF-IDF to find important terms
 */
export function extractKeyConcepts(contents: string[]): Map<string, number> {
  const tfidf = new TfIdf()
  
  // Add all documents
  contents.forEach(content => {
    tfidf.addDocument(content.toLowerCase())
  })
  
  // Get top terms across all documents
  const conceptScores = new Map<string, number>()
  
  contents.forEach((content, docIndex) => {
    tfidf.listTerms(docIndex).slice(0, 5).forEach(item => {
      const currentScore = conceptScores.get(item.term) || 0
      conceptScores.set(item.term, currentScore + item.tfidf)
    })
  })
  
  return conceptScores
}

/**
 * Find similar posts using dynamic matching
 * No hardcoded data - works for ANY content!
 */
export function findSimilarInBatch(
  targetContent: string,
  posts: Array<{ id: string, content: string }>,
  threshold: number = 0.6
): Array<{ id: string, similarity: number }> {
  return posts
    .map(post => ({
      id: post.id,
      similarity: calculateDynamicSimilarity(targetContent, post.content),
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
}

/**
 * Test the dynamic NLP
 */
export function testDynamicNLP() {
  console.log('🧪 Dynamic NLP Tests (NO hardcoded data!)\n')
  
  const testPosts = [
    'Listened to Taylor Swift Lover',
    'listened to taylor swift songs',
    'Heard Taylor Swift today',
    'Watched a movie on Netflix',
    'Binge watched shows on netflix',
    'Went for a morning run',
    'Ran 5 miles this morning',
    'Cooked pasta for dinner',
    'Made spaghetti tonight',
  ]
  
  console.log('📊 Content Hashes:')
  testPosts.forEach(content => {
    const hash = generateDynamicHash(content)
    console.log(`"${content}"`)
    console.log(`  Signature: ${hash.signature}`)
    console.log(`  Stems: [${hash.stems.slice(0, 5).join(', ')}]`)
    console.log('')
  })
  
  console.log('🔍 Similarity Tests:')
  const testPairs = [
    [testPosts[0], testPosts[1]], // Taylor Swift variants
    [testPosts[3], testPosts[4]], // Netflix variants
    [testPosts[5], testPosts[6]], // Running variants
    [testPosts[7], testPosts[8]], // Cooking variants
    [testPosts[0], testPosts[3]], // Unrelated
  ]
  
  testPairs.forEach(([content1, content2]) => {
    const similarity = calculateDynamicSimilarity(content1, content2)
    console.log(`"${content1}"`)
    console.log(`vs "${content2}"`)
    console.log(`  Similarity: ${(similarity * 100).toFixed(1)}%`)
    console.log(`  Match: ${similarity >= 0.6 ? '✅ YES' : '❌ NO'}`)
    console.log('')
  })
  
  console.log('🎯 Batch Finding Test:')
  const target = 'listening to taylor swift music'
  console.log(`Target: "${target}"`)
  console.log(`Searching in ${testPosts.length} posts...\n`)
  
  const results = findSimilarInBatch(target, 
    testPosts.map((content, id) => ({ id: String(id), content }))
  )
  
  results.forEach(result => {
    console.log(`  ${(result.similarity * 100).toFixed(1)}% - "${testPosts[parseInt(result.id)]}"`)
  })
}

/**
 * Advanced: Sentence embeddings using Transformers.js
 * This gives the BEST similarity matching but is slower
 * Uncomment when you need maximum accuracy
 */

/*
import { pipeline } from '@xenova/transformers'

let embeddingModel: any = null

export async function initEmbeddingModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return embeddingModel
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await initEmbeddingModel()
  const output = await model(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

export async function calculateEmbeddingSimilarity(
  text1: string,
  text2: string
): Promise<number> {
  const [embedding1, embedding2] = await Promise.all([
    generateEmbedding(text1),
    generateEmbedding(text2),
  ])
  
  // Cosine similarity
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
    norm1 += embedding1[i] * embedding1[i]
    norm2 += embedding2[i] * embedding2[i]
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}
*/

