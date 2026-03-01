/*
  # Add admin DELETE policies

  1. Changes
    - Add DELETE policy for profiles table allowing admins to delete any profile
    - Add DELETE policy for reviews table allowing admins to delete any review
  
  2. Security
    - Only users with is_admin = true can delete profiles and reviews
    - Uses auth.uid() to check against the logged-in user's is_admin status
*/

-- Add DELETE policy for profiles (admins only)
CREATE POLICY "Admins can delete any profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Add DELETE policy for reviews (admins only)
CREATE POLICY "Admins can delete any review"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );