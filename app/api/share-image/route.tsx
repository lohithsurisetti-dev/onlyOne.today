import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const content = searchParams.get('content') || 'My unique moment'
  const score = searchParams.get('score') || '100'
  const type = searchParams.get('type') || 'uniqueness'
  const scope = searchParams.get('scope') || 'world'
  const vibe = searchParams.get('vibe') || '✨ Free Spirit'
  
  const isUnique = type === 'uniqueness'
  const gradientColors = isUnique
    ? { from: '#a855f7', to: '#ec4899' } // Purple to pink (unique)
    : { from: '#3b82f6', to: '#8b5cf6' } // Blue to purple (common)

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0b2e 0%, #16213e 100%)',
          padding: '60px',
        }}
      >
        {/* Card */}
        <div
          style={{
            background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
            borderRadius: 30,
            padding: '50px',
            width: '1000px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Score */}
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: 'white',
              marginBottom: 20,
            }}
          >
            {score}%
          </div>
          
          {/* Type */}
          <div
            style={{
              fontSize: 40,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 40,
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            {isUnique ? 'UNIQUE' : 'COMMON'}
          </div>
          
          {/* Content */}
          <div
            style={{
              fontSize: 36,
              color: 'white',
              marginBottom: 30,
              textAlign: 'center',
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            "{content}"
          </div>
          
          {/* Metadata */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <span>{vibe}</span>
            <span>•</span>
            <span style={{ textTransform: 'capitalize' }}>{scope}</span>
          </div>
        </div>
        
        {/* Branding */}
        <div
          style={{
            marginTop: 40,
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 700,
          }}
        >
          OnlyOne Today
        </div>
        <div
          style={{
            fontSize: 20,
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: 10,
          }}
        >
          Discover your uniqueness
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}

