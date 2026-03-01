/*
  # Ajouter l'index manquant sur post_boosts.post_id

  1. Index ajouté
    - Index sur post_boosts.post_id pour améliorer les performances de jointure

  2. Notes importantes
    - Les foreign keys sans index peuvent causer des performances dégradées sur les requêtes de jointure
    - Cet index améliore significativement les performances des requêtes impliquant cette relation
*/

-- Index pour post_boosts.post_id
CREATE INDEX IF NOT EXISTS idx_post_boosts_post_id ON post_boosts(post_id);
