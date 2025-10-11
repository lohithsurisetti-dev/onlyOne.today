# OnlyOne.today — Design Requirements & AI Generation Prompts

*Complete design specifications for generating UI mockups with Stitch AI or similar tools*

---

## 🎨 Brand Identity

### Core Concept
A minimalist, immersive, emotion-first experience celebrating everyday uniqueness through a night-sky aesthetic.

### Brand Personality
- **Calm** yet **alive**
- **Minimal** yet **warm**
- **Poetic** yet **playful**
- **Deep** yet **accessible**
- **Quiet** yet **powerful**

### Design Philosophy
> "Like looking at stars — each one unique, together forming something beautiful."

---

## 🌈 Color Palette

### Primary Colors
```
Space Dark (Background)    : #0a0a1a  (Deep navy black)
Space Mid (Surfaces)       : #1a1a2e  (Midnight blue)
Space Light (Borders)      : #2d2d44  (Slate blue)
```

### Accent Colors
```
Accent Purple (Primary)    : #8b5cf6  (Vibrant purple - uniqueness)
Accent Blue (Secondary)    : #3b82f6  (Bright blue - commonality)
Accent Pink (Highlight)    : #ec4899  (Hot pink - special moments)
Accent Gold (Premium)      : #fbbf24  (Warm gold - achievements)
```

### Text Colors
```
Text Primary               : #f9fafb  (Nearly white)
Text Secondary             : #9ca3af  (Light gray)
Text Muted                 : #6b7280  (Medium gray)
```

### Gradient Overlays
```
Sky Gradient (Background)  : linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #2d1b4e 100%)
Purple Glow                : radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)
Blue Glow                  : radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)
```

---

## ✍️ Typography

### Font Stack
**Primary:** Inter (clean, modern, highly readable)
**Fallback:** system-ui, -apple-system, sans-serif

### Type Scale
```
Heading XL    : 48px / 56px (1.167 line-height) - Bold
Heading L     : 36px / 44px (1.222 line-height) - Bold
Heading M     : 24px / 32px (1.333 line-height) - Semibold
Heading S     : 20px / 28px (1.400 line-height) - Semibold

Body Large    : 18px / 28px (1.556 line-height) - Regular
Body          : 16px / 24px (1.500 line-height) - Regular
Body Small    : 14px / 20px (1.429 line-height) - Regular

Caption       : 12px / 16px (1.333 line-height) - Medium
```

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

## 🖼️ Screen Designs (8 Key Screens)

### Screen 1: Landing / Home Screen

**Prompt for Stitch AI:**
```
Design a full-screen web app landing page with a dark space/night sky aesthetic.

Layout:
- Full viewport height
- Centered content vertically and horizontally
- Dark gradient background (#0a0a1a to #1a1a2e to #2d1b4e from top to bottom)
- Subtle animated stars/dots scattered across background (small white dots, varying opacity)

Header (top, minimal):
- Small logo/text "OnlyOne.today" in top left (white, 14px)
- No other header elements

Main Content (centered):
- Large heading: "What did you do differently today?" (48px, white, bold, center-aligned)
- Subtext below: "While the world follows the trend, you did something no one else did." (18px, light gray, center-aligned, max-width 600px)
- Large text input box below (600px wide, 120px tall, dark surface #1a1a2e, white text, rounded corners 16px, subtle purple glow on focus)
- Placeholder text: "I listened to vinyl while everyone streamed..."
- Character counter bottom-right of input: "0 / 200" (12px, gray)
- Primary button below input: "Share My Moment" (purple #8b5cf6, white text, 16px semibold, 48px tall, rounded 12px, full width of input)
- Small text below button: "Anonymous • No signup required" (12px, gray, center-aligned)

Footer (bottom):
- Centered text: "See what others did →" (14px, purple #8b5cf6, clickable)

Design Style:
- Minimalist, lots of breathing room
- Glassmorphism effect on input (subtle backdrop blur)
- Soft shadows and glows (purple radial gradient behind main content area)
- Modern, clean, calming aesthetic
- Mobile responsive (stack vertically on mobile)
```

