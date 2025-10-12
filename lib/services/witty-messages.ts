/**
 * Witty Messages Library
 * 
 * Curated, brand-voice responses for different scenarios.
 * Makes the app feel alive and shareable.
 */

interface WittyMessageContext {
  uniquenessScore: number
  matchCount: number
  vibe?: string
  scope?: string
}

/**
 * Uniqueness Messages (High Uniqueness)
 */
const UNIQUENESS_MESSAGES = {
  perfect: [ // 100% unique
    "Plot twist: Everyone went basic today. You? You went legendary. 🔥",
    "The algorithm is confused. You weren't supposed to do that. 🤯",
    "While the world copied each other, you wrote the original. 📝",
    "Literally no one else on Earth did this today. That's main character energy. ✨",
    "The trend was to follow trends. You said 'nah.' Legend. 🦄",
    "Everyone else got the memo. You wrote your own. Respect. 🎯",
  ],
  veryHigh: [ // 90-99% unique
    "2.3M people did the same thing. You? Different story. ✨",
    "While {matchCount} people followed the script, you improvised. 🎭",
    "The world went left. You went right. That's the vibe. 🌟",
    "Everyone else chose easy mode. You picked legendary. 🏆",
    "Billions followed the trend. You didn't. That's the tweet. 🐦",
    "{matchCount} people did the obvious. You did the extraordinary. 💫",
  ],
  high: [ // 70-89% unique
    "Not everyone takes the road less traveled. You did. 🛤️",
    "While {matchCount} people did the usual, you switched it up. 🔄",
    "Most people followed the pattern. You broke it. 🔨",
    "The crowd went one way. You chose your own path. 🧭",
    "In a world of copy-paste, you hit 'new document.' ✨",
    "Mainstream? Never heard of her. 😎",
  ],
  moderate: [ // 50-69% unique
    "You're in the sweet spot - unique enough to be interesting. 🎯",
    "{matchCount} people did something similar, but your twist was yours. ✨",
    "Not too common, not too rare. Just right. 🐻",
    "You and {matchCount} others were on a wavelength, but you had your own frequency. 📻",
  ],
}

/**
 * Commonality Messages (High Commonality)
 */
const COMMONALITY_MESSAGES = {
  veryHigh: [ // 80%+ commonality (20% unique)
    "You and {matchCount} others had the same vibe today. Great minds! 🧠",
    "Welcome to the cool kids club. Population: {matchCount}. 😎",
    "Turns out you're not alone. {matchCount} people were on your wavelength. 🌊",
    "{matchCount} people can't be wrong. This is the move. 🎯",
    "The tribe has spoken: {matchCount} members strong. 🤝",
    "You found your people. All {matchCount} of them did this too. 💫",
  ],
  high: [ // 60-79% commonality
    "{matchCount} people had the same idea. You're part of the zeitgeist. ⏰",
    "This is trending in the most human way possible. {matchCount} people agree. 📈",
    "You and {matchCount} others formed an accidental club today. 🎪",
    "Collective consciousness alert: {matchCount} people on the same page. 📖",
  ],
  moderate: [ // 40-59% commonality
    "You're split between unique and relatable. The sweet spot. 🎯",
    "Half the world did this, half didn't. You picked a side. ⚖️",
    "Not too mainstream, not too obscure. Perfectly balanced. ⚡",
  ],
}

/**
 * Celebration Messages (Based on Vibe)
 */
const VIBE_CELEBRATIONS = {
  '🌙 Night Owl': [
    "The night is yours when everyone else sleeps. 🦉",
    "3am hits different, doesn't it? Night owl energy detected. 🌙",
    "While the world dreamed, you lived. That's the vibe. ✨",
  ],
  '☮️ Digital Detox': [
    "Everyone doom-scrolled. You touched grass. Literally. 🌿",
    "In a world of screens, you chose reality. Respect. 📵",
    "The algorithm cried when you didn't log in. Good. 😎",
  ],
  '😭 Emotional': [
    "Feelings? In THIS economy? Brave. 😭",
    "Emotional honesty in 2025. That's revolutionary. 💙",
    "You felt something real. The world needs more of this. 🌟",
  ],
  '🏃 Fitness Warrior': [
    "While others snoozed alarms, you ran. Beast mode. 🏃",
    "The couch called. You said no. That's character. 💪",
    "Fitness isn't a trend for you. It's a lifestyle. 🔥",
  ],
  '🍳 Foodie Chef': [
    "UberEats cried. You cooked from scratch. Chef's kiss. 👨‍🍳",
    "Homemade in a delivery world. That's the move. 🍳",
    "The kitchen was your canvas today. Art = made. 🎨",
  ],
  '🎨 Creative Soul': [
    "AI can generate images. You created from the soul. Priceless. 🎨",
    "In a world of consumption, you created. That's power. ✨",
    "The muse spoke. You listened. Art happened. 🖌️",
  ],
  '📚 Bookworm': [
    "TikTok lost. Books won. You're built different. 📚",
    "In a world of 15-second clips, you read chapters. Legend. 📖",
    "The algorithm can't compete with a good book. You knew. 🌟",
  ],
  '🎵 Music Lover': [
    "The soundtrack of your life hits different. 🎵",
    "While others listened, you FELT the music. Vibe check: passed. ✅",
  ],
  '🌿 Nature Explorer': [
    "Concrete jungle? Nah. Actual nature. That's the move. 🌲",
    "Trees > screens. You got the memo. 🌿",
  ],
}

/**
 * Share Messages (For Viral Sharing)
 */
