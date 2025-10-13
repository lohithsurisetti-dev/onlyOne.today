# 🎯 Hierarchical Scoring System v2.0

## **Overview**

Complete rewrite of the commonality scoring system for better performance, accuracy, and user engagement.

---

## **🚨 Problems with Old System**

### **1. Duplicate Scores**
```
"played cricket" - 100% · 1 (Macomb scope)
"played cricket" - 70% · 4 (World scope)
```
❌ Same content, different scores = confusion!

### **2. Scope Isolation**
- City posts only compared with city posts
- World posts compared with everything
- Result: City posts stayed 100% forever

### **3. Complex Hierarchy Logic**
- 45 database queries per post creation
- Hierarchy protection prevented updates
- Performance: 75 queries/second at scale = 💥

### **4. Static Scores**
- Calculated once at post creation
- Never updated when viewing
- Old posts showed outdated scores

---

## **✅ New System: Hierarchical with Aggregate Table**

### **Architecture:**

```
┌─────────────────────────────────────────────┐
│          POSTS TABLE                        │
│  - content_hash (for matching)              │
│  - uniqueness_score (global only)           │
│  - match_count (global only)                │
│  - location_city/state/country              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    CONTENT_MATCH_COUNTS TABLE (NEW!)        │
│  - content_hash (PRIMARY KEY)               │
│  - world_count (total matches)              │
│  - location_counts (JSONB)                  │
│    {                                        │
│      "cities": {"Macomb": 2, "Tokyo": 5},   │
│      "states": {"Illinois": 3, "NY": 7},    │
│      "countries": {"USA": 10, "Japan": 15}  │
│    }                                        │
└─────────────────────────────────────────────┘
```

---

## **⚡ Performance Improvements**

### **Before:**
```
1 post → 45 queries
100 posts/min → 4,500 queries/min
= 75 queries/second ❌
```

### **After:**
```
1 post → 3 queries
100 posts/min → 300 queries/min  
= 5 queries/second ✅

15x faster! 🚀
```

### **Query Breakdown:**

**On Post Creation:**
1. `INSERT` into posts table (1 query)
2. `RPC increment_content_counts` - atomic increment (1 query)
3. Batch update matching posts (1 query)

**On Display:**
1. `RPC get_location_counts` - O(1) lookup (1 query)

---

## **🎨 User Experience**

### **Smart Display Logic:**

The system calculates scores for ALL 4 levels:
- 🏙️ **City** (Macomb) - easiest to win
- 🗺️ **State** (Illinois) - medium challenge
- 🌍 **Country** (USA) - harder
- 🌐 **World** (Global) - ultimate achievement

### **Display Strategy: "Show Your Best Win"**

```typescript
if (city_score >= 70%) {
  primary: "100% unique in Macomb! 🏙️"
  secondary: "1 of 3 in Illinois 🗺️"
}
else if (state_score >= 70%) {
  primary: "90% unique in Illinois! 🗺️"
  secondary: "1 of 12 in USA 🌍"
}
else if (country_score >= 70%) {
  primary: "80% unique in USA! 🌍"
  secondary: "1 of 247 globally 🌐"
}
else if (world_score >= 70%) {
  primary: "100% unique globally! 🌐"
  secondary: "Only you in the world!"
}
else {
  primary: "Join 12 in Macomb 🏙️"
  secondary: "5,247 globally today 🌐"
}
```

---

## **📱 Visual Examples**

### **Scenario 1: Unique in City**
```
┌─────────────────────────────────────┐
│ played cricket                      │
│                                     │
│ 🏙️ 100% · Only you in Macomb!     │ ← Win!
│ 🗺️ 60% · 1 of 4 in Illinois       │ ← Context
│                                     │
│ just now                            │
└─────────────────────────────────────┘
```

### **Scenario 2: Only Unique Globally**
```
┌─────────────────────────────────────┐
│ quantum physics today               │
│                                     │
│ 🌐 100% · Only you in the world!   │ ← Ultimate win!
│ 🏙️ Also first in Macomb           │ ← Bonus
└─────────────────────────────────────┘
```

