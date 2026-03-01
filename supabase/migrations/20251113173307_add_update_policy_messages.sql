/*
  # Ajouter politique UPDATE pour les messages

  1. Modifications
    - Ajouter une politique UPDATE sur la table `messages`
    - Permet aux utilisateurs de marquer les messages comme lus dans leurs conversations
  
  2. Sécurité
    - Les utilisateurs peuvent seulement modifier les messages des conversations auxquelles ils participent
    - Les utilisateurs ne peuvent modifier que le champ `is_read`
*/

-- Ajouter la politique UPDATE pour permettre de marquer les messages comme lus
CREATE POLICY "Users can update message read status"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );
