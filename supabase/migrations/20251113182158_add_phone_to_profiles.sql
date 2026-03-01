/*
  # Add phone column to profiles table

  1. Changes
    - Add `phone` column to profiles table (text, nullable)
  
  2. Notes
    - This field is private and used for contact purposes
*/

DO $$ 
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;