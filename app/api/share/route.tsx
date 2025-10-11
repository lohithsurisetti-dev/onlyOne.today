import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const content = searchParams.get('content') || 'Your unique moment'
    const score = searchParams.get('score') || '94'
    const type = searchParams.get('type') || 'uniqueness'
    const message = searchParams.get('message') || 'While the world followed the trend, I did something truly unique.'
    
    const isUnique = type === 'uniqueness'
    
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
            background: '#1a162c',
            position: 'relative',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Nebula Background - Multiple radial gradients */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: isUnique
                ? 'radial-gradient(ellipse at 70% 30%, #8A2BE2 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, #4D5DFF 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, #5c67e8 0%, transparent 60%)'
                : 'radial-gradient(ellipse at 70% 30%, #06b6d4 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, #3b82f6 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, #4D5DFF 0%, transparent 60%)',
              opacity: 0.5,
              filter: 'blur(120px)',
            }}
          />
          
          {/* Particle Stars */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
            }}
          >
            {[...Array(80)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: i % 5 === 0 ? '2px' : '1px',
                  height: i % 5 === 0 ? '2px' : '1px',
                  background: 'white',
                  borderRadius: '50%',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.3 + Math.random() * 0.7,
                }}
              />
            ))}
          </div>
          
          {/* Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.1)',
            }}
          />
          
          {/* Top Logo */}
          <div
            style={{
              position: 'absolute',
              top: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 300,
              letterSpacing: '0.15em',
            }}
          >
            OnlyOne.today
          </div>
          
          {/* Main Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              width: '100%',
              padding: '64px',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Spacer */}
            <div style={{ width: '100%' }} />
            
            {/* Text Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                marginTop: '-16px',
              }}
            >
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: 'white',
                  textAlign: 'center',
                  maxWidth: '1000px',
                  textShadow: '0 2px 15px rgba(0, 0, 0, 0.5)',
                  marginBottom: '24px',
                }}
              >
                "{content}"
              </div>
              
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  maxWidth: '900px',
                  textShadow: '0 1px 10px rgba(0, 0, 0, 0.4)',
                }}
              >
                {message}
              </div>
            </div>
            
            {/* Ethereal Orb with Score */}
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
                  width: '220px',
                  height: '220px',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(160, 90, 255, 0.15) 40%, transparent 70%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isUnique
                    ? '0 0 80px 20px rgba(160, 90, 255, 0.6), inset 0 0 50px 10px rgba(255, 255, 255, 0.5)'
                    : '0 0 80px 20px rgba(59, 130, 246, 0.6), inset 0 0 50px 10px rgba(255, 255, 255, 0.5)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '112px',
                      fontWeight: 900,
                      color: 'white',
                      textShadow: '0 0 25px rgba(255, 255, 255, 0.9)',
                      lineHeight: 1,
                    }}
                  >
                    {score}
                  </span>
                  <p
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginTop: '4px',
                    }}
                  >
                    {isUnique ? 'Uniqueness' : 'Commonality'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <span style={{ marginRight: '8px' }}>🔗</span>
                OnlyOne.today
              </div>
              
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                Discover your unique moments
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}

