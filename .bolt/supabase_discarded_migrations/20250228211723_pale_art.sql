/*
  # Correction des erreurs de type UUID vs TEXT

  1. Modifications
     - Mise à jour des politiques de sécurité pour les conversations et messages
     - Correction des fonctions pour gérer correctement les conversions de types
     - Ajout de conversions de types explicites pour éviter les erreurs d'opérateur

  2. Sécurité
     - Maintien des politiques RLS existantes avec des conversions de types appropriées
*/

-- Mettre à jour les politiques pour les conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid()::TEXT = user2_id);

DROP POLICY IF EXISTS "Users can insert conversations they are part of" ON conversations;
CREATE POLICY "Users can insert conversations they are part of"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid()::TEXT = user2_id);

-- Mettre à jour les politiques pour les messages
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

-- Améliorer la fonction get_user_conversations pour gérer correctement les types
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
  -- Extraire les IDs utilisateur pour la jointure avec les profils
  conversation_users AS (
    SELECT
      c.id AS conversation_id,
      CASE
        WHEN c.user1_id = user_id THEN c.user2_id
        ELSE c.user1_id::TEXT
      END AS other_user_id,
      CASE
        WHEN c.user1_id = user_id AND c.user2_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 
          c.user2_id::UUID
        WHEN c.user2_id = user_id::TEXT THEN 
          c.user1_id
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
      -- Pour les profils statiques, extraire le nom des données de profil
      WHEN cu.is_static_profile THEN 
        CASE
          WHEN cu.other_user_id = 'static-profile-1' THEN 'Sophie'
          WHEN cu.other_user_id = 'static-profile-2' THEN 'Marie'
          WHEN cu.other_user_id = 'static-profile-3' THEN 'Léa'
          WHEN cu.other_user_id = 'static-profile-4' THEN 'Emma'
          WHEN cu.other_user_id = 'static-profile-5' THEN 'Jade'
          ELSE 'Unknown Profile'
        END
      -- Pour les utilisateurs réels, obtenir le nom de la table des profils
      ELSE p.name
    END AS other_user_name,
    CASE
      -- Pour les profils statiques, utiliser des photos par défaut
      WHEN cu.is_static_profile THEN 
        CASE
          WHEN cu.other_user_id = 'static-profile-1' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
          WHEN cu.other_user_id = 'static-profile-2' THEN 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'
          WHEN cu.other_user_id = 'static-profile-3' THEN 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'
          WHEN cu.other_user_id = 'static-profile-4' THEN 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400'
          WHEN cu.other_user_id = 'static-profile-5' THEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
          ELSE 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
        END
      -- Pour les utilisateurs réels, obtenir la photo de la table des profils
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

-- Ajouter un commentaire explicatif sur la fonction
COMMENT ON FUNCTION get_user_conversations IS 'Récupère toutes les conversations d''un utilisateur avec gestion appropriée des profils statiques et des conversions de types';