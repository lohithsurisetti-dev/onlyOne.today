/**
 * NLP-like utilities for intelligent content matching
 * Extracts concepts, categories, and generates smart hashes
 */

// Common stop words to remove
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'i', 'my', 'me', 'we', 'our',
])

// Action verbs to preserve
const ACTION_VERBS = new Set([
  'listen', 'listened', 'listening', 'hear', 'heard',
  'watch', 'watched', 'watching', 'see', 'saw', 'seen',
  'read', 'reading',
  'play', 'played', 'playing',
  'eat', 'ate', 'eating',
  'drink', 'drank', 'drinking',
  'run', 'ran', 'running',
  'walk', 'walked', 'walking',
  'work', 'worked', 'working',
  'cook', 'cooked', 'cooking',
  'write', 'wrote', 'writing',
  'call', 'called', 'calling',
  'talk', 'talked', 'talking',
  'go', 'went', 'going',
  'take', 'took', 'taking',
  'make', 'made', 'making',
  'do', 'did', 'doing',
  'buy', 'bought', 'buying',
])

// Famous entities (artists, brands, etc.)
const KNOWN_ENTITIES = new Map([
  // Artists
  ['taylor swift', 'taylorswift'],
  ['taylor', 'taylorswift'],
  ['swift', 'taylorswift'],
  ['beyonce', 'beyonce'],
  ['drake', 'drake'],
  ['billie eilish', 'billieeilish'],
  ['the weeknd', 'theweeknd'],
  ['ariana grande', 'arianagrande'],
  ['ed sheeran', 'edsheeran'],
  ['adele', 'adele'],
  
  // Activities
  ['netflix', 'streaming'],
  ['spotify', 'music'],
  ['youtube', 'video'],
  ['instagram', 'socialmedia'],
  ['twitter', 'socialmedia'],
  ['tiktok', 'socialmedia'],
  ['facebook', 'socialmedia'],
  
  // Sports
  ['world cup', 'worldcup'],
  ['super bowl', 'superbowl'],
  ['olympics', 'olympics'],
])

// Activity categories
const ACTIVITY_CATEGORIES = new Map([
  ['listen', 'music'],
  ['hear', 'music'],
  ['watch', 'video'],
  ['see', 'video'],
  ['read', 'reading'],
  ['play', 'gaming'],
  ['eat', 'food'],
  ['cook', 'food'],
  ['drink', 'beverage'],
  ['run', 'exercise'],
  ['walk', 'exercise'],
  ['work', 'work'],
])

// Verb synonyms (map similar actions to same base form)
const VERB_SYNONYMS = new Map([
  ['hear', 'listen'],
  ['heard', 'listen'],
  ['see', 'watch'],
  ['saw', 'watch'],
  ['seen', 'watch'],
])

/**
 * Normalize a verb to its base form
 */
function normalizeVerb(verb: string): string {
  const verbMap: Record<string, string> = {
    'listened': 'listen',
    'listening': 'listen',
    'heard': 'hear',
    'watched': 'watch',
    'watching': 'watch',
    'seen': 'see',
    'saw': 'see',
    'ate': 'eat',
    'eating': 'eat',
    'drank': 'drink',
    'drinking': 'drink',
    'ran': 'run',
    'running': 'run',
    'walked': 'walk',
    'walking': 'walk',
    'worked': 'work',
    'working': 'work',
    'cooked': 'cook',
    'cooking': 'cook',
    'wrote': 'write',
    'writing': 'write',
    'called': 'call',
    'calling': 'call',
    'talked': 'talk',
    'talking': 'talk',
    'went': 'go',
    'going': 'go',
    'took': 'take',
    'taking': 'take',
    'made': 'make',
    'making': 'make',
    'did': 'do',
    'doing': 'do',
    'bought': 'buy',
    'buying': 'buy',
  }
  
  return verbMap[verb.toLowerCase()] || verb.toLowerCase()
}

/**
 * Extract the main action verb from content
 */
function extractAction(content: string): string | null {
  const words = content.toLowerCase().split(/\s+/)
  
  for (const word of words) {
    const normalized = normalizeVerb(word)
    if (ACTION_VERBS.has(normalized)) {
      // Apply synonym mapping
      return VERB_SYNONYMS.get(normalized) || normalized
    }
  }
  
  return null
}

