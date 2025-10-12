# 📊 Scoring System Explained

## How We Calculate Uniqueness & Commonality

---

## 🧮 **The Math**

Every post gets TWO scores that **always add up to 100%**:

```
Uniqueness Score + Commonality Score = 100%
```

### **Formula:**

```typescript
matchCount = number of similar posts found
totalRecentPosts = posts from last 24 hours

uniquenessScore = 100 - ((matchCount / totalRecentPosts) × 100)
commonalityScore = 100 - uniquenessScore
```

---

## 📈 **Examples**

### **Example 1: Truly Unique**
```
Post: "Wrote a letter by hand"
Match Count: 0 (no one else did this)
Total Recent Posts: 100

Uniqueness = 100 - (0/100 × 100) = 100%
Commonality = 0%

Display: ✨ 100% · 👥 0 people
```

### **Example 2: Somewhat Unique**
```
Post: "Baked banana bread"
Match Count: 5 (5 others did this)
Total Recent Posts: 100

Uniqueness = 100 - (5/100 × 100) = 95%
Commonality = 5%

Display: ✨ 95% · 👥 5 people
```

### **Example 3: Common**
```
Post: "Listened to Taylor Swift"
Match Count: 50 (50 others did this)
Total Recent Posts: 100

Uniqueness = 100 - (50/100 × 100) = 50%
Commonality = 50%

Display: ✨ 50% · 👥 50 people
```

### **Example 4: Very Common**
```
Post: "Doomscrolled Instagram"
Match Count: 80 (80 others did this)
Total Recent Posts: 100

Uniqueness = 100 - (80/100 × 100) = 20%
Commonality = 80%

Display: ✨ 20% · 👥 80 people
```

---

## 🎨 **Visual Classification**

We use **color gradients** to indicate the dominant trait:

### **Purple/Pink Gradient (Unique-Dominant)**
- **When:** Uniqueness ≥ 70%
- **Meaning:** This is rare! Most people didn't do this
- **Emotion:** Pride, individuality, creativity

### **Blue/Cyan Gradient (Common-Dominant)**
- **When:** Commonality ≥ 70% (Uniqueness ≤ 30%)
- **Meaning:** This is popular! Lots of people did this
- **Emotion:** Belonging, validation, trends

### **Gray/Slate Gradient (Balanced)**
- **When:** 30% < Uniqueness < 70%
- **Meaning:** Neither super unique nor super common
- **Emotion:** Neutral, in-between

---

## 🎯 **Why Show Both?**

### **Old Approach (Binary):**
```
IF uniqueness >= 70%:
  Label: "Unique" ✨
ELSE:
  Label: "Common" 👥
```

**Problem:** 
- A 69% unique post is labeled "common" (wrong!)
- Users only see one perspective
- Feels judgmental

### **New Approach (Dual Metrics):**
```
Always show:
  ✨ 69% Unique
  👥 31 people

User decides what to celebrate!
```

**Benefits:**
- ✅ More accurate
- ✅ Less judgmental
- ✅ User choice
- ✅ Both perspectives valid

---

## 🔄 **How It Works in the App**

### **1. Feed Cards**
Every card shows:
```
┌─────────────────────────────┐
│ "Went to the museum"        │
│                             │
│ ✨ 94% · 👥 2 people        │  ← Both metrics!
│ 3m ago                      │
│                             │
│ [😂 5] [🎨 12] [🔥 8]       │
└─────────────────────────────┘
```

### **2. Response Page**
User can toggle:
```
[Uniqueness 94%] [Commonality 6%]
        ↑              ↑
    Selected      Not selected

Share button adapts:
- "Share Uniqueness" (if uniqueness selected)
- "Share Commonality" (if commonality selected)
```

### **3. Share Cards**
Generated card shows the chosen metric:
- If sharing uniqueness: Purple theme, "94% unique!"
- If sharing commonality: Blue theme, "6% with you!"

---

## 🧠 **The Psychology**

### **For Unique Posts (✨ 90%+):**
- **Message:** "You're rare! Share this to show your individuality"
- **Emotion:** Pride, creativity, rebellion
- **Share Style:** "I dare you to beat this!"

### **For Common Posts (👥 70%+):**
- **Message:** "You're part of the tribe! Share this to find your people"
- **Emotion:** Belonging, validation, community
- **Share Style:** "Join us! We all did this"

### **For Balanced Posts (40-60% each):**
- **Message:** "You're in the sweet spot - unique but relatable"
- **Emotion:** Balanced, interesting, curious
- **Share Style:** "What would YOU do?"

---

## 🎯 **Filtering in Feed**

Users can still filter by type:

### **"Unique" Filter**
Shows posts where **uniqueness ≥ 70%**

### **"Common" Filter**
Shows posts where **commonality ≥ 70%** (uniqueness ≤ 30%)

### **"All" Filter**
Shows everything, sorted by timestamp

But even when filtered, **both metrics are always visible** on the card.

---

## 📊 **Summary**

| Aspect | Old System | New System |
|--------|-----------|------------|
| Display | One label | Both scores |
| Classification | Binary (unique/common) | Gradient (purple/blue/gray) |
| Threshold | Fixed 70% | Dynamic based on dominance |
| User Choice | Determined by app | User picks what to share |
| Psychology | Judgmental | Celebrating both |
| Accuracy | Can be misleading | Always truthful |

---

## 💡 **Key Insight**

> **Every post is BOTH unique AND common.**
> 
> The question isn't "which one is it?" 
> 
> The question is "which one do YOU want to celebrate today?"

This is the **Dual Metric Innovation** that makes OnlyOne.today emotionally complete! ✨


