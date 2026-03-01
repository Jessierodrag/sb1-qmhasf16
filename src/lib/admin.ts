import { supabase } from './supabase';
import type { UserProfile, Post, Review } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalReviews: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  clientUsers: number;
  proUsers: number;
}

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[checkIsAdmin] Error:', error);
      return false;
    }

    return data?.is_admin === true;
  } catch (error) {
    console.error('[checkIsAdmin] Error:', error);
    return false;
  }
};

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const [usersRes, postsRes, reviewsRes, subsRes, activeSubsRes, clientsRes, prosRes] =
      await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('price'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString()),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('user_type', 'client'),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('user_type', 'professional'),
      ]);

    const totalRevenue = subsRes.data?.reduce((sum, sub) => sum + (sub.price || 0), 0) || 0;

    return {
      totalUsers: usersRes.count || 0,
      totalPosts: postsRes.count || 0,
      totalReviews: reviewsRes.count || 0,
      totalSubscriptions: subsRes.data?.length || 0,
      activeSubscriptions: activeSubsRes.count || 0,
      totalRevenue,
      clientUsers: clientsRes.count || 0,
      proUsers: prosRes.count || 0,
    };
  } catch (error) {
    console.error('[getAdminStats] Error:', error);
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalReviews: 0,
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      clientUsers: 0,
      proUsers: 0,
    };
  }
};

export const getAllUsers = async (): Promise<{ users: UserProfile[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mappedUsers = (data || []).map((user: any) => ({
      ...user,
      userType: user.user_type === 'professional' ? 'pro' : user.user_type
    }));

    return { users: mappedUsers, error: null };
  } catch (error) {
    console.error('[getAllUsers] Error:', error);
    return { users: [], error: error instanceof Error ? error.message : 'Error fetching users' };
  }
};

export const updateUserStatus = async (
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('[updateUserStatus] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error updating user' };
  }
};

export const deleteUser = async (
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('[deleteUser] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error deleting user' };
  }
};

export const makeUserAdmin = async (
  userId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('[makeUserAdmin] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error updating admin status' };
  }
};

export const getAllPosts = async (): Promise<{ posts: Post[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!posts_user_id_fkey (
          id,
          user_id,
          name,
          username,
          photos,
          location,
          subscription_tier
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { posts: data || [], error: null };
  } catch (error) {
    console.error('[getAllPosts] Error:', error);
    return { posts: [], error: error instanceof Error ? error.message : 'Error fetching posts' };
  }
};

export const updatePostStatus = async (
  postId: string,
  isActive: boolean
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ is_active: isActive })
      .eq('id', postId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('[updatePostStatus] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error updating post' };
  }
};

export const deletePost = async (
  postId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('[deletePost] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error deleting post' };
  }
};

export const getAllReviews = async (): Promise<{ reviews: Review[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profile:profiles!reviews_to_user_id_fkey (name, username, photos),
        reviewer:profiles!reviews_from_user_id_fkey (name, username, photos)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { reviews: data || [], error: null };
  } catch (error) {
    console.error('[getAllReviews] Error:', error);
    return { reviews: [], error: error instanceof Error ? error.message : 'Error fetching reviews' };
  }
};

export const deleteReview = async (
  reviewId: number
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('[deleteReview] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error deleting review' };
  }
};

export const getSubscriptionSettings = async (): Promise<{
  settings: any;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('setting_key', 'subscription_plans')
      .maybeSingle();

    if (error) throw error;

    return { settings: data?.setting_value || null, error: null };
  } catch (error) {
    console.error('[getSubscriptionSettings] Error:', error);
    return {
      settings: null,
      error: error instanceof Error ? error.message : 'Error fetching settings',
    };
  }
};

export const updateSubscriptionSettings = async (
  settings: any
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', currentUser.user.id)
      .single();

    const { error } = await supabase
      .from('admin_settings')
      .update({
        setting_value: settings,
        updated_by: profile?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', 'subscription_plans');

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('[updateSubscriptionSettings] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error updating settings',
    };
  }
};

export const getAllSubscriptions = async (): Promise<{
  subscriptions: any[];
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        profile:profiles!subscriptions_user_id_fkey (
          id,
          name,
          username,
          user_type,
          photos
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { subscriptions: data || [], error: null };
  } catch (error) {
    console.error('[getAllSubscriptions] Error:', error);
    return {
      subscriptions: [],
      error: error instanceof Error ? error.message : 'Error fetching subscriptions',
    };
  }
};
