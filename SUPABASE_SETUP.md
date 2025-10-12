# Supabase Setup Guide for OnlyOne.today

This guide will help you set up Supabase for the OnlyOne.today backend.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## 🚀 Quick Setup

### Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Enter project details:
   - **Name**: OnlyOne.today
   - **Database Password**: (create a strong password and save it)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### Step 2: Run the Database Schema

1. In your Supabase project, go to the **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click "Run" (bottom right)
6. ✅ You should see "Success. No rows returned"

This creates:
- ✅ `posts` table (main content storage)
- ✅ `post_matches` table (similarity tracking)
- ✅ `trending_context` table (cached trending data)
- ✅ `daily_analytics` table (aggregate metrics)
- ✅ Functions for matching and scoring
- ✅ Indexes for performance
- ✅ Row Level Security policies

### Step 3: Get Your API Keys

1. In Supabase, go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ Keep secret!)

### Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
cp .env.local.example .env.local
```

2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **⚠️ IMPORTANT**: Never commit `.env.local` to git!

### Step 5: Test the Connection

Restart your development server:

```bash
npm run dev
```

The app should now connect to Supabase! 🎉

## 📊 Database Schema Overview

### **posts** table
Stores all user posts with:
- Content, input type (action/day), scope (city/state/country/world)
- Location data (city, state, country)
- Content hash for similarity matching
- Uniqueness score (0-100)
- Match count (how many similar posts)
- Timestamps and metadata

### **post_matches** table
Tracks which posts are similar:
- Links two post IDs
- Similarity score (0.0 to 1.0)
- Prevents duplicate matches

### **trending_context** table
Caches trending data from external APIs:
- Source (Spotify, Twitter, Google Trends)
- Category, title, description
- Expiration timestamp for cache invalidation

### **daily_analytics** table
Daily aggregate metrics:
- Total posts, unique/common breakdown
- Posts by scope and type
- Top content hashes (trending activities)

## 🔐 Row Level Security (RLS)

The database is configured with these security policies:

1. ✅ **Anyone can read posts** (public feed)
2. ✅ **Anyone can create posts** (anonymous posting)
3. ✅ **Users can only update their own posts** (if authenticated)

This ensures privacy and security while maintaining the anonymous nature of the app.

## 🚦 API Endpoints

Once Supabase is set up, these endpoints will work:

### **POST /api/posts**
Create a new post and find similar posts.

**Request:**
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

**Response:**
```json
{
  "post": { ... },
  "similarPosts": [ ... ],
  "matchCount": 7,
  "uniquenessScore": 30
}
```

### **GET /api/posts**
Get recent posts for the feed.

**Query params:**
- `filter`: `all` | `unique` | `common`
- `limit`: number (default: 25)
- `offset`: number (default: 0)

## 📈 Performance Optimizations

The schema includes several optimizations:

1. **Indexes** on frequently queried columns:
   - `content_hash`, `scope`, `created_at`
   - `uniqueness_score`, `match_count`
   - Location fields

2. **GIN index** for full-text search on content

3. **pg_trgm extension** for fuzzy text matching

4. **Views** for common queries:
   - `recent_unique_posts`
   - `daily_post_stats`

5. **Functions** for complex operations:
   - `generate_content_hash()`
   - `find_similar_posts()`
   - `calculate_uniqueness_score()`

## 🧪 Testing with Sample Data

The schema includes 5 sample posts for testing. You can view them in the Supabase **Table Editor**:

1. Go to **Table Editor**
2. Select the `posts` table
3. You should see sample posts with varying uniqueness scores

## 🔧 Troubleshooting

### "relation 'posts' does not exist"
- Make sure you ran the entire `schema.sql` file
- Check for errors in the SQL Editor

### "JWT expired" or auth errors
- Verify your API keys are correct in `.env.local`
- Check that `NEXT_PUBLIC_SUPABASE_URL` matches your project URL

### Slow queries
- Ensure indexes are created (run `schema.sql` again)
- Check query performance in Supabase **Logs** tab

### RLS policy errors
- Make sure RLS is enabled on the `posts` table
- Verify policies are created correctly

## 📚 Next Steps

Once Supabase is set up:

1. ✅ Test creating posts from the UI
2. ✅ Verify posts appear in the feed
3. ✅ Check similarity matching works
4. ✅ Monitor performance in Supabase dashboard
5. 🔜 Integrate trending data APIs
6. 🔜 Add user authentication (optional)
7. 🔜 Set up analytics tracking

## 🆘 Need Help?

- Supabase Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions
- Support: support@supabase.com

---

**⚡ Pro Tip**: Use the Supabase **API Docs** tab to see auto-generated API documentation for your database!

