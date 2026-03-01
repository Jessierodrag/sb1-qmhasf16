/*
  # Autoriser la lecture publique des publications

  1. Changements
    - Ajouter une politique permettant aux utilisateurs non authentifiés (anon) de voir les publications actives
    - Cette politique s'ajoute à la politique existante pour les utilisateurs authentifiés
  
  2. Sécurité
    - Seules les publications actives (is_active = true) sont visibles publiquement
    - Les utilisateurs non authentifiés ont uniquement accès en lecture (SELECT)
    - Les autres opérations (INSERT, UPDATE, DELETE) restent réservées aux utilisateurs authentifiés
*/

CREATE POLICY "Anonymous users can view active posts"
  ON posts
  FOR SELECT
  TO anon
  USING (is_active = true);
