/*
  # Correction de la structure de la table likes
  
  1. Modifications
    - Supprimer la colonne profile_id (integer) qui est incorrecte
    - Ajouter la colonne post_id (uuid) pour lier aux publications
    - Ajouter une contrainte unique pour empêcher les doublons (user_id, post_id)
    - Recréer les index appropriés
  
  2. Sécurité
    - Les politiques RLS existantes restent valides
*/

-- Supprimer l'ancienne colonne profile_id
ALTER TABLE likes DROP COLUMN IF EXISTS profile_id;

-- Ajouter la nouvelle colonne post_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likes' AND column_name = 'post_id'
  ) THEN
    ALTER TABLE likes ADD COLUMN post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Créer une contrainte unique pour empêcher les doublons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_post_like'
  ) THEN
    ALTER TABLE likes ADD CONSTRAINT unique_user_post_like UNIQUE(user_id, post_id);
  END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);
