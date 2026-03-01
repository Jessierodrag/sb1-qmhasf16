import React, { useState, useRef, useEffect } from 'react';
import { Star, Heart, MessageCircle, User, MapPin, Sparkles } from 'lucide-react';
import { Profile, UserProfile } from '../types';
import { renderStars } from '../utils/stars';
import PhotoCarousel from './PhotoCarousel';
import ProfileModal from './modals/ProfileModal';
import ReviewsModal from './modals/ReviewsModal';
import SubscriptionBadge from './SubscriptionBadge';
import { toggleLike, getLikeStatus } from '../lib/likes';
import { recordPostView } from '../lib/views';

interface PostCardProps {
  profile: Profile;
  onContact: () => void;
  isAuthenticated: boolean;
  postId?: string;
  onPostDeleted?: () => void;
  authorPhoto?: string;
  userProfile?: UserProfile | null;
  isBoosted?: boolean;
  hideProfileActions?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  profile: initialProfile,
  onContact,
  isAuthenticated,
  authorPhoto,
  postId,
  userProfile,
  isBoosted = false,
  hideProfileActions = false
}) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mettre à jour le state local quand les props changent
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (postId) {
      loadLikeStatus();
    }
  }, [postId, userProfile?.user_id]);

  useEffect(() => {
    if (!postId || !isAuthenticated || viewRecorded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting && !viewRecorded) {
            const userId = userProfile?.user_id || userProfile?.id;
            if (userId) {
              const { success } = await recordPostView(postId, userId);
              if (success) {
                setViewRecorded(true);
              }
            }
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '0px'
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [postId, isAuthenticated, userProfile, viewRecorded]);

  const loadLikeStatus = async () => {
    if (!postId) return;

    const userId = userProfile?.user_id || userProfile?.id;
    const { isLiked: liked, likesCount: count } = await getLikeStatus(postId, userId || null);

    setIsLiked(liked);
    setLikesCount(count);
  };

  const handleLike = async () => {
    if (!isAuthenticated || !postId || isLoadingLike) return;

    const userId = userProfile?.user_id || userProfile?.id;
    if (!userId) {
      console.error('[PostCard] User ID manquant');
      return;
    }

    setIsLoadingLike(true);

    // Optimistic UI update
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);

    try {
      const { success, isLiked: newIsLiked, likesCount: newCount, error } = await toggleLike(postId, userId);

      if (!success || error) {
        // Rollback en cas d'erreur
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikesCount);
        console.error('[PostCard] Erreur toggle like:', error);
      } else {
        // Mettre à jour avec les vraies valeurs du serveur
        setIsLiked(newIsLiked);
        setLikesCount(newCount);
      }
    } catch (err) {
      // Rollback en cas d'erreur
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      console.error('[PostCard] Erreur inattendue:', err);
    } finally {
      setIsLoadingLike(false);
    }
  };

  // Gérer l'ajout d'un nouvel avis
  const handleReviewAdded = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  return (
    <div ref={cardRef} className={`glass rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${isBoosted ? 'ring-2 ring-gold-500/50' : ''} animate-slide-up`}>
      {/* Indicator Boosted */}
      {isBoosted && (
        <div className="bg-gradient-to-r from-gold-500/20 via-yellow-500/20 to-gold-500/20 px-4 py-2.5 flex items-center gap-2 border-b border-gold-500/30">
          <Sparkles className="h-4 w-4 text-gold-500 animate-pulse" />
          <span className="text-xs font-semibold text-gold-500 tracking-wide">PUBLICATION BOOSTÉE</span>
        </div>
      )}

      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={authorPhoto || profile.photos[0]}
              alt={profile.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-rose-500/30"
            />
            {profile.isOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-50"></div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-gray-100">{profile.name}</h3>
              <SubscriptionBadge tier={profile.subscription_tier} size="sm" />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>{profile.location}</span>
            </div>
          </div>
        </div>
        {!hideProfileActions && (
          <div className="flex items-center gap-2">
            {profile.rating > 0 ? (
              <div className="flex items-center gap-1 bg-dark-100/50 px-3 py-1.5 rounded-full">
                {renderStars(profile.rating)}
              </div>
            ) : (
              <span className="text-xs text-gray-500">Pas encore d'avis</span>
            )}
          </div>
        )}
      </div>

      {/* Photos */}
      <PhotoCarousel photos={profile.photos} thumbnails={profile.thumbnails} />

      {/* Actions */}
      <div className="p-5 border-b border-white/5">
        {!hideProfileActions && (
          <div className="flex items-center gap-6 mb-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 group relative"
            >
              <Heart
                className={`h-6 w-6 transition-all duration-200 ${
                  isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-gray-400 group-hover:text-rose-500 group-hover:scale-110'
                } ${isLikeAnimating ? 'animate-like-button' : ''}`}
              />
              {isLiked && isLikeAnimating && (
                <span className="absolute inset-0 bg-rose-500 rounded-full opacity-20 animate-like-explosion"></span>
              )}
              <span className={`text-sm font-medium ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}>
                {likesCount}
              </span>
            </button>
            <button
              onClick={() => setShowReviewsModal(true)}
              className="flex items-center gap-2 group"
            >
              <MessageCircle className="h-6 w-6 text-gray-400 group-hover:text-gray-300 group-hover:scale-110 transition-all duration-200" />
              <span className="text-sm font-medium text-gray-400">
                {profile.reviews?.length || 0}
              </span>
            </button>
          </div>
        )}

        <p className="text-sm text-gray-200 mb-4 line-clamp-2 leading-relaxed">
          {profile.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
            >
              {interest}
            </span>
          ))}
        </div>

        {!hideProfileActions && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-1 flex items-center justify-center gap-2 glass-light text-gray-100 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200 border border-white/5"
            >
              <User className="h-5 w-5" />
              Voir Profil
            </button>
            <button
              onClick={onContact}
              className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-glow-rose"
            >
              Contacter
            </button>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      {!hideProfileActions && 'reviews' in profile && profile.reviews && (
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-100 flex items-center gap-2">
              <Star className="h-4 w-4 text-gold-500" />
              Derniers avis
            </h4>
            <button
              onClick={() => setShowReviewsModal(true)}
              className="text-sm text-rose-500 hover:text-rose-400 font-medium transition-colors"
            >
              Voir tous les avis
            </button>
          </div>

          <div className="space-y-4">
            {profile.reviews.length > 0 ? (
              profile.reviews.slice(0, 1).map((review) => (
                <div key={review.id} className="glass-light p-3 rounded-xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <img
                      src={review.userPhoto}
                      alt={review.userName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/20"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-semibold text-gray-100">{review.userName}</h5>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Star className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-500">
                  Pas encore d'avis
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onContact={onContact}
          isAuthenticated={isAuthenticated}
          onReviewAdded={handleReviewAdded}
        />
      )}

      {showReviewsModal && (
        <ReviewsModal
          profile={profile}
          onClose={() => setShowReviewsModal(false)}
          onReviewAdded={handleReviewAdded}
        />
      )}
    </div>
  );
};

export default PostCard;