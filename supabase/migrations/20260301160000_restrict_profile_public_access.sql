/*
  # Restrict public profile data access

  1. Changes
    - Drop the current "Public profiles are viewable by everyone" policy
    - Create a VIEW `public_profiles` exposing only safe public fields
    - Create policy for authenticated users to see their OWN full profile
    - Grant SELECT on view to anon and authenticated

  2. Security
    - Sensitive fields (name, first_name, last_name, phone, email, is_admin) are NOT exposed publicly
    - Only safe fields are visible in public_profiles view
    - Users can still see their complete profile when authenticated
*/

-- Drop the current public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a restricted SELECT policy: users can only see their own full profile
CREATE POLICY "Users can view their own full profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create public_profiles VIEW with only safe fields
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  user_id,
  username,
  location,
  description,
  photos,
  physical_info,
  personal_info,
  prestations,
  rating,
  subscription_tier,
  is_active,
  created_at,
  user_type
FROM profiles
WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;
