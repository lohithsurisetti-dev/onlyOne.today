# Content Moderation System

## Overview

OnlyOne.today implements a **balanced content moderation system** designed to:
- ✅ Protect users and comply with safety regulations
- ✅ Maintain platform integrity
- ✅ **NOT kill engagement** with overly strict rules
- ✅ Focus on obvious violations, not creative expression

---

## Philosophy

> "Safe, but not suffocating"

We moderate to prevent:
1. **Contact information sharing** (privacy & safety)
2. **Explicit harmful content** (violence, hate speech, explicit sexual content)
3. **Spam and commercial solicitation**

We DON'T moderate:
- Creative language and humor
- Mild profanity in context
- Unconventional activities
- Cultural or personal expression

---

## What Gets Blocked

### 🔴 **High Severity** (Always blocked, logged)

1. **Contact Information**
   - Phone numbers (all formats: 123-456-7890, (123) 456-7890, +1-123-456-7890)
   - Email addresses (user@domain.com)
   - Why: Privacy protection, prevent solicitation

2. **URLs & Links**
   - http://, https://, www.
   - Domain names (example.com)
   - Why: Prevent spam, phishing, external redirects

3. **Social Media Handles**
   - @username patterns
   - Platform names (Instagram, Twitter, Facebook, etc.)
   - Why: Keep platform anonymous, prevent cross-promotion

4. **Explicit Sexual Content**
   - Keywords: porn, xxx, nsfw, explicit, nude, etc.
   - Why: Keep platform safe for all ages

5. **Violence & Self-Harm**
   - Keywords: kill myself, suicide, self harm, terrorist, bomb, etc.
   - Why: User safety, legal compliance
   - Response: Show crisis helpline resources

6. **Hate Speech**
   - Slurs and extreme offensive language
   - Why: Community safety, legal compliance

### 🟡 **Medium Severity** (Blocked, but may evolve)

1. **Spam Patterns**
   - Repeated characters (aaaaaaaaaa)
   - Commercial keywords (buy now, click here, make $1000)
   - Crypto/investment spam
   - Why: Quality control

### 🟢 **Low Severity** (Soft limits)

1. **Content Length**
   - Max: 500 characters
   - Min: 3 characters
   - Why: Keep posts brief and meaningful

---

## Implementation

### Server-Side (Primary Defense)

**File:** `lib/services/moderation.ts`

```typescript
export function moderateContent(content: string): ModerationResult {
  // Returns: { allowed: boolean, reason?: string, severity?: 'low' | 'medium' | 'high' }
}
```

**Features:**
- Pattern matching (regex) for phone, email, URLs
- Keyword detection for harmful content
- Length validation
- Sanitization (removes HTML, excessive whitespace)

**Integration:** `app/api/posts/route.ts`
- Moderation runs BEFORE post creation
- Blocked content never reaches database
- User-friendly error messages returned

### User Experience

**Error Display:**
- Friendly, emoji-based messages
- No technical jargon
- Dismissable with close button
- Auto-clears on retry

**Examples:**
- ❌ "Phone numbers are not allowed" → ✅ "📵 For your safety, please don't share phone numbers. Keep it anonymous!"
- ❌ "Content flagged" → ✅ "🚫 This content isn't appropriate for OnlyOne. Keep it wholesome!"

---

## False Positives

### Known Edge Cases

We accept some false positives to maintain simplicity:

1. **"I watched a 10-digit documentary"** → May trigger phone number check
   - **Solution:** Accepted trade-off. User can rephrase.

2. **"Didn't visit my.website.com"** → May trigger URL check
   - **Solution:** Accepted. Rare legitimate use case.

3. **"Avoided social media"** → Does NOT trigger (platform names allowed in context)
   - **Solution:** Smart pattern matching (only blocks handles like @user)

---

## Moderation Metrics

### What We Track (Server Logs)

```
🚫 Content blocked for IP [IP]: [reason]
✅ Post created successfully from IP: [IP]
```

### Future Analytics (Optional)

- Blocked content categories by day
- False positive reports
- Top violation types
- Refine rules based on patterns

---

## Compliance

### Government & Legal

1. **COPPA (Children's Online Privacy Protection Act)**
   - No collection of personal information from users under 13
   - Contact info blocking helps compliance

2. **GDPR (EU)**
   - Anonymous posting = minimal data collection
   - No email/phone = no PII to manage

3. **Section 230 (US)**
   - Good faith moderation protects platform
   - Focus on illegal content, not opinions

4. **Anti-Spam Laws (CAN-SPAM, etc.)**
   - Block commercial solicitation
   - No email harvesting

### Platform Safety

- **App Store Requirements:** Met (content moderation in place)
- **Ad Network Policies:** Met (no explicit content)
- **Investor Due Diligence:** Documented moderation strategy

---

## Maintenance & Evolution

### Quarterly Review

1. Analyze moderation logs
2. Identify false positives
3. Update keyword lists
4. Balance safety vs. engagement

### Escalation Path

For persistent abuse:
1. **Phase 1 (Current):** Content-level blocking
2. **Phase 2:** IP-based rate limiting (already implemented)
3. **Phase 3:** Device fingerprinting (future)
4. **Phase 4:** ML-based detection (future, if needed)

---

## Future Enhancements

### Considered (Not Implemented Yet)

1. **AI-Based Moderation**
   - Use LLMs for context-aware detection
   - Reduce false positives
   - Cost: ~$0.01-0.05 per post (expensive)

2. **User Reporting**
   - Allow community to flag content
   - Human review for edge cases
   - Cost: Moderation team time

3. **Profanity Filters**
   - Currently NOT implemented
   - Reason: Don't want to kill authentic expression
   - May add in future with severity levels

4. **Multi-Language Support**
   - Current: English-only patterns
   - Future: Detect and moderate multiple languages

---

## Testing Moderation

### Test Cases (For Development)

```bash
# Should PASS
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"Made banana bread today","inputType":"action","scope":"world"}'

# Should FAIL (phone number)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"Call me at 123-456-7890","inputType":"action","scope":"world"}'

# Should FAIL (email)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"Email me at test@example.com","inputType":"action","scope":"world"}'

# Should FAIL (URL)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"Check out https://example.com","inputType":"action","scope":"world"}'

# Should FAIL (social handle)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"content":"Follow me @username","inputType":"action","scope":"world"}'
```

---

## Configuration

### Adjusting Strictness

Edit `lib/services/moderation.ts`:

```typescript
// To make LESS strict:
- Remove keywords from explicitSexualTerms array
- Increase minLength from 3 to 1
- Comment out social media pattern check

// To make MORE strict:
- Add keywords to violentThreats or explicitSexualTerms
- Add profanity filter
- Reduce maxLength from 500 to 200
```

---

## Summary

| Aspect | Approach |
|--------|----------|
| **Philosophy** | Balanced: safe but not restrictive |
| **Coverage** | Contact info, URLs, explicit content, violence, spam |
| **Enforcement** | Server-side, pre-database |
| **User Experience** | Friendly error messages, dismissable |
| **Compliance** | COPPA, GDPR, Section 230 ready |
| **Future** | AI-based, user reporting, multi-language |

---

**Last Updated:** January 2025
**Version:** 1.0
**Owner:** OnlyOne.today Team

