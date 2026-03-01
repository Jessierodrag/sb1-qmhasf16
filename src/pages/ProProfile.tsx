import React, { useState, useEffect } from 'react';
import { Settings, Info, X, Camera, Save, Calendar, ChevronDown, BarChart2, Users, Star, PlusSquare, MessageCircle, Heart, TrendingUp, Clock, Upload, Trash2, AlertCircle, UserPlus, FileEdit, CheckCircle2, MoreVertical, Edit, Eye, EyeOff, GripVertical, Power, Sparkles, Crown, BadgeCheck } from 'lucide-react';
import { UserProfile } from '../types';
import NewPostModal from '../components/modals/NewPostModal';
import EditPostModal from '../components/modals/EditPostModal';
import ReorderPhotosModal from '../components/modals/ReorderPhotosModal';
import EditProfileForm from '../components/EditProfileForm';
import { updateProfile, toggleProfileActive } from '../lib/profile';
import { getPosts, deletePost, updatePost, togglePostActive, mergeUserPosts, reorderPostPhotos } from '../lib/posts';
import { getProfileReviews } from '../lib/reviews';
import { Review } from '../types';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { getUserActiveSubscription, getSubscriptionPlan, type Subscription } from '../lib/subscriptions';
import { getUserReviews } from '../lib/userStats';

interface ProProfileProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setCurrentView: (view: 'home' | 'profile' | 'messages' | 'wallet') => void;
}

