-- Safe migration for aggregate counts table
-- Uses DROP IF EXISTS to avoid conflicts

-- Drop existing policies first
DROP POLICY IF EXISTS "Match counts are viewable by everyone" ON content_match_counts;
DROP POLICY IF EXISTS "System can manage counts" ON content_match_counts;

-- Drop existing functions
DROP FUNCTION IF EXISTS increment_content_counts(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_location_counts(TEXT, TEXT, TEXT, TEXT);

-- Drop table if exists (WARNING: This will delete data!)
-- Comment this out if you want to keep existing data
-- DROP TABLE IF EXISTS content_match_counts;

-- Create table (with IF NOT EXISTS for safety)
CREATE TABLE IF NOT EXISTS content_match_counts (
  content_hash TEXT PRIMARY KEY,
  
  -- Global count
  world_count INTEGER DEFAULT 0 NOT NULL,
  
  -- Aggregated location counts as JSONB
  location_counts JSONB DEFAULT '{
    "cities": {},
    "states": {}, 
    "countries": {}
  }'::jsonb NOT NULL,
  
  -- Metadata
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_world_count CHECK (world_count >= 0)
);

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_match_counts_hash ON content_match_counts(content_hash);
CREATE INDEX IF NOT EXISTS idx_match_counts_locations ON content_match_counts USING gin(location_counts);

-- Enable RLS (safe to run multiple times)
ALTER TABLE content_match_counts ENABLE ROW LEVEL SECURITY;

-- Create policies (now safe since we dropped them first)
CREATE POLICY "Match counts are viewable by everyone"
  ON content_match_counts FOR SELECT
  USING (true);

CREATE POLICY "System can manage counts"
  ON content_match_counts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to increment counts atomically
CREATE OR REPLACE FUNCTION increment_content_counts(
  p_content_hash TEXT,
  p_city TEXT,
  p_state TEXT,
  p_country TEXT
)
RETURNS void AS $$
DECLARE
  v_current_cities JSONB;
  v_current_states JSONB;
  v_current_countries JSONB;
BEGIN
  -- Upsert: Insert if new, update if exists
  INSERT INTO content_match_counts (
    content_hash, 
    world_count, 
    location_counts,
    first_seen_at,
    last_updated_at
  )
  VALUES (
    p_content_hash,
    1,
    jsonb_build_object(
      'cities', CASE WHEN p_city != '' THEN jsonb_build_object(p_city, 1) ELSE '{}'::jsonb END,
      'states', CASE WHEN p_state != '' THEN jsonb_build_object(p_state, 1) ELSE '{}'::jsonb END,
      'countries', CASE WHEN p_country != '' THEN jsonb_build_object(p_country, 1) ELSE '{}'::jsonb END
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (content_hash) DO UPDATE SET
    -- Increment world count
    world_count = content_match_counts.world_count + 1,
    
    -- Increment city count (only if city provided)
    location_counts = CASE 
      WHEN p_city != '' THEN
        jsonb_set(
          content_match_counts.location_counts,
          ARRAY['cities', p_city],
          to_jsonb(COALESCE((content_match_counts.location_counts->'cities'->p_city)::int, 0) + 1)
        )
      ELSE content_match_counts.location_counts
    END,
    
    -- Increment state count (only if state provided)
    location_counts = CASE 
      WHEN p_state != '' THEN
        jsonb_set(
          content_match_counts.location_counts,
          ARRAY['states', p_state],
          to_jsonb(COALESCE((content_match_counts.location_counts->'states'->p_state)::int, 0) + 1)
        )
      ELSE content_match_counts.location_counts
    END,
    
    -- Increment country count (only if country provided)
    location_counts = CASE 
      WHEN p_country != '' THEN
        jsonb_set(
          content_match_counts.location_counts,
          ARRAY['countries', p_country],
          to_jsonb(COALESCE((content_match_counts.location_counts->'countries'->p_country)::int, 0) + 1)
        )
      ELSE content_match_counts.location_counts
    END,
    
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
DECLARE
  v_record RECORD;
BEGIN
  -- Try to fetch the record
  SELECT * INTO v_record
  FROM content_match_counts
  WHERE content_hash = p_content_hash;
  
  IF NOT FOUND THEN
    -- No record exists, return zeros
    RETURN QUERY SELECT 0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Return counts from JSONB
  RETURN QUERY
  SELECT 
    v_record.world_count,
    COALESCE((v_record.location_counts->'cities'->>p_city)::int, 0)::INTEGER as city_count,
    COALESCE((v_record.location_counts->'states'->>p_state)::int, 0)::INTEGER as state_count,
    COALESCE((v_record.location_counts->'countries'->>p_country)::int, 0)::INTEGER as country_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE content_match_counts IS 
'Aggregated match counts for efficient scoring. Avoids counting on every display.';

COMMENT ON FUNCTION increment_content_counts IS
'Atomically increments counts for a content hash at all location levels.';

COMMENT ON FUNCTION get_location_counts IS
'Retrieves all location-level counts for a content hash in one query.';

