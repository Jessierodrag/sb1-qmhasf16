/*
  # Ajouter les index manquants sur les foreign keys

  1. Index ajoutés
    - Index sur conversations.user2_id pour améliorer les performances de jointure
    - Index sur messages.sender_id pour améliorer les performances de jointure
    - Index sur notifications.review_id pour améliorer les performances de jointure

  2. Notes importantes
    - Les foreign keys sans index peuvent causer des performances dégradées sur les requêtes de jointure
    - Ces index améliorent significativement les performances des requêtes impliquant ces relations
*/

-- Index pour conversations.user2_id
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);

-- Index pour messages.sender_id
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Index pour notifications.review_id
CREATE INDEX IF NOT EXISTS idx_notifications_review_id ON notifications(review_id);
