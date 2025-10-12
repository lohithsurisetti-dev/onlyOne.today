import { NextRequest, NextResponse } from 'next/server'
import { getModerationStats, resetModerationStats } from '@/lib/services/moderation-hybrid'

/**
 * GET /api/moderation/stats - Get moderation statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = getModerationStats()
    
    return NextResponse.json({
      stats,
      summary: {
        total: stats.total,
        blocked: stats.staticBlocked + stats.aiBlocked,
        allowed: stats.allowed,
        blockRate: stats.total > 0 
          ? ((stats.staticBlocked + stats.aiBlocked) / stats.total * 100).toFixed(1) + '%'
          : '0%',
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/moderation/stats:', error)
    return NextResponse.json(
      { error: 'Failed to get moderation stats' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/moderation/stats - Reset moderation statistics
 */
export async function DELETE(request: NextRequest) {
  try {
    resetModerationStats()
    
    return NextResponse.json({ 
      message: 'Moderation stats reset successfully' 
    }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/moderation/stats:', error)
    return NextResponse.json(
      { error: 'Failed to reset moderation stats' },
      { status: 500 }
    )
  }
}

