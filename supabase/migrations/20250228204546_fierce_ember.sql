/*
  # Chat System Integration

  1. New Functions
    - `get_user_conversations` - Returns all conversations for a user with the most recent message
  
  2. Changes
    - No changes to existing tables or policies
    
  3. Notes
    - This migration adds a stored procedure to efficiently retrieve conversations
*/

-- Create a function to get all conversations for a user with the most recent message
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_photo TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH last_messages AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.text,
      m.created_at,
      m.sender_id
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user1_id = user_id OR c.user2_id = user_id
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT
      m.conversation_id,
      COUNT(*) AS count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.user1_id = user_id OR c.user2_id = user_id)
      AND m.sender_id != user_id
      AND m.read = false
    GROUP BY m.conversation_id
  )
  SELECT
    c.id AS conversation_id,
    CASE
      WHEN c.user1_id = user_id THEN c.user2_id
      ELSE c.user1_id
    END AS other_user_id,
    p.name AS other_user_name,
    (p.photos)[1] AS other_user_photo,
    lm.text AS last_message,
    lm.created_at AS last_message_time,
    COALESCE(uc.count, 0) AS unread_count
  FROM conversations c
  JOIN profiles p ON (
    CASE
      WHEN c.user1_id = user_id THEN c.user2_id
      ELSE c.user1_id
    END = p.id
  )
  LEFT JOIN last_messages lm ON c.id = lm.conversation_id
  LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
  WHERE c.user1_id = user_id OR c.user2_id = user_id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;