-- Backfill aggregate counts from existing posts
-- Run this AFTER running aggregate-counts-migration-safe.sql

-- Clear existing data (if any)
TRUNCATE content_match_counts;

-- Populate from existing posts
INSERT INTO content_match_counts (
  content_hash,
  world_count,
  location_counts,
  first_seen_at,
  last_updated_at
)
SELECT 
  content_hash,
  COUNT(*) as world_count,
  jsonb_build_object(
    'cities', (
      SELECT jsonb_object_agg(location_city, city_count)
      FROM (
        SELECT location_city, COUNT(*) as city_count
        FROM posts p2
        WHERE p2.content_hash = p1.content_hash
          AND p2.location_city IS NOT NULL
          AND p2.location_city != ''
        GROUP BY location_city
      ) city_agg
    ),
    'states', (
      SELECT jsonb_object_agg(location_state, state_count)
      FROM (
        SELECT location_state, COUNT(*) as state_count
        FROM posts p2
        WHERE p2.content_hash = p1.content_hash
          AND p2.location_state IS NOT NULL
          AND p2.location_state != ''
        GROUP BY location_state
      ) state_agg
    ),
    'countries', (
      SELECT jsonb_object_agg(location_country, country_count)
      FROM (
        SELECT location_country, COUNT(*) as country_count
        FROM posts p2
        WHERE p2.content_hash = p1.content_hash
          AND p2.location_country IS NOT NULL
          AND p2.location_country != ''
        GROUP BY location_country
      ) country_agg
    )
  ) as location_counts,
  MIN(created_at) as first_seen_at,
  MAX(created_at) as last_updated_at
FROM posts p1
WHERE created_at > NOW() - INTERVAL '24 hours' -- Only recent posts
GROUP BY content_hash;

-- Verify results
SELECT 
  content_hash,
  world_count,
  jsonb_pretty(location_counts) as locations
FROM content_match_counts
ORDER BY world_count DESC
LIMIT 10;

-- Show summary
SELECT 
  COUNT(*) as total_unique_hashes,
  SUM(world_count) as total_posts,
  AVG(world_count) as avg_posts_per_hash,
  MAX(world_count) as max_posts_for_single_hash
FROM content_match_counts;

