/*
  # Correction des conversations dupliquées
  
  1. Modifications
    - Supprimer les conversations dupliquées (garder la plus ancienne)
    - Ajouter une contrainte unique pour empêcher les doublons
    - Ajouter un index unique qui gère les deux ordres (user1, user2) et (user2, user1)
  
  2. Sécurité
    - La contrainte empêchera la création de conversations dupliquées
    - Un index unique garantit qu'une paire d'utilisateurs ne peut avoir qu'une seule conversation
*/

-- Étape 1: Supprimer les conversations dupliquées
-- Garder seulement la conversation la plus ancienne pour chaque paire d'utilisateurs
WITH duplicates AS (
  SELECT 
    id,
    user1_id,
    user2_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LEAST(user1_id::text, user2_id::text),
        GREATEST(user1_id::text, user2_id::text)
      ORDER BY created_at ASC
    ) as rn
  FROM conversations
)
DELETE FROM conversations
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Étape 2: Créer une fonction pour normaliser l'ordre des utilisateurs
-- Cela garantit que user1_id est toujours <= user2_id
CREATE OR REPLACE FUNCTION normalize_conversation_users()
RETURNS TRIGGER AS $$
BEGIN
  -- S'assurer que user1_id est toujours le plus petit UUID
  IF NEW.user1_id > NEW.user2_id THEN
    -- Échanger user1_id et user2_id
    DECLARE
      temp_id UUID;
    BEGIN
      temp_id := NEW.user1_id;
      NEW.user1_id := NEW.user2_id;
      NEW.user2_id := temp_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 3: Créer un trigger pour normaliser automatiquement les conversations
DROP TRIGGER IF EXISTS normalize_conversation_users_trigger ON conversations;
CREATE TRIGGER normalize_conversation_users_trigger
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION normalize_conversation_users();

-- Étape 4: Normaliser les conversations existantes
UPDATE conversations
SET user1_id = user2_id, user2_id = user1_id
WHERE user1_id > user2_id;

-- Étape 5: Ajouter une contrainte unique
-- Maintenant que les conversations sont normalisées, on peut ajouter la contrainte
DROP INDEX IF EXISTS unique_conversation_pair;
CREATE UNIQUE INDEX unique_conversation_pair ON conversations(user1_id, user2_id);
