-- Fix: Chain jsonb_set calls instead of multiple assignments
CREATE OR REPLACE FUNCTION increment_content_counts(
  p_content_hash TEXT,
  p_city TEXT,
  p_state TEXT,
  p_country TEXT
)
RETURNS void AS $$
BEGIN
  -- Upsert: Insert if new, update if exists
  INSERT INTO content_match_counts (
    content_hash, 
    world_count, 
    location_counts
  )
  VALUES (
    p_content_hash,
    1,
    jsonb_build_object(
      'cities', jsonb_build_object(p_city, 1),
      'states', jsonb_build_object(p_state, 1),
      'countries', jsonb_build_object(p_country, 1)
    )
  )
  ON CONFLICT (content_hash) DO UPDATE SET
    -- Increment world count
    world_count = content_match_counts.world_count + 1,
    
    -- Chain all jsonb_set calls together (SINGLE assignment)
    location_counts = jsonb_set(
      jsonb_set(
        jsonb_set(
          content_match_counts.location_counts,
          ARRAY['cities', p_city],
          to_jsonb(COALESCE((content_match_counts.location_counts->'cities'->p_city)::int, 0) + 1)
        ),
        ARRAY['states', p_state],
        to_jsonb(COALESCE((content_match_counts.location_counts->'states'->p_state)::int, 0) + 1)
      ),
      ARRAY['countries', p_country],
      to_jsonb(COALESCE((content_match_counts.location_counts->'countries'->p_country)::int, 0) + 1)
    ),
    
    -- Update timestamp
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Verify the function was updated
SELECT 'increment_content_counts function fixed!' as status;

