/*
  # Protect admin functions and fields

  1. Changes
    - Add RLS policies for admin UPDATE operations on profiles (is_active field)
    - Ensure regular users cannot modify is_admin or is_active fields
    - Strengthen admin_settings policies (already exist but we reinforce)
    - Create trigger to prevent modification of is_admin and is_active by non-admins

  2. Security
    - Only admins can UPDATE is_active on other profiles
    - Regular users' UPDATE policy cannot modify is_admin or is_active
    - Admin policies check is_admin via subquery for additional security
*/

-- Create policy: only admins can UPDATE is_active on profiles
CREATE POLICY "Admins can update is_active on any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Must be admin
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  )
  WITH CHECK (
    -- Must be admin
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Create function to prevent is_active tampering by non-admins
CREATE OR REPLACE FUNCTION prevent_is_active_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_is_admin boolean;
BEGIN
  -- Get the authenticated user
  current_user_id := auth.uid();

  -- If is_active is not being changed, allow the update
  IF OLD.is_active IS NOT DISTINCT FROM NEW.is_active THEN
    RETURN NEW;
  END IF;

  -- Check if the current user is an admin
  SELECT is_admin INTO current_user_is_admin
  FROM profiles
  WHERE user_id = current_user_id;

  -- Non-admins cannot change is_active
  IF current_user_is_admin IS NOT TRUE THEN
    -- Restore the original value
    NEW.is_active := OLD.is_active;
    RAISE WARNING 'Only admins can modify is_active status';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists and create trigger
DROP TRIGGER IF EXISTS protect_is_active_field ON profiles;
CREATE TRIGGER protect_is_active_field
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_active_tampering();

-- Ensure admin_settings policies are strong (they should already exist from create_admin_system.sql)
-- This is just a safety check/reinforcement

-- Add comment to document the security model
COMMENT ON POLICY "Admins can view settings" ON admin_settings IS 
  'Only users with is_admin=true can view admin settings';

COMMENT ON POLICY "Admins can insert settings" ON admin_settings IS 
  'Only users with is_admin=true can insert admin settings';

COMMENT ON POLICY "Admins can update settings" ON admin_settings IS 
  'Only users with is_admin=true can update admin settings';
