import React, { useState, useEffect } from 'react';
import { Profile, UserProfile } from '../types';
import ProfileModal from '../components/modals/ProfileModal';
import ReviewsModal from '../components/modals/ReviewsModal';
import ChatModal from '../components/modals/ChatModal';
import LoginPromptModal from '../components/modals/LoginPromptModal';
import PostCard from '../components/PostCard';
import { getPosts, Post as PostType } from '../lib/posts';
import { Loader } from 'lucide-react';
import { getProfileById, userProfileToProfile } from '../lib/profile';

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
  const [error, setError] = useState<string | null>(null);
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, Profile>>({});

  // Charger les publications depuis la base de données
  const loadPosts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { posts, error } = await getPosts(selectedLocation || undefined);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setDbPosts(posts);
      
      // Charger les profils des auteurs
      const authorIds = posts.map(post => post.user_id).filter(Boolean);
      const uniqueAuthorIds = [...new Set(authorIds)];

      const authorProfilesMap: Record<string, Profile> = {};
      for (const authorId of uniqueAuthorIds) {
        if (authorId) {
          try {
            const { profile, error } = await getProfileById(authorId);
            if (!error && profile) {
              authorProfilesMap[authorId] = userProfileToProfile(profile);
            }
          } catch (err) {
            console.error(`Erreur lors du chargement du profil ${authorId}:`, err);
          }
        }
      }

      setAuthorProfiles(authorProfilesMap);
    } catch (err) {
      console.error('Erreur lors du chargement des publications:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des publications');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les publications au montage et lorsque la localisation change
  useEffect(() => {
    loadPosts();
  }, [selectedLocation]);

  // Écouter les événements de création, modification et suppression de post
  useEffect(() => {
    const handlePostCreated = () => {
      console.log('Post créé, rechargement des publications...');
      loadPosts();
    };

    const handlePostDeleted = () => {
      console.log('Post supprimé, rechargement des publications...');
      loadPosts();
    };

    const handlePostUpdated = () => {
      console.log('Post modifié, rechargement des publications...');
      loadPosts();
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
    console.log('[handleContact] Appel avec profile:', {
      id: profile.id,
      name: profile.name,
      userId: profile.userId
    });

    // Afficher le modal de connexion si l'utilisateur n'est pas connecté
    if (!isAuthenticated || !userProfile) {
      console.log('[handleContact] Utilisateur non authentifié');
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
      console.log('[handleContact] Récupération du profil pour userId:', profile.userId);
      const { profile: otherUserProfile, error } = await getProfileById(profile.userId);

      if (error || !otherUserProfile) {
        console.error('[handleContact] Erreur lors de la récupération du profil:', error);
        alert(`Impossible de charger le profil de cet utilisateur: ${error?.message || 'Erreur inconnue'}`);
        return;
      }

      console.log('[handleContact] Profil récupéré, ouverture du chat avec:', otherUserProfile.username);
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
    const authorProfile = post.user_id && authorProfiles[post.user_id]
      ? authorProfiles[post.user_id]
      : null;

    return {
      id: parseInt(post.id),
      name: authorProfile?.name || post.user?.name || 'Utilisateur',
      location: post.location,
      premium: authorProfile?.premium || false,
      online: authorProfile?.online || true,
      interests: post.tags || [],
      description: post.caption,
      rating: authorProfile?.rating || post.user?.rating || 0,
      imageUrl: authorProfile?.imageUrl || authorProfile?.photos?.[0] || post.user?.photos?.[0] || '',
      photos: post.photos || [],
      thumbnails: post.thumbnails || [],
      physicalInfo: authorProfile?.physicalInfo || post.user?.physicalInfo || {
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
      personalInfo: authorProfile?.personalInfo || post.user?.personalInfo || {
        alcool: "",
        fumeur: "",
        langues: [],
        orientation: "",
        origine: ""
      },
      prestations: authorProfile?.prestations || post.user?.prestations || "",
      reviews: authorProfile?.reviews || [],
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      isLiked: post.is_liked,
      userId: post.user_id,
      subscription_tier: authorProfile?.subscription_tier || post.user?.subscription_tier
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
                  if (post.user_id && authorProfiles[post.user_id]) {
                    handleContact(authorProfiles[post.user_id]);
                  } else {
                    const tempProfile = dbPostToProfile(post);
                    handleContact(tempProfile);
                  }
                }}
                isAuthenticated={isAuthenticated}
                postId={post.id}
                onPostDeleted={handlePostDeleted}
                authorPhoto={post.user?.photos[0] || (post.user_id && authorProfiles[post.user_id]
                  ? authorProfiles[post.user_id].photos[0]
                  : '')}
                userProfile={userProfile}
                isBoosted={post.is_boosted || false}
              />
            ))}
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