import { supabase } from './supabase';
import { UserProfile, UserType } from '../types';

export interface AuthError {
  message: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  phone?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

const mapUserTypeToDb = (userType: UserType): string => {
  return userType === 'pro' ? 'professional' : 'client';
};

const mapUserTypeFromDb = (dbUserType: string): UserType => {
  return dbUserType === 'professional' ? 'pro' : 'client';
};

export const signUp = async (data: SignUpData): Promise<{ user: UserProfile | null; error: AuthError | null }> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          user_type: data.userType,
          first_name: data.firstName || '',
          last_name: data.lastName || '',
          username: data.username || data.name,
          phone: data.phone || ''
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');

    const newProfile: UserProfile = {
      id: authData.user.id,
      name: data.name,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      username: data.username || data.name,
      location: 'Paris',
      description: '',
      interests: [],
      photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
      physicalInfo: {
        sexe: '',
        ethnique: '',
        nationalite: '',
        age: 25,
        yeux: '',
        taille: '',
        poids: '',
        cheveux: '',
        mensurations: '',
        poitrine: '',
        bonnet: '',
        tour_poitrine: '',
        epilation: ''
      },
      personalInfo: {
        alcool: '',
        fumeur: '',
        langues: ['Français'],
        orientation: '',
        origine: ''
      },
      prestations: '',
      userType: data.userType,
      phone: data.phone
    };

    const { data: insertedProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        name: data.name,
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        username: data.username || data.name,
        user_type: mapUserTypeToDb(data.userType),
        phone: data.phone || '',
        location: 'Paris',
        description: '',
        photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400']
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }

    // Mettre à jour newProfile avec l'ID généré
    newProfile.id = insertedProfile.id;
    newProfile.user_id = insertedProfile.user_id;

    return { user: newProfile, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription'
      }
    };
  }
};

export const signIn = async (data: SignInData): Promise<{ user: UserProfile | null; error: AuthError | null }> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signin');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profileData) throw new Error('Profile not found');

    const userProfile: UserProfile = {
      id: profileData.id,
      user_id: profileData.user_id,
      name: profileData.name,
      firstName: profileData.first_name || '',
      lastName: profileData.last_name || '',
      username: profileData.username || profileData.name,
      location: profileData.location || 'Paris',
      description: profileData.description || '',
      interests: profileData.interests || [],
      photos: profileData.photos || [],
      physicalInfo: profileData.physical_info || {
        sexe: '',
        ethnique: '',
        nationalite: '',
        age: 25,
        yeux: '',
        taille: '',
        poids: '',
        cheveux: '',
        mensurations: '',
        poitrine: '',
        bonnet: '',
        tour_poitrine: '',
        epilation: ''
      },
      personalInfo: profileData.personal_info || {
        alcool: '',
        fumeur: '',
        langues: ['Français'],
        orientation: '',
        origine: ''
      },
      prestations: profileData.prestations || '',
      userType: mapUserTypeFromDb(profileData.user_type),
      phone: profileData.phone
    };

    return { user: userProfile, error: null };
  } catch (error) {
    console.error('Signin error:', error);
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Email ou mot de passe incorrect'
      }
    };
  }
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Signout error:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la déconnexion'
      }
    };
  }
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la réinitialisation'
      }
    };
  }
};

export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du mot de passe'
      }
    };
  }
};

export const getCurrentUser = async (): Promise<{ user: UserProfile | null; error: AuthError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) return { user: null, error: null };

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profileData) return { user: null, error: null };

    const userProfile: UserProfile = {
      id: profileData.id,
      user_id: profileData.user_id,
      name: profileData.name,
      firstName: profileData.first_name || '',
      lastName: profileData.last_name || '',
      username: profileData.username || profileData.name,
      location: profileData.location || 'Paris',
      description: profileData.description || '',
      interests: profileData.interests || [],
      photos: profileData.photos || [],
      physicalInfo: profileData.physical_info || {
        sexe: '',
        ethnique: '',
        nationalite: '',
        age: 25,
        yeux: '',
        taille: '',
        poids: '',
        cheveux: '',
        mensurations: '',
        poitrine: '',
        bonnet: '',
        tour_poitrine: '',
        epilation: ''
      },
      personalInfo: profileData.personal_info || {
        alcool: '',
        fumeur: '',
        langues: ['Français'],
        orientation: '',
        origine: ''
      },
      prestations: profileData.prestations || '',
      userType: mapUserTypeFromDb(profileData.user_type),
      phone: profileData.phone
    };

    return { user: userProfile, error: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la récupération de l\'utilisateur'
      }
    };
  }
};
