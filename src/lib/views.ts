import { supabase } from './supabase';

export const recordPostView = async (postId: string, viewerId: string | null) => {
  try {
    if (!viewerId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .maybeSingle();

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    if (post.user_id === viewerId) {
      return { success: false, error: 'Cannot record view on own post' };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentView } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', postId)
      .eq('viewer_id', viewerId)
      .gte('viewed_at', oneHourAgo)
      .maybeSingle();

    if (recentView) {
      return { success: false, error: 'View already recorded recently' };
    }

    const { error } = await supabase
      .from('post_views')
      .insert({
        post_id: postId,
        viewer_id: viewerId,
        viewed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error recording post view:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in recordPostView:', err);
    return { success: false, error: 'Failed to record view' };
  }
};

export const getUserTotalViews = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', supabase.rpc('get_user_posts', { target_user_id: userId }));

    if (error) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);

      if (!posts || posts.length === 0) {
        return { count: 0 };
      }

      const postIds = posts.map(p => p.id);

      const { count: viewCount, error: viewError } = await supabase
        .from('post_views')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);

      if (viewError) {
        console.error('Error fetching user total views:', viewError);
        return { count: 0, error: viewError.message };
      }

      return { count: viewCount || 0 };
    }

    return { count: count || 0 };
  } catch (err) {
    console.error('Error in getUserTotalViews:', err);
    return { count: 0, error: 'Failed to fetch views' };
  }
};

export const getPostViews = async (postId: string) => {
  try {
    const { count, error } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      console.error('Error fetching post views:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0 };
  } catch (err) {
    console.error('Error in getPostViews:', err);
    return { count: 0, error: 'Failed to fetch post views' };
  }
};
