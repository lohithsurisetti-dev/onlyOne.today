import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIP, RateLimitPresets, createRateLimitResponse } from '@/lib/utils/rate-limit'
import { detectVibeSync } from '@/lib/services/vibe-detector'

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getIP(request)
  const rateLimitResult = rateLimit(ip, 'share-generation', RateLimitPresets.SHARE_GENERATION)
  
  if (!rateLimitResult.success) {
    console.log(`⚠️ Rate limit exceeded for share generation from IP: ${ip}`)
    return createRateLimitResponse(rateLimitResult)
  }
  
  const { searchParams } = new URL(request.url)
  
  const content = searchParams.get('content') || 'Your unique moment'
  const score = searchParams.get('score') || '94'
  const type = searchParams.get('type') || 'uniqueness'
  const message = searchParams.get('message') || 'While the world followed the trend, I did something truly unique.'
  const scope = searchParams.get('scope') || 'world'
  const inputType = searchParams.get('inputType') || 'action'
  const vibeParam = searchParams.get('vibe')
  
  // Detect vibe if not provided
  const vibe = vibeParam || detectVibeSync(content)
  
  const isUnique = type === 'uniqueness'
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200, height=630">
  <title>Share Card</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1200px;
      height: 630px;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }
    
    .card {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #2d1b4e 100%);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
    }
    
    .stars {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(1px 1px at 20% 30%, white, transparent),
        radial-gradient(1px 1px at 40% 70%, white, transparent),
        radial-gradient(1px 1px at 90% 40%, white, transparent),
        radial-gradient(1px 1px at 10% 80%, white, transparent),
        radial-gradient(1px 1px at 60% 20%, white, transparent);
      opacity: 0.8;
    }
    
    .glow {
      position: absolute;
      width: 800px;
      height: 800px;
      background: ${isUnique 
        ? 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
      };
      filter: blur(100px);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .content {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: 1000px;
      padding: 0 60px;
    }
    
    .logo {
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.6);
      font-size: 18px;
      font-weight: 300;
      letter-spacing: 0.2em;
    }
    
    .quote {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 30px;
      color: white;
      text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
    }
    
    .message {
      font-size: 22px;
      font-weight: 400;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.85);
      margin-bottom: 50px;
      text-shadow: 0 1px 15px rgba(0, 0, 0, 0.4);
    }
    
    .score-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .score-circle {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: ${isUnique 
        ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
        : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'
      };
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: ${isUnique 
        ? '0 0 60px rgba(139, 92, 246, 0.6)'
        : '0 0 60px rgba(59, 130, 246, 0.6)'
      };
    }
    
    .score-number {
      font-size: 72px;
      font-weight: 900;
      color: white;
      line-height: 1;
    }
    
    .score-label {
      font-size: 16px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 8px;
    }
    
    .footer {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tagline {
      font-size: 14px;
    }
    
    .scope-info {
      position: absolute;
      top: 40px;
      right: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
    
    .vibe-badge {
      position: absolute;
      top: 40px;
      left: 40px;
      padding: 10px 20px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3));
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="stars"></div>
    <div class="glow"></div>
    
    <div class="logo">OnlyOne.today</div>
    
    ${vibe ? `<div class="vibe-badge">${vibe}</div>` : ''}
    
    <div class="scope-info">
      <span>${scope === 'world' ? '🌍' : scope === 'country' ? '🏳️' : scope === 'state' ? '🏛️' : '🏙️'}</span>
      <span>${scope === 'world' ? 'Worldwide' : scope === 'country' ? 'Country' : scope === 'state' ? 'State' : 'City'}</span>
    </div>
    
    <div class="content">
      <div class="quote">"${content}"</div>
      <div class="message">${message}</div>
      
      <div class="score-section">
        <div class="score-circle">
          <div class="score-number">${score}</div>
          <div class="score-label">${isUnique ? 'Unique' : 'Common'}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div class="brand">
        <span>🔗</span>
        <span>OnlyOne.today</span>
      </div>
      <div class="tagline">Discover your unique moments</div>
    </div>
  </div>
</body>
</html>`
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

