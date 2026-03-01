/*
  # Fix Post Counters with Automatic Triggers

  1. Changes
    - Create function to update likes_count on posts table
    - Create function to update comments_count on posts table
    - Create triggers to automatically update counters when likes/comments are added or removed
    - Update existing posts with correct counts

  2. Why
    - The likes_count and comments_count columns exist but are not being updated
    - Users see 0 likes/comments even when they exist
    - Triggers will keep counts synchronized automatically
*/

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_likes_count ON likes;
DROP TRIGGER IF EXISTS trigger_update_comments_count ON post_reviews;

-- Create trigger for likes
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Create trigger for comments
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON post_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Fix existing counts for all posts
UPDATE posts p
SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = p.id),
  comments_count = (SELECT COUNT(*) FROM post_reviews WHERE post_id = p.id);
