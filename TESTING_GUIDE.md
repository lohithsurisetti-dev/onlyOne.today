# Testing Guide for OnlyOne.today Backend

## 🚀 Quick Start

### Step 1: Set Up Supabase (Required!)

Before testing, you **must** set up Supabase:

1. **Create Supabase Project**: Go to https://app.supabase.com and create a new project
2. **Run Schema**: Copy `supabase/schema.sql` and run in SQL Editor
3. **Get API Keys**: Settings → API → Copy URL and anon key
4. **Create `.env.local`**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. **Restart dev server**: `npm run dev`

### Step 2: Test with curl

Once Supabase is set up, run these tests:

---

## 📝 Manual curl Tests

### Test 1: Create Your First Post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Listened to Taylor Swift Lover",
    "inputType": "action",
    "scope": "world",
    "locationCountry": "USA"
  }'
```

**Expected Response:**
```json
{
  "post": {
    "id": "uuid-here",
    "content": "Listened to Taylor Swift Lover",
    "uniqueness_score": 100,
    "match_count": 0,
    ...
  },
  "similarPosts": [],
  "matchCount": 0,
  "uniquenessScore": 100
}
```

✅ **First post is always 100% unique!**

---

### Test 2: Create a Similar Post (Test Matching)

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Listened to Taylor Swift Lover",
    "inputType": "action",
    "scope": "world",
    "locationCountry": "USA"
  }'
```

**Expected Response:**
```json
{
  "post": { ... },
  "similarPosts": [
    { "content": "Listened to Taylor Swift Lover", ... }
  ],
  "matchCount": 1,
  "uniquenessScore": 90
}
```

✅ **Matching works! Score decreased to 90.**

---

### Test 3: Create a Unique Post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Wrote a handwritten letter to my grandma",
    "inputType": "action",
    "scope": "world"
  }'
```

**Expected:** `uniquenessScore: 100` (no matches)

---

### Test 4: Get All Posts

```bash
curl http://localhost:3000/api/posts?filter=all&limit=10
```

**Expected Response:**
```json
{
  "posts": [
    {
      "id": "...",
      "content": "...",
      "uniqueness_score": 90,
      "match_count": 1,
      "created_at": "2024-01-01T12:00:00Z",
      ...
    },
    ...
  ]
}
```

---

### Test 5: Get Only Unique Posts

```bash
curl http://localhost:3000/api/posts?filter=unique&limit=10
```

**Expected:** Only posts with `uniqueness_score >= 70`

---

### Test 6: Get Only Common Posts

```bash
curl http://localhost:3000/api/posts?filter=common&limit=10
```

**Expected:** Only posts with `uniqueness_score < 70`

---

### Test 7: Test Different Scopes

**City scope:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Had pizza for lunch",
    "inputType": "action",
    "scope": "city",
    "locationCity": "New York",
    "locationState": "NY",
    "locationCountry": "USA"
  }'
```

**State scope:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Went for a run",
    "inputType": "action",
    "scope": "state",
    "locationState": "California",
    "locationCountry": "USA"
  }'
```

**Country scope:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Watched the sunset",
    "inputType": "action",
    "scope": "country",
    "locationCountry": "USA"
  }'
```

---

### Test 8: Test Validation (Should Fail)

**Empty content:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "",
    "inputType": "action",
    "scope": "world"
  }'
```

**Expected:** `{"error": "Content must be between 3 and 500 characters"}`

---

**Invalid input type:**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test post",
    "inputType": "invalid",
    "scope": "world"
  }'
```

**Expected:** `{"error": "Invalid input type"}`

---

## 🧪 Automated Test Script

If you have `jq` installed, run the full test suite:

```bash
./test-api.sh
```

This will:
- Create multiple posts
- Test similarity matching
- Test uniqueness scoring
- Test filtering
- Test all scopes
- Test validation

---

## 🌐 Testing in Browser

### 1. Test Home Page Submission

1. Go to http://localhost:3000
2. Type: "Listened to Taylor Swift"
3. Select: Action, World
4. Click "Discover"
5. ✅ Should see uniqueness score (100 for first post)

### 2. Test Matching

1. Submit the same post again
2. ✅ Score should decrease (90)
3. Submit 3-4 more times
4. ✅ Score should keep decreasing

### 3. Test Feed

1. Go to http://localhost:3000/feed
2. ✅ Should see posts from database
3. Click filters (All/Unique/Common)
4. ✅ Should filter correctly

