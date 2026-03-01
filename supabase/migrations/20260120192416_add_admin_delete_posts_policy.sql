/*
  # Add admin DELETE policy for posts
  
  1. Changes
    - Add DELETE policy for posts table allowing admins to delete any post
    
  2. Security
    - Only users with is_admin = true can delete any post
    - Regular users can still only delete their own posts (existing policy)
    - Uses auth.uid() to check against the logged-in user's is_admin status
*/

-- Add DELETE policy for posts (admins only)
CREATE POLICY "Admins can delete any post"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );
