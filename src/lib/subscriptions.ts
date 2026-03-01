import { supabase } from './supabase';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'vip';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  price: number;
  payment_method: string;
  boosted_cities: string[];
  city_change_count: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  duration: number;
  features: string[];
  badge: string;
  color: string;
  maxCities: number;
  maxCityChanges: number | 'unlimited';
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'basic',
    name: 'Roses Classic',
    price: 9.90,
    duration: 1,
    features: [
      'Visibilité boostée pendant 24h dans 1 ville',
      'Modification de ville possible 1 fois'
    ],
    badge: 'sparkles',
    color: 'from-yellow-500 to-yellow-600',
    maxCities: 1,
    maxCityChanges: 1
  },
  {
    tier: 'premium',
    name: 'Roses Premium',
    price: 49.90,
    duration: 7,
    features: [
      'Visibilité boostée pendant 7 jours dans 5 villes',
      'Modifications de villes illimitées pendant 7 jours'
    ],
    badge: 'crown',
    color: 'from-purple-500 to-purple-600',
    maxCities: 5,
    maxCityChanges: 'unlimited'
  },
  {
    tier: 'vip',
    name: 'Roses Elite',
    price: 169.90,
    duration: 30,
    features: [
      'Visibilité boostée pendant 1 mois complet dans 10 villes',
      'Modifications de villes illimitées pendant 30 jours',
      'Badge certifié garantissant visibilité accrue dans les recherches et le fil d\'actualité'
    ],
    badge: 'badge-check',
    color: 'from-blue-500 to-blue-600',
    maxCities: 10,
    maxCityChanges: 'unlimited'
  }
];

export const getUserActiveSubscription = async (
  userId: string
): Promise<{ subscription: Subscription | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[getUserActiveSubscription] Erreur:', error);
      throw error;
    }

    return { subscription: data, error: null };
  } catch (error) {
    console.error('[getUserActiveSubscription] Erreur:', error);
    return {
      subscription: null,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération'
    };
  }
};

export const getUserSubscriptions = async (
  userId: string
): Promise<{ subscriptions: Subscription[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getUserSubscriptions] Erreur:', error);
      throw error;
    }

    return { subscriptions: data || [], error: null };
  } catch (error) {
    console.error('[getUserSubscriptions] Erreur:', error);
    return {
      subscriptions: [],
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération'
    };
  }
};

export const createSubscription = async (
  userId: string,
  tier: SubscriptionTier,
  price: number,
  paymentMethod: string,
  duration: number,
  boostedCities: string[] = []
): Promise<{ subscription: Subscription | null; error: string | null }> => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        price,
        payment_method: paymentMethod,
        boosted_cities: boostedCities,
        city_change_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('[createSubscription] Erreur:', error);
      throw error;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: endDate.toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('[createSubscription] Erreur mise à jour profil:', profileError);
    }

    return { subscription: data, error: null };
  } catch (error) {
    console.error('[createSubscription] Erreur:', error);
    return {
      subscription: null,
      error: error instanceof Error ? error.message : 'Erreur lors de la création'
    };
  }
};

export const cancelSubscription = async (
  subscriptionId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      console.error('[cancelSubscription] Erreur récupération:', fetchError);
      throw new Error('Abonnement non trouvé');
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscriptionId);

    if (error) {
      console.error('[cancelSubscription] Erreur:', error);
      throw error;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: null,
        subscription_expires_at: null
      })
      .eq('user_id', subscription.user_id);

    if (profileError) {
      console.error('[cancelSubscription] Erreur mise à jour profil:', profileError);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('[cancelSubscription] Erreur:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'annulation'
    };
  }
};

export const getSubscriptionPlan = (tier: SubscriptionTier): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.tier === tier);
};

export const updateBoostedCities = async (
  subscriptionId: string,
  boostedCities: string[]
): Promise<{ subscription: Subscription | null; error: string | null }> => {
  try {
    const { data: currentSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !currentSub) {
      throw new Error('Abonnement non trouvé');
    }

    const plan = getSubscriptionPlan(currentSub.tier);
    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    if (plan.maxCityChanges !== 'unlimited' && currentSub.city_change_count >= plan.maxCityChanges) {
      return {
        subscription: null,
        error: 'Nombre maximum de modifications atteint'
      };
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        boosted_cities: boostedCities,
        city_change_count: currentSub.city_change_count + 1
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('[updateBoostedCities] Erreur:', error);
      throw error;
    }

    return { subscription: data, error: null };
  } catch (error) {
    console.error('[updateBoostedCities] Erreur:', error);
    return {
      subscription: null,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    };
  }
};

export const checkAndExpireSubscriptions = async (): Promise<void> => {
  try {
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString());

    if (fetchError) {
      console.error('[checkAndExpireSubscriptions] Erreur récupération:', fetchError);
      return;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString());

    if (error) {
      console.error('[checkAndExpireSubscriptions] Erreur:', error);
      return;
    }

    if (expiredSubs && expiredSubs.length > 0) {
      const userIds = expiredSubs.map(sub => sub.user_id);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: null,
          subscription_expires_at: null
        })
        .in('user_id', userIds);

      if (profileError) {
        console.error('[checkAndExpireSubscriptions] Erreur mise à jour profils:', profileError);
      }
    }
  } catch (error) {
    console.error('[checkAndExpireSubscriptions] Erreur:', error);
  }
};
