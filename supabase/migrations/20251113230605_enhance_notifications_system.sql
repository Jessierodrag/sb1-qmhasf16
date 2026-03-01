/*
  # Amélioration du système de notifications
  
  1. Modifications
    - Ajouter des colonnes à la table notifications pour plus de contexte
      - `actor_id` (uuid) - ID de l'utilisateur qui a effectué l'action
      - `post_id` (uuid nullable) - Référence au post concerné
      - `review_id` (uuid nullable) - Référence à l'avis concerné
      - `action_type` (text) - Type d'action (like, comment, review, message)
    - Créer des fonctions trigger pour créer automatiquement des notifications
    - Créer des index pour améliorer les performances
  
  2. Sécurité
    - Les politiques RLS existantes restent valides
*/

-- Améliorer la structure de la table notifications
DO $$
BEGIN
  -- Ajouter actor_id (celui qui effectue l'action)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'actor_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;

  -- Ajouter post_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  -- Ajouter review_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'review_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN review_id UUID REFERENCES reviews(id) ON DELETE CASCADE;
  END IF;

  -- Ajouter action_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_type TEXT NOT NULL DEFAULT 'other';
  END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON notifications(post_id);

-- Fonction pour créer une notification de like
CREATE OR REPLACE FUNCTION notify_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  actor_username TEXT;
BEGIN
  -- Récupérer le propriétaire du post
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Ne pas notifier si l'utilisateur like son propre post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Récupérer le username de l'acteur
  SELECT username INTO actor_username
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Créer la notification
  INSERT INTO notifications (user_id, actor_id, post_id, type, action_type, message)
  VALUES (
    post_owner_id,
    NEW.user_id,
    NEW.post_id,
    'like',
    'like',
    actor_username || ' a aimé votre publication'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une notification de commentaire (post_review)
CREATE OR REPLACE FUNCTION notify_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  actor_username TEXT;
BEGIN
  -- Récupérer le propriétaire du post
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Ne pas notifier si l'utilisateur commente son propre post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Récupérer le username de l'acteur
  SELECT username INTO actor_username
  FROM profiles
  WHERE user_id = NEW.user_id;

  -- Créer la notification
  INSERT INTO notifications (user_id, actor_id, post_id, review_id, type, action_type, message)
  VALUES (
    post_owner_id,
    NEW.user_id,
    NEW.post_id,
    NEW.id,
    'comment',
    'comment',
    actor_username || ' a commenté votre publication'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une notification d'avis profil
CREATE OR REPLACE FUNCTION notify_profile_review()
RETURNS TRIGGER AS $$
DECLARE
  actor_username TEXT;
BEGIN
  -- Ne pas notifier si l'utilisateur s'auto-évalue
  IF NEW.to_user_id = NEW.from_user_id THEN
    RETURN NEW;
  END IF;

  -- Récupérer le username de l'acteur
  SELECT username INTO actor_username
  FROM profiles
  WHERE user_id = NEW.from_user_id;

  -- Créer la notification
  INSERT INTO notifications (user_id, actor_id, review_id, type, action_type, message)
  VALUES (
    NEW.to_user_id,
    NEW.from_user_id,
    NEW.id,
    'review',
    'review',
    actor_username || ' vous a laissé un avis (' || NEW.rating || ' étoiles)'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une notification de message
CREATE OR REPLACE FUNCTION notify_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  actor_username TEXT;
BEGIN
  -- Récupérer le destinataire (l'autre personne dans la conversation)
  SELECT 
    CASE 
      WHEN c.user1_id = NEW.sender_id THEN c.user2_id
      ELSE c.user1_id
    END INTO recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- Récupérer le username de l'expéditeur
  SELECT username INTO actor_username
  FROM profiles
  WHERE user_id = NEW.sender_id;

  -- Créer la notification
  INSERT INTO notifications (user_id, actor_id, type, action_type, message)
  VALUES (
    recipient_id,
    NEW.sender_id,
    'message',
    'message',
    actor_username || ' vous a envoyé un message'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS trigger_notify_like ON likes;
DROP TRIGGER IF EXISTS trigger_notify_comment ON post_reviews;
DROP TRIGGER IF EXISTS trigger_notify_profile_review ON reviews;
DROP TRIGGER IF EXISTS trigger_notify_message ON messages;

-- Créer les triggers
CREATE TRIGGER trigger_notify_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_like();

CREATE TRIGGER trigger_notify_comment
  AFTER INSERT ON post_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment();

CREATE TRIGGER trigger_notify_profile_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_profile_review();

CREATE TRIGGER trigger_notify_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message();
