# Deployment Guide for OnlyOne.today

This guide covers deploying OnlyOne.today to Vercel with Supabase backend.

## 📋 Prerequisites

- ✅ Supabase project set up (see `SUPABASE_SETUP.md`)
- ✅ GitHub repository with your code
- ✅ Vercel account (sign up at https://vercel.com)

## 🚀 Deploy to Vercel

### Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `onlyOne.today` repository
4. Click "Import"

### Step 2: Configure Environment Variables

In the Vercel deployment settings, add these environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron Job Security (generate a random string)
CRON_SECRET=your-random-secret-key-here

# Optional: External APIs
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GOOGLE_TRENDS_API_KEY=your_google_trends_api_key
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for deployment to complete (~2-3 minutes)
3. ✅ Your app is live!

Your app will be available at: `https://your-project-name.vercel.app`

## 🔄 Automatic Deployments

Vercel automatically deploys:
- ✅ **Production**: Every push to `main` branch
- ✅ **Preview**: Every pull request

## ⏰ Cron Jobs (Trending Data)

### Vercel Cron Jobs

The `vercel.json` file configures a cron job to refresh trending data every hour:

```json
{
  "crons": [
    {
      "path": "/api/cron/trending",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Note**: Cron jobs are only available on Vercel Pro plans. For free tier, use external cron services.

### Alternative: External Cron Services

If you're on Vercel's free tier, use an external cron service:

1. **cron-job.org** (Free):
   - Go to https://cron-job.org
   - Create account
   - Add new cron job:
     - URL: `https://your-app.vercel.app/api/cron/trending`
     - Schedule: Every hour (`0 * * * *`)
     - Add header: `Authorization: Bearer your-cron-secret`

2. **EasyCron** (Free):
   - Go to https://www.easycron.com
   - Similar setup as above

3. **GitHub Actions** (Free):
   Create `.github/workflows/refresh-trending.yml`:
   ```yaml
   name: Refresh Trending Data
   on:
     schedule:
       - cron: '0 * * * *'  # Every hour
   jobs:
     refresh:
       runs-on: ubuntu-latest
       steps:
         - name: Call Cron Endpoint
           run: |
             curl -X GET https://your-app.vercel.app/api/cron/trending \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
   ```

## 🌍 Custom Domain

### Add Your Domain

1. In Vercel, go to your project
2. Click "Settings" → "Domains"
3. Enter your domain (e.g., `onlyone.today`)
4. Follow DNS configuration instructions
5. ✅ Your app will be available at your custom domain!

## 📊 Monitoring

### Vercel Analytics

Enable analytics in your Vercel dashboard:
1. Go to "Analytics" tab
2. Enable "Web Analytics"
3. View real-time metrics

### Supabase Monitoring

Monitor database performance:
1. Go to Supabase dashboard
2. Check "Database" → "Query Performance"
3. Monitor "Logs" for errors

## 🔐 Security Checklist

Before going live:

- ✅ **Environment variables** are set in Vercel (not in code)
- ✅ **Service role key** is kept secret (never exposed to client)
- ✅ **Cron secret** is set for API protection
- ✅ **Row Level Security** is enabled in Supabase
- ✅ **CORS** is configured if using external APIs
- ✅ **Rate limiting** is considered (use Vercel Edge Config or Upstash)

## 🚦 Health Checks

### Test Your Deployment

1. **Homepage**: Visit `https://your-app.vercel.app`
2. **Create Post**: Try posting an action
3. **View Feed**: Check `/feed` shows posts
4. **Share Card**: Test downloading share cards
5. **API**: Test `https://your-app.vercel.app/api/posts`

### Common Issues

**"Supabase connection failed"**
- Check environment variables are set correctly
- Verify Supabase project URL and keys

**"No posts showing in feed"**
- Make sure database has data (check Supabase table editor)
- Check browser console for errors

**"Share cards not generating"**
- Check `/api/share-preview` endpoint
- Verify no console errors

## 📈 Performance Optimization

### Enable Edge Functions

Some API routes can be optimized with Edge Functions:

```typescript
// Add to API routes:
export const runtime = 'edge'
```

### Add Caching

Use Vercel's caching for static content:

```typescript
export const revalidate = 3600 // 1 hour
```

### Database Indexing

Ensure all indexes are created (see `schema.sql`)

## 🔄 Continuous Deployment

### Workflow

1. Develop locally
2. Push to `feature` branch
3. Create pull request
4. Vercel creates preview deployment
5. Review and test
6. Merge to `main`
7. Auto-deploy to production

### Rollback

If something goes wrong:
1. Go to Vercel dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click "..." → "Promote to Production"

## 🎯 Post-Deployment Tasks

After successful deployment:

1. ✅ Test all features end-to-end
2. ✅ Monitor Vercel Analytics
3. ✅ Check Supabase database growth
4. ✅ Set up error tracking (Sentry, LogRocket)
5. ✅ Configure backups in Supabase
6. ✅ Set up uptime monitoring (UptimeRobot, Pingdom)

## 📞 Support

- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **GitHub Issues**: Create issue in your repository

---

**🎉 Congratulations!** Your app is now live and ready to discover the world's uniqueness!

