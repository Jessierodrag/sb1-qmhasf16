/*
  # Create post_reviews table

  1. New Tables
    - `post_reviews`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `user_id` (uuid, foreign key to profiles.user_id)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on `post_reviews` table
    - Add policies:
      - Anyone can view all post reviews
      - Authenticated users can create reviews for posts
      - Users can update/delete their own reviews
      
  3. Indexes
    - Index on post_id for faster queries
    - Index on user_id for faster queries
    - Unique constraint on (post_id, user_id) to prevent duplicate reviews
*/

-- Create post_reviews table
CREATE TABLE IF NOT EXISTS post_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS post_reviews_post_id_idx ON post_reviews(post_id);
CREATE INDEX IF NOT EXISTS post_reviews_user_id_idx ON post_reviews(user_id);
CREATE INDEX IF NOT EXISTS post_reviews_created_at_idx ON post_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE post_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view post reviews"
  ON post_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create post reviews"
  ON post_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post reviews"
  ON post_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post reviews"
  ON post_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);