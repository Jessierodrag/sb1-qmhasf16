/*
  # Nettoyage des conversations invalides
  
  1. Modifications
    - Suppression des conversations avec des user_id invalides
    - Les conversations seront supprimées si user1_id ou user2_id ne correspond à aucun profil
  
  2. Sécurité
    - Cette opération nettoie les données orphelines
    - Les messages associés seront automatiquement supprimés grâce à ON DELETE CASCADE
*/

-- Supprimer les conversations où user1_id ne correspond à aucun profil
DELETE FROM conversations
WHERE user1_id NOT IN (SELECT id FROM profiles);

-- Supprimer les conversations où user2_id ne correspond à aucun profil
DELETE FROM conversations
WHERE user2_id NOT IN (SELECT id FROM profiles);
