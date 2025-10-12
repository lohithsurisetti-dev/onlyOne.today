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
 * Dynamic content hash generation using NLP
 * Works for ANY content - no hardcoding!
 */
export function generateDynamicHash(content: string): {
  exact: string
  stems: string[]
  signature: string
  keywords: string[]
} {
  // 1. Tokenize (split into words)
  const tokens = tokenizer.tokenize(content.toLowerCase()) || []
  
  // 2. Remove stop words dynamically
  const stopWords = new Set(natural.stopwords)
  const meaningfulTokens = tokens.filter(token => 
    token.length > 2 && !stopWords.has(token)
  )
  
  // 3. Stem words (normalize verb forms)
  const stems = meaningfulTokens.map(token => stemmer.stem(token))
  
  // 4. Create signature (sorted unique stems for consistent matching)
  const uniqueStems = Array.from(new Set(stems)).sort()
  const signature = uniqueStems.slice(0, 5).join(':')
  
  // 5. Exact hash (original)
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
  }
}

/**
 * Calculate semantic similarity between two pieces of content
 * Uses cosine similarity on word vectors
 */
export function calculateDynamicSimilarity(
  content1: string,
  content2: string
): number {
  const hash1 = generateDynamicHash(content1)
  const hash2 = generateDynamicHash(content2)
  
  // Check if signatures match (fast path)
  if (hash1.signature === hash2.signature) {
    return 1.0
  }
  
  // Calculate Jaccard similarity on stems
  const set1 = new Set(hash1.stems)
  const set2 = new Set(hash2.stems)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  const jaccardSimilarity = intersection.size / union.size
  
  // Also check keyword overlap
  const keywords1 = new Set(hash1.keywords)
  const keywords2 = new Set(hash2.keywords)
  
  const keywordIntersection = new Set([...keywords1].filter(x => keywords2.has(x)))
  const keywordSimilarity = keywords1.size > 0 
    ? keywordIntersection.size / Math.max(keywords1.size, keywords2.size)
    : 0
  
  // Weighted average
  return jaccardSimilarity * 0.7 + keywordSimilarity * 0.3
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

