# OnlyOne.today — Tech Stack & Implementation Guide

*The definitive technical decisions for building OnlyOne.today as a lightweight, scalable PWA*

---

## 🎯 Platform Decision: **Progressive Web App (PWA)**

### Why PWA, Not Native Mobile:

✅ **Faster to market** (2-3 weeks vs 2-3 months)  
✅ **Zero friction** (share link, instant access)  
✅ **Lower cost** ($0/mo vs $99/yr + development)  
✅ **Easier updates** (deploy instantly, no app store review)  
✅ **Better for virality** (link sharing beats "download my app")  
✅ **Works everywhere** (iOS, Android, desktop, tablet)  
✅ **Native app later** (wrap with React Native, reuse 90% of code)

**Decision:** Build web first, native apps after 10k DAU

---

## 🛠️ Tech Stack

### **Frontend**

**Next.js 14+ (App Router)**
- Framework: React 18+
- Language: TypeScript
- Styling: Tailwind CSS
- Animations: Framer Motion
- Icons: Lucide React

**Why:**
- ✅ React-based (huge ecosystem)
- ✅ Server components = fast by default
- ✅ Built-in routing, no config needed
- ✅ PWA-ready with next-pwa
- ✅ TypeScript = fewer bugs
- ✅ SEO-friendly for organic discovery
- ✅ Hot reload = fast development
- ✅ Deploy to Vercel in 2 clicks

**Folder Structure:**
```
/app
  /page.tsx           # Home (post submission)
  /feed/page.tsx      # Anonymous feed
  /api
    /posts/route.ts   # Post submission API
    /trends/route.ts  # Trending data API
/components
  /PostCard.tsx
  /FeedItem.tsx
  /ShareCard.tsx
/lib
  /supabase.ts        # Supabase client
  /trends.ts          # Trending data fetchers
  /matching.ts        # Post matching logic
/styles
  /globals.css        # Tailwind + custom styles
```

---

### **Backend**

**Supabase (PostgreSQL + Auth + Realtime + Storage)**

**Why:**
- ✅ Free tier: 500MB DB, 50k MAU, 2GB storage
- ✅ PostgreSQL (reliable, proven at scale)
- ✅ Built-in auth (email, OAuth, magic links)
- ✅ Realtime subscriptions (for live feed)
- ✅ Row-level security (privacy by default)
- ✅ Auto-generated REST & GraphQL APIs
- ✅ Storage for share cards
- ✅ Edge functions for serverless logic
- ✅ One-click deploy
- ✅ Scales to millions

**Alternative Considered:** Firebase (good, but slightly more expensive and less SQL-friendly)

---

### **Database Schema**

#### Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Parsed entities (from NLP)
  activity TEXT,          -- "listening", "watching", etc.
  subject TEXT,           -- "Taylor Swift", "book", etc.
  category TEXT,          -- "music", "tv", "reading", etc.
  
  -- Matching
  similarity_hash TEXT,   -- For O(1) matching
  
  -- Metrics
  uniqueness_score INT CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100),
  commonality_score INT CHECK (commonality_score >= 0 AND commonality_score <= 100),
  similar_count INT DEFAULT 0,
  
  -- Trend context
  trend_match JSONB,      -- {trend: "X", source: "spotify", contrast: true}
  
  -- Privacy
  is_public BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Engagement
  reactions INT DEFAULT 0,
  shares INT DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_similarity_hash ON posts(similarity_hash);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

#### Users Table (Optional, for logged-in features)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Preferences
  notification_level TEXT DEFAULT 'daily',  -- 'none', 'daily', 'matches', 'all'
  allow_activity_tracking BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'auto',  -- 'auto', 'light', 'dark'
  
  -- Stats
  total_posts INT DEFAULT 0,
  streak INT DEFAULT 0,
  last_post_date DATE,
  
  -- Connected services (encrypted)
  connected_services JSONB
);
```

#### Trending Cache Table
```sql
CREATE TABLE trending_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,   -- 'spotify', 'google', 'twitter'
  category TEXT,          -- 'music', 'news', 'videos'
  trends JSONB NOT NULL,  -- Array of trending items
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Auto-delete expired trends
CREATE INDEX idx_trending_expires ON trending_cache(expires_at);
```

---

### **External APIs**

#### 1. Google Trends (Unofficial)
**Library:** `google-trends-api`
**Purpose:** Detect what's trending globally
**Cost:** Free
**Rate Limit:** ~100 requests/hour
**Caching:** 1 hour

```typescript
import googleTrends from 'google-trends-api';

