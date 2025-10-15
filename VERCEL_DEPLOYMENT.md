# 🚀 Vercel Deployment Guide

Complete guide to deploy OnlyOne.Today to production with your custom domain.

## 📋 **Prerequisites**

- [x] Domain purchased: `onlyonetoday.com` ✅
- [x] Cloudflare account with domain
- [x] Vercel account
- [x] Supabase project setup
- [x] Code pushed to GitHub

---

## 🎯 **Step-by-Step Deployment**

### **STEP 1: Deploy to Vercel (5 min)**

1. **Go to Vercel:**
   - https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository:**
   - Select: `lohithsurisetti-dev/onlyOne.today`
   - Branch: `nlp_pipeline` (or `main`)
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_SITE_URL = https://onlyonetoday.com
   NEXT_PUBLIC_SITE_NAME = OnlyOne.Today
   NEXT_PUBLIC_CONTACT_EMAIL = hello@onlyonetoday.com
   
   NEXT_PUBLIC_SUPABASE_URL = [your_supabase_url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your_anon_key]
   SUPABASE_SERVICE_ROLE_KEY = [your_service_key]
   ```

5. **Click "Deploy"**
   - Wait 2-3 minutes
   - You'll get: `onlyone-today.vercel.app`

---

### **STEP 2: Add Custom Domain (5 min)**

1. **In Vercel Dashboard:**
   - Go to Project → Settings → Domains
   - Click "Add Domain"
   - Enter: `onlyonetoday.com`
   - Click "Add"

2. **Vercel will show you DNS records:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Go to Cloudflare Dashboard:**
   - DNS → Manage DNS
   - Add the records Vercel gave you
   - Delete any conflicting records

4. **Wait 2-5 minutes:**
   - Vercel will auto-verify
   - You'll see ✅ green checkmark

5. **Set as Primary:**
   - In Vercel, click "Set as Primary Domain"
   - This makes `onlyonetoday.com` the default

---

### **STEP 3: Setup Email Routing (3 min)**

1. **In Cloudflare:**
   - Email Routing → Get Started
   - Click "Enable Email Routing"

2. **Add Destination:**
   - Enter YOUR Gmail address
   - Verify email (check inbox)

3. **Create Routes:**
   ```
   hello@onlyonetoday.com → your@gmail.com
   support@onlyonetoday.com → your@gmail.com
   ```

4. **Test:**
   - Send email to `hello@onlyonetoday.com`
   - Should arrive in your Gmail! ✅

---

### **STEP 4: SSL & HTTPS (Automatic)**

Vercel automatically provisions SSL certificates for your custom domain.

**Within 1-2 minutes:**
- ✅ `https://onlyonetoday.com` works
- ✅ Auto-redirects HTTP → HTTPS
- ✅ Green padlock in browser

**No action needed!**

---

### **STEP 5: Verify Deployment (5 min)**

**Test these URLs:**

1. **Homepage:**
   - https://onlyonetoday.com
   - Should load instantly
   - Check meta tags (View Source)

2. **Feed:**
   - https://onlyonetoday.com/feed
   - Should show posts
   - Check filters work

3. **Create Post:**
   - Submit a test post
   - Check response page loads
   - Verify share URLs use `onlyonetoday.com`

4. **Share Test:**
   - Click share button
   - Check preview image loads
   - WhatsApp/Instagram share works

5. **SEO Check:**
   - https://onlyonetoday.com/sitemap.xml
   - https://onlyonetoday.com/robots.txt
   - Both should load correctly

---

## 🎯 **Environment Variable Configuration**

### **Vercel Environment Variables:**

```bash
# Production (onlyonetoday.com)
NEXT_PUBLIC_SITE_URL=https://onlyonetoday.com
NEXT_PUBLIC_SITE_NAME=OnlyOne.Today
NEXT_PUBLIC_CONTACT_EMAIL=hello@onlyonetoday.com

# Supabase (same for all environments)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

**How to add:**
1. Vercel Dashboard → Project → Settings
2. Environment Variables → Add New
3. Select environment: **Production**, **Preview**, **Development**
4. Add each variable
5. Redeploy for changes to take effect

---

## 🔧 **DNS Configuration (Cloudflare)**

### **Required DNS Records:**

```
# A Record (Root domain)
Type: A
Name: @
Value: 76.76.21.21
Proxy: ON (Orange cloud)

