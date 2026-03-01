/*
  # Add UPDATE policy for reviews table

  1. Security Changes
    - Add policy to allow users to update their own reviews
    - Users can only update reviews they created (where from_user_id matches auth.uid())

  2. Policy Details
    - USING clause checks if the user is the author of the review
    - WITH CHECK clause ensures the from_user_id remains the same
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reviews'
    AND policyname = 'Users can update own reviews'
  ) THEN
    CREATE POLICY "Users can update own reviews"
      ON reviews
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = from_user_id)
      WITH CHECK (auth.uid() = from_user_id);
  END IF;
END $$;