const SHARE_MESSAGES = {
  uniqueDare: [
    "I dare you to beat this {score}% uniqueness! Can you? 🔥",
    "Think you're unique? Beat this {score}% score! 🎯",
    "Only the brave try this... {score}% uniqueness 💪",
    "Challenge accepted? This is {score}% unique - try to top it! ✨",
    "The bar is set at {score}%. Can you jump higher? 🏆",
    "Everyone else failed. Can YOU do something {score}% more unique? 😏",
  ],
  uniqueBrag: [
    "I'm literally 1 of 1 who did this today. Built different. 😤",
    "{score}% unique. The algorithm doesn't know what to do with me. 🤖",
    "While you were trending, I was being legendary. {score}% proof. ✨",
  ],
  commonInvite: [
    "{matchCount} people did this. Join the club or do something different? 🤔",
    "Part of the {matchCount} who did this. What did YOU do? 👥",
    "{matchCount} people can't be wrong... or can they? 😏",
    "Everyone's doing this ({matchCount} people). Dare to be different? ✨",
    "The {matchCount}-person club. In or out? 🎪",
  ],
  commonProud: [
    "I'm one of {matchCount}. We move together. 🌊",
    "{matchCount} of us had the same vibe. That's community. 🤝",
    "Found my tribe: {matchCount} strong. 💪",
  ],
}

/**
 * Get a witty message for the response page
 */
export function getWittyResponse(context: WittyMessageContext): string {
  const { uniquenessScore, matchCount, vibe } = context
  
  // Perfect uniqueness (100%)
  if (uniquenessScore === 100) {
    return random(UNIQUENESS_MESSAGES.perfect)
  }
  
  // Very high uniqueness (90-99%)
  if (uniquenessScore >= 90) {
    return random(UNIQUENESS_MESSAGES.veryHigh).replace('{matchCount}', matchCount.toString())
  }
  
  // High uniqueness (70-89%)
  if (uniquenessScore >= 70) {
    return random(UNIQUENESS_MESSAGES.high).replace('{matchCount}', matchCount.toString())
  }
  
  // Moderate uniqueness (50-69%)
  if (uniquenessScore >= 50) {
    return random(UNIQUENESS_MESSAGES.moderate).replace('{matchCount}', matchCount.toString())
  }
  
  // High commonality (60%+ commonality = <40% uniqueness)
  const commonalityScore = 100 - uniquenessScore
  if (commonalityScore >= 60) {
    return random(COMMONALITY_MESSAGES.veryHigh).replace('{matchCount}', matchCount.toString())
  }
  
  // Moderate commonality
  if (commonalityScore >= 40) {
    return random(COMMONALITY_MESSAGES.high).replace('{matchCount}', matchCount.toString())
  }
  
  // Balanced
  return random(COMMONALITY_MESSAGES.moderate)
}

/**
 * Get a witty share message (for dares/invites)
 */
export function getShareMessage(context: WittyMessageContext & { isDare?: boolean }): string {
  const { uniquenessScore, matchCount, isDare = true } = context
  
  if (uniquenessScore >= 70) {
    // Unique posts
    return isDare
      ? random(SHARE_MESSAGES.uniqueDare).replace('{score}', uniquenessScore.toString())
      : random(SHARE_MESSAGES.uniqueBrag).replace('{score}', uniquenessScore.toString())
  } else {
    // Common posts
    return isDare
      ? random(SHARE_MESSAGES.commonInvite).replace('{matchCount}', matchCount.toString())
      : random(SHARE_MESSAGES.commonProud).replace('{matchCount}', matchCount.toString())
  }
}

/**
 * Get a vibe-specific celebration
 */
export function getVibeCelebration(vibe: string): string {
  const vibeKey = vibe as keyof typeof VIBE_CELEBRATIONS
  const messages = VIBE_CELEBRATIONS[vibeKey]
  
  if (messages && messages.length > 0) {
    return random(messages)
  }
  
  return "You did your thing. The world noticed. ✨"
}

/**
 * Utility: Get random item from array
 */
function random<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Get loading messages (show while analyzing)
 */
export function getLoadingMessage(): string {
  const messages = [
    "Finding your tribe... 🔍",
    "Analyzing uniqueness... 🧠",
    "Consulting the universe... 🌌",
    "Checking if anyone else dared... 🎲",
    "Measuring your rebel score... 😎",
    "Comparing with the world... 🌍",
    "Calculating your vibe... 🎨",
    "Discovering your rank... 🏆",
  ]
  return random(messages)
}

/**
 * Get rank display text with personality
 */
export function getWittyRank(uniquenessScore: number, scope: string = 'world'): string {
  const getScopeText = (s: string) => {
    switch (s) {
      case 'city': return 'in your city'
      case 'state': return 'in your state'
      case 'country': return 'in your country'
      default: return 'on Earth'
    }
  }
  
  if (uniquenessScore === 100) {
    return `Only you ${getScopeText(scope)}. Literal unicorn. 🦄`
  }
  
  if (uniquenessScore >= 95) {
    return `Top 1% most unique ${getScopeText(scope)}. Main character vibes. ✨`
  }
  
  if (uniquenessScore >= 85) {
    return `Top 5% most unique ${getScopeText(scope)}. Built different. 🔥`
  }
  
  if (uniquenessScore >= 70) {
    return `Top 10% most unique ${getScopeText(scope)}. Rebel status unlocked. 😎`
  }
  
  if (uniquenessScore >= 50) {
    return `Perfectly balanced ${getScopeText(scope)}. Thanos would approve. ⚖️`
  }
  
  return `Part of the vibe ${getScopeText(scope)}. Community energy. 🤝`
}

