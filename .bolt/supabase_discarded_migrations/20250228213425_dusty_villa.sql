-- Update the messages policy to handle static profile IDs in conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid()::TEXT)
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid()::TEXT)
    )
  );

DROP POLICY IF EXISTS "Users can update read status of their messages" ON messages;
CREATE POLICY "Users can update read status of their messages"
  ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid()::TEXT)
    )
  );

-- Fix the get_user_conversations function to properly handle static profiles
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
DECLARE
  profile_record RECORD;
BEGIN
  FOR conversation_id, other_user_id, is_static_profile, profile_id, last_message, last_message_time, unread_count IN
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
    conversation_users AS (
      SELECT
        c.id AS conversation_id,
        CASE
          WHEN c.user1_id = user_id THEN c.user2_id
          ELSE c.user1_id::TEXT
        END AS other_user_id,
        CASE
          WHEN (c.user1_id = user_id AND c.user2_id LIKE 'static-profile-%') OR 
               (c.user2_id = user_id::TEXT AND c.user1_id::TEXT LIKE 'static-profile-%') THEN TRUE
          ELSE FALSE
        END AS is_static_profile,
        CASE
          WHEN c.user1_id = user_id AND c.user2_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 
            c.user2_id::UUID
          WHEN c.user2_id = user_id::TEXT THEN 
            c.user1_id
          ELSE NULL
        END AS profile_id
      FROM conversations c
      WHERE c.user1_id = user_id OR c.user2_id = user_id::TEXT
    )
    SELECT
      cu.conversation_id,
      cu.other_user_id,
      cu.is_static_profile,
      cu.profile_id,
      lm.text AS last_message,
      lm.created_at AS last_message_time,
      COALESCE(uc.count, 0) AS unread_count
    FROM conversation_users cu
    LEFT JOIN last_messages lm ON cu.conversation_id = lm.conversation_id
    LEFT JOIN unread_counts uc ON cu.conversation_id = uc.conversation_id
    ORDER BY lm.created_at DESC NULLS LAST
  LOOP
    -- For static profiles, extract the name and photo from hardcoded values
    IF is_static_profile THEN
      CASE
        WHEN other_user_id = 'static-profile-1' THEN
          other_user_name := 'Sophie';
          other_user_photo := 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400';
        WHEN other_user_id = 'static-profile-2' THEN
          other_user_name := 'Marie';
          other_user_photo := 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400';
        WHEN other_user_id = 'static-profile-3' THEN
          other_user_name := 'Léa';
          other_user_photo := 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400';
        WHEN other_user_id = 'static-profile-4' THEN
          other_user_name := 'Emma';
          other_user_photo := 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400';
        WHEN other_user_id = 'static-profile-5' THEN
          other_user_name := 'Jade';
          other_user_photo := 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
        ELSE
          other_user_name := 'Unknown Profile';
          other_user_photo := 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400';
      END CASE;
    ELSE
      -- For real users, get the name and photo from profiles table
      IF profile_id IS NOT NULL THEN
        SELECT name, photos[1] INTO STRICT other_user_name, other_user_photo 
        FROM profiles 
        WHERE id = profile_id;
      ELSE
        other_user_name := 'Unknown User';
        other_user_photo := 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400';
      END IF;
    END IF;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;