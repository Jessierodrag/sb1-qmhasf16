import { useState, useEffect, useCallback } from 'react';
import { getTotalUnreadCount } from '../lib/conversations';
import { supabase } from '../lib/supabase';

export const useUnreadMessages = (userId: string | null | undefined, refreshInterval = 30000) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { count, error } = await getTotalUnreadCount(userId);

      if (!error) {
        setUnreadCount(count);
      } else {
        console.error('[useUnreadMessages] Erreur:', error);
      }
    } catch (err) {
      console.error('[useUnreadMessages] Erreur inattendue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    // Chargement initial
    fetchUnreadCount();

    // S'abonner aux changements des messages en temps réel
    console.log('[useUnreadMessages] Abonnement aux messages pour:', userId);
    const messagesSubscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('[useUnreadMessages] Changement détecté:', payload);
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Actualiser périodiquement en backup (au cas où Realtime échoue)
    const interval = setInterval(fetchUnreadCount, refreshInterval);

    return () => {
      console.log('[useUnreadMessages] Nettoyage des abonnements');
      messagesSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchUnreadCount, refreshInterval, userId]);

  return {
    unreadCount,
    isLoading,
    refresh: fetchUnreadCount
  };
};
