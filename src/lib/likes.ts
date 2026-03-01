import { supabase } from './supabase';

export interface LikeError {
  message: string;
}

export const toggleLike = async (
  postId: string,
  userId: string
): Promise<{ success: boolean; isLiked: boolean; likesCount: number; error: LikeError | null }> => {
  try {

    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[toggleLike] Erreur vérification:', checkError);
      throw checkError;
    }

    let isLiked: boolean;

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('[toggleLike] Erreur suppression:', deleteError);
        throw deleteError;
      }

      isLiked = false;
    } else {
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: userId
        });

      if (insertError) {
        console.error('[toggleLike] Erreur insertion:', insertError);
        throw insertError;
      }

      isLiked = true;
    }

    const { count, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      console.error('[toggleLike] Erreur comptage:', countError);
      throw countError;
    }

    const likesCount = count || 0;

    return {
      success: true,
      isLiked,
      likesCount,
      error: null
    };
  } catch (error) {
    console.error('[toggleLike] Erreur:', error);
    return {
      success: false,
      isLiked: false,
      likesCount: 0,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du like'
      }
    };
  }
};

export const getLikeStatus = async (
  postId: string,
  userId: string | null
): Promise<{ isLiked: boolean; likesCount: number; error: LikeError | null }> => {
  try {

    const { count, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      console.error('[getLikeStatus] Erreur comptage:', countError);
      throw countError;
    }

    const likesCount = count || 0;

    let isLiked = false;

    if (userId) {
      const { data, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('[getLikeStatus] Erreur vérification:', checkError);
        throw checkError;
      }

      isLiked = !!data;
    }


    return {
      isLiked,
      likesCount,
      error: null
    };
  } catch (error) {
    console.error('[getLikeStatus] Erreur:', error);
    return {
      isLiked: false,
      likesCount: 0,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération du statut de like'
      }
    };
  }
};

export const getPostLikesCount = async (
  postId: string
): Promise<{ likesCount: number; error: LikeError | null }> => {
  try {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('[getPostLikesCount] Erreur:', error);
      throw error;
    }

    return {
      likesCount: count || 0,
      error: null
    };
  } catch (error) {
    console.error('[getPostLikesCount] Erreur:', error);
    return {
      likesCount: 0,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue'
      }
    };
  }
};
