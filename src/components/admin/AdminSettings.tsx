import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import {
  getSubscriptionSettings,
  updateSubscriptionSettings,
} from '../../lib/admin';

interface SubscriptionPlan {
  name: string;
  price: number;
  duration: number;
  maxCities: number;
  maxCityChanges: number | 'unlimited';
  features: string[];
}

interface SubscriptionPlans {
  basic: SubscriptionPlan;
  premium: SubscriptionPlan;
  vip: SubscriptionPlan;
}

export default function AdminSettings() {
  const [plans, setPlans] = useState<SubscriptionPlans | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { settings } = await getSubscriptionSettings();
    if (settings) {
      setPlans(settings);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!plans) return;

    setSaving(true);
    setMessage(null);

    const { success, error } = await updateSubscriptionSettings(plans);

    if (success) {
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
    } else {
      setMessage({ type: 'error', text: error || 'Erreur lors de l\'enregistrement' });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 5000);
  };

  const updatePlan = (tier: keyof SubscriptionPlans, field: string, value: any) => {
    if (!plans) return;

    setPlans({
      ...plans,
      [tier]: {
        ...plans[tier],
        [field]: value,
      },
    });
  };

  const addFeature = (tier: keyof SubscriptionPlans) => {
    if (!plans) return;

    setPlans({
      ...plans,
      [tier]: {
        ...plans[tier],
        features: [...plans[tier].features, ''],
      },
    });
  };

  const updateFeature = (tier: keyof SubscriptionPlans, index: number, value: string) => {
    if (!plans) return;

    const newFeatures = [...plans[tier].features];
    newFeatures[index] = value;

    setPlans({
      ...plans,
      [tier]: {
        ...plans[tier],
        features: newFeatures,
      },
    });
  };

  const removeFeature = (tier: keyof SubscriptionPlans, index: number) => {
    if (!plans) return;

    setPlans({
      ...plans,
      [tier]: {
        ...plans[tier],
        features: plans[tier].features.filter((_, i) => i !== index),
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!plans) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Erreur lors du chargement des paramètres</p>
      </div>
    );
  }

  const tierLabels = {
    basic: 'Roses Classic',
    premium: 'Roses Premium',
    vip: 'Roses Elite',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-rose-500" />
          <h2 className="text-xl font-bold text-white">Paramètres des abonnements</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {(Object.keys(plans) as Array<keyof SubscriptionPlans>).map((tier) => {
          const plan = plans[tier];
          return (
            <div
              key={tier}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {tierLabels[tier]} ({tier})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Nom du plan</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => updatePlan(tier, 'name', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Prix (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={plan.price}
                    onChange={(e) => updatePlan(tier, 'price', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Durée (jours)</label>
                  <input
                    type="number"
                    value={plan.duration}
                    onChange={(e) => updatePlan(tier, 'duration', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Nombre de villes</label>
                  <input
                    type="number"
                    value={plan.maxCities}
                    onChange={(e) => updatePlan(tier, 'maxCities', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Modifications de villes
                  </label>
                  <input
                    type="text"
                    value={plan.maxCityChanges}
                    onChange={(e) =>
                      updatePlan(
                        tier,
                        'maxCityChanges',
                        e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value)
                      )
                    }
                    placeholder="Nombre ou 'unlimited'"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-white/60">Fonctionnalités</label>
                  <button
                    onClick={() => addFeature(tier)}
                    className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(tier, index, e.target.value)}
                        placeholder="Description de la fonctionnalité"
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-rose-500"
                      />
                      <button
                        onClick={() => removeFeature(tier, index)}
                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-sm text-blue-400">
          <strong>Note :</strong> Les modifications apportées ici affecteront uniquement les
          nouveaux abonnements. Les abonnements existants conserveront leurs paramètres d'origine.
        </p>
      </div>
    </div>
  );
}
