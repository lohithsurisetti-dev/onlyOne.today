# 🌐 Domain Configuration Guide

Your purchased domain: **`onlyonetoday.com`** ✅

---

## ✅ **CURRENT STATUS:**

### **What's Already Configured:**

All code uses the `getSiteUrl()` function from `lib/config/site.ts`, which reads from:
```
NEXT_PUBLIC_SITE_URL environment variable
```

**This means:**
- ✅ **Local Development:** Uses `http://localhost:3000`
- ✅ **Production:** Uses `https://onlyonetoday.com`
- ✅ **Single source of truth:** Change env var = changes everywhere

---

## 🎯 **DOMAIN SETUP PLAN:**

### **Your Purchased Domain:**
```
onlyonetoday.com (Primary) ✅
```

### **Recommended Setup:**

1. **Primary Domain:**
   - `onlyonetoday.com` (main site)
   - `https://onlyonetoday.com` (with HTTPS)

2. **WWW Redirect (Optional):**
   - `www.onlyonetoday.com` → `onlyonetoday.com`
   - Handled automatically by Vercel

3. **Subdomains (Future):**
   - `api.onlyonetoday.com` (if you need dedicated API)
   - `blog.onlyonetoday.com` (if you add a blog)
   - `docs.onlyonetoday.com` (if you add documentation)

---

## 📝 **ENVIRONMENT VARIABLES:**

### **Local Development (.env.local):**
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=OnlyOne.Today
NEXT_PUBLIC_CONTACT_EMAIL=hello@onlyonetoday.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Production (Vercel Environment Variables):**
```bash
NEXT_PUBLIC_SITE_URL=https://onlyonetoday.com
NEXT_PUBLIC_SITE_NAME=OnlyOne.Today
NEXT_PUBLIC_CONTACT_EMAIL=hello@onlyonetoday.com

# Supabase (same as local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🔧 **WHERE DOMAIN IS USED:**

All these files read from `NEXT_PUBLIC_SITE_URL` or `getSiteUrl()`:

### **✅ Already Configured:**

1. **`app/layout.tsx`** - Meta tags, Open Graph
2. **`app/sitemap.ts`** - SEO sitemap
3. **`public/robots.txt`** - Search engine crawlers
4. **`lib/config/site.ts`** - Central configuration
5. **`components/ShareModal.tsx`** - Share URLs
6. **`app/my-posts/page.tsx`** - Post sharing
7. **`next.config.js`** - Image domains

All use the environment variable! ✅

---

## 🚀 **DEPLOYMENT CHECKLIST:**

### **Before Deploying to Vercel:**

1. **Set Environment Variables in Vercel:**
   ```
   NEXT_PUBLIC_SITE_URL = https://onlyonetoday.com
   NEXT_PUBLIC_SITE_NAME = OnlyOne.Today
   NEXT_PUBLIC_CONTACT_EMAIL = hello@onlyonetoday.com
   ```

2. **Add Custom Domain in Vercel:**
   - Go to: Project Settings → Domains
   - Add: `onlyonetoday.com`
   - Vercel will provide DNS records

3. **Update DNS at Cloudflare:**
   (Since you purchased via Cloudflare)
   - Add Vercel's DNS records
   - Usually: CNAME or A record
   - Vercel will verify

4. **SSL Certificate:**
   - Vercel automatically provisions SSL
   - Domain will be `https://onlyonetoday.com`
   - Free SSL included!

---

## 📧 **EMAIL SETUP (Optional):**

If you want emails like `hello@onlyonetoday.com`:

### **Option 1: Cloudflare Email Routing (Free)**
- Forward `hello@onlyonetoday.com` → your Gmail
- Free, simple, works great
- Setup in Cloudflare dashboard

### **Option 2: Google Workspace ($6/mo)**
- Professional email hosting
- `yourname@onlyonetoday.com`
- Full Gmail features

### **Option 3: Resend.com (Free tier)**
- Send transactional emails
- `noreply@onlyonetoday.com`
- Great for notifications

---

## 🎯 **BRANDING CONSISTENCY:**

### **Current Brand Name:**
```
OnlyOne.Today (capitalized, with dot)
```

