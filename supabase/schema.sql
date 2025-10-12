-- OnlyOne.today Database Schema
-- This schema supports scalable post storage, matching, and analytics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- ============================================================
-- POSTS TABLE
-- ============================================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('action', 'day')),
  scope TEXT NOT NULL CHECK (scope IN ('city', 'state', 'country', 'world')),
  
  -- Location data
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  location_coords POINT, -- For geospatial queries
  
  -- Similarity hashing for efficient matching
  content_hash TEXT NOT NULL, -- Simple normalized hash (e.g., "music:taylorswift:lover")
  -- content_embedding VECTOR(384), -- For semantic similarity (optional, requires pgvector extension)
  
  -- Metrics
  uniqueness_score INTEGER DEFAULT 100, -- 0-100
  match_count INTEGER DEFAULT 0, -- How many similar posts
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT true,
  user_id UUID, -- Optional, for future auth
  
  -- Indexes
  CONSTRAINT posts_content_length CHECK (char_length(content) >= 3 AND char_length(content) <= 500)
);

-- Indexes for efficient queries
CREATE INDEX idx_posts_content_hash ON posts(content_hash);
CREATE INDEX idx_posts_scope ON posts(scope);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_location ON posts(location_city, location_state, location_country);
CREATE INDEX idx_posts_uniqueness_score ON posts(uniqueness_score DESC);
CREATE INDEX idx_posts_match_count ON posts(match_count DESC);

-- GIN index for full-text search
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', content));

-- ============================================================
-- POST MATCHES TABLE (for tracking similar posts)
-- ============================================================
CREATE TABLE post_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  matched_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL, -- 0.0 to 1.0
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate matches
  UNIQUE(post_id, matched_post_id),
  
  -- Ensure a post doesn't match itself
  CONSTRAINT no_self_match CHECK (post_id != matched_post_id)
);

CREATE INDEX idx_post_matches_post_id ON post_matches(post_id);
CREATE INDEX idx_post_matches_similarity ON post_matches(similarity_score DESC);

-- ============================================================
-- TRENDING CONTEXT TABLE (cached trending data)
-- ============================================================
CREATE TABLE trending_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL, -- 'spotify', 'twitter', 'google_trends', 'youtube'
  category TEXT NOT NULL, -- 'music', 'news', 'sports', etc.
  title TEXT NOT NULL,
  description TEXT,
  rank INTEGER,
  metadata JSONB, -- Additional data (artist, genre, etc.)
  
  -- Timestamps
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Cache expiration
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trending_source ON trending_context(source);
CREATE INDEX idx_trending_category ON trending_context(category);
CREATE INDEX idx_trending_expires_at ON trending_context(expires_at);

-- ============================================================
-- ANALYTICS TABLE (daily aggregates)
-- ============================================================
CREATE TABLE daily_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  
  -- Aggregate metrics
  total_posts INTEGER DEFAULT 0,
  unique_posts INTEGER DEFAULT 0,
  common_posts INTEGER DEFAULT 0,
  
  -- Breakdown by scope
  posts_by_city INTEGER DEFAULT 0,
  posts_by_state INTEGER DEFAULT 0,
  posts_by_country INTEGER DEFAULT 0,
  posts_by_world INTEGER DEFAULT 0,
  
  -- Breakdown by type
  action_posts INTEGER DEFAULT 0,
  day_posts INTEGER DEFAULT 0,
  
  -- Top content hashes (most common activities)
  top_content_hashes JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One record per day
  UNIQUE(date)
);

CREATE INDEX idx_daily_analytics_date ON daily_analytics(date DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate content hash from post content
CREATE OR REPLACE FUNCTION generate_content_hash(content TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Normalize: lowercase, remove special chars, extract key words
  normalized := lower(regexp_replace(content, '[^a-zA-Z0-9\s]', '', 'g'));
  normalized := regexp_replace(normalized, '\s+', ':', 'g');
  
  -- Take first 3-5 meaningful words
  normalized := substring(normalized from 1 for 100);
  
  RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar posts
CREATE OR REPLACE FUNCTION find_similar_posts(
  p_content_hash TEXT,
  p_scope TEXT,
  p_location_city TEXT DEFAULT NULL,
  p_location_state TEXT DEFAULT NULL,
  p_location_country TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  post_id UUID,
  content TEXT,
  similarity_score FLOAT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    similarity(p.content_hash, p_content_hash) as sim_score,
    p.created_at
  FROM posts p
  WHERE 
    p.content_hash % p_content_hash -- Using pg_trgm similarity operator
    AND (
      -- Scope filtering
      (p_scope = 'city' AND p.location_city = p_location_city) OR
      (p_scope = 'state' AND p.location_state = p_location_state) OR
      (p_scope = 'country' AND p.location_country = p_location_country) OR
      (p_scope = 'world')
    )
    AND p.created_at > NOW() - INTERVAL '24 hours' -- Only recent posts
  ORDER BY sim_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate uniqueness score
CREATE OR REPLACE FUNCTION calculate_uniqueness_score(match_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Formula: 100 - (match_count * 10), minimum 0
  RETURN GREATEST(0, 100 - (match_count * 10));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read posts (anonymous)
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- Policy: Anyone can insert posts (anonymous posting)
CREATE POLICY "Anyone can create posts"
  ON posts FOR INSERT
  WITH CHECK (true);

-- Policy: Users can only update their own posts (if authenticated)
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================

-- Insert some sample posts
INSERT INTO posts (content, input_type, scope, location_country, content_hash, uniqueness_score, match_count)
VALUES
  ('Listened to Taylor Swift Lover', 'action', 'world', 'USA', 'listened:taylor:swift:lover', 30, 7),
  ('Took a nap at 3 PM', 'action', 'world', 'USA', 'took:nap:3:pm', 80, 2),
  ('Didnt watch the World Cup', 'action', 'world', 'India', 'didnt:watch:world:cup', 90, 1),
  ('Baked banana bread', 'action', 'world', 'UK', 'baked:banana:bread', 70, 3),
  ('Wrote a letter by hand', 'action', 'world', 'Canada', 'wrote:letter:by:hand', 95, 0);

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- View: Recent unique posts (for feed)
CREATE VIEW recent_unique_posts AS
SELECT 
  id,
  content,
  input_type,
  scope,
  location_city,
  location_state,
  location_country,
  uniqueness_score,
  match_count,
  created_at,
  CASE 
    WHEN uniqueness_score >= 70 THEN 'unique'
    ELSE 'common'
  END as post_type
FROM posts
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- View: Daily stats
CREATE VIEW daily_post_stats AS
SELECT 
  DATE(created_at) as post_date,
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE uniqueness_score >= 70) as unique_posts,
  COUNT(*) FILTER (WHERE uniqueness_score < 70) as common_posts,
  AVG(uniqueness_score) as avg_uniqueness_score
FROM posts
GROUP BY DATE(created_at)
ORDER BY post_date DESC;

