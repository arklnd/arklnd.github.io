-- Reactions system for blog posts
-- Run this in Supabase SQL Editor to set up the reactions feature.

-- 1. Table
CREATE TABLE IF NOT EXISTS reactions (
  post_slug TEXT NOT NULL,
  emoji     TEXT NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_slug, emoji)
);

-- 2. Get reactions for a single post
CREATE OR REPLACE FUNCTION get_reactions(p_slug TEXT)
RETURNS TABLE (emoji TEXT, count INTEGER) AS $$
BEGIN
  RETURN QUERY
    SELECT r.emoji, r.count
    FROM reactions r
    WHERE r.post_slug = p_slug
    ORDER BY r.count DESC, r.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Toggle (add/remove) a reaction
CREATE OR REPLACE FUNCTION toggle_reaction(
  p_slug   TEXT,
  p_emoji  TEXT,
  p_action TEXT
)
RETURNS TABLE (emoji TEXT, count INTEGER) AS $$
#variable_conflict use_column
BEGIN
  IF p_action = 'add' THEN
    INSERT INTO reactions (post_slug, emoji, count)
    VALUES (p_slug, p_emoji, 1)
    ON CONFLICT (post_slug, emoji)
    DO UPDATE SET count = reactions.count + 1;
  ELSIF p_action = 'remove' THEN
    UPDATE reactions
    SET count = GREATEST(reactions.count - 1, 0)
    WHERE post_slug = p_slug AND emoji = p_emoji;

    DELETE FROM reactions
    WHERE post_slug = p_slug AND emoji = p_emoji AND count <= 0;
  END IF;

  RETURN QUERY
    SELECT r.emoji, r.count
    FROM reactions r
    WHERE r.post_slug = p_slug
    ORDER BY r.count DESC, r.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get aggregated reactions for all posts (used by home-page badges)
CREATE OR REPLACE FUNCTION get_all_reactions()
RETURNS TABLE (post_slug TEXT, emoji TEXT, count INTEGER) AS $$
BEGIN
  RETURN QUERY
    SELECT r.post_slug, r.emoji, r.count
    FROM reactions r
    WHERE r.count > 0
    ORDER BY r.post_slug, r.count DESC, r.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS & access
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_read_reactions"
  ON reactions FOR SELECT
  TO anon
  USING (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON reactions TO anon;
GRANT EXECUTE ON FUNCTION get_reactions(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION toggle_reaction(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_all_reactions() TO anon;
