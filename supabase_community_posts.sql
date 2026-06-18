-- Tripetrip Community feed table and role-isolated policies.
-- Run this once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 2 AND 280),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_posts_role_created
  ON community_posts(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_author_created
  ON community_posts(author_id, created_at DESC);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read same-role community posts" ON community_posts;
CREATE POLICY "Users read same-role community posts"
  ON community_posts FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = community_posts.role
    )
  );

DROP POLICY IF EXISTS "Users create own same-role community posts" ON community_posts;
CREATE POLICY "Users create own same-role community posts"
  ON community_posts FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = community_posts.role
    )
  );
