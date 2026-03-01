/*
  # Corriger le search_path des fonctions

  1. Problème
    - Les fonctions avec un search_path mutable sont vulnérables aux attaques par injection
    - Un attaquant pourrait modifier le search_path pour rediriger vers des fonctions malveillantes

  2. Solution
    - Ajouter SET search_path = public, pg_temp à toutes les fonctions
    - Garantit que les fonctions utilisent toujours le bon schema

  3. Fonctions corrigées
    - normalize_conversation_users
    - deactivate_expired_boosts
    - notify_like
    - update_subscriptions_updated_at
    - update_post_likes_count
    - update_post_comments_count
    - notify_comment
    - notify_profile_review
    - notify_message
    - sync_profile_subscription_tier
    - update_conversation_last_message
*/

-- normalize_conversation_users
CREATE OR REPLACE FUNCTION normalize_conversation_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user1_id > NEW.user2_id THEN
    DECLARE
      temp_id uuid;
    BEGIN
      temp_id := NEW.user1_id;
      NEW.user1_id := NEW.user2_id;
      NEW.user2_id := temp_id;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- deactivate_expired_boosts
CREATE OR REPLACE FUNCTION deactivate_expired_boosts()
RETURNS void AS $$
BEGIN
  UPDATE post_boosts
  SET is_active = false
  WHERE is_active = true AND end_date <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- notify_like
CREATE OR REPLACE FUNCTION notify_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;

  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, message, actor_id, post_id, action_type)
    VALUES (
      post_owner_id,
      'like',
      'a aimé votre post',
      NEW.user_id,
      NEW.post_id,
      'like'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- update_subscriptions_updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- update_post_likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- update_post_comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- notify_comment
CREATE OR REPLACE FUNCTION notify_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;

  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, message, actor_id, post_id, action_type)
    VALUES (
      post_owner_id,
      'comment',
      'a commenté votre post',
      NEW.user_id,
      NEW.post_id,
      'comment'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- notify_profile_review
CREATE OR REPLACE FUNCTION notify_profile_review()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, message, actor_id, review_id, action_type)
  VALUES (
    NEW.to_user_id,
    'review',
    'a laissé un avis sur votre profil',
    NEW.from_user_id,
    NEW.id,
    'review'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- notify_message
CREATE OR REPLACE FUNCTION notify_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
BEGIN
  SELECT CASE
    WHEN user1_id::text = NEW.sender_id::text THEN user2_id
    ELSE user1_id
  END INTO recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  INSERT INTO notifications (user_id, type, message, actor_id, action_type)
  VALUES (
    recipient_id,
    'message',
    'vous a envoyé un message',
    NEW.sender_id::uuid,
    'message'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- sync_profile_subscription_tier
CREATE OR REPLACE FUNCTION sync_profile_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'expired') AND OLD.status = 'active' THEN
    UPDATE profiles
    SET 
      subscription_tier = NULL,
      subscription_expires_at = NULL
    WHERE user_id = NEW.user_id;
  END IF;

  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE profiles
    SET 
      subscription_tier = NEW.tier,
      subscription_expires_at = NEW.end_date
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- update_conversation_last_message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
