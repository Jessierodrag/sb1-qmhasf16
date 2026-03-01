/*
  # Modify Conversations Table for Static Profiles

  1. Changes
    - Create a new conversations table with TEXT type for user2_id
    - Preserve existing data and relationships
    - Recreate policies for the new table structure
    - Update the get_user_conversations function
  
  2. Notes
    - This migration uses CASCADE to handle dependent objects
    - All existing policies and triggers will be recreated
*/

-- Create a new conversations table with TEXT type for user2_id
CREATE TABLE conversations_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Copy data from the old table to the new one
INSERT INTO conversations_new (id, user1_id, user2_id, created_at, updated_at)
SELECT id, user1_id, user2_id::TEXT, created_at, updated_at
FROM conversations;

-- Drop the old table with CASCADE to remove dependent objects
DROP TABLE conversations CASCADE;

-- Rename the new table to the original name
ALTER TABLE conversations_new RENAME TO conversations;

-- Add foreign key constraint back to messages table
ALTER TABLE messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Enable Row Level Security on the new table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Recreate the policies for the new conversations table
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid()::TEXT = user1_id::TEXT OR auth.uid()::TEXT = user2_id);

CREATE POLICY "Users can insert conversations they are part of"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user1_id::TEXT OR auth.uid()::TEXT = user2_id);

-- Recreate the function to update the updated_at column for conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column for conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversations_updated_at();

-- Create function to update conversation's updated_at when a new message is added
CREATE OR REPLACE FUNCTION update_conversation_timestamp_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation's updated_at when a new message is added
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp_on_message();

-- Update the get_user_conversations function to handle static profile IDs
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
  )
  SELECT
    c.id AS conversation_id,
    CASE
      WHEN c.user1_id = user_id THEN c.user2_id
      ELSE c.user1_id::TEXT
    END AS other_user_id,
    CASE
      -- For static profiles, extract the name from the profiles data
      WHEN (c.user1_id = user_id AND c.user2_id LIKE 'static-profile-%') OR 
           (c.user2_id = user_id::TEXT AND c.user1_id::TEXT LIKE 'static-profile-%') THEN 
        CASE
          WHEN c.user2_id = 'static-profile-1' OR c.user1_id::TEXT = 'static-profile-1' THEN 'Sophie'
          WHEN c.user2_id = 'static-profile-2' OR c.user1_id::TEXT = 'static-profile-2' THEN 'Marie'
          WHEN c.user2_id = 'static-profile-3' OR c.user1_id::TEXT = 'static-profile-3' THEN 'Léa'
          WHEN c.user2_id = 'static-profile-4' OR c.user1_id::TEXT = 'static-profile-4' THEN 'Emma'
          WHEN c.user2_id = 'static-profile-5' OR c.user1_id::TEXT = 'static-profile-5' THEN 'Jade'
          ELSE 'Unknown Profile'
        END
      -- For real users, get the name from profiles table
      ELSE p.name
    END AS other_user_name,
    CASE
      -- For static profiles, use default photos
      WHEN (c.user1_id = user_id AND c.user2_id LIKE 'static-profile-%') OR 
           (c.user2_id = user_id::TEXT AND c.user1_id::TEXT LIKE 'static-profile-%') THEN 
        CASE
          WHEN c.user2_id = 'static-profile-1' OR c.user1_id::TEXT = 'static-profile-1' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
          WHEN c.user2_id = 'static-profile-2' OR c.user1_id::TEXT = 'static-profile-2' THEN 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'
          WHEN c.user2_id = 'static-profile-3' OR c.user1_id::TEXT = 'static-profile-3' THEN 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'
          WHEN c.user2_id = 'static-profile-4' OR c.user1_id::TEXT = 'static-profile-4' THEN 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400'
          WHEN c.user2_id = 'static-profile-5' OR c.user1_id::TEXT = 'static-profile-5' THEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
          ELSE 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
        END
      -- For real users, get the photo from profiles table
      ELSE (p.photos)[1]
    END AS other_user_photo,
    lm.text AS last_message,
    lm.created_at AS last_message_time,
    COALESCE(uc.count, 0) AS unread_count
  FROM conversations c
  LEFT JOIN profiles p ON (
    CASE
      WHEN c.user1_id = user_id AND c.user2_id NOT LIKE 'static-profile-%' THEN 
        CASE 
          WHEN c.user2_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 
            c.user2_id::UUID 
          ELSE NULL 
        END
      WHEN c.user2_id = user_id::TEXT AND c.user1_id::TEXT NOT LIKE 'static-profile-%' THEN c.user1_id
      ELSE NULL
    END = p.id
  )
  LEFT JOIN last_messages lm ON c.id = lm.conversation_id
  LEFT JOIN unread_counts uc ON c.id = uc.conversation_id
  WHERE c.user1_id = user_id OR c.user2_id = user_id::TEXT
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Recreate policies for messages to work with the new conversations table
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