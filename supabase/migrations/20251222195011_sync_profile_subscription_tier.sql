/*
  # Synchronisation automatique du subscription_tier dans profiles

  1. Fonction trigger
    - Crée une fonction qui synchronise automatiquement le subscription_tier dans profiles
    - Lorsqu'un abonnement est annulé ou expiré, met subscription_tier à NULL
    - Lorsqu'un abonnement est activé, met à jour subscription_tier avec le tier approprié

  2. Trigger
    - Se déclenche sur UPDATE de la table subscriptions
    - Maintient la cohérence entre subscriptions et profiles automatiquement

  3. Notes importantes
    - Garantit l'intégrité des données même en cas de bug dans le code
    - Élimine les risques d'incohérence entre subscription_tier et le statut réel de l'abonnement
    - Fonctionne de manière transparente sans nécessiter de modifications du code applicatif
*/

-- Fonction pour synchroniser le subscription_tier dans profiles
CREATE OR REPLACE FUNCTION sync_profile_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'abonnement devient annulé ou expiré, supprimer le tier du profil
  IF NEW.status IN ('cancelled', 'expired') AND OLD.status = 'active' THEN
    UPDATE profiles
    SET 
      subscription_tier = NULL,
      subscription_expires_at = NULL
    WHERE user_id = NEW.user_id;
  END IF;

  -- Si l'abonnement devient actif, mettre à jour le tier dans le profil
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE profiles
    SET 
      subscription_tier = NEW.tier,
      subscription_expires_at = NEW.end_date
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table subscriptions
DROP TRIGGER IF EXISTS trigger_sync_profile_subscription_tier ON subscriptions;
CREATE TRIGGER trigger_sync_profile_subscription_tier
  AFTER UPDATE OF status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_subscription_tier();
