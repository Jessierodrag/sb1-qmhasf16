import { supabase } from './supabase';

export interface UserStats {
  userId: string;
  name: string;
  username: string | null;
  userType: 'client' | 'professional';
  photos: string[];
  accountCreatedAt: string;
  totalReviewsGiven: number;
  averageRatingGiven: number;
  totalReviewsReceived: number;
  averageRatingReceived: number;
  isActive: boolean;
}

export interface UserReviewWithProfile {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  professionalId: string;
  professionalName: string;
  professionalUsername: string | null;
  professionalPhoto: string | null;
  professionalUserType: string;
}

export const getUserStats = async (userId: string): Promise<{ stats: UserStats | null; error: string | null }> => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, name, username, user_type, photos, created_at, is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }

    if (!profile) {
      return { stats: null, error: 'Profil non trouvé' };
    }

    const { count: profileReviewsGivenCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', userId);

    const { count: postReviewsGivenCount } = await supabase
      .from('post_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const totalReviewsGiven = (profileReviewsGivenCount || 0) + (postReviewsGivenCount || 0);

    const { data: profileReviewsGiven } = await supabase
      .from('reviews')
      .select('rating')
      .eq('from_user_id', userId);

    const { data: postReviewsGiven } = await supabase
      .from('post_reviews')
      .select('rating')
      .eq('user_id', userId);

    let averageRatingGiven = 0;
    const allReviewsGiven = [...(profileReviewsGiven || []), ...(postReviewsGiven || [])];

    if (allReviewsGiven.length > 0) {
      const totalRating = allReviewsGiven.reduce((sum, review) => sum + review.rating, 0);
      averageRatingGiven = totalRating / allReviewsGiven.length;
    }

    const { count: profileReviewsReceivedCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', userId);

    const { data: userPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    let postReviewsReceivedCount = 0;
    let postReviewsReceived: any[] = [];

    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(post => post.id);

      const { count } = await supabase
        .from('post_reviews')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);

      postReviewsReceivedCount = count || 0;

      const { data } = await supabase
        .from('post_reviews')
        .select('rating')
        .in('post_id', postIds);

      postReviewsReceived = data || [];
    }

    const totalReviewsReceived = (profileReviewsReceivedCount || 0) + postReviewsReceivedCount;

    const { data: profileReviewsReceived } = await supabase
      .from('reviews')
      .select('rating')
      .eq('to_user_id', userId);

    let averageRatingReceived = 0;
    const allReviewsReceived = [...(profileReviewsReceived || []), ...postReviewsReceived];

    if (allReviewsReceived.length > 0) {
      const totalRating = allReviewsReceived.reduce((sum, review) => sum + review.rating, 0);
      averageRatingReceived = totalRating / allReviewsReceived.length;
    }

    const stats: UserStats = {
      userId: profile.user_id,
      name: profile.name,
      username: profile.username,
      userType: profile.user_type === 'professional' ? 'professional' : 'client',
      photos: profile.photos || [],
      accountCreatedAt: profile.created_at,
      totalReviewsGiven: totalReviewsGiven,
      averageRatingGiven: averageRatingGiven,
      totalReviewsReceived: totalReviewsReceived,
      averageRatingReceived: averageRatingReceived,
      isActive: profile.is_active
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques'
    };
  }
};

export const getUserReceivedReviews = async (userId: string): Promise<{ reviews: UserReviewWithProfile[]; error: string | null }> => {
  try {
    const { data: profileReviews, error: profileReviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        from_user_id,
        profiles!reviews_from_user_id_fkey (
          user_id,
          name,
          username,
          photos,
          user_type
        )
      `)
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false });

    if (profileReviewsError) {
      console.error('Error fetching received profile reviews:', profileReviewsError);
      throw profileReviewsError;
    }

    const { data: userPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    let postReviews: any[] = [];

    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(post => post.id);

      const { data, error: postReviewsError } = await supabase
        .from('post_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          updated_at,
          user_id,
          profiles!post_reviews_user_id_fkey (
            user_id,
            name,
            username,
            photos,
            user_type
          )
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: false });

      if (postReviewsError) {
        console.error('Error fetching received post reviews:', postReviewsError);
        throw postReviewsError;
      }

      postReviews = data || [];
    }

    const mappedProfileReviews: UserReviewWithProfile[] = (profileReviews || []).map(review => {
      const profile = review.profiles as any;
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        professionalId: profile?.user_id || '',
        professionalName: profile?.name || 'Utilisateur inconnu',
        professionalUsername: profile?.username || null,
        professionalPhoto: profile?.photos?.[0] || null,
        professionalUserType: profile?.user_type || 'client'
      };
    });

    const mappedPostReviews: UserReviewWithProfile[] = postReviews.map(review => {
      const profile = review.profiles as any;
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        professionalId: profile?.user_id || '',
        professionalName: profile?.name || 'Utilisateur inconnu',
        professionalUsername: profile?.username || null,
        professionalPhoto: profile?.photos?.[0] || null,
        professionalUserType: profile?.user_type || 'client'
      };
    });

    const allReviews = [...mappedProfileReviews, ...mappedPostReviews].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { reviews: allReviews, error: null };
  } catch (error) {
    console.error('Error getting user received reviews:', error);
    return {
      reviews: [],
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des avis reçus'
    };
  }
};

export const getUserReviews = async (userId: string): Promise<{ reviews: UserReviewWithProfile[]; error: string | null }> => {
  try {
    const { data: profileReviews, error: profileReviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        to_user_id,
        profiles!reviews_to_user_id_fkey (
          user_id,
          name,
          username,
          photos,
          user_type
        )
      `)
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false });

    if (profileReviewsError) {
      console.error('Error fetching profile reviews:', profileReviewsError);
      throw profileReviewsError;
    }

    const { data: postReviews, error: postReviewsError } = await supabase
      .from('post_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        post_id,
        posts!post_reviews_post_id_fkey (
          user_id,
          profiles!posts_user_id_fkey (
            user_id,
            name,
            username,
            photos,
            user_type
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postReviewsError) {
      console.error('Error fetching post reviews:', postReviewsError);
      throw postReviewsError;
    }

    const mappedProfileReviews: UserReviewWithProfile[] = (profileReviews || []).map(review => {
      const profile = review.profiles as any;
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        professionalId: profile?.user_id || '',
        professionalName: profile?.name || 'Utilisateur inconnu',
        professionalUsername: profile?.username || null,
        professionalPhoto: profile?.photos?.[0] || null,
        professionalUserType: profile?.user_type || 'client'
      };
    });

    const mappedPostReviews: UserReviewWithProfile[] = (postReviews || []).map(review => {
      const post = review.posts as any;
      const profile = post?.profiles;
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        professionalId: profile?.user_id || '',
        professionalName: profile?.name || 'Utilisateur inconnu',
        professionalUsername: profile?.username || null,
        professionalPhoto: profile?.photos?.[0] || null,
        professionalUserType: profile?.user_type || 'client'
      };
    });

    const allReviews = [...mappedProfileReviews, ...mappedPostReviews].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { reviews: allReviews, error: null };
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return {
      reviews: [],
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des avis'
    };
  }
};
