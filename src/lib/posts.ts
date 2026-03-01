import { v4 as uuidv4 } from 'uuid';
import { Post, Profile } from '../types';
import { supabase } from './supabase';
import { uploadPostPhotos } from './storage';

export interface PostError {
  message: string;
}

export interface MediaCount {
  photos: number;
  videos: number;
  total: number;
}

const POSTS_KEY = 'fire-roses-posts';
const MAX_PHOTOS = 30;
const MAX_VIDEOS = 5;

const getStoredPosts = (): Post[] => {
  const posts = localStorage.getItem(POSTS_KEY);
  return posts ? JSON.parse(posts) : [];
};

const savePosts = (posts: Post[]) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

const isVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const getUserMediaCount = async (userId: string): Promise<MediaCount> => {
  try {
    const { data: userPosts, error } = await supabase
      .from('posts')
      .select('photos')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    let photoCount = 0;
    let videoCount = 0;

    if (userPosts && userPosts.length > 0) {
      userPosts.forEach(post => {
        const photos = post.photos || [];
        photos.forEach((url: string) => {
          if (isVideoUrl(url)) {
            videoCount++;
          } else {
            photoCount++;
          }
        });
      });
    }

    return {
      photos: photoCount,
      videos: videoCount,
      total: photoCount + videoCount
    };
  } catch (error) {
    console.error('Error counting user media:', error);
    return { photos: 0, videos: 0, total: 0 };
  }
};

export const validateMediaUpload = async (
  userId: string,
  newFiles: File[]
): Promise<{ valid: boolean; error?: string }> => {
  const currentCount = await getUserMediaCount(userId);

  let newPhotoCount = 0;
  let newVideoCount = 0;

  newFiles.forEach(file => {
    if (isVideoFile(file)) {
      newVideoCount++;
    } else {
      newPhotoCount++;
    }
  });

  const totalPhotos = currentCount.photos + newPhotoCount;
  const totalVideos = currentCount.videos + newVideoCount;

  if (totalPhotos > MAX_PHOTOS) {
    return {
      valid: false,
      error: `Limite de ${MAX_PHOTOS} photos dépassée. Vous avez actuellement ${currentCount.photos} photo(s) et tentez d'ajouter ${newPhotoCount} photo(s).`
    };
  }

  if (totalVideos > MAX_VIDEOS) {
    return {
      valid: false,
      error: `Limite de ${MAX_VIDEOS} vidéos dépassée. Vous avez actuellement ${currentCount.videos} vidéo(s) et tentez d'ajouter ${newVideoCount} vidéo(s).`
    };
  }

  return { valid: true };
};

export const createPost = async (data: {
  caption: string;
  location: string;
  tags: string[];
  photos: File[];
}): Promise<{ post: Post | null; error: PostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }


    const validation = await validateMediaUpload(user.id, data.photos);
    if (!validation.valid) {
      return {
        post: null,
        error: {
          message: validation.error || 'Limite de médias dépassée'
        }
      };
    }

    const { urls: photoUrls, thumbnails: thumbnailUrls, error: uploadError } = await uploadPostPhotos(data.photos, user.id);

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      throw new Error(uploadError);
    }


    // Créer un nouveau post

    const postId = uuidv4();

    const { data: insertedPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        id: postId,
        user_id: user.id,
        caption: data.caption,
        location: data.location,
        tags: data.tags,
        photos: photoUrls,
        thumbnails: thumbnailUrls,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Post insert error:', insertError);
      throw insertError;
    }


    const newPost: Post = {
      id: insertedPost.id,
      userId: user.id,
      user_id: user.id,
      caption: insertedPost.caption,
      location: insertedPost.location,
      tags: insertedPost.tags,
      photos: insertedPost.photos,
      created_at: insertedPost.created_at,
      updated_at: insertedPost.updated_at,
      likes_count: 0,
      comments_count: 0,
      is_liked: false
    };

    return { post: newPost, error: null };
  } catch (error) {
    console.error('Create post error:', error);
    return {
      post: null,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de la publication'
      }
    };
  }
};

