/*
  # Server-side blocking check for messages

  1. Changes
    - Create BEFORE INSERT trigger on messages table
    - Check if sender is blocked by any participant of the conversation
    - If blocked, RAISE EXCEPTION to prevent message insertion

  2. Security
    - Prevents client-side bypass of blocking logic
    - Server enforces blocking rules at database level
    - Blocks messages in both directions (blocker and blocked)
*/

-- Create function to check if sender is blocked
CREATE OR REPLACE FUNCTION check_message_blocking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id uuid;
  is_blocked boolean;
BEGIN
  -- Get the recipient (the other user in the conversation)
  SELECT CASE 
    WHEN c.user1_id = NEW.sender_id THEN c.user2_id
    WHEN c.user2_id = NEW.sender_id THEN c.user1_id
    ELSE NULL
  END INTO recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- If we can't determine recipient, something is wrong
  IF recipient_id IS NULL THEN
    RAISE EXCEPTION 'Invalid conversation or sender';
  END IF;

  -- Check if sender is blocked by the recipient
  SELECT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = recipient_id
    AND blocked_id = NEW.sender_id
  ) INTO is_blocked;

  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot send message: you are blocked by this user';
  END IF;

  -- Check if sender has blocked the recipient (prevent sending to blocked users)
  SELECT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = NEW.sender_id
    AND blocked_id = recipient_id
  ) INTO is_blocked;

  IF is_blocked THEN
    RAISE EXCEPTION 'Cannot send message: you have blocked this user';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS check_message_blocking_trigger ON messages;
CREATE TRIGGER check_message_blocking_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_blocking();

-- Add comment to document the security feature
COMMENT ON FUNCTION check_message_blocking() IS 
  'Prevents blocked users from sending messages to each other in either direction';
