import { useEffect, useState } from 'react';
import { Users, FileText, Star, CreditCard, TrendingUp, UserCheck, Briefcase } from 'lucide-react';
import { getAdminStats, type AdminStats as AdminStatsType } from '../../lib/admin';

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getAdminStats();
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Erreur lors du chargement des statistiques</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Utilisateurs Totaux',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Clients',
      value: stats.clientUsers,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Professionnels',
      value: stats.proUsers,
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Publications',
      value: stats.totalPosts,
      icon: FileText,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-500/10',
    },
    {
      label: 'Avis',
      value: stats.totalReviews,
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Abonnements Actifs',
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Abonnements Totaux',
      value: stats.totalSubscriptions,
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Revenu Total',
      value: `${stats.totalRevenue.toFixed(2)}€`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Vue d'ensemble</h2>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
              <div className="text-sm text-white/60">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Répartition des utilisateurs</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Clients</span>
                <span className="text-white font-medium">{stats.clientUsers}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.clientUsers / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Professionnels</span>
                <span className="text-white font-medium">{stats.proUsers}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.proUsers / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Abonnements</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Actifs</span>
                <span className="text-white font-medium">{stats.activeSubscriptions}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                  style={{
                    width: `${stats.totalSubscriptions > 0 ? (stats.activeSubscriptions / stats.totalSubscriptions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="text-sm text-white/60 mb-1">Revenu moyen par abonnement</div>
              <div className="text-2xl font-bold text-white">
                {stats.totalSubscriptions > 0
                  ? (stats.totalRevenue / stats.totalSubscriptions).toFixed(2)
                  : '0.00'}
                €
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
