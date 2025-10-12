/**
 * Hybrid Content Moderation
 * 
 * Combines static rule-based + AI model detection
 * - Static: Fast, catches obvious violations (phone, email, URLs)
 * - AI: Context-aware, catches nuanced toxic content
 */

import { moderateContent, getModerationMessage } from './moderation'
import { moderateWithAI, getAIModerationMessage } from './moderation-ai'

export interface HybridModerationResult {
  allowed: boolean
  reason?: string
  severity?: 'low' | 'medium' | 'high'
  blockedBy?: 'static' | 'ai' | 'both'
  aiScores?: Record<string, number>
  message?: string
}

/**
 * Two-stage moderation pipeline
 * 
 * Stage 1: Static rules (fast, catches obvious patterns)
 * Stage 2: AI detection (smart, catches context-based violations)
 */
export async function moderateContentHybrid(
  content: string,
  useAI: boolean = true // Toggle AI on/off
): Promise<HybridModerationResult> {
  // Stage 1: Static rule-based moderation (always runs)
  const staticResult = moderateContent(content)
  
  // If static rules block it, no need for AI
  if (!staticResult.allowed) {
    return {
      allowed: false,
      reason: staticResult.reason,
      severity: staticResult.severity,
      blockedBy: 'static',
      message: getModerationMessage(staticResult),
    }
  }
  
  // Stage 2: AI-based moderation (only if enabled and static passed)
  if (useAI) {
    try {
      const aiResult = await moderateWithAI(content)
      
      if (!aiResult.allowed) {
        return {
          allowed: false,
          reason: aiResult.reason,
          severity: aiResult.severity,
          blockedBy: 'ai',
          aiScores: aiResult.scores,
          message: getAIModerationMessage(aiResult),
        }
      }
      
      // Both passed - content is clean
      return {
        allowed: true,
        blockedBy: undefined,
        aiScores: aiResult.scores,
      }
    } catch (error) {
      console.error('⚠️ AI moderation failed, falling back to static-only:', error)
      // If AI fails, rely on static rules (already passed)
      return {
        allowed: true,
        blockedBy: undefined,
      }
    }
  }
  
  // AI disabled, static passed - allow
  return {
    allowed: true,
    blockedBy: undefined,
  }
}

/**
 * Quick static-only check (for performance-critical paths)
 */
export function moderateStaticOnly(content: string): HybridModerationResult {
  const result = moderateContent(content)
  
  return {
    allowed: result.allowed,
    reason: result.reason,
    severity: result.severity,
    blockedBy: result.allowed ? undefined : 'static',
    message: result.allowed ? undefined : getModerationMessage(result),
  }
}

/**
 * Moderation with configurable options
 */
export interface ModerationOptions {
  useAI?: boolean          // Enable AI detection (default: true)
  aiThreshold?: number     // AI confidence threshold 0-1 (default: 0.75)
  logResults?: boolean     // Log moderation results (default: true)
}

export async function moderateWithOptions(
  content: string,
  options: ModerationOptions = {}
): Promise<HybridModerationResult> {
  const {
    useAI = true,
    logResults = true,
  } = options
  
  const result = await moderateContentHybrid(content, useAI)
  
  if (logResults && !result.allowed) {
    console.log(`🚫 Content blocked by ${result.blockedBy}: ${result.reason}`)
    if (result.aiScores) {
      console.log('📊 AI scores:', result.aiScores)
    }
  }
  
  return result
}

/**
 * Moderation stats for analytics
 */
export interface ModerationStats {
  staticBlocked: number
  aiBlocked: number
  allowed: number
  total: number
  topStaticReasons: Record<string, number>
  topAIReasons: Record<string, number>
}

// In-memory stats (reset on server restart)
const stats: ModerationStats = {
  staticBlocked: 0,
  aiBlocked: 0,
  allowed: 0,
  total: 0,
  topStaticReasons: {},
  topAIReasons: {},
}

export function trackModerationResult(result: HybridModerationResult): void {
  stats.total++
  
  if (!result.allowed) {
    if (result.blockedBy === 'static') {
      stats.staticBlocked++
      if (result.reason) {
        stats.topStaticReasons[result.reason] = (stats.topStaticReasons[result.reason] || 0) + 1
      }
    } else if (result.blockedBy === 'ai') {
      stats.aiBlocked++
      if (result.reason) {
        stats.topAIReasons[result.reason] = (stats.topAIReasons[result.reason] || 0) + 1
      }
    }
  } else {
    stats.allowed++
  }
}

export function getModerationStats(): ModerationStats {
  return { ...stats }
}

export function resetModerationStats(): void {
  stats.staticBlocked = 0
  stats.aiBlocked = 0
  stats.allowed = 0
  stats.total = 0
  stats.topStaticReasons = {}
  stats.topAIReasons = {}
}

