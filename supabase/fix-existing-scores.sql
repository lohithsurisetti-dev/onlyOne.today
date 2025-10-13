-- Fix scores for all existing posts by recalculating based on actual matches
-- This corrects the frozen score issue

-- Step 1: Update match_count for all posts based on actual matching posts
UPDATE posts p1
SET match_count = (
  SELECT COUNT(*)
  FROM posts p2
  WHERE p2.content_hash = p1.content_hash
    AND p2.id != p1.id
    AND p2.created_at > NOW() - INTERVAL '24 hours'
);

-- Step 2: Recalculate uniqueness_score based on new match_count
-- Formula: GREATEST(0, 100 - (match_count * 10))
UPDATE posts
SET uniqueness_score = GREATEST(0, 100 - (match_count * 10));

-- Verify results
SELECT 
  content,
  content_hash,
  uniqueness_score,
  match_count,
  created_at
FROM posts
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- Show posts with same hash (should have same scores now)
SELECT 
  content,
  content_hash,
  uniqueness_score,
  match_count,
  location_city,
  created_at
FROM posts
WHERE content_hash IN (
  SELECT content_hash 
  FROM posts 
  GROUP BY content_hash 
  HAVING COUNT(*) > 1
)
ORDER BY content_hash, created_at DESC;

