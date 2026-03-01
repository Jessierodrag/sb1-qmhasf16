/*
  # Création de la table des avis

  1. Nouvelle Table
    - `reviews`
      - `id` (uuid, clé primaire)
      - `profile_id` (uuid, clé étrangère vers profiles)
      - `user_id` (uuid, clé étrangère vers profiles)
      - `rating` (integer, note de 1 à 5)
      - `comment` (text, commentaire)
      - `created_at` (timestamp avec fuseau horaire)
      - `updated_at` (timestamp avec fuseau horaire)

  2. Sécurité
    - Active RLS sur la table reviews
    - Ajoute des politiques pour:
      - Lecture: tout le monde peut voir les avis
      - Écriture: les utilisateurs authentifiés peuvent ajouter des avis
      - Modification: les utilisateurs peuvent modifier leurs propres avis
      - Suppression: les utilisateurs peuvent supprimer leurs propres avis

  3. Contraintes
    - Un utilisateur ne peut donner qu'un seul avis par profil
    - La note doit être entre 1 et 5
*/

-- Supprime la table si elle existe déjà pour éviter les conflits
DROP TABLE IF EXISTS reviews CASCADE;

-- Création de la table reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

-- Active RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Supprime les politiques existantes si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir tous les avis" ON reviews;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent ajouter des avis" ON reviews;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres avis" ON reviews;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres avis" ON reviews;

-- Crée les nouvelles politiques
CREATE POLICY "Les utilisateurs peuvent voir tous les avis"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent ajouter des avis"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres avis"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres avis"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Supprime la fonction trigger si elle existe
DROP FUNCTION IF EXISTS update_reviews_updated_at() CASCADE;

-- Crée la fonction trigger
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crée le trigger
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();