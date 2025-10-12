# Backend Integration Summary

This document summarizes the complete backend integration for OnlyOne.today.

## ✅ What's Been Implemented

### 1. **Supabase Setup**
- ✅ Database schema with 4 tables (`posts`, `post_matches`, `trending_context`, `daily_analytics`)
- ✅ Indexes for performance (content_hash, scope, timestamps)
- ✅ Row Level Security (RLS) policies
- ✅ PostgreSQL functions for matching and scoring
- ✅ Views for common queries

### 2. **API Routes**
- ✅ `POST /api/posts` - Create new posts
- ✅ `GET /api/posts` - Fetch recent posts with filtering
- ✅ `GET /api/cron/trending` - Refresh trending data (cron job)

### 3. **Services Layer**
- ✅ `lib/services/posts.ts` - Post CRUD operations
  - `createPost()` - Creates post, finds similar posts, calculates uniqueness
  - `findSimilarPosts()` - Matches based on content hash and scope
  - `getRecentPosts()` - Fetches feed with filtering
  - `getTrendingContentHashes()` - Gets popular activities

- ✅ `lib/services/trending.ts` - Trending data management
  - `getTrendingContext()` - Gets cached trending data
  - `saveTrendingContext()` - Saves trending items to cache
  - `fetchSpotifyTrending()` - Fetches from Spotify API (ready to use)
  - `generateTrendingMessage()` - Creates witty messages
  - `refreshTrendingData()` - Refreshes all trending sources

### 4. **React Hooks**
- ✅ `useCreatePost()` - Hook to create posts with loading/error states
- ✅ `useRecentPosts()` - Hook to fetch posts with filtering
- ✅ `useRefreshPosts()` - Manual refresh hook

### 5. **Frontend Integration**
- ✅ **Home Page** (`app/page.tsx`)
  - Integrated `useCreatePost()` hook
  - Loading states during submission
  - Automatic routing based on uniqueness score
  - Stores result in sessionStorage

- ✅ **Response Pages** (`app/response/page.tsx` & `app/response/commonality/page.tsx`)
  - Loads real post data from sessionStorage
  - Displays actual uniqueness scores
  - Shows real match counts
  - Dynamic messaging based on actual data

- ✅ **Feed Page** (`app/feed/page.tsx`)
  - Integrated `useRecentPosts()` hook
  - Real-time data from database
  - Falls back to mock data if API not connected
  - Transforms API data to display format

### 6. **Type Safety**
- ✅ `lib/types/database.ts` - Complete TypeScript types for database
- ✅ Type-safe API responses
- ✅ Type-safe hooks

### 7. **Documentation**
- ✅ `SUPABASE_SETUP.md` - Complete Supabase setup guide
- ✅ `DEPLOYMENT_GUIDE.md` - Vercel deployment guide
- ✅ `BACKEND_INTEGRATION.md` - This document

---

## 🎯 How It Works

### User Submits a Post

```typescript
1. User types: "Listened to Taylor Swift"
   ↓
2. EnhancedInput → handleSubmit()
   ↓
3. useCreatePost() → POST /api/posts
   ↓
4. Backend processes:
   - Generate hash: "listened:taylor:swift"
   - Search database for similar posts
   - Calculate uniqueness: 100 - (matchCount * 10)
   - Save post to database
   - Create post_matches records
   ↓
5. Response:
   {
     post: {...},
     similarPosts: [...],
     matchCount: 7,
     uniquenessScore: 30
   }
   ↓
6. Frontend:
   - Stores result in sessionStorage
   - Routes to /response or /response/commonality
   - Displays actual scores and counts
```

### Feed Displays Posts

```typescript
1. FeedPage loads
   ↓
2. useRecentPosts('all', 100, 0)
   ↓
3. GET /api/posts?filter=all&limit=100&offset=0
   ↓
4. Backend queries database
   ↓
5. Returns posts with:
   - Content
   - Uniqueness scores
   - Match counts
   - Timestamps
   ↓
6. Frontend transforms and displays
```

---

## 🚀 What You Need to Do

### Step 1: Set Up Supabase (10 minutes)

1. **Create Supabase Project**
   - Go to https://app.supabase.com
   - Click "New Project"
   - Name: "OnlyOne.today"
   - Set database password
   - Choose region

2. **Run Database Schema**
   - Go to SQL Editor
   - Copy all contents from `supabase/schema.sql`
   - Run the query
   - ✅ All tables, indexes, functions created

3. **Get API Keys**
   - Go to Settings → API
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` key (keep secret!)

### Step 2: Configure Environment Variables (2 minutes)

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Test Locally (2 minutes)

```bash
# Restart dev server
npm run dev

