/*
  # Fix Conversations Query Error

  1. Changes
    - Fix the error "operator does not exist: uuid = text" in the get_user_conversations function
    - Properly handle type casting between UUID and TEXT in the query
    - Ensure proper JOIN conditions for profiles table
  
  2. Notes
    - This migration fixes the type compatibility issues in the existing function
    - No schema changes are made, only function logic is updated
*/

-- Update the get_user_conversations function to properly handle type casting
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id TEXT,
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
    WHERE c.user1_id = user_id OR c.user2_id = user_id::TEXT
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT
      m.conversation_id,
      COUNT(*) AS count
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.user1_id = user_id OR c.user2_id = user_id::TEXT)
      AND m.sender_id != user_id
      AND m.read = false
    GROUP BY m.conversation_id
  ),
  -- Extract real user IDs for profile joining
  conversation_users AS (
    SELECT
      c.id AS conversation_id,
      CASE
        WHEN c.user1_id = user_id THEN c.user2_id
        ELSE c.user1_id::TEXT
      END AS other_user_id,
      CASE
        WHEN c.user1_id = user_id THEN 
          CASE 
            WHEN c.user2_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 
              c.user2_id::UUID
            ELSE NULL
          END
        WHEN c.user2_id = user_id::TEXT THEN c.user1_id
        ELSE NULL
      END AS profile_id,
      CASE
        WHEN (c.user1_id = user_id AND c.user2_id LIKE 'static-profile-%') OR 
             (c.user2_id = user_id::TEXT AND c.user1_id::TEXT LIKE 'static-profile-%') THEN TRUE
        ELSE FALSE
      END AS is_static_profile
    FROM conversations c
    WHERE c.user1_id = user_id OR c.user2_id = user_id::TEXT
  )
  SELECT
    cu.conversation_id,
    cu.other_user_id,
    CASE
      -- For static profiles, extract the name from the profiles data
      WHEN cu.is_static_profile THEN 
        CASE
          WHEN cu.other_user_id = 'static-profile-1' THEN 'Sophie'
          WHEN cu.other_user_id = 'static-profile-2' THEN 'Marie'
          WHEN cu.other_user_id = 'static-profile-3' THEN 'Léa'
          WHEN cu.other_user_id = 'static-profile-4' THEN 'Emma'
          WHEN cu.other_user_id = 'static-profile-5' THEN 'Jade'
          ELSE 'Unknown Profile'
        END
      -- For real users, get the name from profiles table
      ELSE p.name
    END AS other_user_name,
    CASE
      -- For static profiles, use default photos
      WHEN cu.is_static_profile THEN 
        CASE
          WHEN cu.other_user_id = 'static-profile-1' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
          WHEN cu.other_user_id = 'static-profile-2' THEN 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'
          WHEN cu.other_user_id = 'static-profile-3' THEN 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'
          WHEN cu.other_user_id = 'static-profile-4' THEN 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400'
          WHEN cu.other_user_id = 'static-profile-5' THEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
          ELSE 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
        END
      -- For real users, get the photo from profiles table
      ELSE (p.photos)[1]
    END AS other_user_photo,
    lm.text AS last_message,
    lm.created_at AS last_message_time,
    COALESCE(uc.count, 0) AS unread_count
  FROM conversation_users cu
  LEFT JOIN profiles p ON (cu.profile_id = p.id)
  LEFT JOIN last_messages lm ON cu.conversation_id = lm.conversation_id
  LEFT JOIN unread_counts uc ON cu.conversation_id = uc.conversation_id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Fix the getOrCreateConversation query in the application
COMMENT ON FUNCTION get_user_conversations IS 'Gets all conversations for a user with proper handling of static profiles';