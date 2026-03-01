import React, { useState, useEffect } from 'react';
import { X, Star, Loader } from 'lucide-react';
import { Profile, Review } from '../../types';
import { renderStars } from '../../utils/stars';
import { addReview, getProfileReviews, getProfileAverageRating } from '../../lib/reviews';
import { supabase } from '../../lib/supabase';
import UserProfileModal from './UserProfileModal';

interface ReviewsModalProps {
  profile: Profile;
  onClose: () => void;
  onReviewAdded?: (updatedProfile: Profile) => void;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ profile, onClose, onReviewAdded }) => {
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(profile.reviews || []);
  const [averageRating, setAverageRating] = useState(profile.rating || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, photo: string, userType: 'client' | 'professional'} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
  }, []);

  // Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isAuthenticated) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, username, photos, user_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setCurrentUser({
            id: user.id,
            name: profileData.username || profileData.name,
            photo: profileData.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
            userType: profileData.user_type === 'professional' ? 'professional' : 'client'
          });
        }
      }
    };
    
    fetchCurrentUser();
  }, [isAuthenticated]);

  // Charger les avis et la note moyenne
  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      try {
        if (!profile.userId) {
          // Si pas d'userId, utiliser les avis statiques du profil
          setReviews(profile.reviews || []);
          setAverageRating(profile.rating || 0);
          setIsLoading(false);
          return;
        }

        const [reviewsResult, ratingResult] = await Promise.all([
          getProfileReviews(profile.userId),
          getProfileAverageRating(profile.userId)
        ]);

        if (reviewsResult.error) throw new Error(reviewsResult.error.message);
        if (ratingResult.error) throw new Error(ratingResult.error.message);

        setReviews(reviewsResult.reviews);
        setAverageRating(ratingResult.rating);
      } catch (err) {
        console.error('Error loading reviews:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [profile.userId, profile.reviews, profile.rating]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !newReview.rating || !newReview.comment.trim() || !currentUser) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      if (!profile.userId) {
        // Pour les profils statiques, ajouter l'avis localement
        const review: Review = {
          id: (reviews?.length || 0) + 1,
          userId: currentUser.id,
          userName: currentUser.name,
          userPhoto: currentUser.photo,
          rating: newReview.rating,
          comment: newReview.comment,
          date: new Date()
        };

        const updatedReviews = [review, ...(reviews || [])];
        const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAverage = totalRating / updatedReviews.length;

        setReviews(updatedReviews);
        setAverageRating(newAverage);

        // Mettre à jour le profil parent
        if (onReviewAdded) {
          onReviewAdded({
            ...profile,
            rating: newAverage,
            reviews: updatedReviews
          });
        }
      } else {
        // Pour les profils de la base de données
        const { review, error: reviewError } = await addReview(
          profile.userId,
          newReview.rating,
          newReview.comment
        );

        if (reviewError) throw new Error(reviewError.message);

        if (review) {
          const updatedReviews = [review, ...reviews.filter(r => r.id !== review.id)];
          const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
          const newAverage = totalRating / updatedReviews.length;

          setReviews(updatedReviews);
          setAverageRating(newAverage);

          // Mettre à jour le profil parent
          if (onReviewAdded) {
            onReviewAdded({
              ...profile,
              rating: newAverage,
              reviews: updatedReviews
            });
          }
        }
      }

      // Réinitialiser le formulaire
      setNewReview({ rating: 0, comment: '' });
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[100]">
      <div className="bg-dark-50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <img
                src={profile.photos[0]}
                alt={profile.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-200 truncate">{profile.name}</h2>
                <div className="flex items-center gap-2">
                  {averageRating > 0 ? (
                    <>
                      {renderStars(averageRating)}
                      <span className="text-sm text-gray-400">
                        ({reviews.length} avis)
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Pas encore d'avis</span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Formulaire d'avis */}
          {isAuthenticated ? (
            <form 
              onSubmit={handleSubmitReview}
              className="mb-6 p-4 bg-dark-100 rounded-lg"
            >
              <h5 className="font-medium text-gray-200 mb-4">Laisser un avis</h5>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                      onMouseEnter={() => setHoverRating(rating)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          rating <= (hoverRating || newReview.rating)
                            ? 'fill-rose text-rose'
                            : 'text-gray-500'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">
                  Votre commentaire
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark-50 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent"
                  rows={4}
                  placeholder="Partagez votre expérience..."
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose/10 text-rose rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!newReview.rating || !newReview.comment.trim() || !currentUser || isSubmitting}
                className="w-full bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Publication en cours...' : 'Publier l\'avis'}
              </button>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-dark-100 rounded-lg text-center">
              <p className="text-gray-300 mb-4">Vous devez être connecté pour laisser un avis</p>
              <button
                onClick={() => {
                  onClose();
                  // Rediriger vers la page de connexion
                  const loginButton = document.querySelector('button:has(.h-6.w-6.text-rose)');
                  if (loginButton) {
                    (loginButton as HTMLButtonElement).click();
                  }
                }}
                className="px-4 py-2 bg-rose text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
              >
                Se connecter
              </button>
            </div>
          )}

          {/* Liste des avis */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="h-8 w-8 text-rose animate-spin" />
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-dark-200 pb-6 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => {
                        if (review.userId) {
                          setSelectedUserId(review.userId);
                          setShowUserProfile(true);
                        }
                      }}
                      className="flex-shrink-0 hover:opacity-80 transition-opacity p-1 -m-1"
                    >
                      <img
                        src={review.userPhoto}
                        alt={review.userName}
                        className="w-12 h-12 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-transparent hover:ring-rose-500/30 transition-all"
                      />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (review.userId) {
                              setSelectedUserId(review.userId);
                              setShowUserProfile(true);
                            }
                          }}
                          className="font-medium text-gray-200 hover:text-rose-500 transition-colors py-1 -my-1 text-left"
                        >
                          {review.userName}
                        </button>
                        <span className="text-xs text-gray-500">
                          {new Date(review.date).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="mt-1">
                        {renderStars(review.rating)}
                      </div>
                      <p className="mt-2 text-sm text-gray-300">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">
                Aucun avis pour le moment. Soyez le premier à donner votre avis !
              </p>
            )}
          </div>
        </div>
      </div>

      {showUserProfile && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUserId(null);
          }}
          currentUserType={currentUser?.userType}
        />
      )}
    </div>
  );
};

export default ReviewsModal;