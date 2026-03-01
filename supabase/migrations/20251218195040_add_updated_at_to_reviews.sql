/*
  # Add updated_at column to reviews table

  1. Changes
    - Add `updated_at` column to reviews table with default value of now()
    - This allows tracking when reviews are modified

  2. Notes
    - This is needed for the review update functionality
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE reviews ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;