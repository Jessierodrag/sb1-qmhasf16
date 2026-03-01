import React, { useState, useEffect } from 'react';
import { Check, CreditCard, X, Sparkles, Crown, BadgeCheck, MapPin } from 'lucide-react';
import {
  SUBSCRIPTION_PLANS,
  getUserActiveSubscription,
  createSubscription,
  cancelSubscription,
  updateBoostedCities,
  type Subscription,
  type SubscriptionTier,
  getSubscriptionPlan
} from '../lib/subscriptions';
import { getCurrentUser } from '../lib/auth';
import { regions } from '../data/regions';

interface SubscriptionPageProps {
  autoOpenTier?: SubscriptionTier | null;
  onAutoOpenComplete?: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ autoOpenTier, onAutoOpenComplete }) => {
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof SUBSCRIPTION_PLANS[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showEditCitiesModal, setShowEditCitiesModal] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  useEffect(() => {
    if (autoOpenTier && !isLoading) {
      const plan = SUBSCRIPTION_PLANS.find(p => p.tier === autoOpenTier);
      if (plan) {
        handleSubscribe(plan);
        if (onAutoOpenComplete) {
          onAutoOpenComplete();
        }
      }
    }
  }, [autoOpenTier, isLoading]);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const { user } = await getCurrentUser();
      if (user && user.user_id) {
        const { subscription } = await getUserActiveSubscription(user.user_id);
        setActiveSubscription(subscription);
      }
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
    setSelectedCities([]);
    setError(null);
  };

  const handleAddCity = () => {
    if (!selectedCity) return;

    if (selectedCities.includes(selectedCity)) {
      setError('Cette ville est déjà sélectionnée');
      return;
    }

    let maxCities = 1;

    if (showEditCitiesModal && currentPlan) {
      maxCities = currentPlan.maxCities;
    } else if (selectedPlan) {
      const plan = getSubscriptionPlan(selectedPlan.tier);
      if (!plan) return;
      maxCities = plan.maxCities;
    }

    if (selectedCities.length >= maxCities) {
      setError(`Vous ne pouvez sélectionner que ${maxCities} ville${maxCities > 1 ? 's' : ''} maximum`);
      return;
    }

    setSelectedCities([...selectedCities, selectedCity]);
    setSelectedCity('');
    setSelectedDepartment('');
    setSelectedRegion('');
    setError(null);
  };

  const handleRemoveCity = (city: string) => {
    setSelectedCities(selectedCities.filter(c => c !== city));
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const plan = getSubscriptionPlan(selectedPlan.tier);
    if (!plan) return;

    if (selectedCities.length === 0) {
      setError(`Veuillez sélectionner au moins 1 ville`);
      return;
    }

    if (selectedCities.length > plan.maxCities) {
      setError(`Vous ne pouvez sélectionner que ${plan.maxCities} ville${plan.maxCities > 1 ? 's' : ''} maximum`);
      return;
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Numéro de carte invalide');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setError('Date d\'expiration invalide (MM/AA)');
      return;
    }

    if (cardCvc.length !== 3) {
      setError('Code CVC invalide');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { user } = await getCurrentUser();
      if (!user || !user.user_id) {
        throw new Error('Utilisateur non connecté');
      }

      const { subscription, error: subError } = await createSubscription(
        user.user_id,
        selectedPlan.tier,
        selectedPlan.price,
        'card',
        selectedPlan.duration,
        selectedCities
      );

      if (subError) {
        throw new Error(subError);
      }

      if (subscription) {
        setActiveSubscription(subscription);
        setShowPaymentModal(false);
        setSelectedPlan(null);
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setCardName('');
        setSelectedRegion('');
        setSelectedDepartment('');
        setSelectedCity('');
        setSelectedCities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return;
    }

    try {
      const { success, error: cancelError } = await cancelSubscription(activeSubscription.id);
      if (success) {
        await loadSubscription();
      } else if (cancelError) {
        setError(cancelError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleOpenEditCities = () => {
    if (activeSubscription) {
      setSelectedCities([...activeSubscription.boosted_cities]);
      setShowEditCitiesModal(true);
    }
  };

  const handleSaveEditedCities = async () => {
    if (!activeSubscription) return;

    const plan = getSubscriptionPlan(activeSubscription.tier);
    if (!plan) return;

    if (selectedCities.length === 0) {
      setError(`Veuillez sélectionner au moins 1 ville`);
      return;
    }

    if (selectedCities.length > plan.maxCities) {
      setError(`Vous ne pouvez sélectionner que ${plan.maxCities} ville${plan.maxCities > 1 ? 's' : ''} maximum`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { subscription, error: updateError } = await updateBoostedCities(
        activeSubscription.id,
        selectedCities
      );

      if (updateError) {
        setError(updateError);
        return;
      }

      if (subscription) {
        setActiveSubscription(subscription);
        setShowEditCitiesModal(false);
        setSelectedRegion('');
        setSelectedDepartment('');
        setSelectedCity('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedDepartment('');
    setSelectedCity('');
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    setSelectedCity('');
  };

  const getAvailableDepartments = () => {
    if (!selectedRegion) return [];
    return Object.keys(regions[selectedRegion as keyof typeof regions] || {});
  };

  const getAvailableCities = () => {
    if (!selectedRegion || !selectedDepartment) return [];
    const region = regions[selectedRegion as keyof typeof regions];
    if (!region) return [];
    return region[selectedDepartment as keyof typeof region] || [];
  };

  const currentPlan = activeSubscription ? getSubscriptionPlan(activeSubscription.tier) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-gray-600 border-t-rose-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 mt-8">
          <h1 className="text-3xl font-light text-white mb-3">Abonnements</h1>
          <p className="text-gray-400 text-base">
            Augmentez votre visibilité
          </p>
        </div>

        {activeSubscription && activeSubscription.status === 'active' && currentPlan && (
          <div className="glass p-8 rounded-lg mb-16 border border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {currentPlan.tier === 'basic' ? (
                    <Sparkles className="h-5 w-5 text-rose-500" />
                  ) : currentPlan.tier === 'premium' ? (
                    <Crown className="h-5 w-5 text-rose-500" />
                  ) : (
                    <BadgeCheck className="h-5 w-5 text-rose-500" />
                  )}
                  <h2 className="text-xl font-medium text-white">Abonnement {currentPlan.name}</h2>
                </div>
                <p className="text-sm text-gray-400">
                  Actif jusqu'au {new Date(activeSubscription.end_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 text-sm text-gray-300 border border-white/20 hover:bg-white/5 rounded-md transition-colors"
              >
                Annuler
              </button>
            </div>
            <div className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{feature}</span>
                </div>
              ))}
              {activeSubscription.boosted_cities && activeSubscription.boosted_cities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-rose-500" />
                      <span className="text-sm font-medium text-rose-400">
                        Ville{activeSubscription.boosted_cities.length > 1 ? 's' : ''} boostée{activeSubscription.boosted_cities.length > 1 ? 's' : ''} ({activeSubscription.boosted_cities.length}/{currentPlan.maxCities})
                      </span>
                    </div>
                    {(currentPlan.maxCityChanges === 'unlimited' || activeSubscription.city_change_count < currentPlan.maxCityChanges) && (
                      <button
                        onClick={handleOpenEditCities}
                        className="text-xs text-rose-500 hover:text-rose-400 transition-colors"
                      >
                        Modifier
                        {currentPlan.maxCityChanges !== 'unlimited' && (
                          <span className="text-gray-500 ml-1">
                            ({currentPlan.maxCityChanges - activeSubscription.city_change_count} modif. restante{(currentPlan.maxCityChanges - activeSubscription.city_change_count) > 1 ? 's' : ''})
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeSubscription.boosted_cities.map((city, index) => (
                      <span key={index} className="text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30">
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {SUBSCRIPTION_PLANS.map((plan, index) => {
            const isCurrentPlan = activeSubscription?.tier === plan.tier;
            const isActive = activeSubscription?.status === 'active';
            const isPremium = index === 1;

            const PlanIcon = plan.tier === 'basic' ? Sparkles : plan.tier === 'premium' ? Crown : BadgeCheck;

            return (
              <div
                key={plan.tier}
                className={`relative glass rounded-lg p-8 border transition-all flex flex-col ${
                  isPremium
                    ? 'border-gold-500/50 scale-105'
                    : 'border-white/10'
                }`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-gold-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Populaire
                  </div>
                )}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <PlanIcon className="h-5 w-5 text-rose-500" />
                    <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  </div>
                  <div className="mb-1">
                    <span className="text-4xl font-light text-white">{plan.price}€</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {plan.duration === 1 ? '24 heures' : plan.duration === 7 ? '7 jours' : '30 jours'}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-rose-500/70 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan && isActive ? (
                  <button
                    disabled
                    className="w-full py-2.5 text-sm glass-light text-gray-500 rounded-md cursor-not-allowed"
                  >
                    Actif
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full py-2.5 text-sm rounded-md font-medium transition-all ${
                      isPremium
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white'
                        : 'glass-light hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    Choisir
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[100]">
          <div className="glass rounded-lg max-w-md w-full max-h-[90vh] border border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-medium text-white">Paiement</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setError(null);
                  setSelectedRegion('');
                  setSelectedDepartment('');
                  setSelectedCity('');
                  setSelectedCities([]);
                }}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="glass-light p-4 rounded-lg mb-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">{selectedPlan.name}</h3>
                  <p className="text-sm text-gray-400">
                    {selectedPlan.duration === 1 ? '24 heures' : selectedPlan.duration === 7 ? '7 jours' : '30 jours'}
                  </p>
                </div>
                <p className="text-xl font-medium text-white">{selectedPlan.price}€</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-medium text-white">
                  Choisissez vos villes de visibilité ({selectedCities.length}/{selectedPlan.maxCities})
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Votre profil sera boosté dans les villes sélectionnées
              </p>

              {selectedCities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 glass-light rounded-lg border border-white/10">
                  {selectedCities.map((city, index) => (
                    <span key={index} className="inline-flex items-center gap-1 text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30">
                      {city}
                      <button
                        onClick={() => handleRemoveCity(city)}
                        className="hover:text-rose-100 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Région
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">Sélectionner une région</option>
                    {Object.keys(regions).map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {selectedRegion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Département
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="">Sélectionner un département</option>
                      {getAvailableDepartments().map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedDepartment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ville
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="flex-1 glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      >
                        <option value="">Sélectionner une ville</option>
                        {getAvailableCities().map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddCity}
                        disabled={!selectedCity || selectedCities.length >= selectedPlan.maxCities}
                        className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500 text-rose-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Numéro de carte
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      if (value.length <= 16 && /^\d*$/.test(value)) {
                        setCardNumber(formatCardNumber(value));
                      }
                    }}
                    placeholder="1234 5678 9012 3456"
                    className="w-full glass-light text-white px-10 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom sur la carte
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiration
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setCardExpiry(formatExpiry(value));
                      }
                    }}
                    placeholder="MM/AA"
                    className="w-full glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 3) {
                        setCardCvc(value);
                      }
                    }}
                    placeholder="123"
                    className="w-full glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
            </div>

            <div className="border-t border-white/10 p-4 sm:p-6">
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                {isProcessing ? 'Traitement...' : `Payer ${selectedPlan.price}€`}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Paiement sécurisé
              </p>
            </div>
          </div>
        </div>
      )}

      {showEditCitiesModal && activeSubscription && currentPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-[100]">
          <div className="glass rounded-lg max-w-md w-full max-h-[90vh] border border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-medium text-white">Modifier les villes boostées</h2>
              <button
                onClick={() => {
                  setShowEditCitiesModal(false);
                  setError(null);
                  setSelectedRegion('');
                  setSelectedDepartment('');
                  setSelectedCity('');
                  if (activeSubscription) {
                    setSelectedCities([...activeSubscription.boosted_cities]);
                  }
                }}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="glass-light p-4 rounded-lg mb-4 border border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Modifications restantes:</span>
                <span className="text-white font-medium">
                  {currentPlan.maxCityChanges === 'unlimited'
                    ? 'Illimité'
                    : `${currentPlan.maxCityChanges - activeSubscription.city_change_count}`}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-medium text-white">
                  Villes sélectionnées ({selectedCities.length}/{currentPlan.maxCities})
                </h3>
              </div>

              {selectedCities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 glass-light rounded-lg border border-white/10">
                  {selectedCities.map((city, index) => (
                    <span key={index} className="inline-flex items-center gap-1 text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full border border-rose-500/30">
                      {city}
                      <button
                        onClick={() => handleRemoveCity(city)}
                        className="hover:text-rose-100 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Région
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">Sélectionner une région</option>
                    {Object.keys(regions).map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {selectedRegion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Département
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="">Sélectionner un département</option>
                      {getAvailableDepartments().map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedDepartment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ville
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="flex-1 glass-light text-white px-4 py-2.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      >
                        <option value="">Sélectionner une ville</option>
                        {getAvailableCities().map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddCity}
                        disabled={!selectedCity || selectedCities.length >= currentPlan.maxCities}
                        className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500 text-rose-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            </div>

            <div className="border-t border-white/10 p-4 sm:p-6">
              <button
                onClick={handleSaveEditedCities}
                disabled={isProcessing || selectedCities.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                {isProcessing ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