# Test the flow:
1. Go to http://localhost:3000
2. Submit a post
3. Should see uniqueness score (will be 100 since database is empty)
4. Check Supabase Table Editor - post should be saved!
```

### Step 4: Deploy to Vercel (5 minutes)

Follow `DEPLOYMENT_GUIDE.md` to deploy to production.

---

## 📊 Database Schema Quick Reference

### **posts** table
```sql
- id (UUID, primary key)
- content (TEXT, user's post)
- input_type ('action' | 'day')
- scope ('city' | 'state' | 'country' | 'world')
- location_city, location_state, location_country
- content_hash (TEXT, for matching)
- uniqueness_score (INTEGER, 0-100)
- match_count (INTEGER)
- created_at, updated_at
- is_anonymous (BOOLEAN, default true)
```

### **post_matches** table
```sql
- id (UUID, primary key)
- post_id (UUID, references posts)
- matched_post_id (UUID, references posts)
- similarity_score (FLOAT, 0.0-1.0)
- created_at
```

### **trending_context** table
```sql
- id (UUID, primary key)
- source (TEXT, 'spotify', 'twitter', etc.)
- category (TEXT, 'music', 'news', etc.)
- title (TEXT)
- description (TEXT)
- rank (INTEGER)
- metadata (JSONB)
- expires_at (TIMESTAMPTZ, cache expiration)
```

---

## 🔄 API Endpoints

### POST /api/posts
**Create a new post**

Request:
```json
{
  "content": "Listened to Taylor Swift Lover",
  "inputType": "action",
  "scope": "world",
  "locationCity": "New York",
  "locationState": "NY",
  "locationCountry": "USA"
}
```

Response:
```json
{
  "post": {
    "id": "uuid",
    "content": "...",
    "uniqueness_score": 30,
    "match_count": 7,
    ...
  },
  "similarPosts": [...],
  "matchCount": 7,
  "uniquenessScore": 30
}
```

### GET /api/posts
**Get recent posts**

Query params:
- `filter`: `all` | `unique` | `common`
- `limit`: number (default 25)
- `offset`: number (default 0)

Response:
```json
{
  "posts": [
    {
      "id": "uuid",
      "content": "...",
      "uniqueness_score": 85,
      "match_count": 2,
      "created_at": "2024-01-01T12:00:00Z",
      ...
    },
    ...
  ]
}
```

---

## 🎨 Matching Algorithm

### Content Hashing
```typescript
// Example:
"Listened to Taylor Swift Lover"
  ↓ normalize (lowercase, remove special chars)
"listened to taylor swift lover"
  ↓ replace spaces with colons
"listened:to:taylor:swift:lover"
  ↓ truncate to 100 chars
"listened:to:taylor:swift:lover"
```

### Similarity Matching
1. **Exact Hash Match** (current implementation)
   - Posts with identical content_hash are considered similar
   - Fast, simple, reliable

2. **Future: Fuzzy Matching** (optional enhancement)
   - Use PostgreSQL's `pg_trgm` extension
   - Find similar posts even with slight variations
   - Example: "listened to Taylor Swift" ≈ "heard Taylor Swift song"

### Uniqueness Calculation
```typescript
uniquenessScore = Math.max(0, 100 - (matchCount * 10))

Examples:
- 0 matches = 100 (completely unique!)
- 3 matches = 70 (still unique)
- 7 matches = 30 (common)
- 10+ matches = 0 (very common)
```

---

## 🔐 Security

### Row Level Security (RLS)
All tables have RLS enabled:
- ✅ **Anyone can read posts** (public feed)
- ✅ **Anyone can create posts** (anonymous posting)
- ✅ **Users can only update their own posts** (if authenticated in future)

### API Security
- ✅ Public endpoints use `anon` key (safe for client-side)
- ✅ Admin operations use `service_role` key (server-side only)
- ✅ Input validation on all endpoints
- ✅ Content length limits (3-500 chars)

---

## 📈 Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_posts_content_hash ON posts(content_hash);
CREATE INDEX idx_posts_scope ON posts(scope);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_uniqueness_score ON posts(uniqueness_score DESC);
```

### Caching Strategy
- Trending data cached with expiration
- Feed queries use indexed columns
- Recent posts within 24 hours for matching

### Scaling Considerations
- **0-10k users**: Single Supabase instance
- **10k-100k users**: Enable read replicas
- **100k+ users**: Implement caching layer (Redis)

---

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- ✅ Check `.env.local` has correct URL and keys
- ✅ Restart dev server after adding env vars
- ✅ Verify Supabase project is active

### "No posts appearing in feed"
- ✅ Check database has data (Supabase Table Editor)
- ✅ Check browser console for errors
- ✅ Verify API endpoints returning data

### "Uniqueness score always 100"
- ✅ Normal for first post (no matches yet!)
- ✅ Create multiple similar posts to see matching
- ✅ Check `content_hash` generation is working

---

## 🎉 Success Indicators

You'll know the backend is working when:

1. ✅ Submitting a post shows actual uniqueness score
2. ✅ Feed displays posts from database
3. ✅ Similar posts get matched correctly
4. ✅ Scores change as more people post similar content
5. ✅ Response pages show real-time data

---

## 🔜 Future Enhancements (Optional)

### Phase 2 (Post-MVP)
- [ ] Add trending data from Spotify API
- [ ] Implement user authentication (optional)
- [ ] Add location detection
- [ ] Enable notifications for matches

### Phase 3 (Scale)
- [ ] Add caching layer (Redis)
- [ ] Implement analytics dashboard
- [ ] Add moderation tools
- [ ] Enable user profiles (optional)

---

## 📞 Need Help?

Refer to:
- `SUPABASE_SETUP.md` for database setup
- `DEPLOYMENT_GUIDE.md` for production deployment
- `DEVELOPMENT_GUIDE.md` for local development

---

**🎊 Congratulations!** Your backend is fully integrated and ready to scale!

