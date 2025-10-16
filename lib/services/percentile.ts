/**
 * Percentile Ranking System (OnlyFans-style)
 * 
 * Calculates how rare your action is compared to ALL users today
 * Provides motivating "Top X%" messaging instead of confusing "90% unique"
 */

export interface PercentileResult {
  percentile: number // e.g., 0.5 for "Top 0.5%"
  tier: 'elite' | 'rare' | 'unique' | 'notable' | 'common' | 'popular'
  displayText: string // e.g., "Top 0.5%"
  badge: string // e.g., "🏆"
  message: string // e.g., "You're rarer than 99.5% of people!"
  comparison: string // e.g., "Only 5 of 1,000 people did this"
}

/**
 * Calculate percentile rank based on how many people did this action
 * 
 * @param peopleWhoDidThis - Total people who did this action (including you)
 * @param totalPostsInScope - Total posts in the scope today
 * @returns PercentileResult with tier, messaging, etc.
 */
export function calculatePercentile(
  peopleWhoDidThis: number,
  totalPostsInScope: number
): PercentileResult {
  // Edge case: Small dataset (< 10 posts) - still calculate tier based on percentile
  if (totalPostsInScope < 10) {
    const percentile = (peopleWhoDidThis / totalPostsInScope) * 100
    
    // Determine tier even for small datasets
    // IMPORTANT: For small datasets, we use absolute counts, not percentiles
    // 1 of 1 = ELITE (only you!)
    // 1 of 5 = UNIQUE (20%)
    // 2 of 5 = NOTABLE (40%)
    let tier: PercentileResult['tier'] = 'common'
    let badge = '✅'
    
    if (peopleWhoDidThis === 1) {
      // Only you did this = most unique!
      tier = 'elite'
      badge = '🏆'
    } else if (percentile <= 20) {
      tier = 'unique'
      badge = '⭐'
    } else if (percentile <= 40) {
      tier = 'notable'
      badge = '✨'
    } else if (percentile <= 60) {
      tier = 'common'
      badge = '✅'
    } else {
      tier = 'popular'
      badge = '👥'
    }
    
    return {
      percentile,
      tier,
      displayText: peopleWhoDidThis === 1 ? 'Only you!' : `${peopleWhoDidThis} of ${totalPostsInScope}`,
      badge,
      message: peopleWhoDidThis === 1 
        ? "You're a unicorn! Only you did this! 🦄"
        : `You're one of ${peopleWhoDidThis} people who did this!`,
      comparison: `${peopleWhoDidThis} of ${totalPostsInScope} people`
    }
  }
  
  // Calculate percentile (what % of population did this)
  const percentile = (peopleWhoDidThis / totalPostsInScope) * 100
  
  // Determine tier and messaging based on percentile
  if (percentile < 0.1) {
    // ELITE: Only you! (< 0.1%)
    return {
      percentile,
      tier: 'elite',
      displayText: 'Only you!',
      badge: '🏆',
      message: "You're a unicorn! Only you did this! 🦄",
      comparison: `Only you out of ${totalPostsInScope.toLocaleString()} people`
    }
  } else if (percentile < 1) {
    // ELITE: Top 1% (0.1% - 1%)
    const formattedPercentile = percentile < 1 ? percentile.toFixed(1) : Math.round(percentile)
    return {
      percentile,
      tier: 'elite',
      displayText: `Top ${formattedPercentile}%`,
      badge: '🏆',
      message: `You're in the elite ${formattedPercentile}%! Rarer than ${(100 - percentile).toFixed(1)}% of people!`,
      comparison: `Only ${peopleWhoDidThis} of ${totalPostsInScope.toLocaleString()} people`
    }
  } else if (percentile < 5) {
    // RARE: Top 5% (1% - 5%)
    const formattedPercentile = Math.round(percentile)
    return {
      percentile,
      tier: 'rare',
      displayText: `Top ${formattedPercentile}%`,
      badge: '🌟',
      message: `Highly exclusive! You're in the top ${formattedPercentile}%!`,
      comparison: `${peopleWhoDidThis} of ${totalPostsInScope.toLocaleString()} people`
    }
  } else if (percentile < 10) {
    // UNIQUE: Top 10% (5% - 10%)
    const formattedPercentile = Math.round(percentile)
    return {
      percentile,
      tier: 'unique',
      displayText: `Top ${formattedPercentile}%`,
      badge: '⭐',
      message: `Nice! You're in the top ${formattedPercentile}%!`,
      comparison: `${peopleWhoDidThis} of ${totalPostsInScope.toLocaleString()} people`
    }
  } else if (percentile < 25) {
    // NOTABLE: Top 25% (10% - 25%)
    const formattedPercentile = Math.round(percentile)
    return {
      percentile,
      tier: 'notable',
      displayText: `Top ${formattedPercentile}%`,
      badge: '✨',
      message: `You're in the top quarter!`,
      comparison: `${peopleWhoDidThis} of ${totalPostsInScope.toLocaleString()} people`
    }
  } else if (percentile < 50) {
    // COMMON: Top 50% (25% - 50%)
    const formattedPercentile = Math.round(percentile)
    return {
      percentile,
      tier: 'common',
      displayText: `Top ${formattedPercentile}%`,
      badge: '✅',
      message: `Popular choice! Join ${peopleWhoDidThis} others!`,
      comparison: `${peopleWhoDidThis} of ${totalPostsInScope.toLocaleString()} people`
    }
  } else {
    // POPULAR: > 50%
    const formattedPercentile = Math.round(percentile)
    return {
      percentile,
      tier: 'popular',
      displayText: `Join ${peopleWhoDidThis} others`,
      badge: '👥',
      message: `You're not alone! ${peopleWhoDidThis} people did this too!`,
      comparison: `${peopleWhoDidThis} of ${totalPostsInScope.toLocaleString()} people`
    }
  }
}

