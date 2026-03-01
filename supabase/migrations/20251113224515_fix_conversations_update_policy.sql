/*
  # Correction des mises à jour de conversations
  
  1. Modifications
    - Ajouter une politique UPDATE pour permettre la mise à jour automatique de last_message
    - Mettre à jour toutes les conversations existantes avec leurs derniers messages
  
  2. Sécurité
    - La politique UPDATE permet aux participants de mettre à jour la conversation
    - Les triggers peuvent maintenant fonctionner correctement
*/

-- Ajouter une politique UPDATE pour conversations si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' AND policyname = 'Users can update their conversations'
  ) THEN
    CREATE POLICY "Users can update their conversations"
      ON conversations
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user1_id OR auth.uid() = user2_id)
      WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
  END IF;
END $$;

-- Mettre à jour toutes les conversations avec leurs derniers messages
UPDATE conversations c
SET 
  last_message = COALESCE((
    SELECT content 
    FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  ), ''),
  last_message_at = COALESCE((
    SELECT created_at 
    FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY m.created_at DESC 
    LIMIT 1
  ), c.created_at)
WHERE last_message IS NULL OR last_message = '';
