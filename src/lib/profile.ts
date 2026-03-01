import { UserProfile } from '../types';
import { supabase } from './supabase';

export interface ProfileError {
  message: string;
}

const PROFILES_KEY = 'fire-roses-profiles';

const getProfiles = (): Record<string, UserProfile> => {
  const profiles = localStorage.getItem(PROFILES_KEY);
  return profiles ? JSON.parse(profiles) : {};
};

const saveProfiles = (profiles: Record<string, UserProfile>) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const userProfileToProfile = (userProfile: UserProfile) => {
  return {
    id: 0,
    userId: userProfile.user_id || userProfile.id,
    name: userProfile.name || userProfile.username || '',
    email: userProfile.email || '',
    avatar: userProfile.avatar || '',
    imageUrl: userProfile.photos?.[0] || '',
    bio: userProfile.bio || userProfile.description || '',
    location: userProfile.location || '',
    premium: userProfile.premium || false,
    online: userProfile.online || false,
    rating: userProfile.rating || 0,
    photos: userProfile.photos || [],
    physicalInfo: userProfile.physicalInfo || {
      sexe: "",
      ethnique: "",
      nationalite: "",
      age: 0,
      yeux: "",
      taille: "",
      poids: "",
      cheveux: "",
      mensurations: "",
      poitrine: "",
      bonnet: "",
      tour_poitrine: "",
      epilation: ""
    },
    personalInfo: userProfile.personalInfo || {
      alcool: "",
      fumeur: "",
      langues: [],
      orientation: "",
      origine: ""
    },
    prestations: userProfile.prestations || "",
    reviews: userProfile.reviews || [],
    interests: [],
    description: userProfile.description || '',
    likes: 0,
    comments: 0,
    isLiked: false,
    createdAt: userProfile.createdAt || new Date().toISOString(),
    updatedAt: userProfile.updatedAt || new Date().toISOString()
  };
};

export const updateProfile = async (
  profile: UserProfile
): Promise<{ success: boolean; error: ProfileError | null }> => {
  try {
    console.log('[updateProfile] Starting with profile:', profile);

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('[updateProfile] Auth user:', user.id);
    console.log('[updateProfile] Profile user_id:', profile.user_id);

    if (profile.user_id !== user.id) {
      throw new Error('Unauthorized profile update attempt');
    }

    // Prepare update data
    const updateData = {
      name: profile.username || profile.name || profile.firstName || '',
      first_name: profile.firstName || '',
      last_name: profile.lastName || '',
      username: profile.username,
      phone: profile.phone || '',
      description: profile.description,
      location: profile.location,
      photos: profile.photos || [],
      physical_info: profile.physicalInfo || {},
      personal_info: profile.personalInfo || {},
      prestations: profile.prestations,
      updated_at: new Date().toISOString()
    };

    console.log('[updateProfile] Update data:', updateData);

    // Update profile in Supabase
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    console.log('[updateProfile] Supabase result:', { data, error });

    if (error) {
      console.error('[updateProfile] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    // Update localStorage for consistency
    localStorage.setItem('user', JSON.stringify({
      ...profile,
      updatedAt: new Date().toISOString()
    }));

    return { success: true, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du profil'
      }
    };
  }
};

export const toggleProfileActive = async (
  isActive: boolean
): Promise<{ success: boolean; error: ProfileError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({
      ...currentUser,
      is_active: isActive,
      updatedAt: new Date().toISOString()
    }));

    return { success: true, error: null };
  } catch (error) {
    console.error('Toggle profile active error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue'
      }
    };
  }
};

export const getProfileById = async (
  profileId: string
): Promise<{ profile: UserProfile | null; error: ProfileError | null }> => {
  try {
    console.log('[getProfileById] Récupération profil pour ID:', profileId);

    // Récupérer depuis Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', profileId)
      .maybeSingle();

    if (error) {
      console.error('[getProfileById] Erreur Supabase:', error);
      throw error;
    }

    if (!data) {
      console.log('[getProfileById] Aucun profil trouvé');
      return { profile: null, error: { message: 'Profil non trouvé' } };
    }

    // Charger les avis depuis la base de données
    const { data: reviewsData } = await supabase
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
      .eq('to_user_id', data.user_id)
      .order('created_at', { ascending: false });

    const reviews = reviewsData?.map(review => ({
      id: review.id,
      userId: review.from_user_id,
      userName: (review.profiles as any)?.username || (review.profiles as any)?.name || 'Utilisateur',
      userPhoto: (review.profiles as any)?.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.created_at)
    })) || [];

    // Calculer la note moyenne basée sur les avis réels
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : data.rating || 0;

    // Convertir en UserProfile
    const profile: UserProfile = {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      username: data.username,
      email: '',
      avatar: data.photos?.[0] || '',
      bio: data.description || '',
      location: data.location || '',
      description: data.description || '',
      photos: data.photos || [],
      user_type: data.user_type || 'client',
      physicalInfo: data.physical_info || {},
      personalInfo: data.personal_info || {},
      prestations: data.prestations || '',
      rating: avgRating,
      premium: false,
      online: false,
      interests: [],
      age: data.physical_info?.age || 0,
      reviews: reviews,
      languages: data.personal_info?.langues || [],
      is_active: data.is_active !== false
    };

    console.log('[getProfileById] Profil récupéré:', profile.username, `avec ${reviews.length} avis`);
    return { profile, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      profile: null,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération du profil'
      }
    };
  }
};