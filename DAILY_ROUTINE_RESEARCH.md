# 🔬 Daily Routine Feature - Research & Planning

## 📋 Feature Overview

**User Input:** Long-form text describing multiple activities throughout their day

**Examples:**
1. "This morning I made coffee before sunrise, watered the plant on my desk, replied to a message I'd been avoiding, took a quiet walk around the block, and ended the day by cooking dinner while music played softly."

2. "This morning I made coffee before sunrise, watered the plant on my desk, wrote a few lines in my notebook, took a quiet walk around the block, and ended the day by watching the sunset without my phone."

**Challenge:** How to measure similarity between multi-activity routines?

---

## 🎓 Lessons Learned from Single Action Matching

### ❌ **What Didn't Work:**

1. **Simple Content Hash** (Too Strict)
   - "went jogging" ≠ "went jog" (typo)
   - No semantic understanding

2. **Fuzzy String Matching Only** (Too Loose)
   - "watching cricket" matched "played cricket" (different actions)
   - No verb/semantic awareness

3. **Database-Level Filtering** (Performance Issues)
   - Slowed down queries
   - Hard to maintain

4. **Negation Blindness**
   - "did exercise" matched "didn't exercise"
   - Opposite meanings treated as same

### ✅ **What Worked:**

1. **Vector Embeddings (pgvector)**
   - Semantic understanding
   - Typo-resistant
   - Paraphrase detection
   - "made pasta" ≈ "cooked pasta"

2. **Composite Similarity Scoring**
   - Vector similarity (70%) + Levenshtein (30%)
   - Multiple signals = better accuracy

3. **Scope-Aware Thresholds**
   - Different thresholds for City (90%) vs World (85%)
   - Context matters

4. **Verb-Focused Matching**
   - Extract core action verbs
   - Prevent false positives

5. **Text Normalization**
   - Unicode NFC, whitespace, punctuation
   - Consistent comparison base

---

## 🧠 Daily Routine: Unique Challenges

### **Key Differences from Single Actions:**

1. **Multiple Activities** - Not just one action, but 5-10 activities
2. **Order Matters (Maybe?)** - "coffee → walk → work" vs "work → walk → coffee"
3. **Time Context** - "morning", "ended the day", "before sunrise"
4. **Connective Text** - "This morning", "and then", "while music played"
5. **Variable Length** - 3 activities vs 10 activities

### **What We Need to Determine:**

**Similarity Question:**
- Are the two examples above 50% similar? 70%? 90%?
- **Common:** coffee, watered plant, quiet walk (3 activities)
- **Different:** replied to message, cooking dinner vs wrote in notebook, watching sunset (4 activities)
- **Overlap:** 3/5 vs 3/6 = 60% vs 50%

**Should this be considered "similar"?**

---

## 🔍 Research: Activity Set Matching Approaches

### **Approach 1: Activity Extraction + Set Similarity**

#### **Step 1: Extract Activities**
Use NLP to split the routine into individual activities:

```
Input: "I made coffee, walked the dog, and read a book"
↓
Activities:
  1. made coffee
  2. walked the dog
  3. read a book
```

**Tools:**
- compromise.js (clause splitting, verb extraction)
- Sentence splitting by commas, "and", "then"
- Remove temporal markers ("this morning", "later")

#### **Step 2: Normalize Each Activity**
Apply our existing normalization:
- Text normalization (Unicode, whitespace)
- Verb extraction ("made coffee" → "make coffee")
- Stemming ("walking" → "walk")

#### **Step 3: Calculate Set Similarity**

**Jaccard Similarity:**
```
Jaccard = |A ∩ B| / |A ∪ B|

Example:
A = {coffee, water plant, walk, message, cook}
B = {coffee, water plant, walk, notebook, sunset}

Intersection: {coffee, water plant, walk} = 3
Union: {coffee, water plant, walk, message, cook, notebook, sunset} = 7

Jaccard = 3/7 = 0.43 = 43% similar
```

**Weighted Jaccard (with embeddings):**
```
Instead of exact match, use semantic similarity threshold

"replied to message" ~0.6~ "wrote in notebook" (both creative tasks)
"cooking dinner" ~0.3~ "watching sunset" (different)

Soft overlap = better accuracy
```

