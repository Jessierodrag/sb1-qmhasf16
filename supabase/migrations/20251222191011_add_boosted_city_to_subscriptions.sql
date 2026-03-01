/*
  # Add boosted_city column to subscriptions

  1. Changes
    - Add `boosted_city` column to `subscriptions` table
      - Stores the city where the user wants their visibility boosted
      - Required for Premium and Elite tiers to track location-based visibility
    
  2. Notes
    - This column is essential for the subscription feature
    - Users select their desired city during subscription purchase
    - The city determines where their posts get boosted visibility
*/

-- Add boosted_city column to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'boosted_city'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN boosted_city text;
  END IF;
END $$;