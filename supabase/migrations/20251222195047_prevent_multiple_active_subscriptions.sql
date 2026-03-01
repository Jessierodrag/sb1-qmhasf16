/*
  # Empêcher les abonnements actifs multiples pour un même utilisateur

  1. Contrainte unique
    - Crée une contrainte unique partielle sur (user_id, status)
    - Un utilisateur ne peut avoir qu'un seul abonnement avec status = 'active'
    - Permet plusieurs abonnements cancelled/expired pour le même utilisateur

  2. Notes importantes
    - Garantit qu'un utilisateur ne peut avoir qu'un seul abonnement actif à la fois
    - Empêche les bugs où plusieurs abonnements actifs créent des incohérences
    - La contrainte est partielle : elle s'applique uniquement aux abonnements actifs
*/

-- Créer une contrainte unique partielle pour empêcher plusieurs abonnements actifs
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription_per_user
  ON subscriptions (user_id)
  WHERE status = 'active';