---

### Screen 2: Response Screen (Uniqueness Emphasized)

**Prompt for Stitch AI:**
```
Design a response screen showing a user's unique moment after posting.

Layout:
- Same dark space background with stars
- Content card centered (max-width 700px)
- Animated entrance (fade in + slide up)

Main Card (centered):
- Dark surface (#1a1a2e) with subtle purple glow around edges
- Rounded corners (24px)
- Padding: 48px

Content inside card (top to bottom):
1. User's post (quoted):
   - Small label: "Your moment" (12px, gray, uppercase, letter-spacing)
   - Post text: "Didn't watch the Super Bowl" (24px, white, medium weight)
   - Divider line below (1px, gray, subtle)

2. Uniqueness Score (prominent):
   - Large circular progress indicator (200px diameter)
   - Purple gradient (#8b5cf6 to #ec4899)
   - Score in center: "94" (64px, bold, white)
   - Label below: "Uniqueness Score" (14px, gray)
   
3. Context Text:
   - Main response: "While 100 million watched, you did something no one else did ✨" (20px, white, line-height 1.5)
   - Badge: "Top 1% most unique today" (purple background, white text, rounded pill, 12px)

4. Secondary Metrics (subtle, bottom):
   - Small text: "👥 3 others also skipped it" (14px, gray, with small blue dot indicator)
   - Timestamp: "Posted 2 minutes ago" (12px, muted gray)

Buttons (bottom of card):
- Primary: "Share This" (purple, white text, 48px tall)
- Secondary: "See What Others Did" (transparent with purple border, purple text)
- Both full width, stacked vertically with 12px gap

Design Style:
- Celebration aesthetic (success state)
- Subtle particle effects around score circle
- Soft glow effects
- Smooth animations
```

---

### Screen 3: Response Screen (Commonality Emphasized)

**Prompt for Stitch AI:**
```
Design a response screen emphasizing connection/commonality after posting.

Layout:
- Same dark space background
- Content card centered (max-width 700px)
- Warm, comforting aesthetic (more blue than purple)

Main Card:
- Dark surface (#1a1a2e) with subtle blue glow (#3b82f6)
- Rounded corners (24px)
- Padding: 48px

Content inside card:
1. User's post (quoted):
   - Small label: "Your moment" (12px, gray)
   - Post text: "Felt anxious today" (24px, white)
   - Divider

2. Commonality Visualization (prominent):
   - Cluster of small circles/avatars representing other people (abstract, not actual photos)
   - 89 small dots arranged in a organic cluster pattern
   - Blue gradient glow
   - Center text overlay: "89 others" (36px, bold, white)

3. Context Text:
   - Main response: "You're one of 89 people who shared this feeling today. You're not alone 💙" (20px, white, comforting tone)
   - Badge: "You're not alone" (blue background, white text)

4. Kindred Spirits Section:
   - Heading: "Others who understand:" (14px, gray)
   - 2-3 other anonymous posts shown as small cards:
     - "Stayed in bed till noon" — 2 hours ago
     - "Couldn't focus today" — 4 hours ago
   - Each in a darker surface (#0a0a1a) with subtle blue border

Buttons:
- Primary: "Share This" (blue, white text)
- Secondary: "Connect with Others" (transparent with blue border)

Design Style:
- Comforting, warm, less "celebration" more "community"
- Soft blue glows instead of purple
- Organic shapes (circles, clusters)
- Empathetic aesthetic
```

---

### Screen 4: Dual Metrics View (Both Scores)

