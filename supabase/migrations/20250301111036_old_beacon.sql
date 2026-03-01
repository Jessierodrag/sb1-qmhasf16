/*
  # Create post_reviews table

  1. New Tables
    - `post_reviews`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `user_id` (uuid, foreign key to profiles)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `post_reviews` table
    - Add policies for authenticated users to manage their own reviews
    - Add policy for everyone to read reviews
  3. Indexes
    - Add indexes for post_id and user_id for better query performance
  4. Triggers
    - Add trigger to update updated_at timestamp
*/

-- Create post_reviews table
CREATE TABLE IF NOT EXISTS post_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id) -- Ensure a user can only review a post once
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS post_reviews_post_id_idx ON post_reviews(post_id);
CREATE INDEX IF NOT EXISTS post_reviews_user_id_idx ON post_reviews(user_id);
CREATE INDEX IF NOT EXISTS post_reviews_rating_idx ON post_reviews(rating);

-- Enable Row Level Security
ALTER TABLE post_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for post_reviews
CREATE POLICY "Users can view all post reviews"
  ON post_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own post reviews"
  ON post_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post reviews"
  ON post_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post reviews"
  ON post_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update the updated_at column
CREATE OR REPLACE FUNCTION update_post_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column
CREATE TRIGGER update_post_reviews_updated_at
BEFORE UPDATE ON post_reviews
FOR EACH ROW
EXECUTE FUNCTION update_post_reviews_updated_at();

-- Create function to calculate average rating for a post
CREATE OR REPLACE FUNCTION calculate_post_average_rating(post_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2) INTO avg_rating
  FROM post_reviews
  WHERE post_id = post_uuid;
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Create function to count reviews for a post
CREATE OR REPLACE FUNCTION count_post_reviews(post_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  review_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO review_count
  FROM post_reviews
  WHERE post_id = post_uuid;
  
  RETURN review_count;
END;
$$ LANGUAGE plpgsql;