---

### **Approach 2: Vector Embedding of Entire Routine**

#### **Pros:**
- Captures semantic flow
- Understands context
- Handles paraphrasing naturally

#### **Cons:**
- Doesn't tell you WHICH activities overlap
- Less granular
- Harder to explain to users

#### **Verdict:** Good as a **secondary signal**, not primary

---

### **Approach 3: Hybrid (Activity Extraction + Embeddings)**

**RECOMMENDED APPROACH:**

```typescript
1. Extract activities from routine
   → ["made coffee", "watered plant", "quiet walk", ...]

2. Generate embedding for each activity
   → [vec1, vec2, vec3, ...]

3. For each activity in Routine A:
   - Find best match in Routine B using vector similarity
   - Threshold: 0.75 (semantic match)
   - Count as "overlapping" if above threshold

4. Calculate overlap percentage:
   - overlaps / min(activities_A, activities_B)
   - Or: overlaps / max(activities_A, activities_B)
   - Or: Average of both (more balanced)

5. Apply similarity threshold:
   - 70%+ overlap = "similar routine"
   - 40-70% overlap = "somewhat similar"
   - < 40% = "different routine"
```

**Example Calculation:**
```
Routine A: [coffee, water plant, message, walk, cook] (5)
Routine B: [coffee, water plant, notebook, walk, sunset] (5)

Matching (using embeddings):
  coffee ↔ coffee (1.0) ✅
  water plant ↔ water plant (0.95) ✅
  message ↔ notebook (0.65) ❌ (below 0.75)
  walk ↔ walk (0.98) ✅
  cook ↔ sunset (0.2) ❌

Overlaps: 3
Similarity: 3/5 = 60%

Result: "Somewhat similar routine"
```

---

## 🎯 Proposed Matching Logic

### **Core Algorithm:**

```typescript
function matchDailyRoutines(routineA: string, routineB: string): {
  similarity: number
  overlappingActivities: string[]
  uniqueActivities: string[]
  totalActivities: number
} {
  // 1. Extract activities
  const activitiesA = extractActivities(routineA)
  const activitiesB = extractActivities(routineB)
  
  // 2. Normalize each activity
  const normalizedA = activitiesA.map(normalize)
  const normalizedB = activitiesB.map(normalize)
  
  // 3. Generate embeddings
  const embeddingsA = await Promise.all(normalizedA.map(generateEmbedding))
  const embeddingsB = await Promise.all(normalizedB.map(generateEmbedding))
  
  // 4. Find overlaps (using semantic similarity)
  const overlaps = []
  for (const [i, embA] of embeddingsA.entries()) {
    for (const [j, embB] of embeddingsB.entries()) {
      const sim = cosineSimilarity(embA, embB)
      if (sim >= 0.75) { // Semantic match
        overlaps.push({
          activityA: activitiesA[i],
          activityB: activitiesB[j],
          similarity: sim
        })
        break // Each activity can only match once
      }
    }
  }
  
  // 5. Calculate similarity
  const minActivities = Math.min(activitiesA.length, activitiesB.length)
  const similarity = overlaps.length / minActivities
  
  return {
    similarity,
    overlappingActivities: overlaps.map(o => o.activityA),
    uniqueActivities: activitiesA.filter(a => !overlaps.some(o => o.activityA === a)),
    totalActivities: activitiesA.length
  }
}
```

### **Similarity Thresholds:**

```
>= 80% overlap → Same routine (only minor differences)
60-80% overlap → Similar routine (core activities match)
40-60% overlap → Somewhat similar (some overlap)
< 40% overlap  → Different routines
```

---

## ⚠️ Critical Considerations

### **1. Activity Extraction Accuracy**

**Challenge:** How do we split activities correctly?

**Bad Extraction:**
```
Input: "I made coffee and walked my dog"
Wrong: ["I made coffee and walked my dog"] (1 activity)
Right: ["made coffee", "walked my dog"] (2 activities)
```

**Solution:**
- Split on coordinating conjunctions: "and", "then", ","
- Use compromise.js clause detection
- Validate each extracted phrase is an action (has verb)

### **2. Minimum Activity Count**

**Should we require a minimum number of activities?**

