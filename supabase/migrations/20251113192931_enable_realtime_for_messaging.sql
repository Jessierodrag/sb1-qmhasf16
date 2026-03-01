/*
  # Activer Realtime pour la messagerie

  1. Changements
    - Activer Supabase Realtime pour la table `messages`
    - Activer Supabase Realtime pour la table `conversations`
  
  2. Fonctionnalité
    - Permet aux clients de s'abonner aux changements en temps réel
    - Les nouveaux messages apparaîtront instantanément dans le chat
    - Les mises à jour de conversations seront reflétées en direct
  
  3. Sécurité
    - Les politiques RLS existantes continuent de s'appliquer
    - Seules les données autorisées par RLS seront diffusées via Realtime
*/

-- Activer Realtime pour la table messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Activer Realtime pour la table conversations
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
