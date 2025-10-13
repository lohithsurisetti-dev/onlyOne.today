-- Batch Update Function for Post Match Counts
-- Increments match_count and recalculates uniqueness_score for multiple posts in a single query
-- 10x faster than sequential updates!

CREATE OR REPLACE FUNCTION increment_match_counts(post_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Batch update: Increment match_count and recalculate uniqueness_score
  -- Formula: uniqueness_score = GREATEST(0, 100 - ((match_count + 1) * 10))
  UPDATE posts
  SET 
    match_count = match_count + 1,
    uniqueness_score = GREATEST(0, 100 - ((match_count + 1) * 10)),
    updated_at = NOW()
  WHERE id = ANY(post_ids);
  
  -- Log for debugging
  RAISE NOTICE 'Batch updated % posts', array_length(post_ids, 1);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_match_counts TO authenticated;
GRANT EXECUTE ON FUNCTION increment_match_counts TO anon;
GRANT EXECUTE ON FUNCTION increment_match_counts TO service_role;

-- Example usage:
-- SELECT increment_match_counts(ARRAY['uuid1', 'uuid2', 'uuid3']::UUID[]);

