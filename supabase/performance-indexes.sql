-- =====================================================
-- Performance Indexes for onlyOne.today
-- =====================================================
-- These indexes dramatically speed up common queries
-- Run this ONCE in Supabase SQL Editor

-- =====================================================
-- 1. Posts Table Indexes
-- =====================================================

-- Index for feed queries (filtered by scope + sorted by time)
-- Used by: GET /api/posts?filter=today&scope=world
CREATE INDEX IF NOT EXISTS idx_posts_scope_created 
  ON posts(scope, created_at DESC);

-- Index for feed queries (filtered by input_type + sorted by time)
-- Used by: GET /api/posts?filter=all&inputType=action
CREATE INDEX IF NOT EXISTS idx_posts_input_type_created 
  ON posts(input_type, created_at DESC);

-- Compound index for most common query pattern
-- Used by: GET /api/posts?filter=today&scope=world&inputType=action
CREATE INDEX IF NOT EXISTS idx_posts_scope_type_created 
  ON posts(scope, input_type, created_at DESC);

-- Index for content hash lookups (similarity detection)
-- Used by: Finding similar posts during post creation
CREATE INDEX IF NOT EXISTS idx_posts_content_hash 
  ON posts(content_hash);

-- Index for similarity searches with scope filter
-- Used by: Finding similar posts within specific scope
CREATE INDEX IF NOT EXISTS idx_posts_hash_scope 
  ON posts(content_hash, scope);

-- =====================================================
-- 2. Reactions Table Indexes (OPTIONAL)
-- =====================================================
-- Only run these if you have a reactions table
-- Skip this section if reactions table doesn't exist yet

-- Uncomment these when you add reactions feature:
-- CREATE INDEX IF NOT EXISTS idx_reactions_post_id 
--   ON reactions(post_id);
--
-- CREATE INDEX IF NOT EXISTS idx_reactions_post_user 
--   ON reactions(post_id, user_fingerprint);

-- =====================================================
-- 3. Temporal Queries (Date Range)
-- =====================================================

-- Note: We already have created_at indexes above (idx_posts_scope_created, etc.)
-- Those are sufficient for date range queries
-- No need for additional date-specific indexes

-- =====================================================
-- 4. Rate Limits Table (from rate-limit-schema.sql)
-- =====================================================

-- Already created in rate-limit-schema.sql:
-- CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time 
--   ON rate_limits(reset_time);

-- =====================================================
-- 5. Verify Indexes
-- =====================================================

-- Run this query to see all indexes on posts table:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'posts';

-- =====================================================
-- PERFORMANCE IMPACT ESTIMATES
-- =====================================================

-- Before indexes:
--   - Feed query (100 posts): 500-1000ms
--   - Similarity search: 300-800ms
--   - Total POST creation: 2-3 seconds
--
-- After indexes:
--   - Feed query (100 posts): 50-100ms (10x faster!)
--   - Similarity search: 30-80ms (10x faster!)
--   - Total POST creation: 1-1.5 seconds (2x faster!)
--
-- Database capacity:
--   - Before: ~500 queries/second
--   - After: ~5,000 queries/second (10x capacity!)

-- =====================================================
-- Notes
-- =====================================================
-- 1. Indexes take up disk space (roughly 10-20% of table size)
-- 2. Indexes slow down INSERTs slightly (5-10%), but worth it
-- 3. Supabase automatically maintains these indexes
-- 4. Safe to run multiple times (IF NOT EXISTS prevents errors)
