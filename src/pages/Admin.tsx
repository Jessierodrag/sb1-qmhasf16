import { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Star,
  CreditCard,
  BarChart3,
  Shield,
  Settings
} from 'lucide-react';
import { checkIsAdmin } from '../lib/admin';
import { getCurrentUser } from '../lib/auth';
import AdminStats from '../components/admin/AdminStats';
import AdminUsers from '../components/admin/AdminUsers';
import AdminPosts from '../components/admin/AdminPosts';
import AdminReviews from '../components/admin/AdminReviews';
import AdminSubscriptions from '../components/admin/AdminSubscriptions';
import AdminSettings from '../components/admin/AdminSettings';

type AdminTab = 'stats' | 'users' | 'posts' | 'reviews' | 'subscriptions' | 'settings';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const { user, error } = await getCurrentUser();
      if (!user || error) {
        setLoading(false);
        return;
      }

      const adminStatus = await checkIsAdmin(user.userId || user.user_id || user.id);
      setIsAdmin(adminStatus);
      setLoading(false);
    };

    verifyAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-white/60">Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
          <p className="text-white/60">
            Vous n'avez pas les droits d'accès à l'administration.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'stats' as AdminTab, label: 'Statistiques', icon: BarChart3 },
    { id: 'users' as AdminTab, label: 'Utilisateurs', icon: Users },
    { id: 'posts' as AdminTab, label: 'Publications', icon: FileText },
    { id: 'reviews' as AdminTab, label: 'Avis', icon: Star },
    { id: 'subscriptions' as AdminTab, label: 'Abonnements', icon: CreditCard },
    { id: 'settings' as AdminTab, label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Administration</h1>
          <p className="text-white/60">Gérez tous les aspects de votre application</p>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/25'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {activeTab === 'stats' && <AdminStats />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'posts' && <AdminPosts />}
          {activeTab === 'reviews' && <AdminReviews />}
          {activeTab === 'subscriptions' && <AdminSubscriptions />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </div>
    </div>
  );
}
