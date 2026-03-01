/*
  # Ajout de la table des commentaires

  1. Nouvelle Table
    - `post_comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `comment` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS
    - Policies pour la lecture/écriture des commentaires
*/

-- Vérifier si la table existe déjà
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    comment text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DO $$ BEGIN
  DROP POLICY IF EXISTS "Les utilisateurs peuvent ajouter leurs propres commentaires" ON post_comments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres commentaires" ON post_comments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres commentaires" ON post_comments;
  DROP POLICY IF EXISTS "Les utilisateurs peuvent voir tous les commentaires" ON post_comments;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Créer les nouvelles policies
CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres commentaires"
  ON post_comments
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres commentaires"
  ON post_comments
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres commentaires"
  ON post_comments
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent voir tous les commentaires"
  ON post_comments
  FOR SELECT
  TO public
  USING (true);

-- Créer ou remplacer la fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;

-- Créer le nouveau trigger
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_updated_at();

-- Créer les index s'ils n'existent pas déjà
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON post_comments(post_id);
  CREATE INDEX IF NOT EXISTS post_comments_user_id_idx ON post_comments(user_id);
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;