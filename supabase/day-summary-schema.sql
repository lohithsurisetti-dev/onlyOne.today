-- ============================================================
-- DAY SUMMARY FEATURE - Database Schema Updates
-- ============================================================
-- Adds support for multi-activity day summaries with 
-- activity-level embeddings and matching

-- 1. Add columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS activities JSONB, -- Array of extracted activities
ADD COLUMN IF NOT EXISTS activity_count INTEGER, -- Count of activities
ADD COLUMN IF NOT EXISTS activity_embeddings vector[]; -- Array of embeddings (one per activity)

-- 2. Create index on activities for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_posts_activities ON posts USING gin(activities);

-- 3. Create index on activity_count for filtering
CREATE INDEX IF NOT EXISTS idx_posts_activity_count ON posts (activity_count) WHERE activity_count IS NOT NULL;

-- 4. Create index on input_type for filtering day vs action
CREATE INDEX IF NOT EXISTS idx_posts_input_type ON posts (input_type);

-- 5. Update existing posts to have NULL for new columns (they're actions, not days)
-- No data migration needed - new columns default to NULL

-- ============================================================
-- RPC FUNCTION: Match Day Summaries by Activity Overlap
-- ============================================================

CREATE OR REPLACE FUNCTION match_day_summaries(
  query_activities JSONB, -- User's activities as JSON array
  query_activity_embeddings vector[], -- User's activity embeddings
  query_scope TEXT, -- 'city' | 'state' | 'country' | 'world'
  query_location_city TEXT DEFAULT NULL,
  query_location_state TEXT DEFAULT NULL,
  query_location_country TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.70, -- 70% overlap to be considered "similar"
  match_limit INT DEFAULT 100
) RETURNS TABLE (
  id UUID,
  content TEXT,
  activities JSONB,
  activity_count INTEGER,
  scope TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  overlap_percentage FLOAT, -- How much the days overlap (0.0 to 1.0)
  matched_activities INTEGER, -- Count of matched activities
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- For day summaries, we need to:
  -- 1. Find other day summaries (input_type = 'day')
  -- 2. Calculate activity overlap using embeddings
  -- 3. Return days with overlap >= threshold
  
  -- Note: The actual overlap calculation will be done in application code
  -- because PostgreSQL doesn't have built-in cosine similarity for vector arrays
  -- This function just returns candidate days for comparison
  
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.activities,
    p.activity_count,
    p.scope,
    p.location_city,
    p.location_state,
    p.location_country,
    0.0::FLOAT AS overlap_percentage, -- Will be calculated in app
    0::INTEGER AS matched_activities, -- Will be calculated in app
    p.created_at
  FROM posts p
  WHERE 
    p.input_type = 'day' -- Only day summaries
    AND p.activities IS NOT NULL
    AND p.activity_count >= 2 -- Valid day summaries
    AND p.created_at >= CURRENT_DATE -- Today only
    AND (
      -- Scope filtering (hierarchical)
      CASE 
        WHEN query_scope = 'world' THEN TRUE
        WHEN query_scope = 'country' AND query_location_country IS NOT NULL THEN 
          p.location_country = query_location_country
        WHEN query_scope = 'state' AND query_location_state IS NOT NULL THEN 
          p.location_state = query_location_state
        WHEN query_scope = 'city' AND query_location_city IS NOT NULL THEN 
          p.location_city = query_location_city
        ELSE TRUE
      END
    )
  ORDER BY p.created_at DESC
  LIMIT match_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN posts.activities IS 'Extracted activities from day summary (JSONB array)';
COMMENT ON COLUMN posts.activity_count IS 'Number of activities in day summary';
COMMENT ON COLUMN posts.activity_embeddings IS 'Vector embeddings for each activity (vector array)';

COMMENT ON FUNCTION match_day_summaries IS 'Find day summaries to compare against (activity overlap calculated in app)';

