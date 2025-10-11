# OnlyOne.today — Technical Architecture & Scaling Plan

*How to build a real-time, culture-aware platform that connects millions without drowning them in notifications*

---

## 🎯 The Core Challenge

**Scenario:**
- User A posts: "Listening to Taylor Swift's Lover"
- User B is ALSO listening to "Lover" right now but hasn't posted
- How do we connect them without:
  - Sending push notifications to everyone (spam + expensive)
  - Creating a massive O(n²) matching problem
  - Violating privacy
  - Overloading infrastructure

**This document solves that problem.**

---

## 📊 Table of Contents

1. [System Overview](#system-overview)
2. [Data Architecture](#data-architecture)
3. [The Matching Engine](#the-matching-engine)
4. [Privacy-First Activity Detection](#privacy-first-activity-detection)
5. [Notification Strategy](#notification-strategy)
6. [Scaling Considerations](#scaling-considerations)
7. [API Integrations](#api-integrations)
8. [Cost Analysis](#cost-analysis)
9. [Implementation Phases](#implementation-phases)

---

## 🏗️ System Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────┐
│           User Layer (Web/Mobile)                │
│  - Post submission                               │
│  - Feed viewing                                  │
│  - Optional: Activity tracking (opt-in)          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Application Layer (Backend)              │
│  - Post processing                               │
│  - Matching engine                               │
│  - Notification orchestrator                     │
│  - Trending data aggregator                      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Data Layer (Storage)                    │
│  - Posts database                                │
│  - User preferences                              │
│  - Activity streams (optional, opt-in)           │
│  - Trending cache                                │
└──────────────────────────────────────────────────┘
```

---

## 🗄️ Data Architecture

### Database Schema (Firebase/Supabase)

#### 1. Posts Collection
```typescript
interface Post {
  id: string;                    // Unique post ID
  content: string;               // "Listening to Lover by Taylor Swift"
  userId: string | null;         // Null if anonymous, ID if logged in
  timestamp: number;             // Unix timestamp
  
  // Parsed/extracted data
  entities: {
    activity?: string;           // "listening"
    song?: string;               // "Lover"
    artist?: string;             // "Taylor Swift"
    category?: string;           // "music", "reading", "sports"
  };
  
  // Matching metadata
  similarityHash: string;        // For quick matching (more below)
  trendMatch?: {
    trend: string;               // "Taylor Swift trending"
    source: string;              // "spotify"
    contrast: boolean;           // true if user went AGAINST trend
  };
  
  // Privacy
  isPublic: boolean;             // Show in feed?
  
  // Engagement
  reactions: number;
  shares: number;
}
```

#### 2. Users Collection (Optional — for logged-in users)
```typescript
interface User {
  id: string;
  createdAt: number;
  
  // Privacy preferences
  preferences: {
    allowActivityTracking: boolean;    // Opt-in for Spotify/Netflix integration
    notificationLevel: "none" | "daily" | "matches" | "all";
    dataSharing: boolean;
  };
  
  // Connected services (opt-in only)
  connectedServices: {
    spotify?: {
      accessToken: string;
      refreshToken: string;
      lastSync: number;
    };
    // Future: Netflix, YouTube, etc.
  };
  
  // Stats (for premium features)
  stats: {
    totalPosts: number;
    streak: number;
    uniquenessScore: number;
  };
}
```

#### 3. Activity Streams (Opt-in only, privacy-focused)
```typescript
interface ActivityStream {
  userId: string;
  timestamp: number;
  
  // Only stored if user opts in
  currentActivity: {
    type: "listening" | "watching" | "reading" | "playing";
    item: string;              // Song name, show name, etc.
    source: "spotify" | "netflix" | "manual";
  };
  
  // TTL: Auto-delete after 24 hours
  expiresAt: number;
}
```

#### 4. Trending Cache (Updated hourly)
```typescript
interface TrendingCache {
  id: string;
  timestamp: number;
  source: "spotify" | "twitter" | "google" | "youtube";
  
  trends: Array<{
    name: string;              // "Lover - Taylor Swift"
    category: string;          // "music"
    volume: number;            // How many people
    rank: number;              // 1-50
  }>;
  
  // TTL: Refresh every hour
  expiresAt: number;
}
```

---

## 🔗 The Matching Engine

### Problem: How to match "Listening to Lover" efficiently

#### Approach 1: Semantic Hashing (Lightweight)

**How it works:**
1. When user posts "Listening to Taylor Swift's Lover"
2. Extract entities using simple NLP:
   - Activity: "listening"
   - Artist: "taylor swift"
   - Song: "lover"
3. Create similarity hash: `music:taylorswift:lover`
4. Query posts with same hash from last 24 hours

**Implementation:**
```javascript
function createSimilarityHash(post) {
  const entities = extractEntities(post); // Use NLP library
  
  // Normalize and create hash
  const category = entities.category || "other";
  const subject = (entities.artist || entities.subject || "").toLowerCase().replace(/\s/g, "");
  const item = (entities.song || entities.item || "").toLowerCase().replace(/\s/g, "");
  
  return `${category}:${subject}:${item}`;
}

// Example outputs:
// "Listening to Lover by Taylor Swift" → "music:taylorswift:lover"
// "Watching Stranger Things" → "tv:netflix:strangerthings"
// "Reading Dune" → "books::dune"
```

**Querying:**
```javascript
// Fast database query
const similarPosts = await db.collection('posts')
  .where('similarityHash', '==', hash)
  .where('timestamp', '>', Date.now() - 86400000) // Last 24 hours
  .limit(50)
  .get();
```

**Benefits:**
- ✅ O(1) lookup using indexed hash
- ✅ Works at any scale
- ✅ No expensive NLP at query time
- ✅ Privacy-safe (only matches posts, not tracking users)

---

### Approach 2: Real-Time Activity Matching (Opt-in Feature)

**For users who connect Spotify/Netflix/etc:**

#### Architecture:

```
User listening on Spotify
         ↓
Spotify sends webhook to our backend (every ~30 seconds)
         ↓
Store in ActivityStream (TTL: 24h)
         ↓
When someone POSTS about same song
         ↓
Query ActivityStream for matches
         ↓
Send targeted notification to ONLY matched users
```

#### Implementation:

```javascript
// When user posts "Listening to Lover"
async function findConnections(post) {
  const hash = createSimilarityHash(post);
  
  // Find others currently doing same thing (opt-in users only)
  const activeListeners = await db.collection('activityStreams')
    .where('currentActivity.hash', '==', hash)
    .where('timestamp', '>', Date.now() - 1800000) // Last 30 min
    .where('userId', '!=', post.userId) // Exclude poster
    .limit(10) // Only notify first 10 matches
    .get();
  
  return activeListeners;
}

// Notification sent ONLY to matched users
async function notifyMatches(post, matches) {
  for (const match of matches) {
    // Check user's notification preferences first
    const user = await getUser(match.userId);
    
    if (user.preferences.notificationLevel === "matches" || 
        user.preferences.notificationLevel === "all") {
      
      await sendPushNotification(match.userId, {
        title: "Someone's listening too 🎵",
        body: "Another person just posted they're also listening to Lover",
        action: "view_post",
        postId: post.id
      });
    }
  }
}
```

---

### Approach 3: Probabilistic Matching (No user tracking at all)

**For maximum privacy:**

Instead of tracking what users are doing, we:
1. Know what's trending globally (Spotify API, etc.)
2. When someone posts "Listening to Lover"
3. Check if "Lover" is trending
4. If yes, we can probabilistically assume many others are listening
5. Response: "While 2M people are streaming Lover right now, you're one of the few who posted about it 🎵"

**No individual tracking needed.**

---

## 🔒 Privacy-First Activity Detection

### The Challenge:
To connect people in real-time, we need to know what they're doing. But this is invasive.

### The Solution: Tiered Consent Model

#### Tier 1: No Tracking (Default)
- Users only share what they manually post
- We match based on posted content only
- Privacy: 100%
- Connections: Limited to people who post

#### Tier 2: Aggregate Tracking (Opt-in)
- User connects Spotify/Netflix/etc.
- We see what they're consuming in aggregate
- Data stored for 24 hours max, then deleted
- Used ONLY for matching
- Privacy: High
- Connections: Higher

#### Tier 3: Real-Time Matching (Opt-in + Premium)
- User enables real-time notifications
- When someone posts what they're doing, they get notified
- Still anonymous (they don't see WHO posted, just that someone did)
- Privacy: Medium
- Connections: Maximum

### Implementation:

```javascript
// User settings screen
const consentOptions = {
  level1: {
    label: "Private",
    description: "Only match my posts. Don't track my activity.",
    enabled: true, // Default
  },
  level2: {
    label: "Smart Matching",
    description: "Connect my Spotify/Netflix to find kindred spirits. Data deleted after 24h.",
    enabled: false, // Opt-in
  },
  level3: {
    label: "Real-Time (Premium)",
    description: "Notify me when someone posts what I'm doing right now.",
    enabled: false, // Opt-in + paid
  }
};
```

### Data Retention Policy:
- Posts: Kept forever (or per user choice)
- Activity streams: 24 hours max, then auto-delete
- Personal data: User can export/delete anytime
- Connected services: Tokens stored encrypted, can be revoked instantly

---

## 🔔 Notification Strategy

### The Problem:
Push notifications can easily become spam. We need surgical precision.

### The Strategy: Context-Aware, Limited Notifications

#### Notification Types:

1. **Daily Reflection Prompt** (8 PM local time)
   - "What did you do differently today?"
   - Sent ONCE per day
   - Can be disabled

2. **Match Notification** (Real-time, opt-in only)
   - "Someone else is listening to Lover right now 🎵"
   - Triggered only when:
     - User has opt-in enabled
     - Someone posts exactly what they're doing
     - Max 3 per day (prevent spam)
   - Can be disabled

3. **Weekly Digest** (Sunday mornings)
   - "Your week of uniqueness"
   - Summary of posts, uniqueness score, interesting moments
   - Can be disabled

4. **Milestone Notifications** (Rare)
   - "You've posted for 7 days straight ✨"
   - "You're in the top 5% most unique this month"
   - Max once per week

### Implementation:

```javascript
// Notification orchestrator
class NotificationOrchestrator {
  
  async shouldSendNotification(userId, type, context) {
    // Get user preferences
    const user = await getUser(userId);
    const prefs = user.preferences;
    
    // Check global notification level
    if (prefs.notificationLevel === "none") {
      return false;
    }
    
    // Check notification frequency (prevent spam)
    const recentNotifs = await this.getRecentNotifications(userId, "24h");
    
    if (type === "match") {
      // Max 3 match notifications per day
      const matchNotifs = recentNotifs.filter(n => n.type === "match");
      if (matchNotifs.length >= 3) {
        return false;
      }
    }
    
    // Check quiet hours (11 PM - 8 AM local time)
    const localHour = this.getUserLocalHour(user.timezone);
    if (localHour >= 23 || localHour < 8) {
      return false;
    }
    
    return true;
  }
  
  async sendMatchNotification(userId, post) {
    const shouldSend = await this.shouldSendNotification(userId, "match", { post });
    
    if (!shouldSend) {
      return;
    }
    
    // Send via Firebase Cloud Messaging or similar
    await fcm.send(userId, {
      title: "Someone's doing the same thing 🎵",
      body: `Another person just posted: "${post.content.substring(0, 50)}..."`,
      data: {
        type: "match",
        postId: post.id,
        action: "view_post"
      },
      priority: "normal", // Not urgent
    });
    
    // Log notification for rate limiting
    await this.logNotification(userId, "match", post.id);
  }
}
```

### Notification Settings (User Control):

```javascript
// User can control exactly what they want
const notificationSettings = {
  dailyPrompt: {
    enabled: true,
    time: "20:00", // 8 PM
  },
  matches: {
    enabled: false, // Opt-in
    maxPerDay: 3,
  },
  weeklyDigest: {
    enabled: true,
    day: "sunday",
    time: "09:00",
  },
  milestones: {
    enabled: true,
  },
  quietHours: {
    enabled: true,
    start: "23:00",
    end: "08:00",
  }
};
```

---

## 📈 Scaling Considerations

### Small Scale (0-10k users)

**Architecture:**
- Single Firebase/Supabase instance
- Simple matching with similarity hashing
- No activity tracking (privacy-first)
- Trending data cached hourly

**Cost:** ~$10-15/mo

**Bottlenecks:** None

---

### Medium Scale (10k-100k users)

**Architecture:**
- Add Redis cache for hot data (trending, recent posts)
- Introduce background workers for matching
- Optional: Activity tracking for opt-in users
- Rate limiting on notifications

**Infrastructure:**
```
Frontend (Vercel/Cloudflare) → API Gateway (Firebase Functions)
                                      ↓
                                Load Balancer
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
              Post Processor    Match Engine    Notification Worker
                    ↓                 ↓                 ↓
              Firebase/Supabase  +  Redis Cache  +  FCM/Push
```

**Cost:** ~$100-200/mo

**Optimizations:**
- Batch processing for non-urgent tasks
- Caching trending data
- Database indexing on hash fields
- CDN for static content

---

### Large Scale (100k-1M+ users)

**Architecture:**
- Multi-region deployment
- Message queue (RabbitMQ/SQS) for async processing
- Separate microservices:
  - Post ingestion service
  - Matching service
  - Notification service
  - Trending aggregation service
- Elasticsearch for advanced post search
- Separate read/write databases

**Infrastructure:**
```
                     Global CDN (Cloudflare)
                              ↓
                    API Gateway (Kong/NGINX)
                              ↓
                    Message Queue (RabbitMQ)
                              ↓
        ┌──────────────┬──────────────┬──────────────┬──────────────┐
        ↓              ↓              ↓              ↓              ↓
   Ingest Service  Match Service  Notify Service  Trend Service  Search Service
        ↓              ↓              ↓              ↓              ↓
   PostgreSQL      Redis Cache    FCM/Push      External APIs  Elasticsearch
```

**Cost:** ~$1,000-3,000/mo (but revenue should be $10k+/mo at this scale)

**Optimizations:**
- Read replicas for database
- Sharding by geographic region
- Advanced caching strategies
- ML-based matching (upgrade from hashing)
- Predictive notification timing

---

## 🔌 API Integrations

### Required for MVP:

#### 1. Google Trends API
**Purpose:** Detect what's trending globally

**Implementation:**
```javascript
import googleTrends from 'google-trends-api';

async function fetchTrends(category = "all") {
  const trends = await googleTrends.dailyTrends({
    trendDate: new Date(),
    geo: 'US', // Can expand to other countries
  });
  
  // Parse and cache
  const parsed = JSON.parse(trends);
  await cacheTrends('google', parsed, 3600); // Cache 1 hour
  
  return parsed;
}

// Run every hour
setInterval(fetchTrends, 3600000);
```

**Cost:** Free (with rate limits)

---

#### 2. Spotify Web API
**Purpose:** Detect trending songs

**Implementation:**
```javascript
import SpotifyWebApi from 'spotify-web-api-node';

async function fetchSpotifyTrends() {
  const spotify = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });
  
  // Get access token
  const auth = await spotify.clientCredentialsGrant();
  spotify.setAccessToken(auth.body['access_token']);
  
  // Get global top 50
  const playlist = await spotify.getPlaylist('37i9dQZEVXbMDoHDwVN2tF'); // Global Top 50
  
  const trends = playlist.body.tracks.items.map((item, index) => ({
    name: `${item.track.name} - ${item.track.artists[0].name}`,
    category: 'music',
    volume: 1000000, // Estimate
    rank: index + 1,
  }));
  
  await cacheTrends('spotify', trends, 3600);
  return trends;
}

// Run every hour
setInterval(fetchSpotifyTrends, 3600000);
```

**Cost:** Free (with rate limits)

---

#### 3. Twitter/X API (Optional for MVP, important for cultural relevance)
**Purpose:** Real-time trending topics

**Note:** Twitter API v2 is now paid ($100/mo for basic). Consider alternatives:
- Scrape trends (against TOS, risky)
- Use Reddit instead (free API)
- Wait until revenue justifies cost

---

### Optional Integrations (Post-MVP):

#### 4. Spotify SDK (For opt-in users)
**Purpose:** Detect what user is currently listening to

```javascript
// User connects Spotify account
async function connectSpotify(userId, authCode) {
  const tokens = await spotify.authorizationCodeGrant(authCode);
  
  // Store tokens (encrypted)
  await db.collection('users').doc(userId).update({
    'connectedServices.spotify': {
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      lastSync: Date.now(),
    }
  });
}

// Poll user's currently playing (every 30 seconds)
async function syncSpotifyActivity(userId) {
  const user = await getUser(userId);
  
  if (!user.connectedServices?.spotify) {
    return;
  }
  
  // Get currently playing
  const playing = await spotify.getMyCurrentPlayingTrack();
  
  if (playing.body.is_playing) {
    // Update activity stream
    await db.collection('activityStreams').doc(userId).set({
      userId,
      timestamp: Date.now(),
      currentActivity: {
        type: 'listening',
        item: `${playing.body.item.name} - ${playing.body.item.artists[0].name}`,
        source: 'spotify',
        hash: createSimilarityHash(`listening ${playing.body.item.name} ${playing.body.item.artists[0].name}`),
      },
      expiresAt: Date.now() + 86400000, // 24 hours
    }, { merge: true });
  }
}
```

**Cost:** Free

---

## 💰 Cost Analysis

### Infrastructure Costs at Different Scales:

| Users | Storage | Compute | APIs | Notifications | Total/mo |
|-------|---------|---------|------|---------------|----------|
| 1k    | $2      | $5      | $0   | $3            | $10      |
| 10k   | $10     | $30     | $10  | $20           | $70      |
| 50k   | $30     | $100    | $30  | $100          | $260     |
| 100k  | $50     | $200    | $50  | $200          | $500     |
| 500k  | $150    | $800    | $150 | $800          | $1,900   |
| 1M    | $300    | $1,500  | $200 | $1,500        | $3,500   |

### Revenue Break-Even Points:

**Assuming:**
- 100k users
- 2% premium conversion ($4.99/mo)
- $10 RPM ads for remaining 98k users
- 50% DAU (50k daily active)

**Revenue:**
- Premium: 2,000 users × $4.99 = $9,980/mo
- Ads: 50k DAU × 30 days × 5 pageviews × $10 CPM = $7,500/mo
- **Total: ~$17,500/mo**

**Costs:** $500/mo

**Profit:** $17,000/mo

**Break-even: ~3k users with 2% conversion**

---

## 🚀 Implementation Phases

### Phase 1: MVP (Weeks 1-3)
**Goal:** Prove the concept works

**Features:**
- ✅ Basic posting
- ✅ Similarity hashing for matching
- ✅ Trending data integration (Google Trends + Spotify)
- ✅ "You're the only one" / "X others did this" responses
- ✅ Anonymous feed
- ✅ Share cards

**Infrastructure:**
- Firebase/Supabase (single instance)
- No activity tracking
- No notifications yet
- No user accounts (anonymous only)

**Cost:** $10-15/mo

---

### Phase 2: Retention Features (Weeks 4-6)
**Goal:** Get users to come back

**Features:**
- ✅ Optional user accounts
- ✅ Personal diary mode
- ✅ Daily notification (1 per day)
- ✅ Basic stats (streak, total posts)
- ✅ Weekly digest email

**Infrastructure:**
- Add email service (SendGrid)
- Add push notification service (FCM)
- Still no activity tracking

**Cost:** $20-30/mo

---

### Phase 3: Smart Matching (Weeks 7-10)
**Goal:** Connect people in real-time

**Features:**
- ✅ Opt-in Spotify integration
- ✅ Activity stream (24h TTL)
- ✅ Match notifications (max 3/day)
- ✅ "Kindred spirits" feature
- ✅ Privacy controls

**Infrastructure:**
- Add Redis for caching
- Background workers for matching
- Rate limiting

**Cost:** $50-100/mo (depends on opt-in rate)

---

### Phase 4: Scale & Monetize (Months 3-6)
**Goal:** Handle growth + make money

**Features:**
- ✅ Premium tier
- ✅ Advanced analytics
- ✅ Native mobile apps
- ✅ Browser extension
- ✅ Multiple trend sources
- ✅ ML-based matching

**Infrastructure:**
- Multi-region deployment
- Message queues
- Read replicas
- CDN optimization

**Cost:** Scales with revenue

---

## 🎯 Decision Framework: When to Notify

### The Algorithm:

```javascript
async function shouldConnectUsers(userA, userB, context) {
  
  // 1. Check if both users opted in
  if (!userA.preferences.allowMatching || !userB.preferences.allowMatching) {
    return false;
  }
  
  // 2. Check if they're doing the EXACT same thing
  const similarity = calculateSimilarity(userA.activity, userB.activity);
  if (similarity < 0.9) { // 90% match threshold
    return false;
  }
  
  // 3. Check notification rate limits
  const recentNotifs = await getRecentNotifications(userB.id, '24h');
  if (recentNotifs.filter(n => n.type === 'match').length >= 3) {
    return false; // Already got 3 match notifications today
  }
  
  // 4. Check time zones (don't notify at 3 AM)
  const localHour = getUserLocalHour(userB.timezone);
  if (localHour < 8 || localHour > 23) {
    return false;
  }
  
  // 5. Check if this match is actually interesting
  // (e.g., matching on "breathing" is not interesting)
  if (context.activity.commonality > 0.5) {
    return false; // More than 50% of users are doing this
  }
  
  // All checks passed
  return true;
}
```

---

## 🔐 Privacy Safeguards

### Data Minimization:
- Collect ONLY what's needed for matching
- Auto-delete activity streams after 24 hours
- Never sell user data
- Never share with third parties

### User Control:
- Clear opt-in for all tracking
- One-click disconnect from services
- Export all data anytime
- Delete account = delete all data immediately

### Transparency:
- Privacy dashboard showing:
  - What data we have
  - How long it's stored
  - Who can see it
  - How to delete it

### Compliance:
- GDPR compliant (EU users)
- CCPA compliant (California users)
- Regular security audits
- Encrypted data at rest and in transit

---

## 🎯 Summary: Your Question Answered

### Problem:
> "User A posts 'listening to Lover', User B is also listening but didn't post. How do we connect them without spamming everyone?"

### Solution:

**Tier 1 (MVP — No tracking):**
- We DON'T connect them
- User A gets: "You're the only one who posted about Lover"
- User B: No notification
- Privacy: 100%, Cost: Low, Connections: Limited

**Tier 2 (Post-MVP — Opt-in tracking):**
- User B opts in to Spotify integration
- We see they're listening to Lover (stored for 24h max)
- When User A posts about Lover, we:
  1. Query activity streams for hash = "music:taylorswift:lover"
  2. Find User B (and maybe 3-4 others)
  3. Check notification preferences + rate limits
  4. Send notification ONLY to those 3-4 matched users
- Privacy: High (opt-in only), Cost: Medium, Connections: High

**Tier 3 (Premium — Real-time matching):**
- Premium users get real-time match notifications
- Free users get weekly digest of matches
- Prevents spam while maximizing connections

### Key Principles:

1. ✅ **Opt-in only** — No tracking by default
2. ✅ **Rate limited** — Max 3 match notifications per day
3. ✅ **Targeted** — Only notify people doing the EXACT same thing
4. ✅ **Time-aware** — No notifications during sleep hours
5. ✅ **Privacy-first** — Data deleted after 24h
6. ✅ **User-controlled** — Can disable anytime

---

## 🚀 Next Steps

1. **Start with Phase 1** (no tracking, no notifications)
   - Proves the concept works
   - Zero privacy concerns
   - Cheap to run

2. **Gather feedback** from first 1k users
   - Do they WANT to be connected in real-time?
   - Would they opt in to activity tracking?
   - What notification frequency feels right?

3. **Build Tier 2** based on demand
   - If users request it → build it
   - If not → keep it simple

4. **Scale thoughtfully**
   - Don't over-engineer early
   - Add complexity only when needed
   - Always put privacy first

---

*The goal isn't to connect everyone — it's to connect the RIGHT people at the RIGHT time without being creepy or annoying.*

*That's how you scale a social app responsibly.*

---

**Document created:** October 2025  
**Last updated:** October 2025

