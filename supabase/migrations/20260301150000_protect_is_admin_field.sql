/*
  # Protect is_admin field from self-promotion

  1. Problem
    - Current RLS policy "Users can update own profile" allows users
      to set is_admin = true on their own profile (privilege escalation)

  2. Fix
    - Create a trigger that prevents any non-admin user from modifying is_admin
    - Only existing admins can promote/demote other users
    - Even admins cannot promote themselves (must be done by another admin or DB directly)

  3. Security
    - Blocks the most critical attack vector: self-promotion to admin
*/

-- Create function to prevent is_admin tampering
CREATE OR REPLACE FUNCTION prevent_admin_self_promotion()
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

  -- If is_admin is not being changed, allow the update
  IF OLD.is_admin IS NOT DISTINCT FROM NEW.is_admin THEN
    RETURN NEW;
  END IF;

  -- Check if the current user is an admin
  SELECT is_admin INTO current_user_is_admin
  FROM profiles
  WHERE user_id = current_user_id;

  -- Non-admins cannot change is_admin at all
  IF current_user_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Only admins can modify admin status';
  END IF;

  -- Admins cannot change their own is_admin status
  IF NEW.user_id = current_user_id THEN
    RAISE EXCEPTION 'Admins cannot modify their own admin status';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists and create trigger
DROP TRIGGER IF EXISTS protect_admin_field ON profiles;
CREATE TRIGGER protect_admin_field
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_self_promotion();
