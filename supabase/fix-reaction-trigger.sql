-- Fix reaction count trigger
-- Run this if counts aren't updating automatically

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_reaction_counts ON post_reactions;

-- Recreate the trigger
CREATE TRIGGER update_reaction_counts
  AFTER INSERT OR DELETE ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reaction_counts();

-- Manually sync all existing counts
UPDATE posts 
SET 
  funny_count = (SELECT COUNT(*) FROM post_reactions WHERE post_id = posts.id AND reaction_type = 'funny'),
  creative_count = (SELECT COUNT(*) FROM post_reactions WHERE post_id = posts.id AND reaction_type = 'creative'),
  must_try_count = (SELECT COUNT(*) FROM post_reactions WHERE post_id = posts.id AND reaction_type = 'must_try'),
  total_reactions = (SELECT COUNT(*) FROM post_reactions WHERE post_id = posts.id);

-- Test the trigger
SELECT 'Trigger fixed! Counts will now update automatically.' AS status;

