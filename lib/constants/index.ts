/**
 * Application Constants - Single Source of Truth
 * All magic numbers, thresholds, and configuration values
 */

// ============================================================================
// UNIQUENESS & SCORING
// ============================================================================

export const UNIQUENESS_THRESHOLD = 70 as const
export const MIN_SCORE = 0 as const
export const MAX_SCORE = 100 as const

// ============================================================================
// SCOPES
// ============================================================================

export const SCOPE_TYPES = ['city', 'state', 'country', 'world'] as const
export type ScopeType = typeof SCOPE_TYPES[number]

export const SCOPE_LABELS = {
  city: 'City',
  state: 'State',
  country: 'Country',
  world: 'World',
} as const

// ============================================================================
// REACTIONS
// ============================================================================

export const REACTION_TYPES = ['funny', 'creative', 'must_try'] as const
export type ReactionType = typeof REACTION_TYPES[number]

export const REACTION_LABELS = {
  funny: 'Funny',
  creative: 'Creative',
  must_try: 'Must Try',
} as const

export const REACTION_EMOJIS = {
  funny: '😂',
  creative: '🎨',
  must_try: '🔥',
} as const

// ============================================================================
// PAGINATION
// ============================================================================

export const DEFAULT_PAGE_SIZE = 24 as const
export const MAX_PAGE_SIZE = 100 as const
export const POSTS_PER_PAGE_OPTIONS = [12, 24, 48] as const

// ============================================================================
// CONTENT LIMITS
// ============================================================================

export const MIN_CONTENT_LENGTH = 3 as const
export const MAX_CONTENT_LENGTH = 500 as const
export const CONTENT_TRUNCATE_LENGTH = 80 as const

// ============================================================================
// TIME PERIODS
// ============================================================================

export const TIME_PERIODS = {
  TODAY: 'today',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  ALL_TIME: 'allTime',
} as const

export const MY_POSTS_RETENTION_DAYS = 30 as const
export const MAX_MY_POSTS_STORED = 50 as const

// ============================================================================
// API & NETWORK
// ============================================================================

export const API_TIMEOUT_MS = 10000 as const // 10 seconds
export const RETRY_ATTEMPTS = 3 as const
export const RETRY_DELAY_MS = 1000 as const

// ============================================================================
// CACHE & REFRESH
// ============================================================================

export const TRENDING_CACHE_DURATION_MS = 5 * 60 * 1000 as const // 5 minutes
export const STATS_CACHE_DURATION_MS = 60 * 1000 as const // 1 minute

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const MOBILE_BREAKPOINT = 768 as const
export const SKELETON_CARD_COUNT = 12 as const
export const MAX_TRENDING_TOPICS = 5 as const

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const FILTER_OPTIONS = ['all', 'unique', 'common', 'trending'] as const
export type FilterOption = typeof FILTER_OPTIONS[number]

export const SCOPE_FILTER_OPTIONS = ['all', 'city', 'state', 'country', 'world'] as const
export type ScopeFilterOption = typeof SCOPE_FILTER_OPTIONS[number]

export const REACTION_FILTER_OPTIONS = ['all', 'funny', 'creative', 'must_try'] as const
export type ReactionFilterOption = typeof REACTION_FILTER_OPTIONS[number]

// ============================================================================
// VIBE CATEGORIES
// ============================================================================

export const VIBE_CATEGORIES = [
  'Free Spirit',
  'Adventurer',
  'Homebody',
  'Foodie',
  'Go-Getter',
  'Chill Vibes',
  'Social Butterfly',
  'Lone Wolf',
] as const

// ============================================================================
// VALIDATION
// ============================================================================

export const MIN_WORD_COUNT = 2 as const
export const MAX_WORD_COUNT = 100 as const
export const MIN_UNIQUE_CHARS = 3 as const

// ============================================================================
// RANKING
// ============================================================================

export const TOP_PERFORMERS_LIMIT = 3 as const
export const MAX_RANKING_DISPLAY = 10 as const

// ============================================================================
// TRENDING
// ============================================================================

export const TRENDING_RETRY_ATTEMPTS = 2 as const
export const TRENDING_RETRY_DELAY_MS = 2000 as const
export const MIN_TRENDING_RESULTS = 5 as const

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if score is unique (>= threshold)
 */
export const isUnique = (score: number): boolean => {
  return score >= UNIQUENESS_THRESHOLD
}

/**
 * Get filter display name
 */
export const getFilterLabel = (filter: FilterOption): string => {
  const labels: Record<FilterOption, string> = {
    all: 'All Posts',
    unique: 'Unique',
    common: 'Common',
    trending: 'Trending',
  }
  return labels[filter]
}

/**
 * Get scope display name
 */
export const getScopeLabel = (scope: ScopeType): string => {
  return SCOPE_LABELS[scope]
}

/**
 * Get reaction display name
 */
export const getReactionLabel = (reaction: ReactionType): string => {
  return REACTION_LABELS[reaction]
}