# CNAME (www subdomain)  
Type: CNAME
Name: www
Value: cname.vercel-dns.com
Proxy: ON (Orange cloud)
```

### **Email Records (MX):**
Cloudflare Email Routing adds these automatically:
```
Type: MX
Priority: Various
Value: Cloudflare email servers
```

### **Proxy Status:**
- ✅ **ON** (Orange cloud) - DDoS protection, CDN
- ❌ **OFF** (Gray cloud) - DNS only

**Recommendation:** Keep proxying ON for viral readiness!

---

## 🚨 **Common Issues & Fixes**

### **Issue: "Domain verification pending"**
**Fix:** 
- Check DNS records are correct
- Wait 5-10 minutes for propagation
- Try visiting site in incognito

### **Issue: "Invalid SSL certificate"**
**Fix:**
- Wait 2-3 minutes (auto-provisions)
- Check Cloudflare proxy is ON
- Verify Vercel has domain added

### **Issue: "Share URLs still show localhost"**
**Fix:**
- Check `NEXT_PUBLIC_SITE_URL` in Vercel
- Redeploy: `git push origin main`
- Clear browser cache

### **Issue: "Email not forwarding"**
**Fix:**
- Check destination email is verified
- Check routes are active in Cloudflare
- Wait 5 minutes for propagation

---

## 📊 **Post-Deployment Checklist**

After deployment, verify:

- [ ] ✅ `onlyonetoday.com` loads (HTTPS)
- [ ] ✅ `www.onlyonetoday.com` redirects to main domain
- [ ] ✅ Create post works
- [ ] ✅ Share URLs use `onlyonetoday.com`
- [ ] ✅ OG images show in social previews (test with WhatsApp)
- [ ] ✅ Email routing works
- [ ] ✅ Sitemap.xml accessible
- [ ] ✅ Robots.txt accessible
- [ ] ✅ Mobile responsive
- [ ] ✅ Feed pagination works
- [ ] ✅ My Posts page loads
- [ ] ✅ Reactions work
- [ ] ✅ Trending loads (if data available)

---

## 🎨 **Updating Domain Later**

If you want to change domain:

1. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SITE_URL=https://newdomain.com
   ```

2. Update Vercel environment variable

3. Update Cloudflare DNS

4. Redeploy:
   ```bash
   git push origin main
   ```

**That's it!** All URLs update automatically because you used environment variables. ✅

---

## 🔥 **Performance Optimization**

### **Cloudflare Settings (After Launch):**

1. **Speed → Optimization:**
   - ✅ Auto Minify (HTML, CSS, JS)
   - ✅ Brotli compression
   - ✅ Early Hints

2. **Caching → Configuration:**
   - ✅ Browser Cache TTL: Respect Existing Headers
   - ✅ Enable Always Online

3. **Security → Settings:**
   - ✅ Security Level: Medium
   - ✅ Challenge Passage: 30 minutes
   - ✅ Bot Fight Mode: ON

---

## 📈 **Monitoring & Analytics**

### **Built-in:**
- ✅ Vercel Analytics (already integrated)
- ✅ Vercel Speed Insights (already integrated)

### **Cloudflare (Free):**
- Analytics → Traffic
- See: Requests, bandwidth, threats blocked

### **Optional Additions:**
- Google Analytics 4 (if you want more detailed analytics)
- Sentry (error tracking)
- LogRocket (session replay)

---

## 💰 **Cost Breakdown**

**Monthly Costs:**

```
Domain (Cloudflare): $0.83/month ($10/year)
Vercel Hosting: $0 (free hobby plan, scales to 100GB bandwidth)
Supabase: $0 (free tier, up to 500MB database)
Email Routing: $0 (Cloudflare included)
SSL Certificates: $0 (automatic)
CDN: $0 (Cloudflare + Vercel)
DDoS Protection: $0 (Cloudflare free)

TOTAL: $0.83/month 🎉
```

**Scales to:**
- 100K users/month: Still $0.83/month
- 1M users/month: ~$20/month (Vercel Pro)
- 10M users/month: ~$200/month (Vercel Pro + Supabase Pro)

---

## 🎯 **Ready to Deploy?**

Run this command to push all changes:

```bash
git add -A
git commit -m "🌐 Add environment variable system for onlyonetoday.com"
git push origin nlp_pipeline
```

Then follow STEP 1 above to deploy to Vercel!

---

**Questions?** Email: hello@onlyonetoday.com (after email routing setup!)

