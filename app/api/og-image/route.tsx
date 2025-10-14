import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
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
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
          }}
        />
        
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 120,
              height: 120,
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            <svg
              width="70"
              height="70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #ffffff 0%, #e0e0e0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            OnlyOne.Today
          </div>
          
          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            Discover how unique you are
          </div>
          
          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <span>✨ Anonymous</span>
            <span>•</span>
            <span>🚀 Instant</span>
            <span>•</span>
            <span>🎯 Fun</span>
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

