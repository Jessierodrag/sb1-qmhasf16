import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Star, MessageCircle, ExternalLink, TrendingUp, Award, CheckCircle, Clock } from 'lucide-react';
import { getUserStats, getUserReceivedReviews, getUserReviews, UserStats, UserReviewWithProfile } from '../../lib/userStats';
import { renderStars } from '../../utils/stars';
import { formatDistanceToNow } from '../../utils/date';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
  onContactUser?: (userId: string) => void;
  onViewProfessional?: (professionalId: string) => void;
  currentUserType?: 'client' | 'professional';
  onLeaveReview?: (userId: string, userName: string) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  onClose,
  onContactUser,
  onViewProfessional,
  currentUserType,
  onLeaveReview
}) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userReceivedReviews, setUserReceivedReviews] = useState<UserReviewWithProfile[]>([]);
  const [userGivenReviews, setUserGivenReviews] = useState<UserReviewWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [statsResult, receivedReviewsResult, givenReviewsResult] = await Promise.all([
        getUserStats(userId),
        getUserReceivedReviews(userId),
        getUserReviews(userId)
      ]);

      if (statsResult.stats) {
        setUserStats(statsResult.stats);
      }

      if (receivedReviewsResult.reviews) {
        setUserReceivedReviews(receivedReviewsResult.reviews);
      }

      if (givenReviewsResult.reviews) {
        setUserGivenReviews(givenReviewsResult.reviews);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const canSendMessage = currentUserType === 'professional';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-dark-100 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up">
        <div className="sticky top-0 bg-dark-100 border-b border-dark-200 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Profil utilisateur</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
          ) : userStats ? (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="glass rounded-2xl p-4 sm:p-6 border border-dark-200">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <img
                    src={userStats.photos[0] || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                    alt={userStats.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-rose-500/30"
                  />
                  <div className="flex-1 w-full">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-100 mb-2">{userStats.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {userStats.userType === 'professional' ? (
                            <span className="bg-gradient-to-r from-rose-500/20 to-rose-600/20 text-rose-400 text-xs font-semibold px-3 py-1 rounded-full border border-rose-500/30">
                              Professionnel
                            </span>
                          ) : (
                            <span className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">
                              Client
                            </span>
                          )}
                          {userStats.isActive && (
                            <span className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
                              <CheckCircle className="h-3 w-3" />
                              Actif
                            </span>
                          )}
                        </div>
                        {userStats.username && (
                          <p className="text-gray-400 text-sm mb-2">@{userStats.username}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>Membre depuis le {formatDate(userStats.accountCreatedAt)}</span>
                        </div>
                      </div>
                      {canSendMessage && userStats.userType !== 'professional' && onLeaveReview && (
                        <button
                          onClick={() => onLeaveReview(userId, userStats.name)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-glow-rose"
                        >
                          <Star className="h-5 w-5" />
                          <span className="hidden sm:inline">Donner un avis</span>
                          <span className="sm:hidden">Avis</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-4 border border-dark-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-yellow-500/10 p-2 rounded-lg">
                      <Star className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-400">Note moyenne reçus</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-100">
                      {userStats.averageRatingReceived > 0 ? userStats.averageRatingReceived.toFixed(1) : '-'}
                    </p>
                    {userStats.averageRatingReceived > 0 && (
                      <div className="flex items-center">
                        {renderStars(userStats.averageRatingReceived)}
                      </div>
                    )}
                  </div>
                  {userStats.totalReviewsReceived > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {userStats.totalReviewsReceived} avis
                    </p>
                  )}
                </div>

                <div className="glass rounded-xl p-4 border border-dark-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <Award className="h-5 w-5 text-blue-500" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-400">Note moyenne laissés</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-100">
                      {userStats.averageRatingGiven > 0 ? userStats.averageRatingGiven.toFixed(1) : '-'}
                    </p>
                    {userStats.averageRatingGiven > 0 && (
                      <div className="flex items-center">
                        {renderStars(userStats.averageRatingGiven)}
                      </div>
                    )}
                  </div>
                  {userStats.totalReviewsGiven > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {userStats.totalReviewsGiven} avis
                    </p>
                  )}
                </div>

                <div className="glass rounded-xl p-4 border border-dark-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-rose-500/10 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-rose-500" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-400">Activité</h4>
                  </div>
                  <p className="text-sm text-gray-300">
                    {userStats.totalReviewsReceived > 0
                      ? `${userStats.totalReviewsReceived} contribution${userStats.totalReviewsReceived > 1 ? 's' : ''}`
                      : 'Aucune activité'}
                  </p>
                </div>
              </div>

              <div className="glass rounded-2xl border border-dark-200 overflow-hidden">
                <div className="flex border-b border-dark-200">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold transition-colors ${
                      activeTab === 'info'
                        ? 'text-rose-500 border-b-2 border-rose-500 bg-rose-500/5'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <span className="hidden sm:inline">Avis reçus ({userReceivedReviews.length})</span>
                    <span className="sm:hidden">Reçus ({userReceivedReviews.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold transition-colors ${
                      activeTab === 'reviews'
                        ? 'text-rose-500 border-b-2 border-rose-500 bg-rose-500/5'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <span className="hidden sm:inline">Avis laissés ({userGivenReviews.length})</span>
                    <span className="sm:hidden">Laissés ({userGivenReviews.length})</span>
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  {activeTab === 'info' ? (
                    <div className="space-y-4">
                      {userReceivedReviews.length > 0 ? (
                        userReceivedReviews.map((review) => (
                          <div
                            key={review.id}
                            className="glass-light p-3 sm:p-4 rounded-xl border border-dark-200 hover:border-rose-500/30 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <img
                                  src={review.professionalPhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                                  alt={review.professionalName}
                                  className="w-12 h-12 sm:w-12 sm:h-12 flex-shrink-0 rounded-full object-cover ring-2 ring-rose-500/20"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold text-gray-100 truncate">{review.professionalName}</h4>
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
                              {onViewProfessional && review.professionalUserType === 'professional' && (
                                <button
                                  onClick={() => onViewProfessional(review.professionalId)}
                                  className="flex items-center justify-center sm:justify-start gap-1 text-sm text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg sm:rounded-none w-full sm:w-auto"
                                >
                                  <span>Voir le profil</span>
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Star className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                          <p className="text-gray-400">Aucun avis reçu pour le moment</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userGivenReviews.length > 0 ? (
                        userGivenReviews.map((review) => (
                          <div
                            key={review.id}
                            className="glass-light p-3 sm:p-4 rounded-xl border border-dark-200 hover:border-rose-500/30 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <img
                                  src={review.professionalPhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                                  alt={review.professionalName}
                                  className="w-12 h-12 sm:w-12 sm:h-12 flex-shrink-0 rounded-full object-cover ring-2 ring-rose-500/20"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold text-gray-100 truncate">{review.professionalName}</h4>
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
                              {onViewProfessional && review.professionalUserType === 'professional' && (
                                <button
                                  onClick={() => onViewProfessional(review.professionalId)}
                                  className="flex items-center justify-center sm:justify-start gap-1 text-sm text-rose-500 hover:text-rose-400 transition-colors bg-rose-500/10 sm:bg-transparent px-3 py-2 sm:p-0 rounded-lg sm:rounded-none w-full sm:w-auto"
                                >
                                  <span>Voir le profil</span>
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Star className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                          <p className="text-gray-400">Aucun avis laissé pour le moment</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Profil introuvable</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
