import { supabase } from './supabase';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at?: string;
  otherUser?: {
    id: string;
    user_id: string;
    name: string;
    username: string;
    photos: string[];
    user_type: string;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

/**
 * Récupère ou crée une conversation entre deux utilisateurs
 */
export const getOrCreateConversation = async (
  currentUserId: string,
  otherUserId: string
): Promise<{ conversation: Conversation | null; error: string | null }> => {
  try {
    console.log('[getOrCreateConversation] Recherche conversation entre:', currentUserId, otherUserId);

    // Normaliser l'ordre des IDs pour correspondre à la logique du trigger SQL
    const [user1, user2] = currentUserId < otherUserId
      ? [currentUserId, otherUserId]
      : [otherUserId, currentUserId];

    // Chercher une conversation existante avec les IDs normalisés
    const { data: existingConversations, error: searchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', user1)
      .eq('user2_id', user2)
      .maybeSingle();

    if (searchError) {
      console.error('[getOrCreateConversation] Erreur recherche:', searchError);
      throw searchError;
    }

    if (existingConversations) {
      console.log('[getOrCreateConversation] Conversation trouvée:', existingConversations.id);
      return { conversation: existingConversations, error: null };
    }

    // Créer une nouvelle conversation avec les IDs normalisés
    // Le trigger SQL s'assurera que l'ordre est correct
    console.log('[getOrCreateConversation] Création nouvelle conversation');
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: currentUserId,
        user2_id: otherUserId,
        last_message: '',
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('[getOrCreateConversation] Erreur création:', createError);

      // Si l'erreur est due à une violation de contrainte unique (race condition),
      // réessayer de récupérer la conversation qui vient d'être créée
      if (createError.code === '23505') {
        console.log('[getOrCreateConversation] Conversation déjà créée, récupération...');
        const { data: retryConversation, error: retryError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user1_id', user1)
          .eq('user2_id', user2)
          .maybeSingle();

        if (retryError || !retryConversation) {
          throw retryError || new Error('Impossible de récupérer la conversation');
        }

        return { conversation: retryConversation, error: null };
      }

      throw createError;
    }

    console.log('[getOrCreateConversation] Conversation créée:', newConversation.id);
    return { conversation: newConversation, error: null };
  } catch (error) {
    console.error('[getOrCreateConversation] Erreur:', error);
    return {
      conversation: null,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération/création de la conversation'
    };
  }
};

/**
 * Récupère toutes les conversations d'un utilisateur
 */
export const getUserConversations = async (
  userId: string
): Promise<{ conversations: Conversation[]; error: string | null }> => {
  try {
    console.log('[getUserConversations] Récupération conversations pour:', userId);

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:profiles!conversations_user1_id_fkey(id, user_id, name, username, photos, user_type),
        user2:profiles!conversations_user2_id_fkey(id, user_id, name, username, photos, user_type)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .not('deleted_by', 'cs', `{${userId}}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('[getUserConversations] Erreur:', error);
      throw error;
    }

    // Enrichir avec l'autre utilisateur et compter les messages non lus
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;

        // Compter les messages non lus
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        return {
          ...conv,
          otherUser,
          unread_count: count || 0
        };
      })
    );

    console.log('[getUserConversations] Conversations récupérées:', enrichedConversations.length);
    return { conversations: enrichedConversations, error: null };
  } catch (error) {
    console.error('[getUserConversations] Erreur:', error);
    return {
      conversations: [],
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des conversations'
    };
  }
};

/**
 * Récupère les messages d'une conversation
 */
export const getConversationMessages = async (
  conversationId: string
): Promise<{ messages: Message[]; error: string | null }> => {
  try {
    console.log('[getConversationMessages] Récupération messages pour conversation:', conversationId);

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[getConversationMessages] Erreur:', error);
      throw error;
    }

    console.log('[getConversationMessages] Messages récupérés:', messages?.length || 0);
    return { messages: messages || [], error: null };
  } catch (error) {
    console.error('[getConversationMessages] Erreur:', error);
    return {
      messages: [],
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des messages'
    };
  }
};

/**
 * Envoie un message dans une conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ message: Message | null; error: string | null }> => {
  try {
    console.log('[sendMessage] Envoi message dans conversation:', conversationId);

    if (!content.trim()) {
      throw new Error('Le message ne peut pas être vide');
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('[sendMessage] Erreur:', error);
      throw error;
    }

    // Mettre à jour la conversation avec le dernier message
    await supabase
      .from('conversations')
      .update({
        last_message: content.trim(),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    console.log('[sendMessage] Message envoyé:', message.id);
    return { message, error: null };
  } catch (error) {
    console.error('[sendMessage] Erreur:', error);
    return {
      message: null,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message'
    };
  }
};

/**
 * Marque les messages d'une conversation comme lus
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('[markMessagesAsRead] Marquage messages comme lus pour conversation:', conversationId);

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[markMessagesAsRead] Erreur:', error);
      throw error;
    }

    console.log('[markMessagesAsRead] Messages marqués comme lus');
    return { success: true, error: null };
  } catch (error) {
    console.error('[markMessagesAsRead] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du marquage des messages'
    };
  }
};

/**
 * Compte le nombre total de messages non lus pour un utilisateur
 */
export const getTotalUnreadCount = async (
  userId: string
): Promise<{ count: number; error: string | null }> => {
  try {
    // Récupérer toutes les conversations de l'utilisateur (non supprimées)
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .not('deleted_by', 'cs', `{${userId}}`);

    if (convError) throw convError;

    if (!conversations || conversations.length === 0) {
      return { count: 0, error: null };
    }

    const conversationIds = conversations.map(c => c.id);

    // Compter les messages non lus dans ces conversations
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('[getTotalUnreadCount] Erreur:', error);
    return {
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur lors du comptage des messages'
    };
  }
};

export const deleteConversation = async (
  conversationId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    console.log('[deleteConversation] Suppression conversation:', conversationId, 'pour:', userId);

    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('deleted_by')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('[deleteConversation] Erreur récupération:', fetchError);
      throw fetchError;
    }

    const deletedBy = conversation.deleted_by || [];
    if (!deletedBy.includes(userId)) {
      deletedBy.push(userId);
    }

    const { error: updateError } = await supabase
      .from('conversations')
      .update({ deleted_by: deletedBy })
      .eq('id', conversationId);

    if (updateError) {
      console.error('[deleteConversation] Erreur mise à jour:', updateError);
      throw updateError;
    }

    console.log('[deleteConversation] Conversation supprimée avec succès');
    return { success: true, error: null };
  } catch (error) {
    console.error('[deleteConversation] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la suppression'
    };
  }
};
