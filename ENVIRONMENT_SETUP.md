# 🔧 Environment Variables Setup

This guide explains how to configure environment variables for different environments.

## 📋 **Quick Setup**

### **Local Development:**

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and set:
   ```env
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_NAME=OnlyOne.Today
   NEXT_PUBLIC_CONTACT_EMAIL=hello@onlyonetoday.com
   
   # Your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Restart dev server:
   ```bash
   npm run dev
   ```

---

### **Production (Vercel):**

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add these variables:
   ```
   NEXT_PUBLIC_SITE_URL = https://onlyonetoday.com
   NEXT_PUBLIC_SITE_NAME = OnlyOne.Today
   NEXT_PUBLIC_CONTACT_EMAIL = hello@onlyonetoday.com
   
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   ```

3. Redeploy:
   ```bash
   git push origin main
   ```

---

## 🎯 **Environment Variables Explained**

### **Required Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Base URL of your site | `https://onlyonetoday.com` |
| `NEXT_PUBLIC_SITE_NAME` | Site name for branding | `OnlyOne.Today` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact email | `hello@onlyonetoday.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | `eyJ...` (SECRET!) |

### **Optional Variables:**

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `UPSTASH_REDIS_REST_URL` | Redis for rate limiting | High traffic (100K+ users) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token | Same as above |

---

## 🔒 **Security Best Practices:**

### **✅ DO:**
- Keep `.env.local` out of git (already in .gitignore)
- Use different values for dev/staging/prod
- Never commit secrets to GitHub
- Use Vercel's encrypted environment variables

### **❌ DON'T:**
- Hardcode URLs in components
- Share service role keys publicly
- Use production keys in development
- Commit `.env.local` to git

---

## 📁 **File Structure:**

```
onlyOne.today/
├── env.example           ← Template (committed to git)
├── .env.local            ← Your local config (NOT in git)
├── lib/
│   └── config/
│       └── site.ts       ← Single source of truth
└── app/
    └── layout.tsx        ← Uses NEXT_PUBLIC_SITE_URL
```

---

## 🚀 **Deployment Checklist:**

### **Before Going Live:**

- [ ] Set `NEXT_PUBLIC_SITE_URL=https://onlyonetoday.com` in Vercel
- [ ] Update DNS in Cloudflare to point to Vercel
- [ ] Setup email routing in Cloudflare
- [ ] Test all share URLs
- [ ] Verify OG images load correctly
- [ ] Check sitemap.xml
- [ ] Test on mobile

---

## 🎯 **How It Works:**

### **Single Source of Truth:**

```typescript
// lib/config/site.ts
export const getSiteUrl = (): string => {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://onlyonetoday.com'
}

// Usage in components:
import { getSiteUrl } from '@/lib/config/site'
const shareUrl = `${getSiteUrl()}/response?id=123`
```

### **Benefits:**
- ✅ Change URL in ONE place (environment variable)
- ✅ Different URLs for dev/prod
- ✅ No hardcoded values
- ✅ Easy to test locally
- ✅ Professional setup

---

## 🔧 **Troubleshooting:**

### **"Site URL is localhost in production!"**
- Check Vercel environment variables
- Make sure `NEXT_PUBLIC_SITE_URL` is set
- Redeploy after adding variables

### **"Share URLs not working!"**
- Clear browser cache
- Check `getSiteUrl()` returns correct domain
- Verify environment variables are loaded

### **"Email addresses wrong!"**
- Update `NEXT_PUBLIC_CONTACT_EMAIL` in Vercel
- Redeploy

---

## 📞 **Need Help?**

Contact: hello@onlyonetoday.com

---

**Last Updated:** October 15, 2025

