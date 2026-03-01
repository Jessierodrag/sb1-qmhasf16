/*
  # Add likes table

  1. New Tables
    - `likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `profile_id` (integer, references profile id)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `likes` table
    - Add policies for authenticated users to manage their likes
*/

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

-- Enable Row Level Security
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Users can view all likes"
  ON likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON likes
  FOR DELETE
  USING (auth.uid() = user_id);