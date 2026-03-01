/*
  # Supprimer la limite de taille du bucket posts
  
  1. Modifications
    - Supprimer la limite de taille du bucket 'posts' en la mettant à NULL
    - Cela permet d'utiliser la limite maximale du projet Supabase (généralement 5 GB)
    - Les vidéos pourront maintenant être uploadées sans restriction de taille au niveau du bucket
  
  2. Notes
    - La limite côté frontend reste à 100 MB pour les vidéos
    - Cela résout le problème "The object exceeded the maximum allowed size"
*/

-- Supprimer la limite de taille du bucket posts
UPDATE storage.buckets 
SET file_size_limit = NULL
WHERE id = 'posts';
