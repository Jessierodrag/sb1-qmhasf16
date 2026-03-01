import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader, Ban, MoreVertical } from 'lucide-react';
import {
  getOrCreateConversation,
  getConversationMessages,
  sendMessage as sendMessageToDb,
  markMessagesAsRead,
  type Message,
  type Conversation
} from '../../lib/conversations';
import { blockUser, isUserBlocked } from '../../lib/blocking';
import { UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import ProfileModal from './ProfileModal';
import UserProfileModal from './UserProfileModal';
import LeaveReviewModal from './LeaveReviewModal';
import { userProfileToProfile } from '../../lib/profile';

interface ChatModalProps {
  otherUserProfile: UserProfile;
  currentUserProfile: UserProfile;
  onClose: () => void;
  onViewProfile?: (profile: UserProfile) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  otherUserProfile,
  currentUserProfile,
  onClose,
  onViewProfile
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Charger la conversation et les messages
  useEffect(() => {
    loadConversation();
  }, [currentUserProfile.id, otherUserProfile.id]);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand on ouvre la conversation
  useEffect(() => {
    if (conversation) {
      const currentUserId = currentUserProfile.user_id || currentUserProfile.id;
      if (currentUserId) {
        markMessagesAsRead(conversation.id, currentUserId);
      }
    }
  }, [conversation, currentUserProfile.id]);

  // Écouter les nouveaux messages en temps réel
  useEffect(() => {
    if (!conversation) return;

    console.log('[ChatModal] Configuration de la subscription pour conversation:', conversation.id);

    // S'abonner aux changements dans la table messages
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          console.log('[ChatModal] Nouveau message reçu:', payload);
          const newMessage = payload.new as Message;

          // Ajouter le nouveau message à la liste
          setMessages((prev) => {
            // Vérifier que le message n'existe pas déjà
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });

          // Marquer comme lu si ce n'est pas notre propre message
          const currentUserId = currentUserProfile.user_id || currentUserProfile.id;
          if (newMessage.sender_id !== currentUserId) {
            markMessagesAsRead(conversation.id, currentUserId);
          }
        }
      )
      .subscribe();

    // Nettoyer la subscription au démontage
    return () => {
      console.log('[ChatModal] Nettoyage de la subscription');
      supabase.removeChannel(channel);
    };
  }, [conversation, currentUserProfile.id, currentUserProfile.user_id]);

  const loadConversation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[ChatModal] currentUserProfile:', {
        id: currentUserProfile.id,
        user_id: currentUserProfile.user_id,
        name: currentUserProfile.name
      });
      console.log('[ChatModal] otherUserProfile:', {
        id: otherUserProfile.id,
        user_id: otherUserProfile.user_id,
        name: otherUserProfile.name
      });

      const currentUserId = currentUserProfile.user_id || currentUserProfile.id;
      const otherUserId = otherUserProfile.user_id || otherUserProfile.id;

      console.log('[ChatModal] IDs utilisés:', {
        currentUserId,
        otherUserId
      });

      if (!currentUserId || !otherUserId) {
        throw new Error('ID utilisateur manquant');
      }

      // Récupérer ou créer la conversation
      const { conversation: conv, error: convError } = await getOrCreateConversation(
        currentUserId,
        otherUserId
      );

      if (convError || !conv) {
        throw new Error(convError || 'Impossible de charger la conversation');
      }

      setConversation(conv);
      console.log('[ChatModal] Conversation chargée:', conv.id);

      // Récupérer les messages
      const { messages: msgs, error: msgsError } = await getConversationMessages(conv.id);

      if (msgsError) {
        throw new Error(msgsError);
      }

      setMessages(msgs);
      console.log('[ChatModal] Messages chargés:', msgs.length);
    } catch (err) {
      console.error('[ChatModal] Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBlockUser = async () => {
    if (!confirm(`Voulez-vous bloquer ${otherUserProfile.username || otherUserProfile.name} ? Cette personne ne pourra plus vous envoyer de messages.`)) {
      return;
    }

    try {
      const currentUserId = currentUserProfile.user_id || currentUserProfile.id;
      const otherUserId = otherUserProfile.user_id || otherUserProfile.id;

      if (!currentUserId || !otherUserId) {
        throw new Error('IDs utilisateurs manquants');
      }

      const { isBlocked } = await isUserBlocked(currentUserId, otherUserId);

      if (isBlocked) {
        alert('Cet utilisateur est déjà bloqué.');
        return;
      }

      const { success, error } = await blockUser(currentUserId, otherUserId);

      if (error) {
        throw new Error(error);
      }

      if (success) {
        alert(`${otherUserProfile.username || otherUserProfile.name} a été bloqué avec succès.`);
        onClose();
      }
    } catch (err) {
      console.error('[ChatModal] Erreur blocage:', err);
      alert('Erreur lors du blocage de l\'utilisateur');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !conversation || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      console.log('[ChatModal] Envoi message');

      const currentUserId = currentUserProfile.user_id || currentUserProfile.id;
      if (!currentUserId) {
        throw new Error('ID utilisateur manquant');
      }

      const { message, error: sendError } = await sendMessageToDb(
        conversation.id,
        currentUserId,
        messageInput.trim()
      );

      if (sendError || !message) {
        throw new Error(sendError || 'Impossible d\'envoyer le message');
      }

      // Ne pas ajouter le message manuellement, laisser la subscription Realtime le faire
      // Cela évite les doublons
      setMessageInput('');

      console.log('[ChatModal] Message envoyé:', message.id);
    } catch (err) {
      console.error('[ChatModal] Erreur envoi:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-3 sm:p-4 z-[100]">
      <div className="bg-dark-50 rounded-xl w-full max-w-2xl h-[90vh] sm:h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-dark-200 flex items-center gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-1 hover:bg-dark-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={() => {
              // Si c'est un professionnel, naviguer vers son profil complet
              if (otherUserProfile.userType === 'pro' && onViewProfile) {
                onViewProfile(otherUserProfile);
                onClose();
              } else {
                // Si c'est un client, afficher la modal avec ses avis
                setShowProfile(true);
              }
            }}
            className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 hover:bg-dark-100/50 rounded-lg p-2 -m-2 transition-colors text-left"
          >
            <img
              src={otherUserProfile.photos[0]}
              alt={otherUserProfile.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-dark-200 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-200 truncate">{otherUserProfile.username || otherUserProfile.name}</h3>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{otherUserProfile.location}</p>
            </div>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-300 p-2 hover:bg-dark-100 rounded-full transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-100 border border-dark-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleBlockUser();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-orange-400 hover:bg-dark-50 transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  <span>Bloquer cet utilisateur</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="h-8 w-8 text-rose animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-dark-100 p-4 rounded-full mb-4">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-400 mb-2">Aucun message pour le moment</p>
              <p className="text-sm text-gray-500">
                Commencez la conversation en envoyant un message
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const currentUserId = currentUserProfile.user_id || currentUserProfile.id;
                const isOwn = msg.sender_id === currentUserId;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 ${
                        isOwn
                          ? 'bg-rose text-white rounded-br-none'
                          : 'bg-dark-100 text-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm sm:text-base break-words">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-3 sm:px-4 py-2 bg-rose/10 border-t border-rose/20">
            <p className="text-sm text-rose">{error}</p>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-dark-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Écrivez votre message..."
              disabled={isLoading || isSending}
              className="flex-1 bg-dark-100 text-gray-200 placeholder-gray-500 rounded-full px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-rose disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || isLoading || isSending}
              className="p-2 sm:p-2.5 text-white bg-rose hover:bg-rose-600 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-rose flex-shrink-0"
            >
              {isSending ? (
                <Loader className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : (
                <Send className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Profile Modal */}
      {showProfile && otherUserProfile.userType === 'pro' && (
        <ProfileModal
          profile={userProfileToProfile(otherUserProfile)}
          onClose={() => setShowProfile(false)}
          onContact={() => {
            setShowProfile(false);
          }}
          isAuthenticated={true}
        />
      )}

      {/* User Profile Modal for Clients */}
      {showProfile && otherUserProfile.userType === 'client' && (
        <UserProfileModal
          userId={otherUserProfile.user_id}
          onClose={() => setShowProfile(false)}
          currentUserType={currentUserProfile.userType === 'pro' ? 'professional' : 'client'}
          onContactUser={() => {
            setShowProfile(false);
          }}
          onViewProfessional={(professionalId) => {
            // Naviguer vers le profil du professionnel si onViewProfile est disponible
            if (onViewProfile) {
              // Créer un UserProfile basique pour la navigation
              const professionalProfile: UserProfile = {
                id: professionalId,
                user_id: professionalId,
                name: '',
                username: '',
                photos: [],
                location: '',
                description: '',
                prestations: '',
                rating: 0,
                reviews: [],
                interests: [],
                age: 0,
                userType: 'pro',
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
              setShowProfile(false);
              onClose();
              onViewProfile(professionalProfile);
            }
          }}
          onLeaveReview={(userId, userName) => {
            setShowProfile(false);
            setShowLeaveReview(true);
          }}
        />
      )}

      {/* Modal laisser un avis */}
      {showLeaveReview && (
        <LeaveReviewModal
          userId={otherUserProfile.user_id}
          userName={otherUserProfile.username || otherUserProfile.name}
          onClose={() => setShowLeaveReview(false)}
          onReviewSubmitted={() => {
            loadConversation();
          }}
        />
      )}
    </div>
  );
};

export default ChatModal;
