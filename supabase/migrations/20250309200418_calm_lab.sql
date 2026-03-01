/*
  # Création de la table des avis

  1. Nouvelle Table
    - `reviews`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers profiles)
      - `profile_id` (uuid, référence vers profiles)
      - `rating` (integer, note de 1 à 5)
      - `comment` (text, commentaire)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS
    - Policies pour lecture/écriture
    - Contraintes sur la note (1-5)
    - Un seul avis par utilisateur par profil

  3. Triggers
    - Mise à jour automatique de updated_at
*/

-- Création de la table reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Les utilisateurs peuvent voir tous les avis"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres avis"
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

-- Trigger pour updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX reviews_profile_id_idx ON reviews(profile_id);
CREATE INDEX reviews_user_id_idx ON reviews(user_id);
CREATE INDEX reviews_rating_idx ON reviews(rating);