```
User 1: "coffee, walk, work, lunch, gym, dinner" (6 activities) ✅
User 2: "coffee" (1 activity) ❌ Not a routine
```

**Recommendation:** Require 2+ activities for "daily routine" type

### **3. Time-of-Day Matters?**

**Question:** Should "coffee in morning" ≠ "coffee at night"?

**Example:**
```
Routine A: "morning coffee, afternoon walk, evening dinner"
Routine B: "evening coffee, morning walk, afternoon dinner"
```

**Same activities, different times → Should match?**

**Recommendation:** 
- Extract time markers: "morning", "afternoon", "evening", "night"
- Reduce similarity if time context is opposite
- But don't make it a hard blocker (times are flexible)

### **4. Semantic vs Exact Matching**

**Critical for Routines:**

```
"made coffee" vs "brewed coffee" → Same activity (0.85+ similarity) ✅
"walked dog" vs "ran with dog" → Different (walk ≠ run) ❌
"read book" vs "watched TV" → Different (read ≠ watch) ❌
```

**Use vector embeddings + verb matching (same as single actions)**

### **5. Order Independence**

**Question:** Does order matter?

```
"coffee → shower → work" 
vs 
"shower → coffee → work"
```

**Recommendation:** 
- Order should NOT matter for overlap detection
- But could be a signal for "exact same routine" (bonus points)
- Focus on activity SET, not sequence

---

## 🚨 Pitfalls to Avoid (Learning from Action Matching)

### **1. Don't Over-Match**

**Bad:**
```
"morning routine: coffee, shower, work"
matches
"evening routine: coffee, walk, sleep"
```
Just because both have "coffee" doesn't mean routines are similar!

**Solution:** Require 50%+ overlap minimum

### **2. Don't Under-Match**

**Bad:**
```
"I brewed coffee, watered plants, went for a jog"
doesn't match
"I made coffee, watered the plants, went jogging"
```

**Solution:** Use embeddings for semantic matching

### **3. Handle Negations**

**Critical:**
```
"did yoga, didn't eat breakfast, went to work"
vs
"did yoga, ate breakfast, went to work"
```

**Solution:** Detect negations ("didn't", "skipped") and treat as different activities

### **4. Filter Gibberish/Spam**

**Examples:**
```
"aaaa bbbb cccc dddd eeee" ❌
"same same same same same" ❌
"coffee coffee coffee coffee" ❌ (repetitive)
```

**Solution:**
- Check each extracted activity for coherence
- Require variety (no repetition)
- Minimum word diversity

### **5. Watch for Gaming**

**Examples:**
```
User copies trending routine verbatim ❌
User adds one word to bypass detection ❌
```

**Solution:**
- Exact text match = flag as potential copy
- Very high similarity (95%+) = suspicious
- Rate limiting on routine submissions

---

## 📊 Proposed Scoring Logic

### **Similarity Calculation:**

```typescript
function calculateRoutineSimilarity(
  activitiesA: string[],
  activitiesB: string[],
  embeddingsA: number[][],
  embeddingsB: number[][]
): number {
  // Find semantic matches
  const matches = []
  const usedB = new Set<number>()
  
  for (let i = 0; i < activitiesA.length; i++) {
    let bestMatch = -1
    let bestSim = 0
    
    for (let j = 0; j < activitiesB.length; j++) {
      if (usedB.has(j)) continue
      
      const sim = cosineSimilarity(embeddingsA[i], embeddingsB[j])
      if (sim > bestSim) {
        bestSim = sim
        bestMatch = j
      }
    }
    
    // Consider it a match if similarity >= 0.75
    if (bestSim >= 0.75 && bestMatch !== -1) {
      matches.push({
        activityA: activitiesA[i],
        activityB: activitiesB[bestMatch],
        similarity: bestSim
      })
      usedB.add(bestMatch)
    }
  }
  
  // Calculate overlap percentage
  const minLength = Math.min(activitiesA.length, activitiesB.length)
  const maxLength = Math.max(activitiesA.length, activitiesB.length)
  
  // Use harmonic mean for balanced scoring
  const overlapPercentage = (2 * matches.length) / (minLength + maxLength)
  
  return overlapPercentage
}
```

