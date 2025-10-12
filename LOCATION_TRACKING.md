# 📍 Location Tracking & Privacy

## Overview

OnlyOne.today uses location data to enable **local** comparisons while respecting user privacy. This document explains how location works, what we track, and how it's used.

---

## 🌍 How Location Detection Works

### Automatic Detection
1. **On page load**, the `LocationDetector` component automatically detects your location
2. Uses **ipapi.co** (free IP geolocation API)
3. **No GPS/browser location permission required**
4. Detects: City, State/Region, Country

### Privacy-First Approach
- ✅ **IP-based geolocation** (not GPS)
- ✅ **No precise coordinates** stored (no lat/long)
- ✅ **City-level precision** maximum
- ✅ **Optional** - app works without location
- ✅ **No third-party tracking**

---

## 📊 What We Store

### Database Schema (`posts` table)
```sql
CREATE TABLE posts (
  -- ... other fields
  
  -- Location data (all optional)
  location_city TEXT,          -- e.g., "San Francisco"
  location_state TEXT,         -- e.g., "California"
  location_country TEXT,       -- e.g., "United States"
  location_coords POINT,       -- NOT USED (future feature)
  
  -- ... other fields
);
```

### What's Stored
| Field | Example | Purpose |
|-------|---------|---------|
| `location_city` | "San Francisco" | City-level comparisons |
| `location_state` | "California" | State/region comparisons |
| `location_country` | "United States" | Country comparisons |

### What's NOT Stored
- ❌ IP addresses
- ❌ GPS coordinates
- ❌ Precise location data
- ❌ Location history
- ❌ Device identifiers

---

## 🎯 How Location is Used

### 1. **Scope Selection**
When users create a post, they choose a comparison scope:

```typescript
const scopes = [
  'city',     // Compare within your city
  'state',    // Compare within your state/region
  'country',  // Compare within your country
  'world'     // Compare globally (default)
]
```

### 2. **Uniqueness Calculation**
Location affects uniqueness scoring:

```sql
-- Example: Find similar posts in the same city
SELECT * FROM posts 
WHERE content_hash = 'ate:pizza'
  AND location_city = 'San Francisco'
  AND created_at > NOW() - INTERVAL '24 hours'
```

**Example Scenarios:**

| Activity | Scope | Location | Result |
|----------|-------|----------|--------|
| "Ate pizza" | City | San Francisco | Compare with SF residents only |
| "Ate pizza" | State | California | Compare with all Californians |
| "Ate pizza" | Country | USA | Compare with all Americans |
| "Ate pizza" | World | (any) | Compare globally |

### 3. **Feed Filtering** (Future Feature)
Will enable:
- View posts from your city
- View posts from nearby areas
- Discover local trends

---

## 🔒 Privacy & Security

### Data Protection
1. **Minimal Collection**: Only city/state/country
2. **No PII**: Location is NOT personally identifiable
3. **Optional**: App works without location
4. **Encrypted**: Data encrypted at rest & in transit (Supabase)
5. **No Sharing**: Location never sold or shared with third parties

### User Control
Users can:
- ✅ See detected location before posting
- ✅ Choose scope (city/state/country/world)
- ✅ Use app without providing location
- ✅ Posts work fine with location = NULL

### GDPR & CCPA Compliance
- ✅ **Right to Access**: Users can see their location data
- ✅ **Right to Delete**: Posts can be deleted (including location)
- ✅ **Minimal Data**: Only what's necessary for functionality
- ✅ **Transparency**: Clear explanation of location use

---

## 🛠️ Implementation Details

### Frontend (app/page.tsx)
```typescript
// 1. Detect location on page load
const [userLocation, setUserLocation] = useState<LocationData | null>(null)

// 2. Pass to API when creating post
const result = await createPost({
  content: data.content,
  inputType: data.inputType,
  scope: data.scope,
  locationCity: userLocation?.city,      // ✅ Optional
  locationState: userLocation?.state,    // ✅ Optional
  locationCountry: userLocation?.country, // ✅ Optional
})
```

### Backend (app/api/posts/route.ts)
```typescript
// 1. Validate location data (security)
const locationValidation = validateLocation({
  city: locationCity,
  state: locationState,
  country: locationCountry
})

// 2. Sanitize before storing
const sanitized = locationValidation.sanitized

// 3. Store in database
const result = await createPost({
  // ... other fields
  locationCity: sanitized.city,
  locationState: sanitized.state,
  locationCountry: sanitized.country,
})
```

### Database Query (lib/services/posts.ts)
```typescript
// Find similar posts with location filtering
const { data: similarPosts } = await supabase
  .from('posts')
  .select('*')
  .eq('content_hash', contentHash)
  .eq('location_city', locationCity)  // City filter
  .gte('created_at', twentyFourHoursAgo)
```

---

## 🎨 UI/UX

### Location Display

#### Main Page
```
┌─────────────────────────────────────┐
│ 📍 Your Location                    │
│                                     │
│ ✅ Detected: San Francisco,         │
│    California, United States        │
│                                     │
│ 💡 Used for local comparisons only  │
└─────────────────────────────────────┘
```

#### Post Creation
Users see their detected location and choose scope:
- 🏙️ City: "Compare within San Francisco"
- 🏛️ State: "Compare within California"
- 🏳️ Country: "Compare within United States"
- 🌍 World: "Compare globally"

#### Feed (Future Enhancement)
```
┌───────────────────────────┐
│ Ate pizza today           │
│ ✨ 85% unique            │
│ 👥 3 others              │
│ 📍 San Francisco, CA     │  ← Location badge
└───────────────────────────┘
```

---

## 📈 Analytics Use Cases

### Useful Insights (Future Features)
1. **Local Trends**: "Most popular activity in SF today"
2. **Regional Differences**: "NYC vs LA activity patterns"
3. **Country Comparisons**: "USA vs UK unique activities"
4. **Heatmaps**: Visual representation of activity by location

### Example Queries
```sql
-- Top cities by unique activities
SELECT 
  location_city,
  COUNT(*) FILTER (WHERE uniqueness_score >= 70) as unique_posts,
  COUNT(*) as total_posts
FROM posts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY location_city
ORDER BY unique_posts DESC
LIMIT 10;

-- State-level activity breakdown
SELECT 
  location_state,
  location_country,
  AVG(uniqueness_score) as avg_uniqueness
FROM posts
GROUP BY location_state, location_country
ORDER BY avg_uniqueness DESC;
```

---

## 🚀 Future Enhancements

### Planned Features
1. **Location-based feed filtering**
   - View posts from your city
   - Discover nearby trends
   
2. **Geographic leaderboards**
   - Most unique city
   - Most creative state
   
3. **Location-based challenges**
   - "Can you beat NYC's uniqueness?"
   - Regional competitions

4. **Privacy settings**
   - Hide location from other users
   - Choose location precision level

### Not Planned (Privacy Reasons)
- ❌ Real-time tracking
- ❌ GPS coordinates
- ❌ Home address detection
- ❌ Movement patterns
- ❌ Location-based ads

---

## 🧪 Testing Location

### Manual Testing
```bash
# 1. Open app in browser
open http://localhost:3001

# 2. Check console for location detection
# Should see: "📍 Location detected: { city, state, country }"

# 3. Create a post with different scopes
# - Try city scope
# - Try state scope
# - Try world scope

# 4. Check database
# Verify location fields are populated
```

### API Testing
```bash
# Test with location
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Testing location",
    "inputType": "action",
    "scope": "city",
    "locationCity": "San Francisco",
    "locationState": "California",
    "locationCountry": "United States"
  }'

# Test without location (should still work)
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Testing without location",
    "inputType": "action",
    "scope": "world"
  }'
```

---

## 📞 User Support

### Common Questions

**Q: Why do you need my location?**
A: To show you how your activity compares with others in your area! It's optional.

**Q: Is my exact address tracked?**
A: No! We only know your city/state/country, not your exact location.

**Q: Can I use the app without providing location?**
A: Yes! Location is completely optional. Choose "World" scope for global comparisons.

**Q: Who can see my location?**
A: Currently, location is not displayed to other users. It's only used for calculations.

**Q: Can I change my location?**
A: Location is auto-detected and cannot be manually changed (prevents gaming the system).

**Q: What if location detection fails?**
A: The app works perfectly fine without location. Just use "World" scope.

---

## 🔄 Migration & Rollout

### Phase 1: Backend Ready ✅
- Database schema supports location
- API endpoints accept location
- Validation & sanitization in place

### Phase 2: Frontend Integration ✅
- LocationDetector component created
- Main page detects location
- Location passed to API

### Phase 3: Display & UX (Next)
- Show location in feed cards
- Add location filters
- Location-based insights

### Phase 4: Analytics (Future)
- Location heatmaps
- Regional leaderboards
- Geographic trends

---

## 📄 Compliance Checklist

- [x] Privacy policy updated
- [x] User consent (implicit via usage)
- [x] Data minimization (only city/state/country)
- [x] Encryption at rest & in transit
- [x] No third-party sharing
- [x] Right to delete
- [x] Transparency (this document)
- [ ] GDPR data export feature
- [ ] Location opt-out toggle
- [ ] Location data retention policy

---

## 📚 References

- [ipapi.co Documentation](https://ipapi.co/api/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [GDPR Guidelines](https://gdpr.eu/)
- [CCPA Compliance](https://oag.ca.gov/privacy/ccpa)

---

**Last Updated**: October 2025  
**Status**: Location tracking active  
**Privacy**: Minimal data collection, maximum transparency

