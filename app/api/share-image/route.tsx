import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const content = searchParams.get('content') || 'My unique moment'
  const percentileText = searchParams.get('percentileText') || 'Top 10%'
  const percentileBadge = searchParams.get('percentileBadge') || '🏆'
  const percentileComparison = searchParams.get('percentileComparison') || '1 of 10 people'
  const percentileTier = searchParams.get('percentileTier') || 'elite'
  const scope = searchParams.get('scope') || 'world'
  const inputType = searchParams.get('inputType') || 'action'
  
  // Determine colors based on tier and input type
  const isTopTier = ['elite', 'rare', 'unique', 'notable'].includes(percentileTier)
  
  let colors
  if (inputType === 'day') {
    colors = isTopTier
      ? { gradient: ['#fb923c', '#fbbf24'], text: '#ea580c', bg: '#fff7ed', accent: '#fed7aa' }
      : { gradient: ['#14b8a6', '#10b981'], text: '#0f766e', bg: '#f0fdfa', accent: '#99f6e4' }
  } else {
    colors = isTopTier
      ? { gradient: ['#a855f7', '#ec4899'], text: '#9333ea', bg: '#faf5ff', accent: '#e9d5ff' }
      : { gradient: ['#3b82f6', '#06b6d4'], text: '#2563eb', bg: '#eff6ff', accent: '#bfdbfe' }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Gradient Background Accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60%',
            height: '100%',
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent}40 100%)`,
            opacity: 0.6,
          }}
        />
        
        {/* Content Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            padding: '80px',
            gap: '60px',
          }}
        >
          {/* Left Side - Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.gradient[0]} 0%, ${colors.gradient[1]} 100%)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 8 }}>{percentileBadge}</div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '-1px',
                }}
              >
                {percentileText}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                {percentileComparison}
              </div>
            </div>
          </div>
          
          {/* Right Side - Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            {/* Quote */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: '#1f2937',
                lineHeight: 1.3,
                letterSpacing: '-0.5px',
              }}
            >
              "{content.substring(0, 80)}{content.length > 80 ? '...' : ''}"
            </div>
            
            {/* Metadata */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: 20,
                color: '#6b7280',
              }}
            >
              <span style={{ fontSize: 28 }}>🌍</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#9ca3af' }}>{scope}</span>
            </div>
            
            {/* Separator */}
            <div
              style={{
                width: '100%',
                height: '2px',
                background: `linear-gradient(90deg, ${colors.gradient[0]}40 0%, transparent 100%)`,
                marginTop: '20px',
                marginBottom: '20px',
              }}
            />
            
            {/* Branding */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${colors.gradient[0]} 0%, ${colors.gradient[1]} 100%)`,
                  backgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-0.5px',
                }}
              >
                OnlyOne Today
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: '#9ca3af',
                  fontWeight: 500,
                }}
              >
                Discover your uniqueness
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
