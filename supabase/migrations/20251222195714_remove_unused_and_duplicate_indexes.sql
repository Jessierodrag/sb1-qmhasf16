/*
  # Supprimer les index inutilisés et dupliqués

  1. Index dupliqués supprimés
    - idx_likes_user (duplicata de idx_likes_user_id)

  2. Index inutilisés supprimés
    - idx_conversations_deleted_by
    - post_reviews_created_at_idx
    - idx_likes_created_at
    - idx_conversations_users
    - idx_messages_created_at
    - idx_notifications_user
    - idx_post_boosts_post_active
    - idx_posts_boosted
    - idx_post_boosts_city_active

  3. Notes importantes
    - Les index inutilisés consomment de l'espace disque et ralentissent les opérations d'écriture
    - Cette migration améliore les performances d'insertion/mise à jour
*/

-- Supprimer l'index dupliqué
DROP INDEX IF EXISTS idx_likes_user;

-- Supprimer les index inutilisés
DROP INDEX IF EXISTS idx_conversations_deleted_by;
DROP INDEX IF EXISTS post_reviews_created_at_idx;
DROP INDEX IF EXISTS idx_likes_created_at;
DROP INDEX IF EXISTS idx_conversations_users;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_post_boosts_post_active;
DROP INDEX IF EXISTS idx_posts_boosted;
DROP INDEX IF EXISTS idx_post_boosts_city_active;