**Prompt for Stitch AI:**
```
Design a balanced response screen showing both uniqueness and commonality scores.

Layout:
- Same dark background
- Wider card (max-width 800px)

Main Card:
- Two-column layout on desktop, stacked on mobile
- Split design with subtle vertical divider

Left Column (Uniqueness):
- Purple gradient background (#8b5cf6 fade)
- Circular score: "67/100"
- Icon: ✨ 
- Label: "Uniqueness"
- Small text: "More unique than 67% of people"
- Rank badge: "Uncommon"

Right Column (Commonality):
- Blue gradient background (#3b82f6 fade)
- Circular score: "33/100"
- Icon: 👥
- Label: "Commonality"
- Small text: "23 others did similar things"
- Badge: "You're not alone"

Bottom Section (full width):
- User's post shown at top
- Context text: "While most people streamed Taylor Swift, you chose vinyl. Rare, but you have company 🎵"
- Toggle switch: "View: Both | Uniqueness | Commonality" (pill-style selector)

Buttons:
- Share button (gradient purple to blue)
- See feed button (transparent)

Design Style:
- Balanced, harmonious
- Clear visual separation between metrics
- Not emphasizing one over the other
- Toggle allows user to switch focus
```

---

### Screen 5: Anonymous Feed / Explore

**Prompt for Stitch AI:**
```
Design an immersive, floating feed of anonymous posts resembling a night sky constellation.

Layout:
- Full screen, dark gradient background with animated stars
- No traditional feed structure (no vertical list)
- Posts appear as floating cards randomly positioned across the screen

Header (top, sticky):
- "What the world did today" (24px, white, center-aligned)
- Filter pills: "All" | "Music" | "Reading" | "Offline" | "Unique" (horizontal scroll, pill-style, purple active state)

Main Content (full viewport):
- 10-15 post cards scattered across screen (CSS Grid or absolute positioning)
- Each card:
  - Size: 240px x 160px (varied slightly for visual interest)
  - Dark surface (#1a1a2e) with gradient border (purple or blue depending on post type)
  - Rounded corners (16px)
  - Soft shadow and glow
  - Gentle floating animation (translateY up/down 10px, 3s ease-in-out)
  - Content:
    - Post text (16px, white, 2-3 lines max, ellipsis if longer)
    - Small badge: "Unique ✨" or "89 others 👥" (purple or blue)
    - Timestamp: "2m ago" (12px, gray, bottom-right)
  - Hover state: Scale up slightly (1.05x), increased glow

Interactive Elements:
- Click card to expand (modal overlay)
- "Post Your Moment" floating action button (bottom-right, purple circle with + icon, 64px diameter)

Lines connecting cards (optional, subtle):
- Thin dotted lines (#2d2d44) connecting nearby cards
- Creates constellation effect

Design Style:
- Immersive, exploratory
- No traditional navigation
- Feels like discovering stars in the sky
- Calm, meditative scrolling experience
- Infinite scroll (lazy load more posts)
```

---

### Screen 6: Share Card (Social Media Export)

**Prompt for Stitch AI:**
```
Design a shareable social media card (1200x630px for OG image).

Layout:
- Landscape format
- Dark gradient background (same space aesthetic)
- Centered content

Background:
- Top-to-bottom gradient (#0a0a1a to #2d1b4e)
- Scattered stars (subtle, small white dots)
- Soft purple radial glow in center

Main Content (centered):
1. Logo/branding (top):
   - "OnlyOne.today" text (16px, white, subtle)

2. User's post (center, prominent):
   - Large quote marks (decorative, purple, 80px)
   - Post text: "Didn't watch the Super Bowl" (40px, white, bold, center-aligned, max 2 lines)
   - Quote marks close (decorative, purple)

3. Response text (below post):
   - "While 100 million watched, I did something no one else did ✨" (24px, light gray, center-aligned)

4. Metric (bottom-center):
   - Large circular badge (120px diameter, purple gradient)
   - Score inside: "94" (48px, bold, white)
   - Label: "Uniqueness" (12px, white, below circle)
   - Small badge: "Top 1%" (purple pill, 12px)

5. Footer (bottom):
   - "OnlyOne.today" (16px, purple, center)
   - Tagline: "What did you do differently today?" (14px, gray)

Design Style:
- Instagram/Twitter optimized
- Clean, readable at small sizes
- Strong contrast for accessibility
- Branded but not overly promotional
- Pride-inducing aesthetic (user wants to share this)
```