### **Scenario 3: Common Everywhere**
```
┌─────────────────────────────────────┐
│ ate breakfast                       │
│                                     │
│ 🏙️ Join 12 in Macomb               │ ← Community
│ 🌐 5,247 globally today (trending!)│ ← Scale
└─────────────────────────────────────┘
```

---

## **🔧 Technical Implementation**

### **Database Functions:**

#### **1. `increment_content_counts()`**
Atomically increments counts at all location levels:
```sql
INSERT INTO content_match_counts VALUES (...)
ON CONFLICT DO UPDATE SET
  world_count = world_count + 1,
  location_counts = jsonb_set(...) -- increment city
  location_counts = jsonb_set(...) -- increment state
  location_counts = jsonb_set(...) -- increment country
```

#### **2. `get_location_counts()`**
Fast O(1) lookup of all counts:
```sql
SELECT 
  world_count,
  location_counts->'cities'->'Macomb' as city_count,
  location_counts->'states'->'Illinois' as state_count,
  location_counts->'countries'->'USA' as country_count
FROM content_match_counts
WHERE content_hash = $1
```

### **Service Functions:**

#### **1. `createPost()`**
Simplified to 3 queries:
```typescript
// 1. Find global matches
const matches = await findSimilarPostsGlobal({ contentHash, content })

// 2. Insert post
await db.posts.insert({ content, global_score })

// 3. Increment aggregate counts
await db.rpc('increment_content_counts', { hash, city, state, country })
```

#### **2. `getHierarchicalScores()`**
Calculate display scores on-the-fly:
```typescript
// Get counts for all levels (1 query)
const counts = await getLocationCounts(hash, location)

// Calculate scores
const cityScore = calculateScore(counts.city_count)
const stateScore = calculateScore(counts.state_count)
const countryScore = calculateScore(counts.country_count)
const worldScore = calculateScore(counts.world_count)

// Return best achievement
return getBestScore({ city, state, country, world })
```

---

## **✅ Benefits**

### **1. Performance**
- **15x faster** post creation
- **O(1) lookups** for display
- **Scales to 1000+ posts/min**

### **2. Accuracy**
- **No duplicate scores** - same content always matches
- **Global matching** - no scope isolation
- **Real counts** - accurate across all levels

### **3. User Engagement**
- **Always feel special** - show best achievement
- **Progressive challenge** - city → state → country → world
- **Clear context** - primary + secondary scores
- **Honest metrics** - all scores are true

### **4. Simplicity**
- **Single global score** stored in posts table
- **One aggregate table** for all location counts
- **No complex hierarchy logic**
- **Easier to understand and maintain**

---

## **🎮 Gamification Opportunities**

### **Achievements:**
- 🏙️ "City Champion" - 100% unique in city 10 times
- 🗺️ "State Legend" - 100% unique in state 5 times
- 🌍 "Country Pioneer" - 100% unique in country 3 times
- 🌐 "World First" - 100% unique globally!

### **Leaderboards:**
- "Most unique in your city this week"
- "Most globally unique posts"
- "Your city vs other cities"

### **Badges:**
- Progressive unlock: City → State → Country → World
- Multiple achievement tracks
- Visible on profile

---

## **📊 Migration Strategy**

### **Step 1: Deploy Schema**
```bash
# Run in Supabase SQL editor
psql < supabase/aggregate-counts-schema.sql
```

### **Step 2: Backfill Existing Data**
```sql
-- Populate aggregate table from existing posts
INSERT INTO content_match_counts (content_hash, world_count, location_counts)
SELECT 
  content_hash,
  COUNT(*) as world_count,
  jsonb_build_object(
    'cities', (SELECT jsonb_object_agg(location_city, count) ...),
    'states', (SELECT jsonb_object_agg(location_state, count) ...),
    'countries', (SELECT jsonb_object_agg(location_country, count) ...)
  )
FROM posts
GROUP BY content_hash;
```

### **Step 3: Deploy New Code**
- Service functions already updated
- Frontend will use new `getHierarchicalScores()` function

### **Step 4: Verify**
- Test post creation
- Check aggregate counts
- Verify display scores

---

## **🚀 Result**

**Before:** Confusing, slow, inaccurate
**After:** Clear, fast, engaging

Users always see their **best achievement** while understanding the full context. Performance is 15x better. Code is simpler. Everybody wins! 🎯

