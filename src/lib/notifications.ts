import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  post_id: string | null;
  review_id: string | null;
  type: string;
  action_type: string;
  message: string;
  read: boolean;
  created_at: string;
  actor?: {
    username: string;
    photos: string[];
  };
}

export const getNotifications = async (
  userId: string,
  limit = 50
): Promise<{ notifications: Notification[]; error: string | null }> => {
  try {
    console.log('[getNotifications] Récupération notifications pour:', userId);

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(username, photos)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getNotifications] Erreur:', error);
      throw error;
    }

    console.log('[getNotifications] Notifications récupérées:', data?.length || 0);
    return { notifications: data || [], error: null };
  } catch (error) {
    console.error('[getNotifications] Erreur:', error);
    return {
      notifications: [],
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des notifications'
    };
  }
};

export const getUnreadNotificationsCount = async (
  userId: string
): Promise<{ count: number; error: string | null }> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('[getUnreadNotificationsCount] Erreur:', error);
      throw error;
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('[getUnreadNotificationsCount] Erreur:', error);
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur lors du comptage'
    };
  }
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('[markNotificationAsRead] Marquage notification:', notificationId);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('[markNotificationAsRead] Erreur:', error);
      throw error;
    }

    console.log('[markNotificationAsRead] Notification marquée comme lue');
    return { success: true, error: null };
  } catch (error) {
    console.error('[markNotificationAsRead] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du marquage'
    };
  }
};

export const markAllNotificationsAsRead = async (
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('[markAllNotificationsAsRead] Marquage toutes notifications pour:', userId);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('[markAllNotificationsAsRead] Erreur:', error);
      throw error;
    }

    console.log('[markAllNotificationsAsRead] Toutes les notifications marquées comme lues');
    return { success: true, error: null };
  } catch (error) {
    console.error('[markAllNotificationsAsRead] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du marquage'
    };
  }
};

export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('[deleteNotification] Suppression notification:', notificationId);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('[deleteNotification] Erreur:', error);
      throw error;
    }

    console.log('[deleteNotification] Notification supprimée');
    return { success: true, error: null };
  } catch (error) {
    console.error('[deleteNotification] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression'
    };
  }
};

export const getReceivedLikesCount = async (
  userId: string
): Promise<{ count: number; error: string | null }> => {
  try {
    // Compter tous les likes reçus sur les posts de l'utilisateur
    const { count, error } = await supabase
      .from('likes')
      .select('*, posts!inner(user_id)', { count: 'exact', head: true })
      .eq('posts.user_id', userId);

    if (error) {
      console.error('[getReceivedLikesCount] Erreur:', error);
      throw error;
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('[getReceivedLikesCount] Erreur:', error);
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur lors du comptage'
    };
  }
};

export const getReceivedCommentsCount = async (
  userId: string
): Promise<{ count: number; error: string | null }> => {
  try {
    // Compter tous les commentaires reçus sur les posts de l'utilisateur
    const { count, error } = await supabase
      .from('post_reviews')
      .select('*, posts!inner(user_id)', { count: 'exact', head: true })
      .eq('posts.user_id', userId);

    if (error) {
      console.error('[getReceivedCommentsCount] Erreur:', error);
      throw error;
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('[getReceivedCommentsCount] Erreur:', error);
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur lors du comptage'
    };
  }
};