### **Example:**
```
Routine A: 5 activities
Routine B: 5 activities
Matches: 3

Harmonic mean: (2 * 3) / (5 + 5) = 6/10 = 0.6 = 60%
```

### **Thresholds:**

```
Scope     | Match Threshold | Reason
----------|----------------|---------------------------
City      | 65%            | Stricter (small community)
State     | 60%            | Moderate
Country   | 55%            | Relaxed
World     | 50%            | Most relaxed
```

---

## 🎨 UI/UX Considerations

### **Display to User:**

**Instead of:**
"60% similar to 5 other routines"

**Show:**
"Your routine shares 3 activities with 5 others"

**Breakdown:**
```
✅ Common: coffee, watered plant, walk
🌟 Unique to you: replied to message, cooking dinner
```

**Percentile Display:**
```
🏆 Top 15%
3 of 20 people had similar routines
```

### **Card Design:**

```
┌──────────────────────────────────────┐
│ "I made coffee, watered plants..."  │
│                                      │
│ 🏆 Top 15%      3 of 20 people      │
│ 🌍 World        2 hrs ago           │
│                                      │
│ Activities: 5                        │
│ Unique to you: 2                     │
└──────────────────────────────────────┘
```

### **Feed Display:**

**Option A: Show Full Text**
```
This morning I made coffee before sunrise, watered the plant on 
my desk, replied to a message I'd been avoiding...
[Read more]
```

**Option B: Show Activity List**
```
My Day:
  • Made coffee before sunrise
  • Watered plant
  • Replied to message
  • Took a walk
  • Cooked dinner
```

**Recommendation:** Option A (keeps natural flow)

---

## 🔧 Technical Implementation Plan

### **Phase 1: Activity Extraction**

```typescript
function extractActivities(routine: string): string[] {
  // 1. Split by common delimiters
  const clauses = routine
    .split(/,\s*and\s+|,\s+|\s+and\s+then\s+|\s+then\s+/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  // 2. Remove temporal/connective phrases
  const cleaned = clauses.map(clause => {
    return clause
      .replace(/^(this morning|this afternoon|this evening|later|after that|before that|then|and)\s+/gi, '')
      .replace(/^I\s+/i, '') // Remove leading "I"
      .trim()
  })
  
  // 3. Validate each is an action (has verb)
  const doc = nlp(routine)
  const activities = cleaned.filter(activity => {
    const activityDoc = nlp(activity)
    const hasVerb = activityDoc.verbs().length > 0
    const hasContent = activity.split(/\s+/).length >= 2 // At least 2 words
    return hasVerb && hasContent
  })
  
  return activities
}
```

### **Phase 2: Similarity Matching**

```typescript
function matchRoutines(
  routineA: string,
  routineB: string,
  scope: string
): {
  similarity: number
  overlaps: number
  uniqueA: number
  uniqueB: number
} {
  const activitiesA = extractActivities(routineA)
  const activitiesB = extractActivities(routineB)
  
  // Generate embeddings for each activity
  const embsA = await Promise.all(activitiesA.map(generateEmbedding))
  const embsB = await Promise.all(activitiesB.map(generateEmbedding))
  
  // Find best matches using Hungarian algorithm (optimal pairing)
  const matches = findOptimalMatches(embsA, embsB, threshold=0.75)
  
  // Calculate similarity
  const overlapCount = matches.length
  const totalActivities = Math.max(activitiesA.length, activitiesB.length)
  const similarity = overlapCount / totalActivities
  
  return {
    similarity,
    overlaps: overlapCount,
    uniqueA: activitiesA.length - matches.filter(m => m.from === 'A').length,
    uniqueB: activitiesB.length - matches.filter(m => m.from === 'B').length,
  }
}
```

### **Phase 3: Storage & Retrieval**

```sql
-- Store activities as JSONB array
ALTER TABLE posts 
ADD COLUMN activities JSONB; -- ["made coffee", "watered plant", ...]

-- Store activity embeddings as array of vectors
ALTER TABLE posts
ADD COLUMN activity_embeddings vector[]; -- [vec1, vec2, vec3]

-- Index for fast retrieval
CREATE INDEX idx_posts_activities ON posts USING gin(activities);
```

---

