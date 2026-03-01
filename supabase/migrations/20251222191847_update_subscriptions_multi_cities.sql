/*
  # Update subscriptions to support multiple cities

  1. Changes
    - Remove `boosted_city` column from `subscriptions` table
    - Add `boosted_cities` column as text array to store multiple cities
    - Add `city_change_count` column to track number of city modifications
      - Used to limit modifications for basic tier (1 change allowed)
      - Premium and VIP have unlimited changes
    
  2. Notes
    - Roses Classic: 1 city, 1 modification allowed
    - Roses Premium: 5 cities, unlimited modifications
    - Roses Elite: 10 cities, unlimited modifications
*/

-- Remove old single city column if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'boosted_city'
  ) THEN
    ALTER TABLE subscriptions DROP COLUMN boosted_city;
  END IF;
END $$;

-- Add new multi-cities column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'boosted_cities'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN boosted_cities text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Add city change counter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'city_change_count'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN city_change_count integer DEFAULT 0;
  END IF;
END $$;