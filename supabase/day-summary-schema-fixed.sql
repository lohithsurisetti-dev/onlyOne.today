-- ============================================================
-- DAY SUMMARY FEATURE - Database Schema Updates (FIXED)
-- ============================================================
-- Stores activity embeddings as JSONB instead of vector[]
-- (pgvector doesn't support vector arrays natively)

-- 1. Drop the problematic vector[] column if it exists
ALTER TABLE posts DROP COLUMN IF EXISTS activity_embeddings;

-- 2. Add columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS activities JSONB, -- Array of extracted activities
ADD COLUMN IF NOT EXISTS activity_count INTEGER, -- Count of activities
ADD COLUMN IF NOT EXISTS activity_embeddings JSONB; -- Array of embeddings stored as JSONB

-- 3. Create index on activities for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_posts_activities ON posts USING gin(activities);

-- 4. Create index on activity_embeddings for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_posts_activity_embeddings ON posts USING gin(activity_embeddings);

-- 5. Create index on activity_count for filtering
CREATE INDEX IF NOT EXISTS idx_posts_activity_count ON posts (activity_count) WHERE activity_count IS NOT NULL;

-- 6. Create index on input_type for filtering day vs action
CREATE INDEX IF NOT EXISTS idx_posts_input_type ON posts (input_type);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN posts.activities IS 'Extracted activities from day summary (JSONB array of strings)';
COMMENT ON COLUMN posts.activity_count IS 'Number of activities in day summary';
COMMENT ON COLUMN posts.activity_embeddings IS 'Vector embeddings for each activity (JSONB array of number arrays)';

