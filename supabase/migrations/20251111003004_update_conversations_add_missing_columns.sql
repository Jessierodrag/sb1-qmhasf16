/*
  # Mise à jour des conversations - Ajout de colonnes et amélioration

  1. Modifications
    - Ajouter la colonne `updated_at` si elle n'existe pas
    - Ajouter la colonne `is_read` dans messages si elle n'existe pas
    - Mettre à jour les valeurs par défaut
    - Ajouter un trigger pour mettre à jour le dernier message

  2. Notes
    - Les tables existent déjà, on ajoute seulement ce qui manque
*/

-- Ajouter updated_at à conversations si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ajouter is_read à messages si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;

-- Mettre à jour last_message_at pour avoir une valeur par défaut si NULL
UPDATE conversations 
SET last_message_at = created_at 
WHERE last_message_at IS NULL;

-- Fonction pour mettre à jour automatiquement le dernier message de la conversation
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe et le recréer
DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();