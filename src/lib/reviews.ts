import { v4 as uuidv4 } from 'uuid';
import { Review } from '../types';
import { supabase } from './supabase';

export interface PostReview {
  id: string;
  post_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    user_id: string;
    name: string;
    username?: string;
    photos?: string[];
  };
}

export interface ReviewError {
  message: string;
}

const REVIEWS_KEY = 'fire-roses-reviews';

const getReviews = (): Record<string, Review[]> => {
  const reviews = localStorage.getItem(REVIEWS_KEY);
  return reviews ? JSON.parse(reviews) : {};
};

const saveReviews = (reviews: Record<string, Review[]>) => {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
};

export const createReview = async (
  userId: string,
  rating: number,
  comment: string
): Promise<{ error: string | null }> => {
  try {
    const result = await addReview(userId, rating, comment);
    if (result.error) {
      return { error: result.error.message };
    }
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Une erreur est survenue'
    };
  }
};

export const addReview = async (
  profileId: string,
  rating: number,
  comment: string
): Promise<{ review: Review | null; error: ReviewError | null }> => {
  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Check if user already reviewed this profile
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('to_user_id', profileId)
      .eq('from_user_id', user.id)
      .maybeSingle();


    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select(`
          id,
          rating,
          comment,
          created_at,
          from_user_id,
          profiles!reviews_from_user_id_fkey (
            name,
            username,
            photos
          )
        `)
        .single();

      if (error) throw error;

      const mappedReview: Review = {
        id: data.id,
        userId: data.from_user_id,
        userName: (data.profiles as any)?.username || (data.profiles as any)?.name || 'Utilisateur',
        userPhoto: (data.profiles as any)?.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: data.rating,
        comment: data.comment,
        date: new Date(data.created_at)
      };

      return { review: mappedReview, error: null };
    } else {
      // Create new review
        to_user_id: profileId,
        from_user_id: user.id,
        rating,
        comment
      });

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          to_user_id: profileId,
          from_user_id: user.id,
          rating,
          comment
        })
        .select(`
          id,
          rating,
          comment,
          created_at,
          from_user_id,
          profiles!reviews_from_user_id_fkey (
            name,
            username,
            photos
          )
        `)
        .single();

      if (error) {
        console.error('[addReview] Insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      const mappedReview: Review = {
        id: data.id,
        userId: data.from_user_id,
        userName: (data.profiles as any)?.username || (data.profiles as any)?.name || 'Utilisateur',
        userPhoto: (data.profiles as any)?.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: data.rating,
        comment: data.comment,
        date: new Date(data.created_at)
      };

      return { review: mappedReview, error: null };
    }
  } catch (error) {
    console.error('Add review error:', error);
    return {
      review: null,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'ajout de l\'avis'
      }
    };
  }
};

export const getProfileReviews = async (
  profileId: string
): Promise<{ reviews: Review[]; error: ReviewError | null }> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        from_user_id,
        profiles!reviews_from_user_id_fkey (
          name,
          username,
          photos
        )
      `)
      .eq('to_user_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get profile reviews error:', error);
      throw error;
    }

    const reviews: Review[] = (data || []).map(review => ({
      id: review.id,
      userId: review.from_user_id,
      userName: (review.profiles as any)?.username || (review.profiles as any)?.name || 'Utilisateur',
      userPhoto: (review.profiles as any)?.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.created_at)
    }));

    return { reviews, error: null };
  } catch (error) {
    console.error('Get profile reviews error:', error);
    return {
      reviews: [],
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération des avis'
      }
    };
  }
};

export const getProfileAverageRating = async (
  profileId: string
): Promise<{ rating: number; count: number; error: ReviewError | null }> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('to_user_id', profileId);

    if (error) {
      console.error('Get profile average rating error:', error);
      throw error;
    }

    const profileReviews = data || [];

    if (profileReviews.length === 0) {
      return { rating: 0, count: 0, error: null };
    }

    const totalRating = profileReviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      rating: totalRating / profileReviews.length,
      count: profileReviews.length,
      error: null
    };
  } catch (error) {
    console.error('Get profile average rating error:', error);
    return {
      rating: 0,
      count: 0,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération de la note moyenne'
      }
    };
  }
};

// Post Reviews functions using Supabase
export const getPostReviews = async (
  postId: string
): Promise<{ reviews: PostReview[]; error: ReviewError | null }> => {
  try {
    const { data, error } = await supabase
      .from('post_reviews')
      .select(`
        *,
        profiles!post_reviews_user_id_fkey (
          id,
          user_id,
          name,
          username,
          photos
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get post reviews error:', error);
      throw error;
    }

    return { reviews: data || [], error: null };
  } catch (error) {
    console.error('Get post reviews error:', error);
    return {
      reviews: [],
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération des avis'
      }
    };
  }
};

