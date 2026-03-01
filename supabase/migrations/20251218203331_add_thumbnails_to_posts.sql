/*
  # Ajout des miniatures vidéo aux publications

  1. Modifications
    - Ajoute une colonne `thumbnails` (tableau de texte) à la table `posts`
      - Stocke les URLs des miniatures correspondant aux vidéos
      - Même ordre que le tableau `photos`
      - Pour les images, la valeur est NULL ou identique à photos[i]
      - Pour les vidéos, contient l'URL de la miniature extraite

  2. Notes
    - Cette colonne permet d'avoir une image de prévisualisation pour chaque média
    - Les thumbnails sont générés automatiquement lors de l'upload des vidéos
    - Améliore l'expérience utilisateur en affichant des aperçus cohérents
*/

-- Ajouter la colonne thumbnails à la table posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'thumbnails'
  ) THEN
    ALTER TABLE posts ADD COLUMN thumbnails TEXT[] DEFAULT NULL;
  END IF;
END $$;