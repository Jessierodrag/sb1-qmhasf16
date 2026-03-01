import { useEffect, useState } from 'react';
import { Search, Eye, EyeOff, Trash2, Heart, MessageCircle, MapPin } from 'lucide-react';
import { getAllPosts, updatePostStatus, deletePost } from '../../lib/admin';
import type { Post } from '../../types';
import { formatRelativeTime } from '../../utils/date';

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { posts: data } = await getAllPosts();
    setPosts(data);
    setLoading(false);
  };

  const handleToggleStatus = async (postId: string, currentStatus: boolean) => {
    const { success } = await updatePostStatus(postId, !currentStatus);
    if (success) {
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, is_active: !currentStatus } : p
        )
      );
      window.dispatchEvent(new Event('postUpdated'));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) return;

    const { success } = await deletePost(postId);
    if (success) {
      setPosts(posts.filter((p) => p.id !== postId));
      window.dispatchEvent(new Event('postDeleted'));
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
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
        <h2 className="text-xl font-bold text-white">Gestion des publications</h2>
        <button
          onClick={loadPosts}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Actualiser
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une publication..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex gap-4">
              {post.photos?.[0] && (
                <img
                  src={post.thumbnails?.[0] || post.photos[0]}
                  alt="Post"
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-2">
                  <img
                    src={post.user?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'}
                    alt={post.user?.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">{post.user?.name}</h3>
                    <p className="text-sm text-white/60">
                      {formatRelativeTime(new Date(post.created_at))}
                    </p>
                  </div>
                </div>

                {post.caption && (
                  <p className="text-white/80 mb-2 line-clamp-2">{post.caption}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                  {post.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {post.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments_count || 0}
                  </span>
                  {post.tags && post.tags.length > 0 && (
                    <span className="flex gap-1 flex-wrap">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white/10 rounded-lg text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleStatus(post.id, post.is_active ?? true)}
                  className={`p-2 rounded-lg transition-colors ${
                    post.is_active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                  title={post.is_active ? 'Désactiver' : 'Activer'}
                >
                  {post.is_active ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">Aucune publication trouvée</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-white/60 text-center">
        {filteredPosts.length} publication(s) affichée(s) sur {posts.length}
      </div>
    </div>
  );
}