async function fetchGoogleTrends() {
  const results = await googleTrends.dailyTrends({
    trendDate: new Date(),
    geo: 'US',
  });
  return JSON.parse(results);
}
```

#### 2. Spotify Web API
**Purpose:** Trending songs, albums, playlists
**Cost:** Free
**Rate Limit:** 180 requests/minute
**Caching:** 1 hour

```typescript
import SpotifyWebApi from 'spotify-web-api-node';

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function fetchSpotifyTrends() {
  // Get access token
  const auth = await spotify.clientCredentialsGrant();
  spotify.setAccessToken(auth.body.access_token);
  
  // Get Global Top 50 playlist
  const playlist = await spotify.getPlaylist('37i9dQZEVXbMDoHDwVN2tF');
  return playlist.body.tracks.items;
}
```

#### 3. Twitter/X API (Optional, Post-MVP)
**Purpose:** Real-time trending topics
**Cost:** $100/mo (Basic tier)
**Decision:** Skip for MVP, too expensive

---

### **NLP / Matching Engine**

#### MVP: Fuse.js + Simple Regex
**Library:** `fuse.js` (12KB, fuzzy search)
**Purpose:** Match similar posts
**Cost:** Free

```typescript
import Fuse from 'fuse.js';

// Extract entities with simple regex
function extractEntities(content: string) {
  const lower = content.toLowerCase();
  
  // Activity patterns
  const activities = {
    listening: /(listen|hearing|playing|streaming)\s+(to\s+)?/i,
    watching: /(watch|viewing|streaming)\s+/i,
    reading: /(read|reading)\s+/i,
    playing: /(playing|played)\s+/i,
  };
  
  // Find activity
  let activity = null;
  for (const [key, pattern] of Object.entries(activities)) {
    if (pattern.test(content)) {
      activity = key;
      break;
    }
  }
  
  // Extract subject (everything after activity word)
  const subject = activity 
    ? content.replace(activities[activity], '').trim()
    : content;
  
  return { activity, subject };
}

