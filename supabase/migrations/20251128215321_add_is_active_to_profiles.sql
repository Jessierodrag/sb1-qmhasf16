/*
  # Add is_active field to profiles

  1. Changes
    - Add `is_active` boolean column to profiles table
    - Default value is true (active)
    - Allows users to temporarily hide their profile and posts

  2. Purpose
    - Enable users to deactivate/reactivate their profile
    - When is_active is false, profile should not appear in searches or feeds
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;