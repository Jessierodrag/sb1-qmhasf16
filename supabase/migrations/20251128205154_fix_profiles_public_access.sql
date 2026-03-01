/*
  # Fix public access to profiles

  1. Changes
    - Drop the existing restrictive SELECT policy on profiles
    - Create a new SELECT policy that allows public (anonymous) access to profiles
  
  2. Security
    - Profiles can be viewed by anyone (authenticated or not)
    - Users can still only update/insert their own profiles
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create a new public SELECT policy
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (true);
