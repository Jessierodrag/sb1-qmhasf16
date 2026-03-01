/*
  # Système de tracking des vues de publications

  1. Nouvelle table
    - `post_views`
      - `id` (uuid, primary key)
      - `post_id` (uuid, référence vers posts)
      - `viewer_id` (uuid, référence vers profiles) - l'utilisateur qui voit le post
      - `viewed_at` (timestamptz) - quand le post a été vu
      - Index sur post_id pour des requêtes rapides
      - Index composite sur (post_id, viewer_id, viewed_at) pour éviter les doublons et optimiser les requêtes
  
  2. Sécurité
    - Enable RLS sur `post_views`
    - Policy pour permettre aux utilisateurs authentifiés d'enregistrer leurs vues
    - Policy pour permettre aux propriétaires de posts de voir les vues de leurs publications
  
  3. Index
    - Index sur post_id pour compter rapidement les vues par post
    - Index sur viewer_id pour l'historique des vues d'un utilisateur
    - Index composite pour éviter les doublons récents (même post vu plusieurs fois dans un court laps de temps)
*/

-- Créer la table post_views
CREATE TABLE IF NOT EXISTS post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewer_id ON post_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_post_views_post_viewer_date ON post_views(post_id, viewer_id, viewed_at DESC);

-- Activer RLS
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs authentifiés peuvent enregistrer une vue
CREATE POLICY "Users can record views"
  ON post_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Policy: Les propriétaires de posts peuvent voir les vues de leurs publications
CREATE POLICY "Post owners can view their post views"
  ON post_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_views.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent voir leur propre historique de vues
CREATE POLICY "Users can view their own view history"
  ON post_views
  FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());
