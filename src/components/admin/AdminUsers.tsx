import { useEffect, useState } from 'react';
import {
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  Briefcase,
  Crown,
} from 'lucide-react';
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  makeUserAdmin,
} from '../../lib/admin';
import type { UserProfile } from '../../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'pro' | 'admin'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { users: data } = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const { success } = await updateUserStatus(userId, !currentStatus);
    if (success) {
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        )
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    const { success } = await deleteUser(userId);
    if (success) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (!confirm(`Êtes-vous sûr de vouloir ${isCurrentlyAdmin ? 'retirer' : 'donner'} les droits admin ?`)) return;

    const { success } = await makeUserAdmin(userId, !isCurrentlyAdmin);
    if (success) {
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_admin: !isCurrentlyAdmin } : u
        )
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'admin' && user.is_admin) ||
      (filterType === 'client' && user.userType === 'client') ||
      (filterType === 'pro' && user.userType === 'pro');

    return matchesSearch && matchesFilter;
  });

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
        <h2 className="text-xl font-bold text-white">Gestion des utilisateurs</h2>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Actualiser
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'client', 'pro', 'admin'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-4 py-3 rounded-xl transition-colors ${
                filterType === type
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {type === 'all' && 'Tous'}
              {type === 'client' && 'Clients'}
              {type === 'pro' && 'Pros'}
              {type === 'admin' && 'Admins'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <img
                src={user.photos?.[0] || user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'}
                alt={user.name}
                className="w-16 h-16 rounded-xl object-cover"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold truncate">{user.name}</h3>
                  {user.is_admin && (
                    <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  )}
                  {user.subscription_tier && (
                    <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    {user.userType === 'pro' ? (
                      <Briefcase className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    {user.userType === 'pro' ? 'Professionnel' : 'Client'}
                  </span>
                  <span>{user.location}</span>
                  {user.subscription_tier && (
                    <span className="text-yellow-500 font-medium">
                      {user.subscription_tier}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(user.id, user.is_active ?? true)}
                  className={`p-2 rounded-lg transition-colors ${
                    user.is_active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                  title={user.is_active ? 'Désactiver' : 'Activer'}
                >
                  {user.is_active ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => handleToggleAdmin(user.id, user.is_admin ?? false)}
                  className={`p-2 rounded-lg transition-colors ${
                    user.is_admin
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                  title={user.is_admin ? 'Retirer admin' : 'Rendre admin'}
                >
                  {user.is_admin ? (
                    <ShieldOff className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-white/60 text-center">
        {filteredUsers.length} utilisateur(s) affiché(s) sur {users.length}
      </div>
    </div>
  );
}