export const addPostReview = async (
  postId: string,
  rating: number,
  comment: string
): Promise<{ review: PostReview | null; error: ReviewError | null }> => {
  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Check if user already reviewed this post
    const { data: existingReview, error: checkError } = await supabase
      .from('post_reviews')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();


    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from('post_reviews')
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select(`
          *,
          profiles!post_reviews_user_id_fkey (
            id,
            user_id,
            name,
            username,
            photos
          )
        `)
        .single();

      if (error) throw error;
      return { review: data, error: null };
    } else {
      // Create new review
        post_id: postId,
        user_id: user.id,
        rating,
        comment
      });

      const { data, error } = await supabase
        .from('post_reviews')
        .insert({
          post_id: postId,
          user_id: user.id,
          rating,
          comment
        })
        .select(`
          *,
          profiles!post_reviews_user_id_fkey (
            id,
            user_id,
            name,
            username,
            photos
          )
        `)
        .single();

      if (error) {
        console.error('[addPostReview] Insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      return { review: data, error: null };
    }
  } catch (error) {
    console.error('Add post review error:', error);
    return {
      review: null,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'ajout de l\'avis'
      }
    };
  }
};

export const getUserReceivedReviews = async (
  userId: string
): Promise<{ reviews: PostReview[]; error: ReviewError | null }> => {
  try {
    // First, get all post IDs created by this user
    const { data: userPosts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    if (postsError) {
      console.error('Get user posts error:', postsError);
      throw postsError;
    }

    if (!userPosts || userPosts.length === 0) {
      return { reviews: [], error: null };
    }

    const postIds = userPosts.map(post => post.id);

    // Then get all reviews for these posts
    const { data, error } = await supabase
      .from('post_reviews')
      .select(`
        *,
        profiles!post_reviews_user_id_fkey (
          id,
          user_id,
          name,
          username,
          photos
        )
      `)
      .in('post_id', postIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Get user received reviews error:', error);
      throw error;
    }

    return { reviews: data || [], error: null };
  } catch (error) {
    console.error('Get user received reviews error:', error);
    return {
      reviews: [],
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération des avis'
      }
    };
  }
};

export const getUserWrittenReviews = async (
  userId: string
): Promise<{ reviews: PostReview[]; error: ReviewError | null }> => {
  try {
    const { data, error } = await supabase
      .from('post_reviews')
      .select(`
        *,
        posts!post_reviews_post_id_fkey (
          id,
          title,
          user_id,
          profiles!posts_user_id_fkey (
            id,
            user_id,
            name,
            username,
            photos
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user written reviews error:', error);
      throw error;
    }

    return { reviews: data || [], error: null };
  } catch (error) {
    console.error('Get user written reviews error:', error);
    return {
      reviews: [],
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération des avis'
      }
    };
  }
};

export const getUserWrittenProfileReviews = async (
  userId: string
): Promise<{ reviews: Review[]; error: ReviewError | null }> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        to_user_id,
        profiles!reviews_to_user_id_fkey (
          id,
          user_id,
          name,
          username,
          photos
        )
      `)
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user written profile reviews error:', error);
      throw error;
    }

    const reviews: Review[] = (data || []).map(review => ({
      id: review.id,
      userId: review.to_user_id,
      userName: (review.profiles as any)?.username || (review.profiles as any)?.name || 'Utilisateur',
      userPhoto: (review.profiles as any)?.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.created_at)
    }));

    return { reviews, error: null };
  } catch (error) {
    console.error('Get user written profile reviews error:', error);
    return {
      reviews: [],
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération des avis'
      }
    };
  }
};

export const getPostReviewsCount = async (
  userId: string
): Promise<{ count: number; error: ReviewError | null }> => {
  try {
    const { count: profileReviewsCount, error: profileError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', userId);

    if (profileError) {
      console.error('Get profile reviews count error:', profileError);
    }

    const { data: userPosts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    let postReviewsCount = 0;
    if (!postsError && userPosts && userPosts.length > 0) {
      const postIds = userPosts.map(post => post.id);

      const { count, error } = await supabase
        .from('post_reviews')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds);

      if (!error) {
        postReviewsCount = count || 0;
      }
    }

    const totalCount = (profileReviewsCount || 0) + postReviewsCount;

    return { count: totalCount, error: null };
  } catch (error) {
    console.error('Get reviews count error:', error);
    return {
      count: 0,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors du comptage des avis'
      }
    };
  }
};