// Create similarity hash
function createSimilarityHash(content: string): string {
  const entities = extractEntities(content);
  const normalized = entities.subject
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 50);
  
  return `${entities.activity || 'other'}:${normalized}`;
}
```

#### Post-MVP: OpenAI API
**Cost:** ~$0.002 per post (at scale: $20/mo for 10k posts)
**Benefits:** Better entity extraction, sentiment analysis

---

### **Sentiment Detection**

#### MVP: Simple Keyword Matching
```typescript
function detectSentiment(content: string): 'proud' | 'vulnerable' | 'neutral' {
  const lower = content.toLowerCase();
  
  const proudKeywords = ['didn\'t', 'still', 'instead', 'chose', 'skipped', 'ignored'];
  const vulnerableKeywords = ['felt', 'anxious', 'sad', 'cried', 'struggled', 'hard', 'difficult'];
  
  const proudCount = proudKeywords.filter(k => lower.includes(k)).length;
  const vulnerableCount = vulnerableKeywords.filter(k => lower.includes(k)).length;
  
  if (vulnerableCount > 0) return 'vulnerable';
  if (proudCount > 0) return 'proud';
  return 'neutral';
}
```

#### Post-MVP: Sentiment Analysis Library
**Library:** `sentiment` or OpenAI API

---

### **Hosting & Infrastructure**

#### Frontend Hosting: **Vercel**
**Why:**
- ✅ Free tier: Unlimited bandwidth, 100 deployments/day
- ✅ Built by Next.js creators (perfect integration)
- ✅ Auto-deploy from GitHub
- ✅ Edge network (fast globally)
- ✅ Zero config

**Cost:**
- Free: 0-100k requests/mo
- Pro ($20/mo): Unlimited requests

#### Backend Hosting: **Supabase Cloud**
**Why:**
- ✅ Free tier: 500MB DB, 50k MAU, 2GB storage
- ✅ Fully managed (no DevOps)
- ✅ Auto-backups
- ✅ Global CDN

**Cost:**
- Free: 0-50k users
- Pro ($25/mo): 100k users, 8GB DB
- Scale: Custom pricing

#### File Storage (Share Cards): **Supabase Storage**
**Why:**
- ✅ Included in Supabase
- ✅ 2GB free
- ✅ Image transformations built-in

---

### **Analytics**

**Plausible Analytics** (Privacy-first)
**Why:**
- ✅ GDPR compliant (no cookie banner needed)
- ✅ Lightweight (< 1KB script)
- ✅ Simple dashboard
- ✅ $9/mo for 10k pageviews

**Alternative:** PostHog (free self-hosted, more features)

---

### **Notifications** (Post-MVP)

**Firebase Cloud Messaging (FCM)**
**Why:**
- ✅ Free
- ✅ Works on iOS, Android, Web
- ✅ Reliable
- ✅ Easy integration with PWA

**Implementation:**
- Service worker for push notifications
- Supabase Edge Functions to send notifications
- User opt-in required

---

## 📦 Dependencies

### package.json (Core Dependencies)
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.4.0",
    
    "@supabase/supabase-js": "^2.42.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    
    "tailwindcss": "^3.4.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.363.0",
    
    "fuse.js": "^7.0.0",
    "google-trends-api": "^5.0.0",
    "spotify-web-api-node": "^5.0.2",
    
    "date-fns": "^3.6.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "prettier": "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.11"
  }
}
```

---

## 🌐 PWA Configuration

### next.config.js
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['supabase.co'],
  },
});
```

### manifest.json
```json
{
  "name": "OnlyOne.today",
  "short_name": "OnlyOne",
  "description": "While the world follows the trend, you did something no one else did.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a1a",
  "theme_color": "#8b5cf6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🎨 Design System (Tailwind Config)

### tailwind.config.js
```javascript
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Night sky theme
        'space-dark': '#0a0a1a',
        'space-mid': '#1a1a2e',
        'space-light': '#2d2d44',
        'accent-purple': '#8b5cf6',
        'accent-blue': '#3b82f6',
        'accent-pink': '#ec4899',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 💰 Cost Breakdown

### MVP (0-5k users)
| Service | Cost |
|---------|------|
| Vercel (hosting) | $0 |
| Supabase (database) | $0 |
| Domain (optional) | $12/yr |
| **Total** | **~$0/mo** |

### Growth (5k-50k users)
| Service | Cost |
|---------|------|
| Vercel Pro | $20/mo |
| Supabase Pro | $25/mo |
| Plausible Analytics | $9/mo |
| External APIs | $0-20/mo |
| **Total** | **~$75/mo** |

### Scale (50k-200k users)
| Service | Cost |
|---------|------|
| Vercel Pro | $20/mo |
| Supabase Scale | $100/mo |
| Plausible | $19/mo |
| APIs + CDN | $50/mo |
| **Total** | **~$190/mo** |

**At 100k users:** With 2% premium conversion ($4.99/mo) + ads ($10 RPM), you'd make ~$17k/mo
**Break-even:** ~3k users

---

## 🚀 Development Timeline

### Week 1: Core MVP
- [ ] Set up Next.js + Supabase project
- [ ] Create database schema
- [ ] Build post submission form
- [ ] Implement similarity hashing
- [ ] Basic response: "You're the only one" or "X others did this"
- [ ] Store posts in database

### Week 2: Trending Integration
- [ ] Integrate Google Trends API
- [ ] Integrate Spotify API
- [ ] Cache trending data (1 hour TTL)
- [ ] Generate contextual responses: "While millions did X, you did Y"
- [ ] Build anonymous feed UI
- [ ] Implement real-time updates (Supabase Realtime)

### Week 3: Polish & Launch
- [ ] Design & implement share cards (OG images)
- [ ] Add animations (Framer Motion)
- [ ] PWA configuration (manifest, service worker)
- [ ] Analytics integration (Plausible)
- [ ] SEO optimization (meta tags)
- [ ] Deploy to Vercel
- [ ] Launch on Product Hunt

### Post-Launch (Week 4+)
- [ ] Dual metric system (uniqueness + commonality scores)
- [ ] Sentiment detection
- [ ] User accounts (optional login)
- [ ] Daily notification
- [ ] Weekly digest
- [ ] Premium tier

---

## 🔒 Security Considerations

### Supabase Row-Level Security (RLS)
```sql
-- Only allow reading public posts
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (is_public = true);

-- Users can insert posts
CREATE POLICY "Anyone can create posts"
  ON posts FOR INSERT
  WITH CHECK (true);

-- Users can only update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);
```

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret

NEXT_PUBLIC_PLAUSIBLE_DOMAIN=onlyone.today
```

