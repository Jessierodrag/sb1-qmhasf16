/*
  # Création des buckets de stockage pour les photos

  1. Nouveaux buckets
    - `profile_photos` - Pour les photos de profil des utilisateurs
    - `post_photos` - Pour les photos des publications
  
  2. Sécurité
    - Enable RLS sur les buckets
    - Politiques pour permettre aux utilisateurs authentifiés de télécharger et visualiser les photos
*/

-- Création du bucket pour les photos de profil
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'Profile Photos', true)
ON CONFLICT (id) DO NOTHING;

-- Création du bucket pour les photos des publications
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_photos', 'Post Photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket profile_photos
CREATE POLICY "Les utilisateurs authentifiés peuvent télécharger des photos de profil"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres photos de profil"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres photos de profil"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Tout le monde peut voir les photos de profil"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile_photos');

-- Politiques pour le bucket post_photos
CREATE POLICY "Les utilisateurs authentifiés peuvent télécharger des photos de publication"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres photos de publication"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'post_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres photos de publication"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'post_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Tout le monde peut voir les photos de publication"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post_photos');