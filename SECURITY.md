# 🔒 Security Documentation

## Overview

OnlyOne.today implements multiple layers of security to protect users and the platform. This document outlines all security measures in place.

## 🛡️ Security Layers

### 1. **Network Security**

#### Rate Limiting
- **Implementation**: In-memory rate limiting (upgradeable to Redis/Upstash)
- **Presets**:
  - Post Creation: 10 posts per hour
  - Reactions: 30 reactions per 5 minutes
  - Feed Reads: 100 requests per 5 minutes
  - Share Generation: 20 shares per 10 minutes
- **IP Tracking**: Multi-header support (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
- **Response Headers**: Includes rate limit info (limit, remaining, reset time)

#### Security Headers (Applied Globally via Middleware)
```
X-Frame-Options: DENY                              # Prevent clickjacking
X-Content-Type-Options: nosniff                    # Prevent MIME sniffing
X-XSS-Protection: 1; mode=block                    # Enable XSS protection
Referrer-Policy: strict-origin-when-cross-origin   # Protect referrer info
Permissions-Policy: camera=(), microphone=()...    # Disable dangerous features
Content-Security-Policy: ...                       # Comprehensive CSP
```

---

### 2. **Input Validation & Sanitization**

#### Request Validation
- ✅ Body size limits (50KB max)
- ✅ JSON format validation
- ✅ Query parameter validation
- ✅ Numeric bounds checking (limit, offset)
- ✅ Enum validation (inputType, scope, filter)

#### String Validation
- ✅ Length constraints (min/max)
- ✅ Pattern matching (regex)
- ✅ Required field checks
- ✅ Type checking

#### Content Sanitization
```typescript
- Remove null bytes
- Remove control characters
- Limit consecutive whitespace
- Strip HTML tags
- Remove script tags
- Sanitize special characters
```

#### Injection Protection
- ✅ **SQL Injection Detection** (defense in depth, Supabase primary protection)
- ✅ **XSS Detection** (script tags, event handlers, dangerous functions)
- ✅ **NoSQL Injection Prevention** (via Supabase RLS)

---

### 3. **Content Moderation (Hybrid Approach)**

#### Static Rule-Based Moderation (Fast)
Blocks:
- 📱 Phone numbers (multiple formats)
- 📧 Email addresses
- 🔗 URLs and links
- 👤 Social media handles (@username)
- 🔞 Explicit sexual content
- ⚠️ Violence and threats
- 🗑️ Spam patterns
- 😡 Hate speech
- 📏 Length violations (3-500 characters)

#### AI-Powered Moderation (Smart)
Uses: `@xenova/transformers` (Transformers.js)
- 🤖 Toxic language detection
- 🎯 Context-aware analysis
- 📊 Severity scoring
- 📈 Analytics tracking

#### Moderation Flow
```
1. Static rules (fast path)
   ↓
2. AI detection (if enabled)
   ↓
3. Sanitization
   ↓
4. Store in database
```

---

### 4. **Authentication & Authorization**

#### Supabase Row Level Security (RLS)
- ✅ Database-level access control
- ✅ Per-user data isolation
- ✅ Service role for admin operations
- ✅ Anon key for public reads

#### CRON Job Protection
```typescript
// /api/cron/trending
Authorization: Bearer ${CRON_SECRET}
```

#### API Endpoint Protection
- ✅ IP-based rate limiting
- ✅ Request validation
- ✅ Error handling (no internal details exposed)

---

### 5. **Data Protection**

#### Location Data
- ✅ Sanitized before storage
- ✅ Length validation (max 100 chars)
- ✅ Optional (not required)
- ✅ No precise coordinates (city/state/country only)

#### User Content
- ✅ All content moderated before storage
- ✅ Sanitized (HTML removed, whitespace normalized)
- ✅ Length limited (3-500 characters)
- ✅ No PII (phone, email, social handles blocked)

#### Database Security
- ✅ Supabase hosted (SOC 2 compliant)
- ✅ RLS policies enabled
- ✅ Encrypted at rest
- ✅ Encrypted in transit (HTTPS only)

---

### 6. **Error Handling**

#### Secure Error Responses
```typescript
// ✅ GOOD (Production)
{ error: "Failed to create post" }

// ❌ BAD (Never expose)
{ error: "Database connection failed at pg_connection.ts:42" }
```

#### Logging Strategy
- ✅ Server-side: Detailed logs with stack traces
- ✅ Client-side: Generic error messages
- ✅ No sensitive data in logs
- ✅ IP addresses logged for security incidents

---

### 7. **Frontend Security**

#### Input Handling
- ✅ Client-side validation (UX)
- ✅ Server-side validation (security)
- ✅ Never trust client input

#### API Communication
- ✅ HTTPS only (enforced by Vercel)
- ✅ No API keys in frontend
- ✅ CORS properly configured
- ✅ Server-side proxy for external APIs

---

## 🔍 Security Checklist

### ✅ Implemented
- [x] Rate limiting (IP-based)
- [x] Content moderation (Static + AI)
- [x] Input validation & sanitization
- [x] SQL injection protection
- [x] XSS protection
- [x] Security headers
- [x] HTTPS enforcement
- [x] Error handling (no internal details)
- [x] Body size limits
- [x] Supabase RLS
- [x] CRON authentication
- [x] PII blocking (phone, email)
- [x] Spam detection
- [x] Hate speech detection

### 🔄 Recommended for Scale
- [ ] Redis/Upstash for rate limiting (distributed)
- [ ] DDoS protection (Cloudflare/Vercel Pro)
- [ ] WAF (Web Application Firewall)
- [ ] Bot detection (Cloudflare Turnstile)
- [ ] Honeypot fields (simple bot trap)
- [ ] 2FA for admin accounts
- [ ] Security audit/penetration testing
- [ ] Backup encryption
- [ ] Monitoring & alerting (Sentry)

---

## 🚨 Incident Response

### If Attack Detected
1. **Identify**: Check logs for attack patterns
2. **Block**: Add IP to rate limit blocklist
3. **Investigate**: Analyze attack vector
4. **Patch**: Fix vulnerability
5. **Monitor**: Watch for repeat attempts

### Monitoring
```bash
# Check rate limit violations
grep "Rate limit exceeded" logs

# Check SQL injection attempts
grep "SQL injection attempt" logs

# Check XSS attempts
grep "XSS attempt" logs

# Check moderation blocks
grep "Content blocked" logs
```

---

## 🔐 Environment Variables

### Required (Security Critical)
```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Optional (Enhanced Security)
```bash
CRON_SECRET=<random-string>  # For CRON job authentication
```

### Validation
Environment variables are validated at startup. Missing critical vars will log errors.

---

## 📚 Security Best Practices

### For Developers
1. **Never trust user input** - Always validate server-side
2. **Use parameterized queries** - Prevent SQL injection
3. **Sanitize all output** - Prevent XSS
4. **Validate types & ranges** - Prevent unexpected behavior
5. **Log security events** - For incident response
6. **Fail securely** - Default to deny, not allow
7. **Keep dependencies updated** - Regular `npm audit`

### For Deployment
1. **Use HTTPS only** - Enforce via Vercel settings
2. **Set environment vars** - Never commit secrets
3. **Enable rate limiting** - Prevent abuse
4. **Monitor logs** - Watch for attacks
5. **Regular backups** - Database snapshots
6. **Test in staging** - Never test security in prod

---

## 🧪 Testing Security

### Manual Testing
```bash
# Test rate limiting
for i in {1..20}; do curl -X POST http://localhost:3001/api/posts -H "Content-Type: application/json" -d '{"content":"test"}'; done

# Test SQL injection
curl -X POST http://localhost:3001/api/posts -H "Content-Type: application/json" -d '{"content":"test'; DROP TABLE posts;--"}'

# Test XSS
curl -X POST http://localhost:3001/api/posts -H "Content-Type: application/json" -d '{"content":"<script>alert(1)</script>"}'

# Test body size limit
dd if=/dev/zero bs=1M count=1 | curl -X POST http://localhost:3001/api/posts -H "Content-Type: application/json" -d @-
```

### Automated Testing
```bash
# Run security audit
npm audit

# Check for known vulnerabilities
npm audit fix

# Run linter (catches some security issues)
npm run lint
```

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email: [your-security-email@example.com]

**Please DO NOT** open a public GitHub issue for security vulnerabilities.

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

## 📄 Compliance

### GDPR Compliance
- ✅ Minimal data collection
- ✅ No PII stored (phone/email blocked)
- ✅ User content can be deleted
- ✅ Data encrypted at rest & in transit

### CCPA Compliance
- ✅ No personal data sold
- ✅ Transparent data usage
- ✅ User rights respected

### Accessibility
- ✅ WCAG 2.1 AA compliant
- ✅ Screen reader friendly
- ✅ Keyboard navigation

---

## 🔄 Security Updates

### Version History
- **v1.2** (2025-10): Enhanced security layer (this release)
  - Added middleware for global security headers
  - Implemented comprehensive input validation
  - Added SQL injection & XSS detection
  - Enhanced error handling
  
- **v1.1** (2025-10): Initial security implementation
  - Rate limiting
  - Hybrid moderation (Static + AI)
  - Basic input validation

---

## 📖 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Last Updated**: October 2025  
**Security Contact**: [your-email]  
**Bug Bounty**: Not currently available

