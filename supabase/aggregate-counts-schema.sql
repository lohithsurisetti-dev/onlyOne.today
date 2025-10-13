-- Aggregate match counts table for efficient scoring
-- This enables O(1) lookups instead of counting matches on every display

CREATE TABLE IF NOT EXISTS content_match_counts (
  content_hash TEXT PRIMARY KEY,
  
  -- Global count
  world_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Aggregated location counts as JSONB
  -- Structure: { "cities": {"Macomb": 2, "Tokyo": 5}, "states": {...}, "countries": {...} }
  location_counts JSONB DEFAULT '{
    "cities": {},
    "states": {}, 
    "countries": {}
  }'::jsonb NOT NULL,
  
  -- Metadata
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT positive_world_count CHECK (world_count >= 0)
);

-- Index for fast lookups by hash
CREATE INDEX IF NOT EXISTS idx_match_counts_hash ON content_match_counts(content_hash);

-- Index for JSONB queries (if we want to query by location)
CREATE INDEX IF NOT EXISTS idx_match_counts_locations ON content_match_counts USING gin(location_counts);

-- Function to increment counts atomically
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
    
    -- Increment city count
    location_counts = jsonb_set(
      content_match_counts.location_counts,
      ARRAY['cities', p_city],
      to_jsonb(COALESCE((content_match_counts.location_counts->'cities'->p_city)::int, 0) + 1)
    ),
    
    -- Increment state count  
    location_counts = jsonb_set(
      content_match_counts.location_counts,
      ARRAY['states', p_state],
      to_jsonb(COALESCE((content_match_counts.location_counts->'states'->p_state)::int, 0) + 1)
    ),
    
    -- Increment country count
    location_counts = jsonb_set(
      content_match_counts.location_counts,
      ARRAY['countries', p_country],
      to_jsonb(COALESCE((content_match_counts.location_counts->'countries'->p_country)::int, 0) + 1)
    ),
    
    -- Update timestamp
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get counts for a specific location
CREATE OR REPLACE FUNCTION get_location_counts(
  p_content_hash TEXT,
  p_city TEXT,
  p_state TEXT,
  p_country TEXT
)
RETURNS TABLE (
  world_count INTEGER,
  city_count INTEGER,
  state_count INTEGER,
  country_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cmc.world_count,
    COALESCE((cmc.location_counts->'cities'->>p_city)::int, 0) as city_count,
    COALESCE((cmc.location_counts->'states'->>p_state)::int, 0) as state_count,
    COALESCE((cmc.location_counts->'countries'->>p_country)::int, 0) as country_count
  FROM content_match_counts cmc
  WHERE cmc.content_hash = p_content_hash;
  
  -- If no record exists, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, 0, 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
ALTER TABLE content_match_counts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read counts
CREATE POLICY "Match counts are viewable by everyone"
  ON content_match_counts FOR SELECT
  USING (true);

-- Policy: System can insert/update counts
CREATE POLICY "System can manage counts"
  ON content_match_counts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE content_match_counts IS 
'Aggregated match counts for efficient scoring. Avoids counting on every display.';

COMMENT ON FUNCTION increment_content_counts IS
'Atomically increments counts for a content hash at all location levels.';

COMMENT ON FUNCTION get_location_counts IS
'Retrieves all location-level counts for a content hash in one query.';