export const getPosts = async (
  location?: string,
  userId?: string,
  page: number = 0,
  pageSize: number = 10
): Promise<{ posts: Post[]; error: PostError | null }> => {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          user_id,
          name,
          username,
          photos,
          rating,
          location,
          description,
          physical_info,
          personal_info,
          prestations,
          is_active,
          subscription_tier
        )
      `)
      .eq('is_active', true);

    if (location) {
      // Sanitize location input: only allow alphanumeric, spaces, accents, hyphens
      const sanitized = location.replace(/[^a-zA-ZÀ-ÿ0-9\s\-']/g, '').trim();
      if (!sanitized) {
        // Invalid location, skip filter
      } else {
        // Extraire la ville de base (ex: "Paris 1er" -> "Paris")
        const baseCity = sanitized.split(' ')[0];

        // Si c'est un arrondissement (contient un espace), chercher aussi la ville de base
        if (sanitized.includes(' ')) {
          query = query.or(`location.eq.${sanitized},location.eq.${baseCity},location.ilike.${baseCity}%`);
        } else {
          // Si c'est une ville simple, chercher aussi tous ses arrondissements
          query = query.or(`location.eq.${sanitized},location.ilike.${sanitized}%`);
        }
      }
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Pagination
    const startIndex = page * pageSize;
    const endIndex = (page + 1) * pageSize - 1;
    query = query.range(startIndex, endIndex);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('Fetch posts error:', fetchError);
      throw fetchError;
    }

    const posts: Post[] = (data || [])
      .filter(post => post.profiles && post.profiles.is_active !== false)
      .map(post => ({
        id: post.id,
        userId: post.user_id,
        user_id: post.user_id,
        caption: post.caption || '',
        location: post.location || '',
        tags: post.tags || [],
        photos: post.photos || [],
        thumbnails: post.thumbnails || [],
        created_at: post.created_at,
        updated_at: post.updated_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        is_liked: false,
        is_boosted: post.is_boosted || false,
        user: post.profiles ? {
          id: post.profiles.id,
          user_id: post.profiles.user_id,
          name: post.profiles.name,
          username: post.profiles.username,
          photos: post.profiles.photos || [],
          rating: post.profiles.rating || 0,
          location: post.profiles.location,
          description: post.profiles.description,
          physicalInfo: post.profiles.physical_info,
          personalInfo: post.profiles.personal_info,
          prestations: post.profiles.prestations,
          subscription_tier: post.profiles.subscription_tier
        } : undefined
      }))
      .sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    return { posts, error: null };
  } catch (error) {
    console.error('Get posts error:', error);
    return {
      posts: [],
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération des publications'
      }
    };
  }
};

export const deletePost = async (
  postId: string
): Promise<{ success: boolean; error: PostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete post error:', deleteError);
      throw deleteError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Delete post error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression de la publication'
      }
    };
  }
};

export const updatePost = async (
  postId: string,
  data: {
    caption?: string;
    location?: string;
    tags?: string[];
    newPhotos?: File[];
  }
): Promise<{ success: boolean; error: PostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    if (data.newPhotos && data.newPhotos.length > 0) {
      const validation = await validateMediaUpload(user.id, data.newPhotos);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            message: validation.error || 'Limite de médias dépassée'
          }
        };
      }
    }

    let updatedPhotos: string[] | undefined;
    let updatedThumbnails: string[] | undefined;

    if (data.newPhotos && data.newPhotos.length > 0) {
      const { urls: newPhotoUrls, thumbnails: newThumbnailUrls, error: uploadError } = await uploadPostPhotos(data.newPhotos, user.id);

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        throw new Error(uploadError);
      }


      const { data: existingPost } = await supabase
        .from('posts')
        .select('photos, thumbnails')
        .eq('id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      const existingPhotos = existingPost?.photos || [];
      const existingThumbnails = existingPost?.thumbnails || [];
      updatedPhotos = [...newPhotoUrls, ...existingPhotos];
      updatedThumbnails = [...newThumbnailUrls, ...existingThumbnails];
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (updatedPhotos !== undefined) updateData.photos = updatedPhotos;
    if (updatedThumbnails !== undefined) updateData.thumbnails = updatedThumbnails;

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update post error:', updateError);
      throw updateError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Update post error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la modification de la publication'
      }
    };
  }
};

export const togglePostActive = async (
  postId: string,
  isActive: boolean
): Promise<{ success: boolean; error: PostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Toggle post active error:', updateError);
      throw updateError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Toggle post active error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la modification de la publication'
      }
    };
  }
};

export const reorderPostPhotos = async (
  postId: string,
  orderedPhotos: string[]
): Promise<{ success: boolean; error: PostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        photos: orderedPhotos,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Reorder photos error:', updateError);
      throw updateError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Reorder photos error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la réorganisation des photos'
      }
    };
  }
};

export const removePhotosFromPost = async (
  postId: string,
  photoUrlsToRemove: string[]
): Promise<{ success: boolean; error: PostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Récupérer le post actuel
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('photos, thumbnails')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Fetch post error:', fetchError);
      throw fetchError;
    }

    if (!post) {
      throw new Error('Post non trouvé');
    }

    // Filtrer les photos à garder
    const currentPhotos = post.photos || [];
    const currentThumbnails = post.thumbnails || [];

    const updatedPhotos = currentPhotos.filter(
      (photo: string) => !photoUrlsToRemove.includes(photo)
    );

    // Filtrer les thumbnails correspondants
    const photosToRemoveIndices = photoUrlsToRemove.map((url: string) =>
      currentPhotos.indexOf(url)
    ).filter((index: number) => index !== -1);

    const updatedThumbnails = currentThumbnails.filter(
      (_: string, index: number) => !photosToRemoveIndices.includes(index)
    );

    // Mettre à jour le post avec les photos restantes
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        photos: updatedPhotos,
        thumbnails: updatedThumbnails,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Remove photos error:', updateError);
      throw updateError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Remove photos error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression des photos'
      }
    };
  }
};

export const mergeUserPosts = async (): Promise<{ success: boolean; error: PostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Récupérer tous les posts actifs de l'utilisateur
    const { data: userPosts, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Fetch user posts error:', fetchError);
      throw fetchError;
    }

    if (!userPosts || userPosts.length <= 1) {
      return { success: true, error: null };
    }


    // Garder le premier post (le plus ancien) et fusionner tous les autres dedans
    const mainPost = userPosts[0];
    const postsToMerge = userPosts.slice(1);

    // Collecter toutes les photos
    let allPhotos = [...(mainPost.photos || [])];

    // Collecter tous les tags uniques
    let allTags = new Set(mainPost.tags || []);

    // Garder la dernière localisation et caption
    let lastLocation = mainPost.location;
    let lastCaption = mainPost.caption;

    for (const post of postsToMerge) {
      allPhotos = [...allPhotos, ...(post.photos || [])];
      (post.tags || []).forEach((tag: string) => allTags.add(tag));
      lastLocation = post.location || lastLocation;
      lastCaption = post.caption || lastCaption;
    }

    // Mettre à jour le post principal avec toutes les données fusionnées
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        photos: allPhotos,
        tags: Array.from(allTags),
        location: lastLocation,
        caption: lastCaption,
        updated_at: new Date().toISOString()
      })
      .eq('id', mainPost.id);

    if (updateError) {
      console.error('Update main post error:', updateError);
      throw updateError;
    }

    // Supprimer les autres posts
    const postIdsToDelete = postsToMerge.map(p => p.id);
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .in('id', postIdsToDelete);

    if (deleteError) {
      console.error('Delete merged posts error:', deleteError);
      throw deleteError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Merge posts error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la fusion des publications'
      }
    };
  }
};