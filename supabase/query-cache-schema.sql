-- =====================================================
-- Query Cache Table (Open Source Redis Alternative)
-- =====================================================
-- Uses Supabase as a distributed cache for expensive queries
-- Perfect for serverless environments!

CREATE TABLE IF NOT EXISTS query_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast cleanup
CREATE INDEX IF NOT EXISTS idx_query_cache_expires 
  ON query_cache(expires_at);

-- Auto-cleanup expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM query_cache
  WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$;

-- Enable Row Level Security
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on query_cache"
  ON query_cache
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON query_cache TO postgres, anon, authenticated, service_role;

-- For manual cleanup: SELECT cleanup_expired_cache();

