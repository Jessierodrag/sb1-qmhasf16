/*
  # Add first_name and last_name columns to profiles table

  1. Changes
    - Add `first_name` column to profiles table (text, nullable)
    - Add `last_name` column to profiles table (text, nullable)
  
  2. Notes
    - These fields are private and not visible to other users
    - They are used for administrative purposes only
*/

DO $$ 
BEGIN
  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
END $$;