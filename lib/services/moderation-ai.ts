/**
 * AI-Powered Content Moderation
 * 
 * Uses Transformers.js for dynamic, context-aware moderation
 * Combines ML models with static rules for best results
 */

import { pipeline } from '@xenova/transformers'

// Cache the pipeline to avoid reloading
let toxicityClassifier: any = null

export interface AIModerationResult {
  allowed: boolean
  reason?: string
  severity?: 'low' | 'medium' | 'high'
  scores?: {
    toxic?: number
    profanity?: number
    threat?: number
    identity_hate?: number
    insult?: number
    sexual_explicit?: number
  }
  aiDetected?: boolean
}

/**
 * Initialize the AI moderation pipeline
 * Uses a text-classification model trained on toxic content
 */
async function initializeAI(): Promise<any> {
  if (!toxicityClassifier) {
    console.log('🤖 Loading AI moderation model...')
    
    // Use a lightweight toxicity detection model
    // Options:
    // 1. "Xenova/toxic-bert" - BERT-based toxicity detection
    // 2. "facebook/roberta-hate-speech-dynabench-r4-target" - Hate speech detection
    toxicityClassifier = await pipeline(
      'text-classification',
      'Xenova/toxic-bert',
      { quantized: true } // Use quantized version for faster inference
    )
    
    console.log('✅ AI moderation model loaded')
  }
  
  return toxicityClassifier
}

/**
 * AI-based content moderation
 * Detects: toxicity, profanity, threats, hate speech, explicit content
 */
export async function moderateWithAI(content: string): Promise<AIModerationResult> {
  try {
    // Initialize AI model
    const classifier = await initializeAI()
    
    // Run classification
    const result = await classifier(content, {
      top_k: null, // Return all labels
    })
    
    // Parse results
    const scores: Record<string, number> = {}
    let maxScore = 0
    let maxLabel = ''
    
    if (Array.isArray(result)) {
      for (const item of result) {
        const label = item.label.toLowerCase()
        const score = item.score
        
        scores[label] = score
        
        if (score > maxScore) {
          maxScore = score
          maxLabel = label
        }
      }
    }
    
    // Define thresholds (adjust based on testing)
    const TOXICITY_THRESHOLD = 0.75 // 75% confidence = block
    const MEDIUM_THRESHOLD = 0.60   // 60% = warn
    
    // Check if content should be blocked
    if (maxScore >= TOXICITY_THRESHOLD) {
      return {
        allowed: false,
        reason: getAIReason(maxLabel),
        severity: 'high',
        scores: scores as any,
        aiDetected: true,
      }
    }
    
    // Medium severity - could add warnings in future
    if (maxScore >= MEDIUM_THRESHOLD) {
      console.log(`⚠️ Medium toxicity detected: ${maxLabel} (${(maxScore * 100).toFixed(1)}%)`)
      // Allow but log for review
    }
    
    return {
      allowed: true,
      scores: scores as any,
      aiDetected: true,
    }
  } catch (error) {
    console.error('❌ AI moderation error:', error)
    // Fallback: allow if AI fails (don't block legitimate content)
    return {
      allowed: true,
      reason: 'AI moderation unavailable',
      aiDetected: false,
    }
  }
}

/**
 * Get user-friendly reason from AI label
 */
function getAIReason(label: string): string {
  const reasons: Record<string, string> = {
    'toxic': 'Content contains toxic language',
    'severe_toxic': 'Content contains severely toxic language',
    'obscene': 'Content contains obscene language',
    'threat': 'Content contains threatening language',
    'insult': 'Content contains insulting language',
    'identity_hate': 'Content contains hate speech',
    'sexual_explicit': 'Content contains explicit sexual content',
    'profanity': 'Content contains excessive profanity',
  }
  
  return reasons[label] || 'Content violates community guidelines'
}

/**
 * Hybrid moderation: Combines static rules + AI
 * Best of both worlds: Fast static checks + Smart AI detection
 */
export async function hybridModerate(
  content: string,
  staticResult: { allowed: boolean; reason?: string; severity?: string }
): Promise<AIModerationResult> {
  // If static rules already blocked it, no need for AI
  if (!staticResult.allowed) {
    return {
      allowed: false,
      reason: staticResult.reason,
      severity: staticResult.severity as any,
      aiDetected: false,
    }
  }
  
  // Static rules passed, now check with AI for context-aware moderation
  const aiResult = await moderateWithAI(content)
  
  return aiResult
}

/**
 * Get user-friendly message for AI moderation failures
 */
export function getAIModerationMessage(result: AIModerationResult): string {
  if (result.allowed) return ''
  
  const messages: Record<string, string> = {
    'Content contains toxic language': 
      '☢️ Yikes! Our AI detected some toxic vibes. Maybe dial it back a bit?',
    'Content contains severely toxic language': 
      '🛑 Whoa, that\'s REALLY toxic. We\'re gonna need you to calm down there, chief.',
    'Content contains obscene language': 
      '😳 Our AI\'s ears are burning! Keep it family-friendly, would ya?',
    'Content contains threatening language': 
      '⚠️ Easy there, tough guy. Threats aren\'t cool. How about something positive instead?',
    'Content contains insulting language': 
      '🙄 C\'mon, we\'re all friends here. Save the insults for your group chat.',
    'Content contains hate speech': 
      '🛑 Big nope. Hate speech is a one-way ticket to the exit. Try kindness instead!',
    'Content contains explicit sexual content': 
      '😳 That\'s... very explicit. This isn\'t that kind of app. Keep it PG, please!',
    'Content contains excessive profanity': 
      '🤬 Potty mouth alert! We get it, you know words. But maybe use fewer of *those* words?',
    'Content violates community guidelines': 
      '⚖️ Our AI thinks this breaks the rules. Read the room and try again!',
  }
  
  return messages[result.reason || ''] || result.reason || 'Content not allowed'
}

/**
 * Batch moderation for multiple posts (optional, for future use)
 */
export async function batchModerate(contents: string[]): Promise<AIModerationResult[]> {
  const results: AIModerationResult[] = []
  
  for (const content of contents) {
    const result = await moderateWithAI(content)
    results.push(result)
  }
  
  return results
}

/**
 * Get moderation confidence score (for analytics)
 */
export function getModerationConfidence(result: AIModerationResult): number {
  if (!result.scores) return 0
  
  const scores = Object.values(result.scores)
  return Math.max(...scores)
}

