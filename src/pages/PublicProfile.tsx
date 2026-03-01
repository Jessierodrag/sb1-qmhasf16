import React, { useState, useEffect } from 'react';
import { MapPin, Star, Phone, Camera, Loader, ChevronLeft, MessageCircle, Clock, ExternalLink } from 'lucide-react';
import { UserProfile, Review, Profile } from '../types';
import { renderStars } from '../utils/stars';
import { getProfileReviews } from '../lib/reviews';
import { getPosts, Post as PostType } from '../lib/posts';
import PostCard from '../components/PostCard';
import ProfileModal from '../components/modals/ProfileModal';
import ChatModal from '../components/modals/ChatModal';
import { userProfileToProfile } from '../lib/profile';
import SubscriptionBadge from '../components/SubscriptionBadge';
import { getUserReviews, UserReviewWithProfile } from '../lib/userStats';
import { formatDistanceToNow } from '../utils/date';

interface PublicProfileProps {
  viewedProfile: UserProfile;
  currentUserProfile: UserProfile | null;
  isAuthenticated: boolean;
  onBack: () => void;
}

const PublicProfile: React.FC<PublicProfileProps> = ({
  viewedProfile,
  currentUserProfile,
  isAuthenticated,
  onBack
}) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [clientReviews, setClientReviews] = useState<UserReviewWithProfile[]>([]);
  const [isLoadingClientReviews, setIsLoadingClientReviews] = useState(true);

  useEffect(() => {
    const isProfessional = viewedProfile.userType === 'pro' || (viewedProfile as any).userType === 'professional';

    if (isProfessional) {
      loadUserPosts();
      loadUserReviews();
    } else {
      loadClientReviews();
    }
  }, [viewedProfile.id, viewedProfile.userType]);

  const loadUserPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const userId = viewedProfile.user_id || viewedProfile.id;
      const { posts: userPosts, error } = await getPosts(undefined, userId);

      if (error) {
        console.error('Erreur lors du chargement des publications:', error);
      } else {
        setPosts(userPosts);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadUserReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const userId = viewedProfile.user_id || viewedProfile.id;
      const { reviews: userReviews, error } = await getProfileReviews(userId);

      if (error) {
        console.error('Erreur lors du chargement des avis:', error);
      } else {
        setReviews(userReviews);
        if (userReviews.length > 0) {
          const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
          setAverageRating(avgRating);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const loadClientReviews = async () => {
    setIsLoadingClientReviews(true);
    try {
      const userId = viewedProfile.user_id || viewedProfile.id;
      const { reviews: userReviews, error } = await getUserReviews(userId);

      if (error) {
        console.error('Erreur lors du chargement des avis du client:', error);
      } else {
        setClientReviews(userReviews || []);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setIsLoadingClientReviews(false);
    }
  };

  const getOptimizedImageUrl = (url: string) => {
    if (url && url.includes('unsplash.com')) {
      const hasParams = url.includes('?');
      return `${url}${hasParams ? '&' : '?'}w=400&q=80&fm=webp`;
    }
    return url;
  };

  const dbPostToProfile = (post: PostType): Profile => {
    const baseProfile = userProfileToProfile(viewedProfile);

    return {
      ...baseProfile,
      id: parseInt(post.id),
      interests: post.tags || [],
      description: post.caption,
      photos: post.photos || [],
      thumbnails: post.thumbnails || [],
      location: post.location || viewedProfile.location,
      userId: viewedProfile.user_id || viewedProfile.id
    };
  };

  const handleContact = () => {
    if (isAuthenticated && currentUserProfile) {
      setShowChatModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-4 sm:mb-6 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>

        <div className="bg-dark-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4">
            <img
              src={getOptimizedImageUrl(viewedProfile.photos[0])}
              alt={viewedProfile.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-dark-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-200 truncate">
                  {viewedProfile.username || viewedProfile.name}
                </h1>
                <SubscriptionBadge tier={viewedProfile.premium ? 'premium' : 'free'} />
              </div>
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <MapPin className="h-4 w-4" />
                <span>{viewedProfile.location}</span>
              </div>
              {averageRating > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(averageRating)}
                  <span className="text-sm text-gray-400">
                    ({reviews.length} avis)
                  </span>
                </div>
              )}
              {viewedProfile.phone && isAuthenticated && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>{viewedProfile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {viewedProfile.description && (
            <p className="text-gray-300 mb-4">{viewedProfile.description}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-1 bg-dark-100 text-gray-200 py-2.5 rounded-lg font-medium hover:bg-dark-200 transition-colors"
            >
              Voir les informations
            </button>
            {isAuthenticated && currentUserProfile && (
              <button
                onClick={() => setShowChatModal(true)}
                className="flex-1 bg-rose text-white py-2.5 rounded-lg font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Contacter
              </button>
            )}
          </div>
        </div>

        <div>
          {(viewedProfile.userType === 'pro' || (viewedProfile as any).userType === 'professional') ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Publications
                </h2>
                <span className="text-sm text-gray-400">
                  {posts.length} {posts.length > 1 ? 'publications' : 'publication'}
                </span>
              </div>

              {isLoadingPosts ? (
                <div className="flex justify-center items-center py-20">
                  <Loader className="h-8 w-8 text-rose animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-dark-50 rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Aucune publication pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      profile={dbPostToProfile(post)}
                      onContact={handleContact}
                      isAuthenticated={isAuthenticated}
                      postId={post.id}
                      onPostDeleted={loadUserPosts}
                      authorPhoto={viewedProfile.photos[0]}
                      userProfile={currentUserProfile}
                      isBoosted={post.is_boosted || false}
                      hideProfileActions={true}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Avis laissés
                </h2>
                <span className="text-sm text-gray-400">
                  {clientReviews.length} {clientReviews.length > 1 ? 'avis' : 'avis'}
                </span>
              </div>

              {isLoadingClientReviews ? (
                <div className="flex justify-center items-center py-20">
                  <Loader className="h-8 w-8 text-rose animate-spin" />
                </div>
              ) : clientReviews.length === 0 ? (
                <div className="bg-dark-50 rounded-lg p-8 text-center">
                  <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Aucun avis laissé pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientReviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-dark-50 rounded-lg p-4 sm:p-6 border border-dark-200 hover:border-rose-500/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={review.professionalPhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                            alt={review.professionalName}
                            className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full object-cover ring-2 ring-rose-500/20"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-gray-100 truncate text-lg">{review.professionalName}</h4>
                              {review.professionalUserType === 'professional' && (
                                <span className="bg-rose-500/20 text-rose-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-rose-500/30 flex-shrink-0">
                                  Pro
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {renderStars(review.rating)}
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(review.createdAt))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal
          profile={userProfileToProfile(viewedProfile)}
          onClose={() => setShowProfileModal(false)}
          onContact={() => {
            setShowProfileModal(false);
            if (isAuthenticated && currentUserProfile) {
              setShowChatModal(true);
            }
          }}
          isAuthenticated={isAuthenticated}
        />
      )}

      {showChatModal && isAuthenticated && currentUserProfile && (
        <ChatModal
          otherUserProfile={viewedProfile}
          currentUserProfile={currentUserProfile}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </div>
  );
};

export default PublicProfile;
