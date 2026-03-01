import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, MapPin, Phone, User, Calendar, Flag, Globe as Globe2, Wine, Cigarette, Languages, Heart, Scale, Ruler, Eye, Ruler as Ruler2, Shirt, Star, Loader, Image as ImageIcon } from 'lucide-react';
import { Profile, Review, UserProfile } from '../../types';
import { renderStars } from '../../utils/stars';
import { supabase } from '../../lib/supabase';
import SubscriptionBadge from '../SubscriptionBadge';
import MediaViewerModal from './MediaViewerModal';

interface ProfileModalProps {
  profile: Profile | UserProfile;
  onClose: () => void;
  onContact: () => void;
  isAuthenticated: boolean;
  isLoading?: boolean;
  error?: string | null;
  onReviewAdded?: (updatedProfile: Profile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onClose,
  onContact,
  isAuthenticated,
  isLoading = false,
  error = null,
  onReviewAdded
}) => {
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [localProfile, setLocalProfile] = useState<Profile>({...(profile as Profile)});
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, photo: string} | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (isAuthenticated) {
        try {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            // Récupérer le profil de l'utilisateur
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, username, photos')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (profileData) {
              setCurrentUser({
                id: data.user.id,
                name: profileData.username || profileData.name,
                photo: profileData.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
              });
            }
          }
        } catch (err) {
          console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        }
      }
    };
    
    fetchCurrentUser();
  }, [isAuthenticated]);

  // Récupérer les informations complètes du profil et les avis si un userId est disponible
  useEffect(() => {
    const fetchCompleteProfile = async () => {
      // Si le profil a un userId, on peut essayer de récupérer des informations plus complètes
      if ('userId' in profile && profile.userId) {
        try {
          setLoadingProfile(true);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', profile.userId)
            .maybeSingle();

          if (!profileError && profileData) {
            // Charger les avis depuis la base de données
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select(`
                id,
                rating,
                comment,
                created_at,
                from_user_id,
                profiles!reviews_from_user_id_fkey (
                  name,
                  username,
                  photos
                )
              `)
              .eq('to_user_id', profile.userId)
              .order('created_at', { ascending: false });

            const reviews = reviewsData?.map(review => ({
              id: review.id,
              userId: review.from_user_id,
              userName: (review.profiles as any)?.username || (review.profiles as any)?.name || 'Utilisateur',
              userPhoto: (review.profiles as any)?.photos?.[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
              rating: review.rating,
              comment: review.comment,
              date: new Date(review.created_at)
            })) || [];

            // Calculer la note moyenne
            const avgRating = reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 0;

            // Convertir le profil de la base de données au format attendu
            const updatedProfile: Profile = {
              ...localProfile,
              name: profileData.name,
              location: profileData.location,
              description: profileData.description || localProfile.description,
              interests: profileData.interests || localProfile.interests,
              physicalInfo: profileData.physical_info || localProfile.physicalInfo,
              personalInfo: profileData.personal_info || localProfile.personalInfo,
              prestations: profileData.prestations || localProfile.prestations,
              phone: profileData.phone,
              reviews: reviews,
              rating: avgRating
            };

            setLocalProfile(updatedProfile);
          }
        } catch (err) {
          console.error('Erreur lors de la récupération du profil complet:', err);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        // Si pas de userId, on utilise simplement le profil fourni
        setLoadingProfile(false);
      }
    };

    fetchCompleteProfile();
  }, [profile]);

  // Initialiser les reviews si nécessaire
  if (!localProfile.reviews) {
    localProfile.reviews = [];
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !newReview.rating || !newReview.comment.trim() || !currentUser) return;

    try {
      const profileUserId = ('userId' in profile && profile.userId) ||
                           ('user_id' in profile && profile.user_id);

      if (!profileUserId) {
        alert('Impossible de publier l\'avis : profil invalide');
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        alert('Vous devez être connecté pour publier un avis');
        return;
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          from_user_id: authData.user.id,
          to_user_id: profileUserId,
          rating: newReview.rating,
          comment: newReview.comment
        })
        .select()
        .single();

      if (reviewError) {
        console.error('Erreur lors de la création de l\'avis:', reviewError);
        alert('Erreur lors de la publication de l\'avis');
        return;
      }

      const review: Review = {
        id: reviewData.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date(reviewData.created_at)
      };

      const updatedProfile = JSON.parse(JSON.stringify(localProfile)) as Profile;
      updatedProfile.reviews.unshift(review);

      const totalRating = updatedProfile.reviews.reduce((sum, review) => sum + review.rating, 0);
      updatedProfile.rating = totalRating / updatedProfile.reviews.length;

      setLocalProfile(updatedProfile);

      if (onReviewAdded) {
        onReviewAdded(updatedProfile);
      }

      setNewReview({ rating: 0, comment: '' });
      alert('Avis publié avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la publication de l\'avis');
    }
  };

  // Function to get optimized image URL
  const getOptimizedImageUrl = (url: string) => {
    // If it's an Unsplash URL, add parameters for optimization
    if (url && url.includes('unsplash.com')) {
      // Add width, quality and format parameters
      const hasParams = url.includes('?');
      return `${url}${hasParams ? '&' : '?'}w=400&q=80&fm=webp`;
    }
    return url;
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[100]">
        <div className="bg-dark-50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader className="h-10 w-10 text-rose animate-spin mb-4" />
            <p className="text-gray-300">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[100]">
        <div className="bg-dark-50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
              <div className="flex items-center gap-2 sm:gap-3 text-rose">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-200">Erreur</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="w-full bg-dark-100 text-gray-200 py-2.5 rounded-lg font-medium hover:bg-dark-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[100]">
      <div className="bg-dark-50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-200">À propos</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <img
                src={getOptimizedImageUrl(localProfile.photos[0])}
                alt={localProfile.name}
                className="w-20 h-20 rounded-full object-cover"
                loading="lazy"
              />
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <h3 className="text-lg font-semibold text-gray-200">{localProfile.name}</h3>
                  <SubscriptionBadge tier={localProfile.subscription_tier} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{localProfile.location}</span>
                </div>
                {'rating' in localProfile && localProfile.rating > 0 ? (
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(localProfile.rating)}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 mt-1">Pas encore d'avis</div>
                )}
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                  <Phone className="h-4 w-4" />
                  <span>{localProfile.phone || '+33 6 XX XX XX XX'}</span>
                  {!isAuthenticated && (
                    <span className="text-xs text-rose ml-2">
                      (Connectez-vous pour voir le numéro)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Informations physiques</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.sexe || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.age ? `${localProfile.physicalInfo.age} ans` : 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Flag className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.ethnique || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.nationalite || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.taille || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Scale className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.poids || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.yeux || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ruler2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.physicalInfo.mensurations || 'Non renseigné'}</span>
                </div>
                {localProfile.physicalInfo.tour_poitrine && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shirt className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">
                      Tour de poitrine: {localProfile.physicalInfo.tour_poitrine} - Bonnet {localProfile.physicalInfo.bonnet}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Informations personnelles</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.personalInfo.orientation || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.personalInfo.origine || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wine className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.personalInfo.alcool || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Cigarette className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.personalInfo.fumeur || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300">{localProfile.personalInfo.langues?.join(', ') || 'Non renseigné'}</span>
                </div>
              </div>
            </div>

            {'prestations' in localProfile && localProfile.prestations && (
              <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-2">Prestations</h4>
                <p className="text-sm text-gray-300">{localProfile.prestations}</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-200">Avis clients</h4>
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      const reviewSection = document.getElementById('review-form');
                      reviewSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm text-rose hover:underline"
                  >
                    Laisser un avis
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {localProfile.reviews && localProfile.reviews.length > 0 ? (
                  localProfile.reviews.map((review) => (
                    <div key={review.id} className="border-b border-dark-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <img
                          src={getOptimizedImageUrl(review.userPhoto)}
                          alt={review.userName}
                          className="w-10 h-10 rounded-full object-cover"
                          loading="lazy"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-200">{review.userName}</h5>
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
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun avis pour le moment
                  </p>
                )}
              </div>

              {isAuthenticated && (
                <form 
                  id="review-form"
                  onSubmit={handleSubmitReview}
                  className="mt-6 p-4 bg-dark-100 rounded-lg"
                >
                  <h5 className="font-medium text-gray-200 mb-4">Laisser un avis pour {localProfile.name}</h5>
                  
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

                  <button
                    type="submit"
                    disabled={!newReview.rating || !newReview.comment.trim() || !currentUser}
                    className="w-full bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publier l'avis
                  </button>
                </form>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onContact}
                className="flex-1 bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors"
              >
                Contacter
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMediaViewer && localProfile.photos && (
        <MediaViewerModal
          media={localProfile.photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setShowMediaViewer(false)}
        />
      )}
    </div>
  );
};

export default ProfileModal;