### 4. Test Share Cards

1. After submitting a post
2. Click "Share"
3. ✅ Should see preview
4. Click "Download Image"
5. ✅ Should download PNG

---

## 📊 Verify in Supabase

### Check Posts Table

1. Go to Supabase → Table Editor
2. Select `posts` table
3. ✅ Should see all created posts
4. Check:
   - `content` matches what you submitted
   - `content_hash` is generated (e.g., "listened:taylor:swift:lover")
   - `uniqueness_score` is calculated correctly
   - `match_count` shows number of similar posts

### Check Post Matches Table

1. Select `post_matches` table
2. ✅ Should see links between similar posts
3. Each row connects two posts with same content

---

## 🔍 Debugging

### API not responding

1. **Check dev server is running:**
   ```bash
   ps aux | grep "next dev"
   ```

2. **Restart server:**
   ```bash
   npm run dev
   ```

3. **Check logs:**
   Look at terminal for errors

### Database connection issues

1. **Verify .env.local:**
   ```bash
   cat .env.local | grep SUPABASE
   ```

2. **Test Supabase connection:**
   Go to Supabase dashboard → check if project is active

3. **Check API keys:**
   Settings → API → verify keys match `.env.local`

### Posts not matching

1. **Check content_hash generation:**
   - In Supabase, look at `content_hash` column
   - Should be lowercase, colon-separated

2. **Check scope filtering:**
   - Posts only match within same scope
   - "world" matches all worldwide
   - "city" only matches same city

3. **Check 24-hour window:**
   - Only posts from last 24 hours are matched
   - Older posts won't show as matches

---

## ✅ Success Checklist

Your backend is working correctly when:

- [x] Creating a post returns `uniquenessScore: 100` (first time)
- [x] Creating the same post again returns lower score (90)
- [x] GET /api/posts returns posts from database
- [x] Filtering works (unique/common)
- [x] Different scopes work correctly
- [x] Validation rejects invalid input
- [x] Supabase shows posts in Table Editor
- [x] Browser UI creates posts successfully
- [x] Feed displays posts from database
- [x] Response screens show real scores

---

## 🎯 Example Test Flow

```bash
# 1. Create first post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content": "Test action", "inputType": "action", "scope": "world"}'

# Response: uniquenessScore: 100 ✅

# 2. Create same post again
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content": "Test action", "inputType": "action", "scope": "world"}'

# Response: uniquenessScore: 90, matchCount: 1 ✅

# 3. Get all posts
curl http://localhost:3000/api/posts?filter=all

# Response: { posts: [ ...2 posts... ] } ✅

# 4. Check Supabase
# Go to Table Editor → posts table
# Should see 2 rows with same content_hash ✅
```

---

## 🆘 Common Issues

### Issue: "Cannot find module '@supabase/ssr'"
**Fix:** Run `npm install`

### Issue: "NEXT_PUBLIC_SUPABASE_URL is not defined"
**Fix:** Create `.env.local` with Supabase credentials

### Issue: "Failed to create post"
**Fix:** 
1. Check Supabase schema is created
2. Verify API keys in `.env.local`
3. Check browser/terminal logs for errors

### Issue: "uniquenessScore always 100"
**Fix:** This is normal! First post is always unique. Create the same post multiple times to see matching work.

### Issue: "Posts not appearing in feed"
**Fix:**
1. Check database has posts (Supabase Table Editor)
2. Hard refresh browser (Cmd+Shift+R)
3. Check API endpoint: `curl http://localhost:3000/api/posts`

---

## 📈 Performance Testing

### Load Test (Optional)

Create 100 posts quickly:

```bash
for i in {1..100}; do
  curl -s -X POST http://localhost:3000/api/posts \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"Test post $i\", \"inputType\": \"action\", \"scope\": \"world\"}" \
    > /dev/null &
done

wait
echo "Created 100 posts!"
```

Then check:
- Supabase dashboard: 100 posts created ✅
- Feed performance: Still smooth ✅
- Matching still works ✅

---

## 🎊 Ready for Production?

Once all tests pass:

1. ✅ Follow `DEPLOYMENT_GUIDE.md`
2. ✅ Deploy to Vercel
3. ✅ Add production Supabase credentials
4. ✅ Test live site
5. ✅ Share with the world! 🚀

---

**Happy Testing! 🧪**

