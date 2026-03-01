import { useEffect, useState } from 'react';
import { Search, Trash2, Star } from 'lucide-react';
import { getAllReviews, deleteReview } from '../../lib/admin';
import { formatRelativeTime } from '../../utils/date';
import { renderStars } from '../../utils/stars';

interface ReviewWithProfiles {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  profile: {
    name: string;
    username?: string;
    photos: string[];
  };
  reviewer: {
    name: string;
    username?: string;
    photos: string[];
  };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const { reviews: data } = await getAllReviews();
    setReviews(data as any);
    setLoading(false);
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;

    const { success } = await deleteReview(reviewId);
    if (success) {
      setReviews(reviews.filter((r) => r.id !== reviewId));
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = filterRating === null || review.rating === filterRating;

    return matchesSearch && matchesRating;
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
        <h2 className="text-xl font-bold text-white">Modération des avis</h2>
        <button
          onClick={loadReviews}
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
            placeholder="Rechercher un avis..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterRating(null)}
            className={`px-4 py-3 rounded-xl transition-colors ${
              filterRating === null
                ? 'bg-rose-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Tous
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilterRating(rating)}
              className={`px-4 py-3 rounded-xl transition-colors flex items-center gap-1 ${
                filterRating === rating
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {rating}
              <Star className="w-4 h-4 fill-current" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.reviewer?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'}
                      alt={review.reviewer?.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-white font-semibold">{review.reviewer?.name}</p>
                      <p className="text-sm text-white/60">
                        a évalué{' '}
                        <span className="text-white">{review.profile?.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-xs text-white/60">
                      {formatRelativeTime(new Date(review.created_at))}
                    </p>
                  </div>
                </div>

                <p className="text-white/80 mb-3">{review.comment}</p>

                <div className="flex items-center gap-3">
                  <img
                    src={review.profile?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'}
                    alt={review.profile?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-white/60">
                    Profil évalué : <span className="text-white">{review.profile?.name}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteReview(review.id)}
                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors h-fit"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">Aucun avis trouvé</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-white/60 text-center">
        {filteredReviews.length} avis affiché(s) sur {reviews.length}
      </div>
    </div>
  );
}