## 🎪 Edge Cases to Handle

### **1. Too Few Activities**
```
Input: "I had coffee"
→ Only 1 activity
→ Reject: "Please describe at least 2 activities for a routine"
```

### **2. Too Many Activities**
```
Input: 50 activities listed
→ Unrealistic, likely spam
→ Limit: Max 15 activities
→ Show: "Please keep your routine under 15 activities"
```

### **3. Repetitive Activities**
```
Input: "coffee, coffee, coffee, coffee, coffee"
→ Check for duplicates
→ Reject: "Please list different activities"
```

### **4. Non-Actions**
```
Input: "it was sunny, the sky was blue, I felt happy"
→ No verbs/actions
→ Reject: "Please describe what you DID, not how you felt"
```

### **5. Order Sensitivity**
```
Morning routine: [coffee, shower, work]
vs
Evening routine: [work, shower, coffee]

→ Same activities, different context
→ Solution: Extract time markers, reduce similarity if opposite
```

---

## 🎯 Uniqueness Scoring

### **For Routines:**

**Not just overlap, but WHICH activities are unique**

```
Your routine: 5 activities
  3 common (60% of users did)
  2 unique (only you did)

Score: 40% unique (weighted by rarity of each activity)
```

**Advanced Scoring:**
```typescript
function scoreRoutineUniqueness(activities: string[], allRoutines: Routine[]): number {
  const activityRarities = activities.map(activity => {
    // How many people did THIS specific activity?
    const count = countActivityOccurrences(activity, allRoutines)
    const rarity = 1 - (count / allRoutines.length)
    return rarity
  })
  
  // Average rarity across all activities
  const avgRarity = activityRarities.reduce((a, b) => a + b, 0) / activities.length
  return avgRarity * 100 // Convert to percentage
}
```

---

## 🚀 Recommended Implementation

### **Step 1: Validate & Extract** (Week 1)
- Build activity extraction logic
- Validate minimum 2 activities
- Detect and filter gibberish
- Test on 100 sample routines

### **Step 2: Matching Algorithm** (Week 2)
- Implement hybrid matching (embeddings + overlap)
- Test on paired routines
- Tune thresholds
- Verify no false positives/negatives

### **Step 3: UI/UX** (Week 3)
- Design routine cards (show activity count)
- Add "Unique to you" breakdown
- Test mobile/desktop layouts
- Add to feed with "Routine" badge

### **Step 4: Scale Testing** (Week 4)
- Test with 1000+ routines
- Measure performance (embedding generation time)
- Optimize queries
- Add caching

---

## 💭 Final Thoughts

### **Should We Build This?**

**PROS:**
- ✅ Different use case from single actions
- ✅ Appeals to reflective users
- ✅ More content variety
- ✅ Tells a story (not just one action)

**CONS:**
- ⚠️ Complex to implement correctly
- ⚠️ Higher computational cost (multiple embeddings)
- ⚠️ Harder to explain similarity to users
- ⚠️ Potential for gaming/copying

### **Recommendation:**

**Start Small:**
1. MVP: Simple extraction + Jaccard similarity
2. Test with small user group
3. Iterate based on feedback
4. Add embeddings if needed

**Alternative:**
- Keep as "premium" feature (not default)
- Show trending routines for inspiration
- But don't let it dominate the feed

---

## 📌 Next Steps

**Before coding:**

1. ✅ **User Research:** Would users actually use this? Survey your users
2. ✅ **Validate Extraction:** Test activity splitting on 50 sample texts
3. ✅ **Define Success:** What's a "good" match? Get examples
4. ✅ **Edge Cases:** Document all weird inputs and expected behavior
5. ✅ **Performance Budget:** How long can matching take? (< 2 seconds?)

**Then:**
- Build extraction logic
- Test thoroughly
- Ship MVP
- Iterate

---

**My Opinion:** It's a **good feature** but **not core to your app's value prop**. 

Your app is about **"did something NO ONE else did"** - routines make everything more common.

**Better alternative:** Keep routines, but frame them as **"Day Summary"** and focus on finding the **most unique activity** within the routine, rather than matching the whole routine.

What do you think? Should we proceed with full routine matching or pivot to the "most unique activity in your day" approach?

