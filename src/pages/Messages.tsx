import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Loader } from 'lucide-react';
import { UserProfile } from '../types';
import {
  getUserConversations,
  deleteConversation,
  type Conversation
} from '../lib/conversations';
import { blockUser, isUserBlocked } from '../lib/blocking';
import ChatModal from '../components/modals/ChatModal';
import ConversationItem from '../components/ConversationItem';
import UserProfileModal from '../components/modals/UserProfileModal';
import LeaveReviewModal from '../components/modals/LeaveReviewModal';
import { supabase } from '../lib/supabase';

interface MessagesProps {
  userProfile: UserProfile;
  onMessagesRead?: () => void;
  onViewProfile?: (profile: UserProfile) => void;
}

const Messages: React.FC<MessagesProps> = ({ userProfile, onMessagesRead, onViewProfile }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const [reviewUserId, setReviewUserId] = useState<string | null>(null);
  const [reviewUserName, setReviewUserName] = useState<string>('');

  useEffect(() => {
    loadConversations();

    // S'abonner aux changements des messages et conversations en temps réel

    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          loadConversations();
        }
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      conversationsChannel.unsubscribe();
    };
  }, [userProfile.user_id]);

  useEffect(() => {
    // Filtrer les conversations par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredConversations(
        conversations.filter(conv =>
          conv.otherUser?.name.toLowerCase().includes(query) ||
          conv.otherUser?.username.toLowerCase().includes(query) ||
          conv.last_message?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);

    try {

      const { conversations: convs, error: convsError } = await getUserConversations(
        userProfile.user_id
      );

      if (convsError) {
        throw new Error(convsError);
      }

      setConversations(convs);
      setFilteredConversations(convs);
    } catch (err) {
      console.error('[Messages] Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm('Voulez-vous supprimer cette conversation ? Elle sera retirée de votre liste.')) {
      return;
    }

    try {
      const { success, error } = await deleteConversation(conversationId, userProfile.user_id);

      if (error) {
        throw new Error(error);
      }

      if (success) {
        await loadConversations();
      }
    } catch (err) {
      console.error('[Messages] Erreur suppression:', err);
      alert('Erreur lors de la suppression de la conversation');
    }
  };

  const handleBlockUser = async (otherUserId: string, otherUserName: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm(`Voulez-vous bloquer ${otherUserName} ? Cette personne ne pourra plus vous envoyer de messages.`)) {
      return;
    }

    try {
      const { isBlocked } = await isUserBlocked(userProfile.user_id, otherUserId);

      if (isBlocked) {
        alert('Cet utilisateur est déjà bloqué.');
        return;
      }

      const { success, error } = await blockUser(userProfile.user_id, otherUserId);

      if (error) {
        throw new Error(error);
      }

      if (success) {
        alert(`${otherUserName} a été bloqué avec succès.`);
        await loadConversations();
      }
    } catch (err) {
      console.error('[Messages] Erreur blocage:', err);
      alert('Erreur lors du blocage de l\'utilisateur');
    }
  };

  const handleViewProfile = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    // Trouver la conversation pour déterminer le type d'utilisateur
    const conversation = conversations.find(
      conv => conv.otherUser?.user_id === userId
    );

    if (conversation && conversation.otherUser) {
      // Si c'est un professionnel, utiliser onViewProfile pour naviguer vers le profil complet
      if (conversation.otherUser.user_type === 'professional' && onViewProfile) {
        const professionalProfile = getOtherUserProfile(conversation);
        if (professionalProfile) {
          onViewProfile(professionalProfile);
        }
      } else {
        // Pour les clients, afficher la modal UserProfile avec leurs avis
        setSelectedUserId(userId);
        setShowUserProfile(true);
      }
    } else {
      // Fallback: afficher UserProfileModal
      setSelectedUserId(userId);
      setShowUserProfile(true);
    }
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    loadConversations();
    if (onMessagesRead) {
      onMessagesRead();
    }
  };

  // Créer un UserProfile pour l'autre utilisateur
  const getOtherUserProfile = (conversation: Conversation): UserProfile | null => {
    if (!conversation.otherUser) return null;

    return {
      id: conversation.otherUser.id,
      user_id: conversation.otherUser.user_id,
      name: conversation.otherUser.name,
      username: conversation.otherUser.username,
      photos: conversation.otherUser.photos || [],
      location: conversation.otherUser.location || '',
      description: '',
      prestations: '',
      rating: 0,
      reviews: [],
      interests: [],
      age: 0,
      userType: conversation.otherUser.user_type === 'professional' ? 'pro' : 'client',
      languages: [],
      physicalInfo: {
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
      personalInfo: {
        alcool: "",
        fumeur: "",
        langues: [],
        orientation: "",
        origine: ""
      }
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-8">
      {/* En-tête */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-200 mb-2">Messages</h1>
        <p className="text-sm sm:text-base text-gray-400">
          {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-dark-50 border border-dark-200 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12 sm:py-20">
          <Loader className="h-8 w-8 text-rose animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12 sm:py-20">
          <div className="bg-rose/10 text-rose p-4 rounded-lg inline-block">
            {error}
          </div>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
          <div className="bg-dark-50 p-4 sm:p-6 rounded-full mb-4 sm:mb-6">
            <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-200 mb-2">
            {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
          </h3>
          <p className="text-sm sm:text-base text-gray-400 max-w-md">
            {searchQuery
              ? 'Aucune conversation ne correspond à votre recherche'
              : 'Commencez une conversation en contactant un profil'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onConversationClick={handleConversationClick}
              onDelete={handleDeleteConversation}
              onBlock={handleBlockUser}
              onViewProfile={handleViewProfile}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}

      {/* Modal de chat */}
      {selectedConversation && selectedConversation.otherUser && (
        <ChatModal
          currentUserProfile={userProfile}
          otherUserProfile={getOtherUserProfile(selectedConversation)!}
          onClose={handleCloseChat}
          onViewProfile={onViewProfile}
        />
      )}

      {/* Modal profil utilisateur */}
      {showUserProfile && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={() => {
            setShowUserProfile(false);
            setSelectedUserId(null);
          }}
          currentUserType={userProfile.userType === 'pro' ? 'professional' : 'client'}
          onContactUser={(userId) => {
            const conversation = conversations.find(
              conv => conv.otherUser?.user_id === userId
            );
            if (conversation) {
              setSelectedConversation(conversation);
            }
            setShowUserProfile(false);
            setSelectedUserId(null);
          }}
          onViewProfessional={(professionalId) => {
            // Trouver le profil du professionnel et naviguer vers son profil complet
            const professionalConv = conversations.find(
              conv => conv.otherUser?.user_id === professionalId
            );
            if (professionalConv && onViewProfile) {
              const professionalProfile = getOtherUserProfile(professionalConv);
              if (professionalProfile) {
                onViewProfile(professionalProfile);
                setShowUserProfile(false);
                setSelectedUserId(null);
              }
            }
          }}
          onLeaveReview={(userId, userName) => {
            setReviewUserId(userId);
            setReviewUserName(userName);
            setShowUserProfile(false);
            setShowLeaveReview(true);
          }}
        />
      )}

      {/* Modal laisser un avis */}
      {showLeaveReview && reviewUserId && (
        <LeaveReviewModal
          userId={reviewUserId}
          userName={reviewUserName}
          onClose={() => {
            setShowLeaveReview(false);
            setReviewUserId(null);
            setReviewUserName('');
          }}
          onReviewSubmitted={() => {
            loadConversations();
          }}
        />
      )}
    </div>
  );
};

export default Messages;
