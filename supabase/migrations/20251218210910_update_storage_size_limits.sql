/*
  # Augmenter la limite de taille des fichiers dans le bucket posts

  1. Modifications
    - Augmenter la limite de taille des fichiers dans le bucket 'posts' à 100 MB pour supporter les vidéos
    - Les vidéos peuvent maintenant faire jusqu'à 100 MB
    - Les images restent avec une limite de 10 MB côté frontend

  2. Notes
    - La limite par défaut de Supabase Storage est de 50 MB
    - Cette migration augmente la limite à 100 MB pour le bucket posts
    - Cela permet d'uploader des vidéos de meilleure qualité
*/

-- Mettre à jour la limite de taille du bucket posts
UPDATE storage.buckets 
SET file_size_limit = 104857600  -- 100 MB en bytes
WHERE id = 'posts';
