/*
  # Fix profiles RLS policies

  1. Changes
    - Drop existing policies that incorrectly use 'user_id'
    - Recreate policies to correctly use 'id' column
    
  2. Security
    - Maintain same security level - users can only update their own profile
    - Public can view all profiles
    - Users can insert their own profile
*/

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies with correct column reference
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
