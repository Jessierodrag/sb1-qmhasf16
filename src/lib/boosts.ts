import { supabase } from './supabase';

export interface PostBoost {
  id: string;
  post_id: string;
  user_id: string;
  boost_type: '24h' | '7days' | '30days';
  price: number;
  city: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface BoostError {
  message: string;
}

const BOOST_PRICES = {
  '24h': 9.90,
  '7days': 49.90,
  '30days': 169.90
};

const BOOST_DURATIONS = {
  '24h': 1,
  '7days': 7,
  '30days': 30
};

export const createPostBoost = async (
  postId: string,
  boostType: '24h' | '7days' | '30days',
  city: string
): Promise<{ boost: PostBoost | null; error: BoostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + BOOST_DURATIONS[boostType]);

    const { data: boost, error: insertError } = await supabase
      .from('post_boosts')
      .insert({
        post_id: postId,
        user_id: user.id,
        boost_type: boostType,
        price: BOOST_PRICES[boostType],
        city: city,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Create boost error:', insertError);
      throw insertError;
    }

    await supabase
      .from('posts')
      .update({ is_boosted: true })
      .eq('id', postId);

    console.log('Boost created successfully:', boost);
    return { boost, error: null };
  } catch (error) {
    console.error('Create boost error:', error);
    return {
      boost: null,
      error: {
        message: error instanceof Error ? error.message : 'Erreur lors de la création du boost'
      }
    };
  }
};

export const getUserBoosts = async (): Promise<{ boosts: PostBoost[]; error: BoostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: boosts, error } = await supabase
      .from('post_boosts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get boosts error:', error);
      throw error;
    }

    return { boosts: boosts || [], error: null };
  } catch (error) {
    console.error('Get boosts error:', error);
    return {
      boosts: [],
      error: {
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération des boosts'
      }
    };
  }
};

export const getPostActiveBoost = async (
  postId: string
): Promise<{ boost: PostBoost | null; error: BoostError | null }> => {
  try {
    const { data: boost, error } = await supabase
      .from('post_boosts')
      .select('*')
      .eq('post_id', postId)
      .eq('is_active', true)
      .gt('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Get active boost error:', error);
      throw error;
    }

    return { boost, error: null };
  } catch (error) {
    console.error('Get active boost error:', error);
    return {
      boost: null,
      error: {
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération du boost actif'
      }
    };
  }
};

export const deactivateExpiredBoosts = async (): Promise<{ success: boolean; error: BoostError | null }> => {
  try {
    const { error: functionError } = await supabase.rpc('deactivate_expired_boosts');

    if (functionError) {
      console.error('Deactivate expired boosts error:', functionError);
      throw functionError;
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ is_boosted: false })
      .in(
        'id',
        supabase
          .from('post_boosts')
          .select('post_id')
          .eq('is_active', false)
      );

    if (updateError) {
      console.error('Update posts boost status error:', updateError);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Deactivate expired boosts error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erreur lors de la désactivation des boosts expirés'
      }
    };
  }
};

export const updateBoostCity = async (
  boostId: string,
  newCity: string
): Promise<{ success: boolean; error: BoostError | null }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { error: updateError } = await supabase
      .from('post_boosts')
      .update({ city: newCity })
      .eq('id', boostId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('end_date', new Date().toISOString());

    if (updateError) {
      console.error('Update boost city error:', updateError);
      throw updateError;
    }

    console.log('Boost city updated successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Update boost city error:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la ville'
      }
    };
  }
};

export const getBoostPrice = (boostType: '24h' | '7days' | '30days'): number => {
  return BOOST_PRICES[boostType];
};

export const getBoostDuration = (boostType: '24h' | '7days' | '30days'): number => {
  return BOOST_DURATIONS[boostType];
};
