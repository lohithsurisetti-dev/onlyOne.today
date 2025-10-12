-- Add reactions to OnlyOne.today
-- Run this in Supabase SQL Editor to add reaction features

-- ============================================================
-- POST REACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Reaction type
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('funny', 'creative', 'must_try')),
  
  -- Anonymous tracking (use session/IP to prevent spam)
  session_id TEXT, -- Browser session or anonymous identifier
  ip_address TEXT, -- For spam prevention
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reactions from same session
  UNIQUE(post_id, session_id, reaction_type)
);

-- Indexes for performance
CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_type ON post_reactions(reaction_type);
CREATE INDEX idx_post_reactions_created_at ON post_reactions(created_at DESC);

-- ============================================================
-- ADD REACTION COUNTS TO POSTS TABLE
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS funny_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS creative_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS must_try_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS total_reactions INTEGER DEFAULT 0;

CREATE INDEX idx_posts_total_reactions ON posts(total_reactions DESC);
CREATE INDEX idx_posts_funny_count ON posts(funny_count DESC);
CREATE INDEX idx_posts_creative_count ON posts(creative_count DESC);
CREATE INDEX idx_posts_must_try_count ON posts(must_try_count DESC);

-- ============================================================
-- FUNCTIONS FOR REACTION COUNTS
-- ============================================================

-- Function to update reaction counts on posts table
CREATE OR REPLACE FUNCTION update_post_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment the appropriate counter
    IF NEW.reaction_type = 'funny' THEN
      UPDATE posts SET funny_count = funny_count + 1, total_reactions = total_reactions + 1 WHERE id = NEW.post_id;
    ELSIF NEW.reaction_type = 'creative' THEN
      UPDATE posts SET creative_count = creative_count + 1, total_reactions = total_reactions + 1 WHERE id = NEW.post_id;
    ELSIF NEW.reaction_type = 'must_try' THEN
      UPDATE posts SET must_try_count = must_try_count + 1, total_reactions = total_reactions + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement the appropriate counter
    IF OLD.reaction_type = 'funny' THEN
      UPDATE posts SET funny_count = GREATEST(0, funny_count - 1), total_reactions = GREATEST(0, total_reactions - 1) WHERE id = OLD.post_id;
    ELSIF OLD.reaction_type = 'creative' THEN
      UPDATE posts SET creative_count = GREATEST(0, creative_count - 1), total_reactions = GREATEST(0, total_reactions - 1) WHERE id = OLD.post_id;
    ELSIF OLD.reaction_type = 'must_try' THEN
      UPDATE posts SET must_try_count = GREATEST(0, must_try_count - 1), total_reactions = GREATEST(0, total_reactions - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update counts
CREATE TRIGGER update_reaction_counts
  AFTER INSERT OR DELETE ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reaction_counts();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions
CREATE POLICY "Reactions are viewable by everyone"
  ON post_reactions FOR SELECT
  USING (true);

-- Anyone can add reactions (anonymous)
CREATE POLICY "Anyone can add reactions"
  ON post_reactions FOR INSERT
  WITH CHECK (true);

-- Users can delete their own reactions (by session_id)
CREATE POLICY "Users can delete own reactions"
  ON post_reactions FOR DELETE
  USING (true); -- We'll handle session validation in app logic

-- ============================================================
-- VIEWS FOR TOP POSTS BY REACTION
-- ============================================================

-- Top funny posts
CREATE OR REPLACE VIEW top_funny_posts AS
SELECT 
  id,
  content,
  input_type,
  scope,
  uniqueness_score,
  funny_count,
  creative_count,
  must_try_count,
  total_reactions,
  created_at
FROM posts
WHERE funny_count > 0
ORDER BY funny_count DESC, created_at DESC
LIMIT 100;

-- Top creative posts
CREATE OR REPLACE VIEW top_creative_posts AS
SELECT 
  id,
  content,
  input_type,
  scope,
  uniqueness_score,
  funny_count,
  creative_count,
  must_try_count,
  total_reactions,
  created_at
FROM posts
WHERE creative_count > 0
ORDER BY creative_count DESC, created_at DESC
LIMIT 100;

-- Top must-try posts
CREATE OR REPLACE VIEW top_must_try_posts AS
SELECT 
  id,
  content,
  input_type,
  scope,
  uniqueness_score,
  funny_count,
  creative_count,
  must_try_count,
  total_reactions,
  created_at
FROM posts
WHERE must_try_count > 0
ORDER BY must_try_count DESC, created_at DESC
LIMIT 100;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get reaction counts for a post
CREATE OR REPLACE FUNCTION get_post_reactions(p_post_id UUID)
RETURNS TABLE (
  funny INTEGER,
  creative INTEGER,
  must_try INTEGER,
  total INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    funny_count,
    creative_count,
    must_try_count,
    total_reactions
  FROM posts
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql;

-- Check if user already reacted
CREATE OR REPLACE FUNCTION has_user_reacted(
  p_post_id UUID,
  p_session_id TEXT,
  p_reaction_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM post_reactions
    WHERE post_id = p_post_id
    AND session_id = p_session_id
    AND reaction_type = p_reaction_type
  );
END;
$$ LANGUAGE plpgsql;

