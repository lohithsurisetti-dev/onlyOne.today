-- =====================================================
-- TRUNCATE ALL TABLES (Fresh Start)
-- =====================================================
-- WARNING: This will DELETE ALL DATA!
-- Use this for testing the new rarity-based scoring
-- =====================================================

-- Truncate related tables first (to avoid foreign key errors)
TRUNCATE TABLE post_matches CASCADE;

-- Truncate main posts table (CASCADE handles remaining dependencies)
TRUNCATE TABLE posts RESTART IDENTITY CASCADE;

-- Truncate cache/rate limit tables (optional, but recommended for fresh start)
TRUNCATE TABLE rate_limits RESTART IDENTITY CASCADE;
TRUNCATE TABLE query_cache RESTART IDENTITY CASCADE;

-- Verify tables are empty
SELECT 
  'posts' as table_name, 
  COUNT(*) as row_count 
FROM posts
UNION ALL
SELECT 
  'post_matches', 
  COUNT(*) 
FROM post_matches
UNION ALL
SELECT 
  'rate_limits', 
  COUNT(*) 
FROM rate_limits
UNION ALL
SELECT 
  'query_cache', 
  COUNT(*) 
FROM query_cache;

-- Expected result: All counts should be 0

-- =====================================================
-- After running this, your database is fresh!
-- Perfect for testing the new rarity-based scoring.
-- =====================================================

