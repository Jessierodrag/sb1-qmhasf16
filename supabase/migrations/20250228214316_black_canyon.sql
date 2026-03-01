/*
  # Création de la table des publications et configuration du stockage

  1. Nouvelles Tables
    - `posts` - Stocke les métadonnées des publications
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence à profiles.id)
      - `caption` (texte, description de la publication)
      - `location` (texte, lieu de la publication)
      - `tags` (tableau de texte, tags associés)
      - `photos` (tableau de texte, URLs des photos)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Sécurité
    - Active RLS sur la table `posts`
    - Ajoute des politiques pour permettre aux utilisateurs de gérer leurs publications
    - Configure les déclencheurs pour mettre à jour le timestamp
*/

-- Création de la table des publications
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption TEXT,
  location TEXT,
  tags TEXT[],
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Les utilisateurs peuvent voir toutes les publications"
  ON posts
  FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres publications"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres publications"
  ON posts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres publications"
  ON posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_posts_updated_at();

-- Création de la table des likes de publications
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Activer RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les likes
CREATE POLICY "Les utilisateurs peuvent voir tous les likes"
  ON post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres likes"
  ON post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres likes"
  ON post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Création de la table des commentaires
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les commentaires
CREATE POLICY "Les utilisateurs peuvent voir tous les commentaires"
  ON post_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres commentaires"
  ON post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres commentaires"
  ON post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres commentaires"
  ON post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour le timestamp des commentaires
CREATE OR REPLACE FUNCTION update_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_updated_at();