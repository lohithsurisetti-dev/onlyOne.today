# OnlyOne.today - Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
```bash
npm install
# or
yarn install
```

2. **Create environment file:**
Create a `.env.local` file in the root directory with:
```bash
# Supabase (optional for MVP, uses mock data without it)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Spotify API (optional for MVP)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run development server:**
```bash
npm run dev
# or
yarn dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
onlyOne.today/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page (posting screen)
│   ├── globals.css               # Global styles + Tailwind
│   ├── response/                 # Response screens
│   │   ├── page.tsx              # Uniqueness response
│   │   └── commonality/          
│   │       └── page.tsx          # Commonality response
│   └── feed/                     
│       └── page.tsx              # Anonymous feed
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── TextArea.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── CircularProgress.tsx
│   └── StarsBackground.tsx       # Animated stars effect
├── lib/                          # Utility functions (to be added)
│   ├── supabase.ts               # Supabase client
│   ├── matching.ts               # Post matching logic
│   └── trends.ts                 # Trending data fetchers
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

---

## 🎨 Design System

### Colors
```typescript
'space-dark': '#0a0a1a'        // Background
'space-mid': '#1a1a2e'          // Surfaces
'space-light': '#2d2d44'        // Borders
'accent-purple': '#8b5cf6'      // Primary actions
'accent-blue': '#3b82f6'        // Commonality theme
'accent-pink': '#ec4899'        // Gradients
```

### Components Usage

#### Button
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" size="lg" onClick={handleClick}>
  Click Me
</Button>

// Variants: 'primary' | 'secondary' | 'ghost'
// Sizes: 'sm' | 'md' | 'lg'
```

#### TextArea
```tsx
import TextArea from '@/components/ui/TextArea'

<TextArea
  placeholder="Your text here..."
  maxLength={200}
  showCounter={true}
  onChange={(e) => setText(e.target.value)}
/>
```

#### CircularProgress
```tsx
import CircularProgress from '@/components/ui/CircularProgress'

<CircularProgress 
  value={94}           // 0-100
  size={200}           // diameter in px
  gradient={true}      // use gradient colors
/>
```

#### Badge
```tsx
import Badge from '@/components/ui/Badge'

<Badge variant="purple" size="md">
  Top 1% unique
</Badge>

// Variants: 'purple' | 'blue' | 'pink' | 'gray'
```

---

## 🛠️ Current Implementation Status

### ✅ Completed (MVP UI)
- [x] Project setup (Next.js 14 + TypeScript + Tailwind)
- [x] Landing/Home page (posting screen)
- [x] Response screen (uniqueness emphasis)
- [x] Response screen (commonality emphasis)
- [x] Anonymous feed with floating posts
- [x] Shared UI component library
- [x] Design system implementation
- [x] Animated stars background
- [x] Responsive layouts

### 🚧 To Be Implemented
- [ ] Supabase integration
- [ ] Database schema setup
- [ ] Post submission API
- [ ] Matching engine (similarity hashing)
- [ ] Trending data integration (Google Trends + Spotify)
- [ ] Sentiment detection
- [ ] Dual metric scoring algorithm
- [ ] Share card generator
- [ ] PWA configuration
- [ ] User authentication (optional)

---

## 🔧 Development Tasks

### Next Steps for Full Functionality:

#### 1. Set up Supabase
```bash
# Create a new Supabase project at https://supabase.com
# Add the project URL and keys to .env.local
# Run database migrations (see TECH_STACK.md for schema)
```

#### 2. Create API Routes
Create these files in `app/api/`:
- `app/api/posts/route.ts` - Post submission
- `app/api/match/route.ts` - Matching engine
- `app/api/trends/route.ts` - Trending data

#### 3. Implement Matching Logic
Create `lib/matching.ts`:
- Similarity hashing algorithm
- Post comparison logic
- Uniqueness score calculation

#### 4. Add Trending Data
Create `lib/trends.ts`:
- Google Trends API integration
- Spotify Web API integration
- Caching layer (1 hour TTL)

---

## 📱 Testing Locally

### Test Landing Page
1. Navigate to `http://localhost:3000`
2. Type a moment in the textarea
3. Click "Share My Moment"
4. You'll be redirected to the response page with mock data

### Test Response Screens
- **Uniqueness:** `http://localhost:3000/response?content=Your+moment`
- **Commonality:** `http://localhost:3000/response/commonality?content=Your+moment`

### Test Feed
- Navigate to `http://localhost:3000/feed`
- See floating posts in constellation layout
- Filter by "All", "Unique", or "Common"

---

## 🎯 Building for Production

### Build the app:
```bash
npm run build
```

### Start production server:
```bash
npm run start
```

### Deploy to Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 🐛 Common Issues

### Issue: Tailwind styles not loading
**Solution:** Make sure `globals.css` is imported in `app/layout.tsx`

### Issue: "Module not found" errors
**Solution:** Run `npm install` again and restart dev server

### Issue: Environment variables not working
**Solution:** 
- Ensure `.env.local` file exists in root directory
- Restart dev server after adding env vars
- Use `NEXT_PUBLIC_` prefix for client-side variables

### Issue: TypeScript errors
**Solution:** Run `npm run lint` to see all errors

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Package management
npm install              # Install dependencies
npm update               # Update dependencies
```

---

## 🎨 Customizing the Design

### Change colors:
Edit `tailwind.config.ts` under `theme.extend.colors`

### Change fonts:
Edit `app/layout.tsx` to import different Google Fonts

### Change animations:
Edit `app/globals.css` or `tailwind.config.ts` keyframes

---

## 📖 Related Documentation

- [TECH_STACK.md](./TECH_STACK.md) - Complete technical decisions
- [DESIGN_REQUIREMENTS.md](./DESIGN_REQUIREMENTS.md) - Design specifications
- [CORE_CONCEPT.md](./CORE_CONCEPT.md) - Product concept
- [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) - Scaling & architecture

---

## 🚀 Ready to Build!

The MVP UI is complete and ready for backend integration. Follow the tasks above to add full functionality.

**Current Status:** ✅ Frontend Complete | ⏳ Backend Pending

Once you add Supabase and API routes, you'll have a fully functional app!

---

*Last Updated: October 2025*