/**
 * Get color scheme for percentile tier
 */
export function getPercentileColors(tier: PercentileResult['tier']): {
  bg: string
  border: string
  text: string
  glow: string
} {
  switch (tier) {
    case 'elite':
      return {
        bg: 'from-yellow-500/20 to-orange-500/20',
        border: 'border-yellow-400/40',
        text: 'text-yellow-300',
        glow: 'shadow-yellow-500/30'
      }
    case 'rare':
      return {
        bg: 'from-purple-500/20 to-pink-500/20',
        border: 'border-purple-400/40',
        text: 'text-purple-300',
        glow: 'shadow-purple-500/30'
      }
    case 'unique':
      return {
        bg: 'from-purple-500/15 to-pink-500/15',
        border: 'border-purple-400/30',
        text: 'text-purple-200',
        glow: 'shadow-purple-500/20'
      }
    case 'notable':
      return {
        bg: 'from-blue-500/15 to-cyan-500/15',
        border: 'border-blue-400/30',
        text: 'text-blue-200',
        glow: 'shadow-blue-500/20'
      }
    case 'common':
      return {
        bg: 'from-blue-500/10 to-cyan-500/10',
        border: 'border-blue-400/20',
        text: 'text-blue-200/80',
        glow: 'shadow-blue-500/10'
      }
    case 'popular':
      return {
        bg: 'from-green-500/10 to-teal-500/10',
        border: 'border-green-400/20',
        text: 'text-green-200/80',
        glow: 'shadow-green-500/10'
      }
  }
}

/**
 * Format percentile for display with appropriate precision
 */
export function formatPercentile(percentile: number): string {
  if (percentile < 0.1) {
    return '< 0.1'
  } else if (percentile < 1) {
    return percentile.toFixed(1)
  } else {
    return Math.round(percentile).toString()
  }
}

/**
 * Get share message for percentile tier
 */
export function getPercentileShareMessage(result: PercentileResult, content: string): string {
  const messages = {
    elite: [
      `🏆 I'm in the top ${formatPercentile(result.percentile)}% today on OnlyOne Today!`,
      `💎 Only ${result.percentile < 0.1 ? 'I' : 'a few of us'} did this today!`,
      `⭐ Elite status achieved on OnlyOne Today!`
    ],
    rare: [
      `🌟 Top ${formatPercentile(result.percentile)}% on OnlyOne Today!`,
      `✨ Rare action alert! Check it out!`,
      `💫 Highly exclusive on OnlyOne Today!`
    ],
    unique: [
      `⭐ Top ${formatPercentile(result.percentile)}% today!`,
      `✨ Unique action on OnlyOne Today!`,
      `🎯 Standing out today!`
    ],
    notable: [
      `✨ Top ${formatPercentile(result.percentile)}% on OnlyOne Today!`,
      `🎯 Notable action today!`,
      `💫 Uncommon and proud!`
    ],
    common: [
      `✅ Join me and others on OnlyOne Today!`,
      `👥 Popular choice today!`,
      `🤝 Part of the community!`
    ],
    popular: [
      `👥 ${result.comparison} on OnlyOne Today!`,
      `🤝 Join the trend!`,
      `📈 Popular today!`
    ]
  }
  
  const tierMessages = messages[result.tier]
  return tierMessages[Math.floor(Math.random() * tierMessages.length)]
}

/**
 * Calculate percentile for scope-aware comparisons
 * Uses the appropriate total count based on post scope
 */
export function calculateScopeAwarePercentile(
  peopleWhoDidThis: number,
  scope: 'city' | 'state' | 'country' | 'world',
  scopeTotals: {
    city?: number
    state?: number
    country?: number
    world: number
  }
): PercentileResult {
  let totalInScope: number
  
  switch (scope) {
    case 'city':
      totalInScope = scopeTotals.city || 1
      break
    case 'state':
      totalInScope = scopeTotals.state || 1
      break
    case 'country':
      totalInScope = scopeTotals.country || 1
      break
    case 'world':
      totalInScope = scopeTotals.world
      break
  }
  
  return calculatePercentile(peopleWhoDidThis, totalInScope)
}

