/*
  # Create post boosts table

  1. New Tables
    - `post_boosts`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts) - Post being boosted
      - `user_id` (uuid, foreign key to profiles) - User who purchased the boost
      - `boost_type` (text) - Type of boost: '24h', '7days', '30days'
      - `price` (numeric) - Price paid for the boost
      - `start_date` (timestamp) - When the boost starts
      - `end_date` (timestamp) - When the boost ends
      - `is_active` (boolean) - Whether the boost is currently active
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `post_boosts` table
    - Add policy for users to view their own boosts
    - Add policy for authenticated users to create boosts
    - Add public read policy to check if posts are boosted

  3. Indexes
    - Index on (post_id, is_active, end_date) for efficient boost checking
    - Index on (user_id, created_at) for user boost history
*/

-- Create post_boosts table
CREATE TABLE IF NOT EXISTS post_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('24h', '7days', '30days')),
  price NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE post_boosts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own boosts
CREATE POLICY "Users can view own boosts"
  ON post_boosts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create boosts for their own posts
CREATE POLICY "Users can create boosts"
  ON post_boosts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Policy: Public can check if posts are boosted (for filtering)
CREATE POLICY "Public can check active boosts"
  ON post_boosts
  FOR SELECT
  TO public
  USING (is_active = true AND end_date > now());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_boosts_post_active ON post_boosts(post_id, is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_post_boosts_user ON post_boosts(user_id, created_at DESC);

-- Function to automatically deactivate expired boosts
CREATE OR REPLACE FUNCTION deactivate_expired_boosts()
RETURNS void AS $$
BEGIN
  UPDATE post_boosts
  SET is_active = false
  WHERE is_active = true
  AND end_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a column to posts to track if currently boosted (for quick filtering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_boosted'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_boosted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index on is_boosted for quick filtering
CREATE INDEX IF NOT EXISTS idx_posts_boosted ON posts(is_boosted) WHERE is_boosted = true;