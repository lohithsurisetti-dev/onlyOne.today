-- =====================================================
-- Rate Limiting Table (Serverless-Compatible)
-- =====================================================
-- Uses Supabase as a distributed rate limit store
-- Works across all Vercel serverless function instances

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_time BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time 
  ON rate_limits(reset_time);

-- Auto-cleanup expired entries (runs every hour)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE reset_time < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$;

-- Enable Row Level Security (allow all for rate limiting)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on rate_limits"
  ON rate_limits
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON rate_limits TO postgres, anon, authenticated, service_role;

-- Create a scheduled job to cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT cleanup_expired_rate_limits()');

-- For manual cleanup, run: SELECT cleanup_expired_rate_limits();

