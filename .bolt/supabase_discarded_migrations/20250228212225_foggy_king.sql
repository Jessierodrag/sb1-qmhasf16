/*
  # Requêtes SQL pour visualiser et gérer les conversations

  1. Requêtes
     - Vue pour afficher toutes les conversations avec détails
     - Fonction pour obtenir les messages d'une conversation spécifique
     - Fonction pour obtenir les statistiques des conversations
     - Requête pour rechercher dans les conversations

  2. Sécurité
     - Toutes les requêtes respectent les politiques RLS existantes
     - Aucune modification des données n'est effectuée
*/

-- Vue pour afficher toutes les conversations avec détails
CREATE OR REPLACE VIEW conversation_details AS
SELECT 
  c.id,
  c.user1_id,
  c.user2_id,
  p1.name AS user1_name,
  CASE
    WHEN c.user2_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 
      (SELECT name FROM profiles WHERE id = c.user2_id::UUID)
    WHEN c.user2_id LIKE 'static-profile-%' THEN
      CASE
        WHEN c.user2_id = 'static-profile-1' THEN 'Sophie'
        WHEN c.user2_id = 'static-profile-2' THEN 'Marie'
        WHEN c.user2_id = 'static-profile-3' THEN 'Léa'
        WHEN c.user2_id = 'static-profile-4' THEN 'Emma'
        WHEN c.user2_id = 'static-profile-5' THEN 'Jade'
        ELSE 'Unknown Profile'
      END
    ELSE 'Unknown User'
  END AS user2_name,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) AS message_count,
  (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND read = false) AS unread_count,
  (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
  c.created_at,
  c.updated_at
FROM conversations c
JOIN profiles p1 ON c.user1_id = p1.id;

-- Fonction pour obtenir les messages d'une conversation spécifique
CREATE OR REPLACE FUNCTION get_conversation_messages(conversation_id_param UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  sender_name TEXT,
  text TEXT,
  created_at TIMESTAMPTZ,
  read BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    p.name AS sender_name,
    m.text,
    m.created_at,
    m.read
  FROM messages m
  LEFT JOIN profiles p ON m.sender_id = p.id
  WHERE m.conversation_id = conversation_id_param
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques des conversations
CREATE OR REPLACE FUNCTION get_conversation_stats(user_id_param UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  total_messages BIGINT,
  unread_messages BIGINT,
  active_conversations BIGINT,
  most_active_contact TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT id
    FROM conversations
    WHERE user1_id = user_id_param OR user2_id = user_id_param::TEXT
  ),
  contact_message_counts AS (
    SELECT 
      CASE
        WHEN c.user1_id = user_id_param THEN c.user2_id
        ELSE c.user1_id::TEXT
      END AS contact_id,
      COUNT(m.id) AS message_count
    FROM conversations c
    JOIN messages m ON c.id = m.conversation_id
    WHERE c.user1_id = user_id_param OR c.user2_id = user_id_param::TEXT
    GROUP BY contact_id
    ORDER BY message_count DESC
    LIMIT 1
  ),
  most_active AS (
    SELECT
      CASE
        WHEN cmc.contact_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 
          (SELECT name FROM profiles WHERE id = cmc.contact_id::UUID)
        WHEN cmc.contact_id LIKE 'static-profile-%' THEN
          CASE
            WHEN cmc.contact_id = 'static-profile-1' THEN 'Sophie'
            WHEN cmc.contact_id = 'static-profile-2' THEN 'Marie'
            WHEN cmc.contact_id = 'static-profile-3' THEN 'Léa'
            WHEN cmc.contact_id = 'static-profile-4' THEN 'Emma'
            WHEN cmc.contact_id = 'static-profile-5' THEN 'Jade'
            ELSE 'Unknown Profile'
          END
        ELSE 'Unknown User'
      END AS contact_name
    FROM contact_message_counts cmc
  )
  SELECT
    (SELECT COUNT(*) FROM user_conversations) AS total_conversations,
    (SELECT COUNT(*) FROM messages m JOIN user_conversations uc ON m.conversation_id = uc.id) AS total_messages,
    (SELECT COUNT(*) FROM messages m 
     JOIN conversations c ON m.conversation_id = c.id 
     WHERE (c.user1_id = user_id_param OR c.user2_id = user_id_param::TEXT)
     AND m.sender_id != user_id_param
     AND m.read = false) AS unread_messages,
    (SELECT COUNT(*) FROM user_conversations uc 
     WHERE EXISTS (
       SELECT 1 FROM messages m 
       WHERE m.conversation_id = uc.id 
       AND m.created_at > NOW() - INTERVAL '30 days'
     )) AS active_conversations,
    (SELECT contact_name FROM most_active) AS most_active_contact;
END;
$$ LANGUAGE plpgsql;

-- Requête pour rechercher dans les conversations
CREATE OR REPLACE FUNCTION search_conversations(
  user_id_param UUID,
  search_term TEXT
)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id TEXT,
  other_user_name TEXT,
  message_preview TEXT,
  message_time TIMESTAMPTZ,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT 
      c.id AS conversation_id,
      CASE
        WHEN c.user1_id = user_id_param THEN c.user2_id
        ELSE c.user1_id::TEXT
      END AS other_user_id
    FROM conversations c
    WHERE c.user1_id = user_id_param OR c.user2_id = user_id_param::TEXT
  ),
  matching_messages AS (
    SELECT 
      m.conversation_id,
      m.text,
      m.created_at,
      ROW_NUMBER() OVER (PARTITION BY m.conversation_id ORDER BY m.created_at DESC) AS rn
    FROM messages m
    JOIN user_conversations uc ON m.conversation_id = uc.conversation_id
    WHERE m.text ILIKE '%' || search_term || '%'
  )
  SELECT
    uc.conversation_id,
    uc.other_user_id,
    CASE
      WHEN uc.other_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 
        (SELECT name FROM profiles WHERE id = uc.other_user_id::UUID)
      WHEN uc.other_user_id LIKE 'static-profile-%' THEN
        CASE
          WHEN uc.other_user_id = 'static-profile-1' THEN 'Sophie'
          WHEN uc.other_user_id = 'static-profile-2' THEN 'Marie'
          WHEN uc.other_user_id = 'static-profile-3' THEN 'Léa'
          WHEN uc.other_user_id = 'static-profile-4' THEN 'Emma'
          WHEN uc.other_user_id = 'static-profile-5' THEN 'Jade'
          ELSE 'Unknown Profile'
        END
      ELSE 'Unknown User'
    END AS other_user_name,
    mm.text AS message_preview,
    mm.created_at AS message_time,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = uc.conversation_id) AS message_count
  FROM user_conversations uc
  JOIN matching_messages mm ON uc.conversation_id = mm.conversation_id AND mm.rn = 1
  ORDER BY mm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Exemples d'utilisation:
COMMENT ON VIEW conversation_details IS 'Vue détaillée de toutes les conversations avec informations sur les participants';
COMMENT ON FUNCTION get_conversation_messages IS 'Récupère tous les messages d''une conversation spécifique';
COMMENT ON FUNCTION get_conversation_stats IS 'Obtient des statistiques sur les conversations d''un utilisateur';
COMMENT ON FUNCTION search_conversations IS 'Recherche dans les conversations d''un utilisateur par terme de recherche';

/*
Exemples d'utilisation:

-- Voir toutes les conversations (respecte les politiques RLS)
SELECT * FROM conversation_details;

-- Obtenir les messages d'une conversation spécifique
SELECT * FROM get_conversation_messages('conversation-uuid-here');

-- Obtenir les statistiques des conversations
SELECT * FROM get_conversation_stats('user-uuid-here');

-- Rechercher dans les conversations
SELECT * FROM search_conversations('user-uuid-here', 'terme de recherche');
*/