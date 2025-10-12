# 🛡️ Rate Limiting & Traffic Management

## Overview

OnlyOne.today implements a **multi-layer rate limiting strategy** to prevent spam, handle traffic efficiently, and ensure fair usage for all users.

---

## 🔒 Rate Limit Tiers

### **1. Post Creation**
- **Limit:** 10 posts per hour per IP
- **Why:** Prevents spam while allowing normal usage (1 post every 6 minutes)
- **Response:** 429 status with retry-after header

### **2. Reactions**
- **Limit:** 30 reactions per 5 minutes per IP
- **Why:** Allows active engagement (6 reactions/minute) but prevents bot abuse
- **Response:** 429 status with retry-after header

### **3. Feed Reads**
- **Limit:** 100 requests per 5 minutes per IP
- **Why:** Generous limit for browsing (20 requests/minute)
- **Response:** 429 status with retry-after header

### **4. Share Card Generation**
- **Limit:** 20 shares per 10 minutes per IP
- **Why:** Prevents abuse of image generation (2 shares/minute)
- **Response:** 429 status with retry-after header

---

## 🎯 Implementation Layers

### **Layer 1: Server-Side (IP-based)**

**Location:** `/lib/utils/rate-limit.ts`

**How it works:**
- Uses in-memory Map to track requests per IP
- Automatically cleans up old entries every 5 minutes
- Extracts real IP from proxy headers (Vercel, Cloudflare)
- Returns standardized 429 responses with retry-after

**Key Functions:**
```typescript
rateLimit(ip, endpoint, config)
getIP(request)
createRateLimitResponse(result)
```

**Pros:**
- ✅ Fast (in-memory)
- ✅ No external dependencies
- ✅ Works for MVP

**Limitations:**
- ⚠️ Resets on server restart
- ⚠️ Doesn't work across multiple servers

**For Production Scale:**
Use Redis/Upstash for distributed rate limiting.

---

### **Layer 2: Client-Side Throttling**

**Location:** `/components/EnhancedInput.tsx`, `/app/feed/page.tsx`

**Post Submission:**
- Minimum 3 seconds between submissions
- Tracks last submit time in component state
- Shows friendly alert if user tries too fast

**Reactions:**
- Minimum 1 second cooldown per reaction button
- Prevents accidental double-clicks
- Silent throttling (no alert)

**Why Both?**
- Client-side: Better UX (instant feedback)
- Server-side: Security (can't be bypassed)

---

## 📊 Rate Limit Headers

Every API response includes:
```
X-RateLimit-Limit: 10           # Max requests allowed
X-RateLimit-Remaining: 7        # Requests remaining
X-RateLimit-Reset: 1234567890   # Unix timestamp when limit resets
Retry-After: 3600               # Seconds until retry
```

---

## 🚨 Error Handling

### **429 Too Many Requests**

**Server Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 3600
}
```

**Client Handling:**
- Post creation: Alert with retry time
- Reactions: Alert message
- Feed reads: Silent retry after delay

---

## 🔧 Configuration

### **Adjusting Limits**

Edit `/lib/utils/rate-limit.ts`:

```typescript
export const RateLimitPresets = {
  POST_CREATION: {
    limit: 10,              // ← Change this
    windowInSeconds: 3600,  // ← Or this
  },
  // ...
}
```

### **Per-Endpoint Customization**

```typescript
const rateLimitResult = rateLimit(
  ip, 
  'my-endpoint', 
  { limit: 5, windowInSeconds: 60 }  // Custom config
)
```

---

## 📈 Scaling Strategy

### **Current (MVP): In-Memory**
- ✅ Fast
- ✅ Simple
- ✅ No cost
- ⚠️ Single-server only

### **Scale (1k+ users): Upstash Redis**
- ✅ Distributed across all servers
- ✅ Persistent (survives restarts)
- ✅ Free tier: 10k requests/day
- ✅ Edge-compatible (Vercel)

**Migration Path:**
```typescript
// Replace in-memory Map with Upstash
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export async function rateLimit(ip: string, endpoint: string, config: RateLimitConfig) {
  const key = `ratelimit:${endpoint}:${ip}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, config.windowInSeconds)
  }
  
  return {
    success: count <= config.limit,
    // ...
  }
}
```

---

## 🧪 Testing Rate Limits

### **1. Test Post Creation Limit**

```bash
# Should succeed first 10 times, then fail
for i in {1..12}; do
  curl -X POST http://localhost:3000/api/posts \
    -H "Content-Type: application/json" \
    -d '{"content":"Test post '$i'","inputType":"action","scope":"world"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done
```

**Expected:**
- First 10: `201 Created`
- 11th & 12th: `429 Too Many Requests`

### **2. Test Reaction Limit**

```bash
# Should succeed first 30 times, then fail
for i in {1..35}; do
  curl -X POST http://localhost:3000/api/reactions \
    -H "Content-Type: application/json" \
    -d '{"postId":"test-id","reactionType":"funny"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 0.1
done
```

**Expected:**
- First 30: `200 OK`
- 31st+: `429 Too Many Requests`

### **3. Test Client-Side Throttling**

**Manual Test:**
1. Go to home page
2. Type content and click "Discover"
3. Immediately click "Discover" again within 3 seconds
4. Should see alert: "Please wait X more seconds..."

---

## 🎯 Best Practices

### **For Frontend:**
1. ✅ Always check for 429 status
2. ✅ Show user-friendly error messages
3. ✅ Implement client-side throttling first
4. ✅ Respect Retry-After headers

### **For Backend:**
1. ✅ Set appropriate limits per endpoint
2. ✅ Log rate limit violations (for abuse detection)
3. ✅ Return helpful error messages
4. ✅ Include rate limit headers in all responses

---

## 📝 Monitoring

### **What to Watch:**

1. **Rate Limit Violations**
   - Check logs for `⚠️ Rate limit exceeded`
   - High violation rate = potential attack or bugs

2. **Normal User Impact**
   - If real users hit limits, increase thresholds
   - Monitor feedback/complaints

3. **Abuse Patterns**
   - Same IP hitting limit repeatedly
   - Unusual request patterns
   - Consider IP blocking for persistent abusers

### **Future: Add Analytics**

Track in Supabase:
```sql
CREATE TABLE rate_limit_violations (
  ip TEXT,
  endpoint TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  attempts INT
);
```

---

## 🚀 Production Checklist

Before deploying:

- [ ] Test all rate limits locally
- [ ] Verify error messages are user-friendly
- [ ] Confirm client-side throttling works
- [ ] Add monitoring/logging
- [ ] Document limits in user-facing docs (if needed)
- [ ] Plan for Upstash migration path
- [ ] Set up alerts for high violation rates

---

## 💡 Why This Approach?

1. **No Auth Required:** IP-based works for anonymous users
2. **Progressive:** Start simple (in-memory), scale later (Redis)
3. **User-Friendly:** Client-side throttling prevents user frustration
4. **Secure:** Server-side enforcement prevents bypassing
5. **Cost-Effective:** Free for MVP, cheap to scale

---

## 🔮 Future Enhancements

### **Smart Rate Limiting**
- Increase limits for "good" IPs (low spam score)
- Decrease limits for suspicious IPs
- Track behavior patterns

### **Captcha for Suspicious Traffic**
- Only show CAPTCHA after rate limit violation
- Prevents legitimate users from seeing it

### **Premium Bypass**
- When you add accounts, premium users get higher limits
- Encourages upgrades

---

**Need help?** Check `/lib/utils/rate-limit.ts` for implementation details.

