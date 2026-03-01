/*
  # Fix profiles RLS policies to use user_id

  1. Changes
    - Drop existing policies that incorrectly use 'id'
    - Recreate policies to correctly use 'user_id' column which references auth.users
    
  2. Security
    - Maintain same security level - users can only update their own profile
    - Public can view all profiles
    - Users can insert their own profile
    
  3. Important Notes
    - auth.uid() returns the user's ID from auth.users table
    - profiles.user_id references auth.users(id)
    - profiles.id is a separate auto-generated UUID for the profile record
*/

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies with correct column reference
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