---

### Screen 7: Personal Stats / Dashboard

**Prompt for Stitch AI:**
```
Design a personal analytics dashboard showing user's uniqueness journey.

Layout:
- Desktop: Sidebar + main content
- Mobile: Stacked

Sidebar (left, 280px):
- User avatar (anonymous silhouette, 80px, purple gradient circle)
- Username: "You" or "Anonymous #1234" (16px)
- Joined date: "Member for 23 days" (12px, gray)
- Quick stats:
  - Total posts: 23
  - Current streak: 7 days 🔥
  - Average uniqueness: 67/100

Main Content:
1. Header:
   - "Your Week of Uniqueness" (32px, white, bold)
   - Date range: "Oct 5-11, 2025" (14px, gray)

2. Balance Chart (prominent):
   - Dual-metric visualization
   - Left side: Uniqueness (purple gradient bar chart)
   - Right side: Commonality (blue gradient bar chart)
   - Center: Your balance visualization (67% unique, 33% common)
   - Text: "You're independent but connected" (16px, white)

3. Highlights Section:
   - "Top Moments This Week" heading
   - 3 cards showing:
     - Most unique post (purple border, score 98/100)
     - Most common post (blue border, score 87/100)
     - Most engaged post (pink border, 45 reactions)

4. Weekly Trends:
   - Line chart showing uniqueness score over time
   - Purple line (smooth curve)
   - Dots on peak days
   - Hover shows specific day and score

5. Badges Section:
   - "Your Achievements" heading
   - 4-6 badge cards:
     - "7 Day Streak" (fire icon)
     - "Top 5% Unique" (star icon)
     - "Kindred Spirit" (heart icon)
     - "Early Adopter" (lock icon)

Design Style:
- Dashboard aesthetic but minimal
- Data visualization with personality
- Purple and blue gradients throughout
- Celebratory but not gamified
- Clear information hierarchy
```

---

### Screen 8: Mobile App View (PWA)

**Prompt for Stitch AI:**
```
Design the mobile version (375px width) of the main posting screen.

Layout:
- Full height mobile viewport
- Safe area padding (top/bottom for notch)

Background:
- Same dark space gradient
- Fewer stars (performance)

Content (vertically stacked):
1. Header (top):
   - Time display: "9:41" (iOS style, 12px, white, left)
   - Battery/signal indicators (right)
   - App name: "OnlyOne" (14px, center, white, semibold)

2. Main Question (centered):
   - "What did you do differently today?" (28px, white, bold, center-aligned, padding 24px)

3. Text Input:
   - Full width minus 24px padding
   - 3-4 lines tall (auto-expand)
   - Dark surface (#1a1a2e)
   - Rounded 16px
   - Placeholder: "I listened to vinyl..."
   - Character counter: "0 / 200" (bottom-right, 12px)

4. Submit Button (bottom, sticky):
   - Full width minus 24px padding
   - Purple gradient
   - 56px tall (thumb-friendly)
   - "Share My Moment" (16px, white, bold)
   - Bottom padding for safe area

5. Quick Stats Banner (below input, optional):
   - "234 people shared today" (14px, gray, center)
   - Small animated dot (pulse effect)

Bottom Navigation (if logged in):
- 3 tabs: "Post" | "Feed" | "You"
- Icons + labels
- Purple active state
- 64px tall

Design Style:
- Mobile-first interaction
- Large tap targets (min 44x44px)
- One-handed use optimized
- Smooth animations
- Native-feeling despite being PWA
- Bottom-heavy layout (thumb zone)

Special Considerations:
- Add to home screen prompt (iOS Safari style)
- Pull-to-refresh gesture
- Haptic feedback indicators
- Offline mode indicator
```

---

## 🧩 Component Library

### Buttons

#### Primary Button
```
Background: Purple gradient (#8b5cf6 to #a855f7)
Text: White, 16px, semibold
Height: 48px
Border Radius: 12px
Padding: 12px 24px
Hover: Scale 1.02, increased glow
Active: Scale 0.98
```