/**
 * Extract known entities (artists, brands, etc.)
 */
function extractEntities(content: string): string[] {
  const lower = content.toLowerCase()
  const entities: string[] = []
  
  // Check for multi-word entities first
  for (const [phrase, normalized] of KNOWN_ENTITIES.entries()) {
    if (lower.includes(phrase)) {
      entities.push(normalized)
    }
  }
  
  return entities
}

/**
 * Extract key concepts (non-stop words, important terms)
 */
function extractConcepts(content: string): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
  
  // Remove duplicates
  return Array.from(new Set(words))
}

/**
 * Generate multiple hash variants for flexible matching
 */
export function generateContentHashes(content: string): {
  exact: string
  general: string
  category: string
  concepts: string[]
} {
  const action = extractAction(content)
  const entities = extractEntities(content)
  const concepts = extractConcepts(content)
  
  // Exact hash (what we had before)
  const exactHash = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ':')
    .substring(0, 100)
  
  // General hash (action + entities, ignoring specific details)
  let generalParts: string[] = []
  if (action) {
    generalParts.push(action)
  }
  if (entities.length > 0) {
    generalParts.push(...entities)
  } else {
    // If no known entities, take first 2-3 key concepts
    generalParts.push(...concepts.slice(0, 3))
  }
  const generalHash = generalParts.join(':')
  
  // Category hash (high-level activity type)
  let categoryHash = 'activity'
  if (action && ACTIVITY_CATEGORIES.has(action)) {
    categoryHash = ACTIVITY_CATEGORIES.get(action)!
  }
  
  return {
    exact: exactHash,
    general: generalHash || exactHash,
    category: categoryHash,
    concepts: concepts.slice(0, 5), // Top 5 concepts
  }
}

/**
 * Calculate similarity score between two strings using Levenshtein distance
 * Returns a score between 0 and 1 (1 = identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Determine if two posts are similar based on multiple criteria
 */
export function arePostsSimilar(
  content1: string,
  content2: string,
  threshold: number = 0.7
): {
  similar: boolean
  score: number
  matchType: 'exact' | 'general' | 'fuzzy' | 'none'
} {
  const hashes1 = generateContentHashes(content1)
  const hashes2 = generateContentHashes(content2)
  
  // Check exact match
  if (hashes1.exact === hashes2.exact) {
    return { similar: true, score: 1.0, matchType: 'exact' }
  }
  
  // Check general match (same action + entity)
  if (hashes1.general === hashes2.general) {
    return { similar: true, score: 0.9, matchType: 'general' }
  }
  
  // Check fuzzy match on general hash
  const similarity = calculateSimilarity(hashes1.general, hashes2.general)
  if (similarity >= threshold) {
    return { similar: true, score: similarity, matchType: 'fuzzy' }
  }
  
  return { similar: false, score: similarity, matchType: 'none' }
}

/**
 * Example usage and tests
 */
export function testNLP() {
  const testCases = [
    'Listened to Taylor Swift Lover',
    'listened to taylor swift songs',
    'Heard Taylor Swift today',
    'Watched Netflix all day',
    'Binge watched shows on netflix',
    'Went for a morning run',
    'Ran 5 miles this morning',
  ]
  
  console.log('🧪 NLP Hash Generation Tests:\n')
  
  for (const content of testCases) {
    const hashes = generateContentHashes(content)
    console.log(`Content: "${content}"`)
    console.log(`  Exact:    ${hashes.exact}`)
    console.log(`  General:  ${hashes.general}`)
    console.log(`  Category: ${hashes.category}`)
    console.log(`  Concepts: [${hashes.concepts.join(', ')}]`)
    console.log('')
  }
  
  console.log('🔍 Similarity Tests:\n')
  
  const pairs = [
    ['Listened to Taylor Swift Lover', 'listened to taylor swift songs'],
    ['Watched Netflix', 'Binge watched Netflix shows'],
    ['Went for a run', 'Ran 5 miles'],
  ]
  
  for (const [content1, content2] of pairs) {
    const result = arePostsSimilar(content1, content2)
    console.log(`"${content1}"`)
    console.log(`vs "${content2}"`)
    console.log(`  Similar: ${result.similar} (${result.matchType}, score: ${result.score.toFixed(2)})`)
    console.log('')
  }
}

