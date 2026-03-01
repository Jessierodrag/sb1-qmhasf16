/*
  # Create likes table

  1. New Tables
    - `likes` - Track user likes on profiles
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.user_id)
      - `profile_id` (int, profile being liked)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on likes table
    - Add policies for users to manage their own likes
*/

CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  profile_id int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_profile ON likes(profile_id);
