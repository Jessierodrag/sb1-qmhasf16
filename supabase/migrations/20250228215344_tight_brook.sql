-- Création du bucket pour les publications
INSERT INTO storage.buckets (id, name, public)
VALUES ('publications', 'Publications', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques pour le bucket publications
CREATE POLICY "Les utilisateurs authentifiés peuvent télécharger des publications"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'publications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres publications"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'publications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres publications"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'publications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Tout le monde peut voir les publications"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'publications');