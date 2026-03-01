import { useEffect, useState } from 'react';
import { Search, CreditCard, Crown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAllSubscriptions } from '../../lib/admin';
import { formatRelativeTime } from '../../utils/date';

interface SubscriptionWithProfile {
  id: string;
  tier: string;
  status: string;
  start_date: string;
  end_date: string;
  price: number;
  payment_method: string;
  boosted_cities: string[];
  city_change_count: number;
  created_at: string;
  profile: {
    id: string;
    name: string;
    username?: string;
    user_type: string;
    photos: string[];
  };
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    const { subscriptions: data } = await getAllSubscriptions();
    setSubscriptions(data);
    setLoading(false);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.tier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.boosted_cities?.some((city) =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = filterStatus === null || sub.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
            <CheckCircle className="w-3 h-3" />
            Actif
          </span>
        );
      case 'expired':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs">
            <XCircle className="w-3 h-3" />
            Expiré
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-xs">
            <Clock className="w-3 h-3" />
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'basic':
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
            Classic
          </span>
        );
      case 'premium':
        return (
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">
            Premium
          </span>
        );
      case 'vip':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">
            <Crown className="w-3 h-3" />
            Elite
          </span>
        );
      default:
        return null;
    }
  };

  const totalRevenue = filteredSubscriptions.reduce((sum, sub) => sum + sub.price, 0);
  const activeCount = filteredSubscriptions.filter((s) => s.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Gestion des abonnements</h2>
        <button
          onClick={loadSubscriptions}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Abonnements actifs</span>
          </div>
          <div className="text-2xl font-bold text-white">{activeCount}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Total abonnements</span>
          </div>
          <div className="text-2xl font-bold text-white">{filteredSubscriptions.length}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/60 mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Revenu total</span>
          </div>
          <div className="text-2xl font-bold text-white">{totalRevenue.toFixed(2)}€</div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un abonnement..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2">
          {[
            { value: null, label: 'Tous' },
            { value: 'active', label: 'Actifs' },
            { value: 'expired', label: 'Expirés' },
            { value: 'cancelled', label: 'Annulés' },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filterStatus === filter.value
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredSubscriptions.map((sub) => (
          <div
            key={sub.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <img
                src={sub.profile?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'}
                alt={sub.profile?.name}
                className="w-16 h-16 rounded-xl object-cover"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">{sub.profile?.name}</h3>
                  {getTierBadge(sub.tier)}
                  {getStatusBadge(sub.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                  <span className="font-semibold text-white">{sub.price.toFixed(2)}€</span>
                  <span>{sub.payment_method}</span>
                  <span>
                    Du {new Date(sub.start_date).toLocaleDateString()} au{' '}
                    {new Date(sub.end_date).toLocaleDateString()}
                  </span>
                  <span className="text-xs">
                    {formatRelativeTime(new Date(sub.created_at))}
                  </span>
                </div>

                {sub.boosted_cities && sub.boosted_cities.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-white/60">Villes :</span>
                    <div className="flex flex-wrap gap-1">
                      {sub.boosted_cities.slice(0, 5).map((city, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white"
                        >
                          {city}
                        </span>
                      ))}
                      {sub.boosted_cities.length > 5 && (
                        <span className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white">
                          +{sub.boosted_cities.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-white/60">
                  Modifications de villes : {sub.city_change_count}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">Aucun abonnement trouvé</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-white/60 text-center">
        {filteredSubscriptions.length} abonnement(s) affiché(s) sur {subscriptions.length}
      </div>
    </div>
  );
}
