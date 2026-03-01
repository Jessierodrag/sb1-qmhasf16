import { supabase } from './supabase';

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export const blockUser = async (
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('[blockUser] Blocage utilisateur:', blockerId, '->', blockedId);

    const { error } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId
      });

    if (error) {
      console.error('[blockUser] Erreur:', error);
      return { success: false, error: error.message };
    }

    console.log('[blockUser] Utilisateur bloqué avec succès');
    return { success: true, error: null };
  } catch (error) {
    console.error('[blockUser] Erreur inattendue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du blocage'
    };
  }
};

export const unblockUser = async (
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('[unblockUser] Déblocage utilisateur:', blockerId, '->', blockedId);

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) {
      console.error('[unblockUser] Erreur:', error);
      return { success: false, error: error.message };
    }

    console.log('[unblockUser] Utilisateur débloqué avec succès');
    return { success: true, error: null };
  } catch (error) {
    console.error('[unblockUser] Erreur inattendue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du déblocage'
    };
  }
};

export const isUserBlocked = async (
  blockerId: string,
  blockedId: string
): Promise<{ isBlocked: boolean; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();

    if (error) {
      console.error('[isUserBlocked] Erreur:', error);
      return { isBlocked: false, error: error.message };
    }

    return { isBlocked: !!data, error: null };
  } catch (error) {
    console.error('[isUserBlocked] Erreur inattendue:', error);
    return {
      isBlocked: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la vérification'
    };
  }
};

export const getBlockedUsers = async (
  userId: string
): Promise<{ blockedUsers: BlockedUser[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getBlockedUsers] Erreur:', error);
      return { blockedUsers: [], error: error.message };
    }

    return { blockedUsers: data || [], error: null };
  } catch (error) {
    console.error('[getBlockedUsers] Erreur inattendue:', error);
    return {
      blockedUsers: [],
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération'
    };
  }
};
