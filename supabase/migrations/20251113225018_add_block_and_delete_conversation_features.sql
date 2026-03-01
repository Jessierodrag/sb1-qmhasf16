/*
  # Ajout des fonctionnalités de blocage et suppression de conversations
  
  1. Nouvelles Tables
    - `blocked_users`
      - `id` (uuid, primary key)
      - `blocker_id` (uuid, référence vers profiles.id) - Utilisateur qui bloque
      - `blocked_id` (uuid, référence vers profiles.id) - Utilisateur bloqué
      - `created_at` (timestamp)
      - Contrainte unique pour empêcher les doublons (blocker_id, blocked_id)
  
  2. Modifications
    - Ajouter une colonne `deleted_by` à la table `conversations`
      - Tableau d'UUIDs pour stocker les utilisateurs qui ont supprimé la conversation
      - Par défaut: tableau vide
  
  3. Sécurité
    - RLS activé sur `blocked_users`
    - Politique SELECT: Les utilisateurs peuvent voir qui ils ont bloqué
    - Politique INSERT: Les utilisateurs peuvent bloquer d'autres utilisateurs
    - Politique DELETE: Les utilisateurs peuvent débloquer les utilisateurs qu'ils ont bloqués
    - Modification des politiques de messages pour empêcher l'envoi aux utilisateurs bloqués
*/

-- Créer la table blocked_users
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_users_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT unique_block UNIQUE(blocker_id, blocked_id)
);

-- Activer RLS sur blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Les utilisateurs peuvent voir qui ils ont bloqué
CREATE POLICY "Users can view their blocks"
  ON blocked_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Politique INSERT: Les utilisateurs peuvent bloquer d'autres utilisateurs
CREATE POLICY "Users can block others"
  ON blocked_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

-- Politique DELETE: Les utilisateurs peuvent débloquer
CREATE POLICY "Users can unblock others"
  ON blocked_users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Ajouter une colonne deleted_by à conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE conversations ADD COLUMN deleted_by UUID[] DEFAULT '{}';
  END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes de blocage
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Créer un index pour améliorer les performances des requêtes de conversations supprimées
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_by ON conversations USING GIN(deleted_by);

-- Modifier la politique INSERT des messages pour empêcher l'envoi aux utilisateurs bloqués
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
    -- Vérifier que l'utilisateur n'est pas bloqué par le destinataire
    AND NOT EXISTS (
      SELECT 1 FROM conversations c
      JOIN blocked_users bu ON (
        (bu.blocker_id = c.user1_id AND bu.blocked_id = auth.uid()) OR
        (bu.blocker_id = c.user2_id AND bu.blocked_id = auth.uid())
      )
      WHERE c.id = conversation_id
    )
  );
