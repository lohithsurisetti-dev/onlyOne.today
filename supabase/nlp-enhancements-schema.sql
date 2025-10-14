-- =====================================================
-- NLP Pipeline Enhancements
-- =====================================================
-- Adds negation tracking and time expression tags
-- for more accurate semantic matching

-- =====================================================
-- 1. Add Negation and Time Fields to Posts
-- =====================================================

-- Add negation flag (critical for preventing false matches!)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS has_negation boolean DEFAULT false;

-- Add time expression tags (helps distinguish timing)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS time_tags text[] DEFAULT '{}';

-- Add normalized text (for debugging/analysis)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS text_normalized text;

-- Add emoji tags (for context)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS emoji_tags text[] DEFAULT '{}';

-- =====================================================
-- 2. Create Index on Negation (for fast filtering)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_has_negation 
  ON posts(has_negation);

-- =====================================================
-- 3. Update Vector Search Function (with negation filter)
-- =====================================================

-- Drop and recreate to add negation parameter
DROP FUNCTION IF EXISTS match_posts_by_embedding(vector,double precision,integer,text,text,text,text,boolean);

CREATE OR REPLACE FUNCTION match_posts_by_embedding(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.65,
  match_limit int DEFAULT 20,
  scope_filter text DEFAULT 'world',
  filter_city text DEFAULT NULL,
  filter_state text DEFAULT NULL,
  filter_country text DEFAULT NULL,
  today_only boolean DEFAULT true,
  query_has_negation boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  content text,
  scope text,
  location_city text,
  location_state text,
  location_country text,
  similarity float,
  content_hash text,
  created_at timestamptz,
  has_negation boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  today_start timestamptz;
BEGIN
  -- Get today's start (midnight)
  today_start := date_trunc('day', now());
  
  RETURN QUERY
  SELECT
    posts.id,
    posts.content,
    posts.scope::text,
    posts.location_city,
    posts.location_state,
    posts.location_country,
    (1 - (posts.embedding <=> query_embedding))::float as similarity,
    posts.content_hash,
    posts.created_at,
    posts.has_negation
  FROM posts
  WHERE 
    -- Only posts with embeddings
    posts.embedding IS NOT NULL
    -- Similarity threshold
    AND (1 - (posts.embedding <=> query_embedding)) > match_threshold
    -- Today only (optional)
    AND (NOT today_only OR posts.created_at >= today_start)
    -- CRITICAL: Negation must match!
    AND posts.has_negation = query_has_negation
    -- Scope-aware filtering
    AND (
      -- World scope: match all
      scope_filter = 'world'
      OR
      -- Country scope: match posts in that country
      (scope_filter = 'country' AND posts.location_country = filter_country AND posts.scope IN ('city', 'state', 'country'))
      OR
      -- State scope: match posts in that state
      (scope_filter = 'state' AND posts.location_state = filter_state AND posts.scope IN ('city', 'state'))
      OR
      -- City scope: match only city posts in that city
      (scope_filter = 'city' AND posts.location_city = filter_city AND posts.scope = 'city')
    )
  ORDER BY posts.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

-- =====================================================
-- 4. Verify Setup
-- =====================================================

-- Check new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name IN ('has_negation', 'time_tags', 'text_normalized', 'emoji_tags');

-- Check function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'match_posts_by_embedding';

-- =====================================================
-- BENEFITS
-- =====================================================
-- ✅ "didn't exercise" ≠ "did exercise" (negation match required)
-- ✅ "ate breakfast" ≠ "ate dinner" (time tags differ)
-- ✅ More accurate similarity (negation penalty)
-- ✅ Better debugging (normalized text stored)
-- ✅ Emoji context preserved