#### Secondary Button
```
Background: Transparent
Border: 2px solid #8b5cf6
Text: Purple (#8b5cf6), 16px, semibold
Height: 48px
Border Radius: 12px
Hover: Purple background with 10% opacity
```

#### Icon Button
```
Background: #1a1a2e
Icon: 24px, white
Size: 48x48px
Border Radius: 12px
Hover: Purple glow
```

---

### Cards

#### Post Card
```
Background: #1a1a2e
Border Radius: 16px
Padding: 24px
Border: 1px solid #2d2d44
Box Shadow: 0 4px 6px rgba(0, 0, 0, 0.3)
Hover: Lift 4px, increased shadow
```

#### Metric Card
```
Background: Gradient (purple or blue)
Border Radius: 20px
Padding: 32px
Centered content
Glow effect around edges
```

---

### Input Fields

#### Text Input
```
Background: #1a1a2e
Border: 1px solid #2d2d44
Border Radius: 12px
Padding: 16px
Text: White, 16px
Placeholder: Gray (#6b7280), 16px
Focus: Purple border, purple glow
```

#### Text Area
```
Same as text input
Min height: 120px
Resize: Vertical only
Max length indicator
Auto-expand up to 200px
```

---

### Badges

#### Score Badge
```
Background: Purple or Blue gradient
Text: White, 12px, bold
Padding: 6px 12px
Border Radius: 16px (pill)
Icon + text combination
Subtle glow
```

#### Status Badge
```
Background: #2d2d44
Text: Gray, 11px, uppercase, letter-spacing
Padding: 4px 8px
Border Radius: 6px
```

---

### Progress Indicators

#### Circular Progress
```
Size: 120px - 200px (contextual)
Stroke width: 8px
Color: Purple or Blue gradient
Background: #2d2d44
Score in center: Large number
Animation: Smooth fill on load
```

#### Linear Progress
```
Height: 4px
Width: 100%
Background: #2d2d44
Fill: Purple or Blue gradient
Border Radius: 2px
```

---

## 🎬 Animation Guidelines

### Entrance Animations
```
Fade In + Slide Up:
- Duration: 400ms
- Easing: ease-out
- Transform: translateY(20px) to translateY(0)
- Opacity: 0 to 1

Scale In:
- Duration: 300ms
- Easing: ease-out
- Transform: scale(0.95) to scale(1)
- Opacity: 0 to 1
```

### Interaction Animations
```
Button Hover:
- Duration: 200ms
- Easing: ease-in-out
- Transform: scale(1.02)
- Shadow: Increased spread

Button Press:
- Duration: 100ms
- Transform: scale(0.98)

Card Hover:
- Duration: 300ms
- Transform: translateY(-4px)
- Shadow: Elevated
```

### Background Animations
```
Floating Stars:
- Duration: 3s - 5s (varied)
- Easing: ease-in-out
- Transform: translateY(-10px to 10px)
- Opacity: 0.3 to 0.8 (twinkling)
- Infinite loop

Glow Pulse:
- Duration: 2s
- Easing: ease-in-out
- Opacity: 0.4 to 0.7
- Scale: 1 to 1.1
- Infinite alternate
```

---

## 📐 Layout & Spacing

### Grid System
```
Container Max Width: 1200px
Gutters: 24px
Columns: 12 (desktop), 4 (mobile)
```

### Spacing Scale
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
3xl: 64px
4xl: 96px
```

### Breakpoints
```
Mobile:  320px - 767px
Tablet:  768px - 1023px
Desktop: 1024px+
Wide:    1440px+
```

---

## 📱 Responsive Design Rules

### Mobile (< 768px)
- Single column layouts
- Full-width cards (minus 16px padding)
- Larger text inputs (16px minimum to prevent zoom)
- Bottom-sticky buttons
- Simplified navigation (bottom tabs)
- Reduced animations (performance)

### Tablet (768px - 1023px)
- Two-column layouts where appropriate
- Side-by-side metrics
- Expanded navigation
- Medium card sizes

### Desktop (1024px+)
- Multi-column layouts
- Sidebar navigation
- Hover states active
- Full animation suite
- Larger interactive areas

---

## ♿ Accessibility Guidelines

### Color Contrast
- Text on dark background: Minimum 7:1 ratio
- Interactive elements: Minimum 4.5:1 ratio
- Purple accent on dark: Use #a855f7 (lighter shade) for better contrast

### Focus States
- All interactive elements must have visible focus indicator
- Purple outline, 2px, with 2px offset
- Keyboard navigation supported throughout

### Screen Reader Support
- All images have alt text
- Semantic HTML (proper heading hierarchy)
- ARIA labels for icon buttons
- Status messages announced
- Form fields properly labeled

### Touch Targets
- Minimum 44x44px (iOS guideline)
- Adequate spacing between targets (8px minimum)
- Large buttons on mobile (56px height)

---

## 🖼️ Image Specifications

### Logo Variations
```
Full Logo:     PNG, 512x512px, transparent background
Icon Only:     PNG, 192x192px, transparent background
Wordmark:      SVG, scalable
Favicon:       ICO, 32x32px and 16x16px
```

### Social Media Cards
```
Open Graph:    1200x630px, PNG/JPG
Twitter Card:  1200x675px, PNG/JPG
Instagram:     1080x1080px, PNG/JPG
```

### Icons
```
UI Icons:      24x24px, SVG preferred
Emoji:         Use native (Unicode)
Illustrations: SVG, max 800px width
```

---

## 🎨 Stitch AI Generation Tips

### For Best Results:

1. **Be Specific About Layout:**
   - Mention exact pixel dimensions
   - Specify alignment (center, left, etc.)
   - Include padding/margin values

2. **Describe Mood:**
   - Use emotional descriptors (calm, celebratory, comforting)
   - Reference similar designs ("like looking at stars")
   - Mention user feelings

3. **Specify Interactions:**
   - Hover states
   - Active states
   - Animation triggers
   - Transition durations

4. **Include Context:**
   - Mobile vs desktop
   - User journey stage
   - Emotional state of user
   - Brand personality

5. **Reference Colors by Hex:**
   - Don't say "purple" — say "#8b5cf6"
   - Include gradient directions
   - Specify opacity values

6. **Mention Responsive Behavior:**
   - How layout changes on mobile
   - Stacking order
   - Hidden elements at different breakpoints

---

## 📋 Design Checklist

Before finalizing designs, ensure:

- [ ] All screens use consistent color palette
- [ ] Typography scale is consistent
- [ ] Spacing follows 8px grid system
- [ ] Interactive elements have clear hover/active states
- [ ] Mobile versions are fully specified
- [ ] Accessibility contrast ratios met
- [ ] Touch targets are minimum 44px
- [ ] Loading states are designed
- [ ] Empty states are designed
- [ ] Error states are designed
- [ ] Success states are designed
- [ ] Animation timing is specified
- [ ] All icons are consistent style
- [ ] Dark mode is primary (no light mode needed)

---

## 🎯 Priority Order for Design Generation

### Phase 1 (MVP): Generate These First
1. ✅ Screen 1: Landing / Home (posting screen)
2. ✅ Screen 2: Response (uniqueness emphasized)
3. ✅ Screen 5: Anonymous Feed
4. ✅ Screen 8: Mobile version of Screen 1

### Phase 2: Post-Launch
5. ✅ Screen 3: Response (commonality emphasized)
6. ✅ Screen 6: Share Card
7. ✅ Screen 4: Dual metrics view

### Phase 3: Future Features
8. ✅ Screen 7: Personal stats dashboard

---

## 🚀 Ready for Stitch AI

**All specifications complete!**

You can now:
1. Copy any screen prompt into Stitch AI
2. Generate variations
3. Export designs
4. Share with development team

**Tip:** Generate Screen 1 first to establish the visual style, then use "same style as [previous image]" for consistency in subsequent screens.

---

*Document created: October 2025*  
*Ready for design generation* 🎨

