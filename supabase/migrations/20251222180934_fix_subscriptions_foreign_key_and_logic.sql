/*
  # Fix subscriptions foreign key and RLS policies

  1. Changes
    - Drop existing foreign key constraint on subscriptions.user_id
    - Recreate foreign key to reference profiles.user_id instead of profiles.id
    - This aligns with auth.uid() which returns the user's auth ID
    
  2. Security
    - RLS policies now work correctly with auth.uid()
    - Users can only manage their own subscriptions
    
  3. Important Notes
    - subscriptions.user_id now references profiles.user_id (which references auth.users.id)
    - This matches the pattern used in other tables (likes, post_reviews, etc.)
    - auth.uid() returns auth.users.id, which equals profiles.user_id
*/

-- Drop the existing foreign key constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE subscriptions 
  ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(user_id) 
  ON DELETE CASCADE;

-- The RLS policies are already correct since they use auth.uid() = user_id
-- No need to change them as they now align with the new foreign key structure