const ProProfile: React.FC<ProProfileProps> = ({
  userProfile,
  setUserProfile,
  setCurrentView
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'edit'>('dashboard');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showReorderPhotosModal, setShowReorderPhotosModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showProfileCompletionTips, setShowProfileCompletionTips] = useState(true);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [showManagePhotosMenu, setShowManagePhotosMenu] = useState(false);

  // États pour vérifier les conditions
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasCreatedPost, setHasCreatedPost] = useState(false);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [averageGivenRating, setAverageGivenRating] = useState(0);
  const [isMergingPosts, setIsMergingPosts] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Charger les statistiques réelles du tableau de bord
  const { stats } = useDashboardStats(userProfile?.user_id || userProfile?.id);

  // Vérifier si l'utilisateur a complété son profil et créé une publication
  useEffect(() => {
    checkProfileCompletion();
    checkUserPosts();
    checkReceivedReviews();
    checkGivenReviews();
    loadSubscription();
  }, [userProfile]);

  // Écouter les événements de création de post
  useEffect(() => {
    const handlePostCreated = () => {
      checkUserPosts();
    };

    window.addEventListener('postCreated', handlePostCreated);

    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
    };
  }, [userProfile.id]);

  // Fermer le menu "Gérer mes photos" quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showManagePhotosMenu && !target.closest('.relative')) {
        setShowManagePhotosMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManagePhotosMenu]);

  // Vérifier si le profil est suffisamment complété
  const checkProfileCompletion = () => {
    const profileCompletionPercentage = calculateProfileCompletion();
    setHasCompletedProfile(profileCompletionPercentage >= 50);
  };

  // Vérifier si l'utilisateur a créé des publications
  const checkUserPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const { posts, error } = await getPosts();
      if (!error && posts.length > 0) {
        const userId = userProfile.user_id || userProfile.id;
        const filteredUserPosts = posts.filter(post => post.user_id === userId);
        setUserPosts(filteredUserPosts);
        setHasCreatedPost(filteredUserPosts.length > 0);
      } else {
        setUserPosts([]);
        setHasCreatedPost(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des publications:', error);
      setUserPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };


  // Récupérer les avis reçus
  const checkReceivedReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const userId = userProfile.user_id || userProfile.id;
      const { reviews, error } = await getProfileReviews(userId);
      if (!error && reviews) {
        setReceivedReviews(reviews);
        // Calculer la note moyenne
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(totalRating / reviews.length);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des avis:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Récupérer les avis donnés
  const checkGivenReviews = async () => {
    try {
      const userId = userProfile.user_id || userProfile.id;
      const { reviews, error } = await getUserReviews(userId);
      if (!error && reviews) {
        setGivenReviews(reviews);
        // Calculer la note moyenne des avis donnés
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageGivenRating(totalRating / reviews.length);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des avis donnés:', error);
    }
  };

  // Charger l'abonnement actif
  const loadSubscription = async () => {
    setIsLoadingSubscription(true);
    try {
      const userId = userProfile.user_id || userProfile.id;
      if (userId) {
        const { subscription } = await getUserActiveSubscription(userId);
        setActiveSubscription(subscription);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'abonnement:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Calculer le pourcentage de complétion du profil
  const calculateProfileCompletion = () => {
    let totalFields = 0;
    let completedFields = 0;

    // Vérifier les champs de base
    const baseFields = ['firstName', 'lastName', 'username', 'location', 'description', 'phone'];
    totalFields += baseFields.length;
    baseFields.forEach(field => {
      const value = userProfile[field as keyof UserProfile];
      if (value && String(value).trim().length > 0) completedFields++;
    });

    // Vérifier les informations physiques
    if (userProfile.physicalInfo) {
      const physicalFields = Object.keys(userProfile.physicalInfo);
      totalFields += physicalFields.length;
      physicalFields.forEach(field => {
        const value = userProfile.physicalInfo[field as keyof typeof userProfile.physicalInfo];
        if (value && String(value).trim().length > 0) completedFields++;
      });
    }

    // Vérifier les informations personnelles
    if (userProfile.personalInfo) {
      const personalFields = Object.keys(userProfile.personalInfo).filter(f => f !== 'langues');
      totalFields += personalFields.length;
      personalFields.forEach(field => {
        const value = userProfile.personalInfo[field as keyof typeof userProfile.personalInfo];
        if (value && String(value).trim().length > 0) completedFields++;
      });

      // Vérifier les langues
      totalFields += 1;
      if (userProfile.personalInfo.langues && userProfile.personalInfo.langues.length > 0) completedFields++;
    }

    // Vérifier les prestations
    totalFields += 1;
    if (userProfile.prestations && userProfile.prestations.trim().length > 0) completedFields++;

    // Vérifier la photo de profil
    totalFields += 1;
    if (userProfile.photos && userProfile.photos.length > 0 && !userProfile.photos[0].includes('unsplash')) completedFields++;

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  };

  const profileCompletionPercentage = calculateProfileCompletion();

  // Déterminer si nous devons afficher les conseils
  const shouldShowTips = showProfileCompletionTips && (!hasCompletedProfile || !hasCreatedPost);

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setShowEditPostModal(true);
    setOpenMenuPostId(null);
  };

  const handleUpdatePost = async (data: { caption: string; location: string; tags: string[]; newPhotos?: File[] }) => {
    if (!selectedPost) {
      console.error('Aucun post sélectionné');
      return;
    }

    const postId = selectedPost.id;
    const { success, error } = await updatePost(postId, data);

    if (success) {
      await checkUserPosts();

      const { posts } = await getPosts();
      const updatedPost = posts.find(p => p.id === postId);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }

      if (data.newPhotos && data.newPhotos.length > 0) {
        alert(`Publication modifiée avec succès. ${data.newPhotos.length} nouvelle${data.newPhotos.length > 1 ? 's' : ''} photo${data.newPhotos.length > 1 ? 's' : ''} ajoutée${data.newPhotos.length > 1 ? 's' : ''} en première position.`);
      } else {
        alert('Publication modifiée avec succès');
      }
    } else {
      alert(error?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) return;

    const { success, error } = await deletePost(postId);

    if (success) {
      checkUserPosts();
      alert('Publication supprimée avec succès');
    } else {
      alert(error?.message || 'Erreur lors de la suppression');
    }
    setOpenMenuPostId(null);
  };

  const handleToggleActive = async (post: any) => {
    const newStatus = !post.is_active;

    const { success, error } = await togglePostActive(post.id, newStatus);

    if (success) {
      await checkUserPosts();
      alert(newStatus ? 'Publication activée' : 'Publication désactivée');
    } else {
      alert(error?.message || 'Erreur lors de la modification');
    }
    setOpenMenuPostId(null);
  };

  const handleOpenReorderModal = async (postId: string) => {
    await checkUserPosts();
    const { posts } = await getPosts();
    const freshPost = posts.find(p => p.id === postId);
    if (freshPost) {
      setSelectedPost(freshPost);
      setShowReorderPhotosModal(true);
      setOpenMenuPostId(null);
    }
  };

  const handleToggleProfileActive = async () => {
    const isCurrentlyActive = userProfile.is_active !== false;
    const action = isCurrentlyActive ? 'désactiver' : 'activer';

    if (!confirm(`Êtes-vous sûr de vouloir ${action} votre profil ?${isCurrentlyActive ? '\n\nVotre profil et vos publications seront masqués du site.' : ''}`)) {
      return;
    }

    const { success, error } = await toggleProfileActive(!isCurrentlyActive);

    if (success) {
      setUserProfile({
        ...userProfile,
        is_active: !isCurrentlyActive
      });
      alert(`Profil ${isCurrentlyActive ? 'désactivé' : 'activé'} avec succès`);
    } else {
      alert(error?.message || 'Erreur lors de la modification');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-200 mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">Bienvenue, {userProfile.username || userProfile.name}</p>
          {userProfile.is_active === false && (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-500">Votre profil est actuellement désactivé</span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleToggleProfileActive}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              userProfile.is_active === false
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            <Power className="h-5 w-5" />
            <span className="hidden sm:inline">{userProfile.is_active === false ? 'Activer mon profil' : 'Désactiver mon profil'}</span>
            <span className="sm:hidden">{userProfile.is_active === false ? 'Activer' : 'Désactiver'}</span>
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'dashboard' ? 'edit' : 'dashboard')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'edit'
                ? 'bg-rose text-white'
                : 'bg-dark-100 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="hidden sm:inline">{activeTab === 'edit' ? 'Retour au dashboard' : 'Modifier mon profil'}</span>
            <span className="sm:hidden">{activeTab === 'edit' ? 'Retour' : 'Modifier profil'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <EditProfileForm
          userProfile={userProfile}
          onSave={(updatedProfile) => {
            updateProfile(updatedProfile).then(({ success }) => {
              if (success) {
                setUserProfile(updatedProfile);
                setActiveTab('dashboard');
                checkProfileCompletion();
              }
            });
          }}
          onCancel={() => setActiveTab('dashboard')}
        />
      ) : (
        <div className="space-y-6">
          {/* Bannière de bienvenue pour les nouveaux utilisateurs */}
          {shouldShowTips && (
            <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
              <div className="flex items-start gap-4">
                <div className="bg-rose/10 p-3 rounded-lg shrink-0">
                  <Info className="h-6 w-6 text-rose" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">Bienvenue sur Fire Roses !</h3>
                  <p className="text-gray-300 mb-4">
                    Votre compte professionnel a été créé avec succès. Pour commencer à recevoir des demandes et maximiser votre visibilité, nous vous recommandons de compléter votre profil.
                  </p>
                  <div className="w-full bg-dark-100 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-rose h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Profil complété à {profileCompletionPercentage}%</span>
                    <button 
                      onClick={() => setActiveTab('edit')}
                      className="text-rose hover:underline"
                    >
                      Compléter mon profil
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileCompletionTips(false)}
                  className="text-gray-500 hover:text-gray-400 p-2 hover:bg-dark-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Carte d'abonnement */}
          {!isLoadingSubscription && activeSubscription && (
            <div className="bg-gradient-to-br from-rose/10 via-dark-50 to-dark-50 rounded-xl p-4 sm:p-6 border border-rose/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`bg-gradient-to-br ${getSubscriptionPlan(activeSubscription.tier)?.color || 'from-gray-500 to-gray-600'} p-3 rounded-lg`}>
                    {activeSubscription.tier === 'basic' && <Sparkles className="h-6 w-6 text-white" />}
                    {activeSubscription.tier === 'premium' && <Crown className="h-6 w-6 text-white" />}
                    {activeSubscription.tier === 'vip' && <BadgeCheck className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-200">{getSubscriptionPlan(activeSubscription.tier)?.name || 'Abonnement'}</h3>
                    <p className="text-sm text-gray-400">Actif jusqu'au {new Date(activeSubscription.end_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('subscription')}
                  className="px-4 py-2 bg-dark-100 hover:bg-dark-200 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Gérer
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {getSubscriptionPlan(activeSubscription.tier)?.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <BarChart2 className="h-6 w-6 text-blue-500" />
                </div>
                <span className="text-sm text-gray-400">vs hier</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-2">Vues du profil</h3>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-200">{stats.profileViews}</span>
                <span className="text-sm text-gray-500">
                  {stats.profileViews === 0 ? 'Aucune vue' : stats.profileViews === 1 ? 'vue' : 'vues'}
                </span>
              </div>
            </div>

            <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-rose/10 p-3 rounded-lg">
                  <Heart className="h-6 w-6 text-rose" />
                </div>
                <span className="text-sm text-gray-400">vs hier</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-2">Likes reçus</h3>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-200">{stats.receivedLikes}</span>
                <span className="text-sm text-gray-500">
                  {stats.receivedLikes === 0 ? 'Aucun like' : stats.receivedLikes === 1 ? 'like' : 'likes'}
                </span>
              </div>
            </div>

            <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-500/10 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <h3 className="text-gray-400 text-sm mb-2">Note moyenne reçus</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-200">
                  {receivedReviews.length > 0 ? averageRating.toFixed(1) : '-'}
                </span>
                {receivedReviews.length > 0 && (
                  <Star className="h-5 w-5 text-rose fill-rose" />
                )}
              </div>
              {receivedReviews.length > 0 && (
                <span className="text-xs text-gray-500 mt-1">
                  {receivedReviews.length} avis
                </span>
              )}
            </div>

            <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <h3 className="text-gray-400 text-sm mb-2">Note moyenne laissés</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-200">
                  {givenReviews.length > 0 ? averageGivenRating.toFixed(1) : '-'}
                </span>
                {givenReviews.length > 0 && (
                  <Star className="h-5 w-5 text-rose fill-rose" />
                )}
              </div>
              {givenReviews.length > 0 && (
                <span className="text-xs text-gray-500 mt-1">
                  {givenReviews.length} avis
                </span>
              )}
            </div>
          </div>

          {/* Conseils pour compléter le profil */}
          {shouldShowTips && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {!hasCompletedProfile && (
                <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <UserPlus className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-200">Complétez votre profil</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Ajoutez une photo de profil attrayante et renseignez toutes vos informations pour augmenter votre visibilité.
                  </p>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="w-full flex items-center justify-center gap-2 bg-dark-100 text-gray-200 py-2.5 rounded-lg font-medium hover:bg-dark-200 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    Ajouter une photo
                  </button>
                </div>
              )}

              {!hasCreatedPost && (
                <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-500/10 p-3 rounded-lg">
                      <FileEdit className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-200">Créez votre première publication</h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Partagez vos services et attirez l'attention des clients potentiels avec une publication attrayante.
                  </p>
                  <button
                    onClick={() => setShowNewPostModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-dark-100 text-gray-200 py-2.5 rounded-lg font-medium hover:bg-dark-200 transition-colors"
                  >
                    <PlusSquare className="h-5 w-5" />
                    Créer une publication
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Derniers avis et publications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-200">Derniers avis</h3>
                {receivedReviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Note moyenne:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-rose fill-rose" />
                      <span className="font-medium text-gray-200">{averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
              {isLoadingReviews ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose"></div>
                </div>
              ) : receivedReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <div className="bg-dark-100 p-3 rounded-full mb-4">
                    <Star className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">Vous n'avez pas encore reçu d'avis</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Les avis de vos clients s'afficheront ici
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Complétez votre profil pour attirer plus de clients</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {receivedReviews.map((review) => (
                    <div key={review.id} className="flex gap-3 p-4 bg-dark-100 rounded-lg border border-dark-200">
                      <img
                        src={review.userPhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'}
                        alt={review.userName || 'Utilisateur'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-200">
                            {review.userName || 'Utilisateur'}
                          </h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'fill-rose text-rose' : 'text-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-1">{review.comment}</p>
                        <span className="text-xs text-gray-500">
                          {review.date.toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-dark-50 rounded-xl p-4 sm:p-6 border border-dark-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-200">Mes publications</h3>
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-rose text-white rounded-lg font-medium hover:bg-rose-600 transition-colors text-sm sm:text-base"
                >
                  <PlusSquare className="h-5 w-5" />
                  <span className="sm:inline">Nouvelle publication</span>
                </button>
              </div>

              {isLoadingPosts ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose"></div>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <div className="bg-dark-100 p-3 rounded-full mb-4">
                    <PlusSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">Vous n'avez pas encore de publications</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Créez votre première publication pour attirer l'attention
                  </p>
                  <button
                    onClick={() => setShowNewPostModal(true)}
                    className="px-4 py-2 bg-dark-100 text-gray-200 rounded-lg hover:bg-dark-200 transition-colors text-sm"
                  >
                    Créer ma première publication
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <div key={post.id} className="bg-dark-100 rounded-lg p-4 border border-dark-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-gray-200 font-medium mb-1">{post.caption || 'Sans description'}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{post.location}</span>
                            <span>•</span>
                            <span>{post.photos?.length || 0} photo{post.photos?.length > 1 ? 's' : ''}</span>
                            {post.is_active === false && (
                              <>
                                <span>•</span>
                                <span className="text-orange-500">Désactivée</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </button>
                          {openMenuPostId === post.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-dark-50 rounded-lg border border-dark-200 shadow-lg z-20">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-100 transition-colors text-left text-sm text-gray-200 rounded-t-lg"
                              >
                                <Edit className="h-4 w-4" />
                                Modifier
                              </button>
                              {post.photos && post.photos.length > 1 && (
                                <button
                                  onClick={() => handleOpenReorderModal(post.id)}
                                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-100 transition-colors text-left text-sm text-gray-200"
                                >
                                  <GripVertical className="h-4 w-4" />
                                  Réorganiser les photos
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleActive(post)}
                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-100 transition-colors text-left text-sm text-gray-200"
                              >
                                {post.is_active === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                {post.is_active === false ? 'Activer' : 'Désactiver'}
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-100 transition-colors text-left text-sm text-rose rounded-b-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {post.photos && post.photos.map((photo: string, index: number) => {
                          const isVideo = photo.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/);
                          const thumbnails = post.thumbnails || [];

                          let displayUrl: string | null = null;

                          if (thumbnails[index]) {
                            displayUrl = thumbnails[index];
                          } else if (!isVideo) {
                            displayUrl = photo;
                          }

                          return (
                            <div
                              key={`${post.id}-photo-${index}`}
                              className="aspect-square rounded-lg overflow-hidden relative group bg-dark-200"
                            >
                              {displayUrl ? (
                                <img
                                  src={displayUrl}
                                  alt={`Média ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : null}
                              {!displayUrl && (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                  <div className="text-center">
                                    <svg className="h-8 w-8 text-gray-500 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                                    </svg>
                                  </div>
                                </div>
                              )}
                              {isVideo && displayUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors pointer-events-none">
                                  <div className="bg-white/90 rounded-full p-2">
                                    <svg className="h-4 w-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de nouvelle publication */}
      {showNewPostModal && (
        <NewPostModal
          onClose={() => setShowNewPostModal(false)}
          onPost={(post) => {
            setShowNewPostModal(false);
            setHasCreatedPost(true);
          }}
        />
      )}

      {/* Modal de modification de publication */}
      {(() => {
        return showEditPostModal && selectedPost ? (
          <EditPostModal
            onClose={() => {
              setShowEditPostModal(false);
              setSelectedPost(null);
            }}
            onUpdate={handleUpdatePost}
            post={selectedPost}
          />
        ) : null;
      })()}

      {/* Modal de réorganisation des photos */}
      {showReorderPhotosModal && selectedPost && (
        <ReorderPhotosModal
          photos={selectedPost.photos}
          onClose={() => {
            setShowReorderPhotosModal(false);
            setSelectedPost(null);
          }}
          onSave={async (reorderedPhotos) => {
            const { success, error } = await reorderPostPhotos(selectedPost.id, reorderedPhotos);
            if (success) {
              await checkUserPosts();
              setShowReorderPhotosModal(false);
              setSelectedPost(null);
            } else {
              alert(error?.message || 'Erreur lors de la réorganisation des photos');
            }
          }}
        />
      )}
    </div>
  );
};

export default ProProfile;