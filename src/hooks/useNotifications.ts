import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification
} from '../lib/notifications';
import { supabase } from '../lib/supabase';

export const useNotifications = (userId: string | null | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { notifications: notifs, error } = await getNotifications(userId);

      if (error) {
        console.error('[useNotifications] Erreur chargement:', error);
        return;
      }

      setNotifications(notifs);

      // Compter les non lues
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('[useNotifications] Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count } = await getUnreadNotificationsCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('[useNotifications] Erreur comptage:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();

    if (!userId) return;

    // S'abonner aux changements en temps réel
    console.log('[useNotifications] Abonnement aux notifications pour:', userId);

    const notificationsSubscription = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[useNotifications] Changement détecté:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      console.log('[useNotifications] Nettoyage abonnement');
      notificationsSubscription.unsubscribe();
    };
  }, [loadNotifications, userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { success } = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const { success } = await markAllNotificationsAsRead(userId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
};
