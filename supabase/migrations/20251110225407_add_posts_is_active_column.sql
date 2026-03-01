/*
  # Ajouter la colonne is_active aux publications

  1. Modifications
    - Ajoute la colonne `is_active` à la table `posts` pour gérer la désactivation temporaire
    - Valeur par défaut : true (publication active)
    
  2. Notes
    - Les publications désactivées ne seront pas affichées dans le feed public
    - L'utilisateur peut réactiver ses publications à tout moment
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;