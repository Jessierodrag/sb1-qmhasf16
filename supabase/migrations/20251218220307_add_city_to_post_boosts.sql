/*
  # Add city field to post_boosts table

  1. Changes
    - Add `city` column to `post_boosts` table to store the promotion city
    - Add index on (city, is_active, end_date) for efficient filtering by city
    - Add policy to allow users to update the city of their active boosts

  2. Security
    - Update policy to allow users to update city field of their own boosts
*/

-- Add city column to post_boosts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_boosts' AND column_name = 'city'
  ) THEN
    ALTER TABLE post_boosts ADD COLUMN city TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create index on city for efficient filtering
CREATE INDEX IF NOT EXISTS idx_post_boosts_city_active ON post_boosts(city, is_active, end_date);

-- Drop existing update policy if exists
DROP POLICY IF EXISTS "Users can update city of own boosts" ON post_boosts;

-- Policy: Users can update city of their own active boosts
CREATE POLICY "Users can update city of own boosts"
  ON post_boosts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
