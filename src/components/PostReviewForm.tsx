import React, { useState, useEffect } from 'react';
import { Star, Loader } from 'lucide-react';
import { addPostReview, getPostReviews, PostReview } from '../lib/reviews';
import { supabase } from '../lib/supabase';
import { renderStars } from '../utils/stars';

interface PostReviewFormProps {
  postId: string;
  onReviewAdded?: (review: PostReview) => void;
}

const PostReviewForm: React.FC<PostReviewFormProps> = ({ postId, onReviewAdded }) => {
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<PostReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, photo: string} | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (!isAuthenticated) {
          return;
        }
        
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          
          // Récupérer le profil de l'utilisateur
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, username, photos')
            .eq('user_id', data.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            return;
          }
          
          if (profileData) {
            setCurrentUser({
              id: data.user.id,
              name: profileData.username || profileData.name,
              photo: profileData.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
            });
          } else {
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, [isAuthenticated]);

  // Récupérer les avis existants
  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const { reviews, error } = await getPostReviews(postId);
        if (error) throw new Error(error.message);
        
        setReviews(reviews);
        
        // Calculer la note moyenne
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(totalRating / reviews.length);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (postId) {
      fetchReviews();
    }
  }, [postId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError("Vous devez être connecté pour poster un avis");
      return;
    }
    
    if (!newReview.rating || !newReview.comment.trim() || !currentUser) {
      setError("Veuillez remplir tous les champs pour poster un avis");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
        postId,
        rating: newReview.rating,
        comment: newReview.comment
      });
      
      const { review, error } = await addPostReview(
        postId,
        newReview.rating,
        newReview.comment
      );
      
      if (error) {
        console.error('Error from addPostReview:', error);
        throw new Error(error.message);
      }
      
      
      if (review) {
        // Ajouter le nouvel avis à la liste
        setReviews(prev => [review, ...prev.filter(r => r.id !== review.id)]);
        
        // Calculer la nouvelle note moyenne
        const totalRating = [...reviews.filter(r => r.id !== review.id), review]
          .reduce((sum, r) => sum + r.rating, 0);
        const newAverage = totalRating / ([...reviews.filter(r => r.id !== review.id), review].length);
        setAverageRating(newAverage);
        
        // Notifier le parent
        if (onReviewAdded) {
          onReviewAdded(review);
        }
        
        // Réinitialiser le formulaire
        setNewReview({ rating: 0, comment: '' });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-50 rounded-lg p-4 border border-dark-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Avis</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            {renderStars(averageRating)}
            <span className="text-sm text-gray-400">({reviews.length})</span>
          </div>
        )}
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
      <div className="space-y-4">
        <h4 className="font-medium text-gray-200 mb-2">Avis des utilisateurs</h4>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-8 w-8 text-gray-500 animate-spin" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-dark-200 pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <img
                  src={review.profiles?.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                  alt={review.profiles?.name || 'Utilisateur'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-200">{review.profiles?.username || review.profiles?.name || 'Utilisateur'}</h5>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
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
          <p className="text-center text-gray-400 py-4">
            Aucun avis pour le moment. Soyez le premier à donner votre avis !
          </p>
        )}
      </div>
    </div>
  );
};

export default PostReviewForm;