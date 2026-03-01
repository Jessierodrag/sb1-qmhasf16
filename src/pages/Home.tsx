import React, { useState, useEffect } from 'react';
import { Profile, UserProfile } from '../types';
import ProfileModal from '../components/modals/ProfileModal';
import ReviewsModal from '../components/modals/ReviewsModal';
import ChatModal from '../components/modals/ChatModal';
import LoginPromptModal from '../components/modals/LoginPromptModal';
import PostCard from '../components/PostCard';
import { getPosts, Post as PostType } from '../lib/posts';
import { Loader } from 'lucide-react';

interface HomeProps {
  setShowMessage: (show: boolean) => void;
  setShowComments: (show: boolean) => void;
  setSelectedProfile: React.Dispatch<React.SetStateAction<Profile>>;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  selectedLocation: string | null;
  onNavigateToLogin: () => void;
}

const Home: React.FC<HomeProps> = ({
  isAuthenticated,
  userProfile,
  selectedLocation,
  onNavigateToLogin
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<Profile | null>(null);
  const [selectedProfileForChat, setSelectedProfileForChat] = useState<UserProfile | null>(null);
  const [dbPosts, setDbPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Charger les publications depuis la base de données
  const loadPosts = async (page: number = 0, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const { posts, error } = await getPosts(
        selectedLocation || undefined,
        undefined,
        page,
        pageSize
      );
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Si on reçoit moins de posts que pageSize, il n'y a plus de pages
      setHasMore(posts.length === pageSize);
      
      if (append) {
        setDbPosts(prev => [...prev, ...posts]);
      } else {
        setDbPosts(posts);
      }
      // Les profils des auteurs sont déjà inclus dans le JOIN (post.user)
    } catch (err) {
      console.error('Erreur lors du chargement des publications:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des publications');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadPosts(nextPage, true);
  };

  // Charger les publications au montage et lorsque la localisation change
  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    loadPosts(0, false);
  }, [selectedLocation]);

  // Écouter les événements de création, modification et suppression de post
  useEffect(() => {
    const handlePostCreated = () => {
      console.log('Post créé, rechargement des publications...');
      setCurrentPage(0);
      setHasMore(true);
      loadPosts(0, false);
    };

    const handlePostDeleted = () => {
      console.log('Post supprimé, rechargement des publications...');
      setCurrentPage(0);
      setHasMore(true);
      loadPosts(0, false);
    };

    const handlePostUpdated = () => {
      console.log('Post modifié, rechargement des publications...');
      setCurrentPage(0);
      setHasMore(true);
      loadPosts(0, false);
    };

    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('postDeleted', handlePostDeleted);
    window.addEventListener('postUpdated', handlePostUpdated);

    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('postDeleted', handlePostDeleted);
      window.removeEventListener('postUpdated', handlePostUpdated);
    };
  }, [selectedLocation]);

  const handleContact = async (profile: Profile) => {
      id: profile.id,
      name: profile.name,
      userId: profile.userId
    });

    // Afficher le modal de connexion si l'utilisateur n'est pas connecté
    if (!isAuthenticated || !userProfile) {
      setShowLoginPrompt(true);
      return;
    }

    // Vérifier que le userId existe
    if (!profile.userId) {
      console.error('[handleContact] userId manquant dans le profil');
      alert('Impossible de contacter cet utilisateur (ID manquant)');
      return;
    }

    // Récupérer le UserProfile complet de l'autre utilisateur
    try {
      const { profile: otherUserProfile, error } = await getProfileById(profile.userId);

      if (error || !otherUserProfile) {
        console.error('[handleContact] Erreur lors de la récupération du profil:', error);
        alert(`Impossible de charger le profil de cet utilisateur: ${error?.message || 'Erreur inconnue'}`);
        return;
      }

      setSelectedProfileForChat(otherUserProfile);
      setShowChatModal(true);
    } catch (err) {
      console.error('[handleContact] Erreur:', err);
      alert('Une erreur est survenue');
    }
  };

  // Gérer la suppression d'une publication
  const handlePostDeleted = () => {
    // Les notifications sont maintenant gérées automatiquement par les triggers
    loadPosts();
  };

  // Convertir un post de la base de données en profil pour l'affichage
  const dbPostToProfile = (post: PostType): Profile => {
    // Utiliser directement post.user qui vient du JOIN (pas de N+1 query)
    const author = post.user;

    return {
      id: parseInt(post.id),
      name: author?.name || 'Utilisateur',
      location: post.location,
      premium: false,
      online: true,
      interests: post.tags || [],
      description: post.caption,
      rating: author?.rating || 0,
      imageUrl: author?.photos?.[0] || '',
      photos: post.photos || [],
      thumbnails: post.thumbnails || [],
      physicalInfo: author?.physicalInfo || {
        sexe: "",
        ethnique: "",
        nationalite: "",
        age: 0,
        yeux: "",
        taille: "",
        poids: "",
        cheveux: "",
        mensurations: "",
        poitrine: "",
        bonnet: "",
        tour_poitrine: "",
        epilation: ""
      },
      personalInfo: author?.personalInfo || {
        alcool: "",
        fumeur: "",
        langues: [],
        orientation: "",
        origine: ""
      },
      prestations: author?.prestations || "",
      reviews: [],
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      isLiked: post.is_liked,
      userId: post.user_id,
      subscription_tier: author?.subscription_tier
    };
  };

  return (
    <main className="max-w-xl mx-auto px-0 sm:px-4 pt-6 sm:py-8 pb-20 sm:pb-8">
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 text-rose animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-rose/10 text-rose p-4 rounded-lg mb-4 mx-3 sm:mx-0">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Afficher les publications de la base de données */}
        {dbPosts.length > 0 ? (
          <div className="space-y-4">
            {dbPosts.map((post) => (
              <PostCard
                key={`db-post-${post.id}`}
                profile={dbPostToProfile(post)}
                onContact={() => {
                  const tempProfile = dbPostToProfile(post);
                  handleContact(tempProfile);
                }}
                isAuthenticated={isAuthenticated}
                postId={post.id}
                onPostDeleted={handlePostDeleted}
                authorPhoto={post.user?.photos[0] || ''}
                userProfile={userProfile}
                isBoosted={post.is_boosted || false}
              />
            ))}
            
            {/* Bouton "Charger plus" */}
            {hasMore && !isLoading && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMorePosts}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium rounded-full hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-glow-rose disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    'Charger plus'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-dark-100 p-4 rounded-full mb-4">
              <Loader className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Aucune publication disponible</h3>
            <p className="text-gray-500 max-w-md">
              {selectedLocation
                ? `Aucune annonce trouvée pour ${selectedLocation}. Essayez une autre ville.`
                : "Aucune publication n'est disponible pour le moment. Soyez le premier à publier !"
              }
            </p>
          </div>
        )}
      </div>

      {showProfileModal && selectedProfileForModal && (
        <ProfileModal
          profile={selectedProfileForModal}
          onClose={() => setShowProfileModal(false)}
          onContact={() => handleContact(selectedProfileForModal)}
          isAuthenticated={isAuthenticated}
        />
      )}

      {showReviewsModal && selectedProfileForModal && (
        <ReviewsModal
          profile={selectedProfileForModal}
          onClose={() => setShowReviewsModal(false)}
        />
      )}

      {showChatModal && selectedProfileForChat && userProfile && (
        <ChatModal
          currentUserProfile={userProfile}
          otherUserProfile={selectedProfileForChat}
          onClose={() => {
            setShowChatModal(false);
            setSelectedProfileForChat(null);
          }}
        />
      )}

      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => {
            setShowLoginPrompt(false);
            onNavigateToLogin();
          }}
        />
      )}
    </main>
  );
};

export default Home;