---

## 🧪 Testing Strategy

### MVP Testing (Manual)
- Manual testing in browser (Chrome, Safari, Firefox)
- Mobile testing via Chrome DevTools device emulation
- PWA testing with Lighthouse

### Post-MVP (Automated)
- Jest for unit tests
- Playwright for E2E tests
- Supabase migrations for database schema testing

---

## 📈 Monitoring & Observability

### Vercel Analytics (Built-in)
- Core Web Vitals
- Page load times
- Error tracking

### Supabase Dashboard
- Database queries
- API usage
- Real-time connections

### Plausible Analytics
- Page views
- Unique visitors
- Conversion tracking

---

## 🎯 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| First Contentful Paint | < 1s | Server components, code splitting |
| Time to Interactive | < 2s | Minimal JavaScript, lazy loading |
| Largest Contentful Paint | < 2.5s | Image optimization, CDN |
| Cumulative Layout Shift | < 0.1 | Fixed layouts, font preloading |
| Lighthouse Score | > 90 | PWA best practices |

---

## 🔄 Migration Path (If Needed)

### If Supabase → Firebase
- Database structure is similar (PostgreSQL → Firestore requires mapping)
- Auth is compatible
- Storage is 1:1
- Realtime requires rewrite

### If Web → Native
- Wrap with Capacitor or React Native Web
- Reuse 90% of components
- Add native-specific features (biometrics, etc.)
- Re-submit to app stores

---

## 📚 Documentation for Development

### Must-Read Docs:
1. [Next.js App Router](https://nextjs.org/docs/app)
2. [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
3. [Tailwind CSS](https://tailwindcss.com/docs)
4. [PWA Best Practices](https://web.dev/progressive-web-apps/)

### Helpful Resources:
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Google Trends API (unofficial)](https://www.npmjs.com/package/google-trends-api)
- [Spotify Web API Guide](https://developer.spotify.com/documentation/web-api)

---

## ✅ Pre-Development Checklist

Before starting development:

- [ ] GitHub repo created
- [ ] Supabase project created
- [ ] Spotify Developer account created (for API credentials)
- [ ] Domain purchased (optional, can use Vercel subdomain)
- [ ] Figma/design files received from designer
- [ ] Local dev environment set up (Node 18+, VSCode)

---

## 🎬 Ready to Build

**Stack decided:**
- ✅ Next.js 14 + TypeScript + Tailwind CSS
- ✅ Supabase (PostgreSQL)
- ✅ Vercel hosting
- ✅ Google Trends + Spotify APIs
- ✅ Fuse.js for matching
- ✅ PWA-first approach

**Next step:** Waiting for design screens/mockups.

Once designs are ready, we can:
1. Set up project structure
2. Build components based on designs
3. Wire up backend
4. Launch MVP

---

*Document created: October 2025*  
*Ready to build when designs arrive* 🚀