This works for:
- ✅ Domain: `onlyonetoday.com` (lowercase, no dot)
- ✅ Brand: `OnlyOne.Today` (capitalized, with dot)
- ✅ Title: `OnlyOne.Today - Discover How Unique You Are`

### **Examples:**
```
Domain:  onlyonetoday.com
Email:   hello@onlyonetoday.com
Brand:   OnlyOne.Today
Social:  @OnlyOneToday
```

---

## ⚠️ **IMPORTANT NOTES:**

### **About `onlyone.today` Domain:**

You do NOT own `onlyone.today` - you own `onlyonetoday.com`

**This means:**
- ❌ Don't use `onlyone.today` anywhere
- ✅ Always use `onlyonetoday.com`
- ✅ Code already does this via env vars

**If someone visits `onlyone.today`:**
- They might register it
- They might copy your idea
- You can't control it

**Recommendation:**
- You COULD purchase `onlyone.today` as well (protection)
- Redirect it to `onlyonetoday.com`
- Costs ~$10/year
- Optional, not required

---

## 🔍 **VERIFICATION:**

### **Check Current Configuration:**

```bash
# Check environment variables
grep NEXT_PUBLIC_SITE_URL .env.local

# Should show:
# NEXT_PUBLIC_SITE_URL=http://localhost:3000 (local)
# NEXT_PUBLIC_SITE_URL=https://onlyonetoday.com (production)
```

### **After Deployment, Test:**

```bash
# Test domain works
curl -I https://onlyonetoday.com

# Test meta tags
curl https://onlyonetoday.com | grep "og:url"
# Should show: https://onlyonetoday.com

# Test sitemap
curl https://onlyonetoday.com/sitemap.xml
# Should show: onlyonetoday.com URLs

# Test robots.txt
curl https://onlyonetoday.com/robots.txt
# Should show: Sitemap: https://onlyonetoday.com/sitemap.xml
```

---

## 📊 **DOMAIN COMPARISON:**

| Domain | Owned? | Use For | Status |
|--------|--------|---------|--------|
| `onlyonetoday.com` | ✅ YES | Production site | Primary ✅ |
| `www.onlyonetoday.com` | ✅ YES | Auto-redirect to main | Secondary ✅ |
| `onlyone.today` | ❌ NO | N/A | Not owned ⚠️ |

---

## 🎯 **RECOMMENDATION:**

### **Option 1: Current Setup (Good Enough)**
- Use `onlyonetoday.com` only
- Don't worry about `onlyone.today`
- If it's available, someone else can have it
- **Cost:** $0/year extra
- **Status:** ✅ Works fine

### **Option 2: Defensive Registration (Better)**
- Purchase `onlyone.today` as well (~$10/year)
- Redirect to `onlyonetoday.com`
- Protects your brand
- Prevents confusion
- **Cost:** ~$10/year
- **Status:** ⭐ Recommended for protection

### **Option 3: Multiple TLDs (Overkill)**
- `onlyonetoday.com` (primary)
- `onlyonetoday.io`
- `onlyonetoday.app`
- `onlyone.today`
- **Cost:** $40-60/year
- **Status:** Not needed unless you go viral

---

## ✅ **CURRENT STATE:**

**Your code is ALREADY CORRECT!** ✨

- ✅ All files use `getSiteUrl()` or env vars
- ✅ No hardcoded `onlyone.today` in critical paths
- ✅ Domain is configurable via environment
- ✅ Local dev uses `localhost:3000`
- ✅ Production will use `onlyonetoday.com`

**Just set the environment variable in Vercel and you're done!**

---

## 🚀 **NEXT STEPS:**

1. **Deploy to Vercel**
2. **Set env var:** `NEXT_PUBLIC_SITE_URL=https://onlyonetoday.com`
3. **Add custom domain** in Vercel
4. **Update DNS** at Cloudflare
5. **Wait for SSL** (5-10 minutes)
6. **Test:** Visit `https://onlyonetoday.com`
7. **Celebrate!** 🎉

---

**Your domain configuration is solid. Ready to deploy?** 🚀

