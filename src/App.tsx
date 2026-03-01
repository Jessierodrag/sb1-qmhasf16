import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Wallet from './pages/Wallet';
import Subscription from './pages/Subscription';
import Login from './pages/Login';
import PublicProfile from './pages/PublicProfile';
import Admin from './pages/Admin';
import AgeVerification from './components/AgeVerification';
import BottomNav from './components/BottomNav';
import ChatModal from './components/modals/ChatModal';
import ProfileModal from './components/modals/ProfileModal';
import { Notification, UserProfile, Transaction, Conversation, Profile as ProfileType, Message, UserType } from './types';
import { getCurrentUser, signOut } from './lib/auth';
import { X, LogIn, UserPlus, User, Wallet as WalletIcon, Sparkles, Crown, BadgeCheck, Shield } from 'lucide-react';
import { useUnreadMessages } from './hooks/useUnreadMessages';
import { useNotifications } from './hooks/useNotifications';
import { userProfileToProfile } from './lib/profile';
import { type SubscriptionTier } from './lib/subscriptions';
import { checkIsAdmin } from './lib/admin';

const defaultUserProfile: UserProfile = {
  id: '1',
  name: 'Thomas',
  firstName: 'Thomas',
  lastName: 'Dupont',
  username: 'Thomas',
  location: 'Paris',
  description: 'Passionné de photographie et de voyages',
  interests: ['Photographie', 'Voyage', 'Art'],
  photos: [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
  ],
  physicalInfo: {
    sexe: "Homme",
    ethnique: "Caucasien",
    nationalite: "Français",
    age: 28,
    yeux: "Bleus",
    taille: "180 cm",
    poids: "75 kg",
    cheveux: "Brun",
    mensurations: "",
    poitrine: "",
    bonnet: "",
    tour_poitrine: "",
    epilation: ""
  },
  personalInfo: {
    alcool: "Occasionnellement",
    fumeur: "Non",
    langues: ["Français", "Anglais"],
    orientation: "Hétérosexuel",
    origine: "Français"
  },
  prestations: "Photographie professionnelle, retouche photo",
  userType: 'client' as const
};

const App = () => {
  const [showAgeVerification, setShowAgeVerification] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('50');
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'messages' | 'login' | 'wallet' | 'subscription' | 'viewProfile' | 'admin'>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>('client');
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedProfileForChat, setSelectedProfileForChat] = useState<ProfileType | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<ProfileType | null>(null);
  const [viewedUserProfile, setViewedUserProfile] = useState<UserProfile | null>(null);
  const [autoOpenSubscriptionTier, setAutoOpenSubscriptionTier] = useState<SubscriptionTier | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : defaultUserProfile;
  });

  // Utiliser le hook pour les notifications réelles
  const { notifications, unreadCount: notificationsUnreadCount, markAllAsRead } = useNotifications(
    isAuthenticated ? userProfile?.user_id || userProfile?.id : null
  );

  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem('walletBalance');
    return saved ? JSON.parse(saved) : 0;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : [];
  });

  const [conversationsMessages, setConversationsMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('conversationsMessages');
    return saved ? JSON.parse(saved) : {};
  });

  // Hook pour récupérer le nombre de messages non lus
  const { unreadCount, refresh: refreshUnreadCount } = useUnreadMessages(
    isAuthenticated ? userProfile?.user_id || userProfile?.id : null
  );

  // Rafraîchir le compteur quand on quitte la page messages ou ferme le chat
  useEffect(() => {
    if (!showChatModal) {
      refreshUnreadCount();
    }
  }, [showChatModal, refreshUnreadCount]);

  useEffect(() => {
    if (currentView !== 'messages') {
      refreshUnreadCount();
    }
  }, [currentView, refreshUnreadCount]);

  useEffect(() => {
    const checkSession = async () => {
      const { user, error } = await getCurrentUser();
      if (user && !error) {
        setUserProfile(user);
        setUserType(user.userType);
        setIsAuthenticated(true);

        const adminStatus = await checkIsAdmin(user.userId || user.user_id || '');
        setIsAdmin(adminStatus);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    localStorage.setItem('user', JSON.stringify(userProfile));
    localStorage.setItem('walletBalance', JSON.stringify(walletBalance));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('conversationsMessages', JSON.stringify(conversationsMessages));
  }, [userProfile, walletBalance, transactions, conversations, conversationsMessages]);

  const handleAcceptAge = () => {
    setShowAgeVerification(false);
  };

  const handleDeclineAge = () => {
    window.location.href = 'https://www.google.com';
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      setIsAuthenticated(false);
      setCurrentView('home');
      setShowMenu(false);
      setUserProfile(defaultUserProfile);
      // Les notifications sont maintenant gérées par le hook useNotifications
      setWalletBalance(0);
      setTransactions([]);
      setConversations([]);
      setConversationsMessages({});
      setShowMessage(false);
      setShowComments(false);
      setShowLoginPrompt(false);
      setMessageText('');
      setSearchQuery('');
      setShowNotifications(false);
      setSelectedProfile(profiles[0]);
      setNewComment('');
      setNewRating(0);
      setHoverRating(0);
      setUserType('client');
    } else {
      console.error('Logout error:', error);
    }
  };

  const handleNewPost = async (post: {
    photos: string[];
    location: string;
    tags: string[];
    caption: string;
  }) => {
    // Les notifications sont maintenant gérées automatiquement par les triggers
    window.dispatchEvent(new CustomEvent('postCreated'));
  };

  const handleSendPayment = (amount: number) => {
    if (!isAuthenticated || !selectedProfileForChat) return;
    
    setWalletBalance(prev => prev - amount);
    
    const newTransaction: Transaction = {
      id: transactions.length + 1,
      type: 'debit',
      amount: amount,
      description: `Paiement envoyé à ${selectedProfileForChat.name}`,
      date: new Date().toLocaleDateString('fr-FR'),
      method: 'wallet',
      status: 'completed',
      timestamp: new Date()
    };
    
    setTransactions(prev => [newTransaction, ...prev]);

    // Les notifications sont maintenant gérées automatiquement
  };

  const handleSearchResultClick = (profile: ProfileType) => {
    setSelectedProfileForModal(profile);
    setShowProfileModal(true);
  };

  const handleViewProfile = (profile: UserProfile) => {
    setViewedUserProfile(profile);
    setCurrentView('viewProfile');
  };

  if (showAgeVerification) {
    return <AgeVerification onAccept={handleAcceptAge} onDecline={handleDeclineAge} />;
  }

  return (
    <div className="min-h-screen bg-dark text-gray-200">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        notificationsUnreadCount={notificationsUnreadCount}
        onMarkAllNotificationsRead={markAllAsRead}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        setIsAuthenticated={setIsAuthenticated}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
        userType={userType}
        onSearchResultClick={handleSearchResultClick}
      />

      <div className="pt-24 sm:pt-20 pb-16">
        {currentView === 'home' && (
          <Home
            setShowMessage={setShowChatModal}
            setShowComments={setShowComments}
            setSelectedProfile={(profile) => {
              setSelectedProfile(profile);
              setSelectedProfileForChat(profile);
            }}
            isAuthenticated={isAuthenticated}
            userProfile={userProfile}
            selectedLocation={selectedLocation}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        )}
        {currentView === 'profile' && (
          <Profile
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'messages' && userProfile && (
          <Messages
            userProfile={userProfile}
            onMessagesRead={refreshUnreadCount}
            onViewProfile={handleViewProfile}
          />
        )}
        {currentView === 'viewProfile' && viewedUserProfile && (
          <PublicProfile
            viewedProfile={viewedUserProfile}
            currentUserProfile={userProfile}
            isAuthenticated={isAuthenticated}
            onBack={() => setCurrentView('messages')}
          />
        )}
        {currentView === 'wallet' && (
          <Wallet
            walletBalance={walletBalance}
            setWalletBalance={setWalletBalance}
            transactions={transactions}
            setTransactions={setTransactions}
          />
        )}
        {currentView === 'subscription' && (
          <Subscription
            autoOpenTier={autoOpenSubscriptionTier}
            onAutoOpenComplete={() => setAutoOpenSubscriptionTier(null)}
          />
        )}
        {currentView === 'admin' && (
          <Admin />
        )}
        {currentView === 'login' && (
          <Login
            setIsAuthenticated={setIsAuthenticated}
            setCurrentView={setCurrentView}
            setUserType={setUserType}
            setUserProfile={setUserProfile}
          />
        )}
      </div>

      <BottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLocationSelect={setSelectedLocation}
        isAuthenticated={isAuthenticated}
        onNewPost={handleNewPost}
        userType={userType}
        unreadMessagesCount={unreadCount}
      />

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] animate-fade-in"
            onClick={() => setShowMenu(false)}
          />
          
          <div className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-dark z-[9999] animate-slide-in overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-dark-200">
                <h3 className="text-lg font-semibold text-gray-200">Menu</h3>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 hover:bg-dark-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        setCurrentView('login');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200"
                    >
                      <LogIn className="h-5 w-5 text-rose" />
                      <span>Se connecter</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('login');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 mt-2"
                    >
                      <UserPlus className="h-5 w-5 text-rose" />
                      <span>S'inscrire</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setCurrentView('profile');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200"
                    >
                      <User className="h-5 w-5 text-rose" />
                      <span>Mon Profil</span>
                    </button>

                    {userType === 'pro' && (
                      <>
                        <button
                          onClick={() => {
                            setCurrentView('subscription');
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 mt-2"
                        >
                          <Crown className="h-5 w-5 text-rose" />
                          <span>Mon Abonnement</span>
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 mt-2 bg-rose-500/20 border border-rose-500/30"
                      >
                        <Shield className="h-5 w-5 text-rose" />
                        <span>Administration</span>
                      </button>
                    )}

                    {userType === 'pro' && (
                      <div className="mt-6">
                        <h3 className="px-4 text-sm font-medium text-gray-400 mb-3">Offres Premium</h3>

                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setAutoOpenSubscriptionTier('basic');
                            setCurrentView('subscription');
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-4 text-left flex items-start gap-3 bg-dark-50/50 hover:bg-dark-100 rounded-lg backdrop-blur-sm transition-colors"
                        >
                          <Sparkles className="h-5 w-5 text-yellow-500 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-200">Roses Classic</span>
                              <span className="text-sm font-medium text-rose">9.90€</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              Visibilité boostée pendant 24h dans la ville du post
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setAutoOpenSubscriptionTier('premium');
                            setCurrentView('subscription');
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-4 text-left flex items-start gap-3 bg-dark-50/50 hover:bg-dark-100 rounded-lg backdrop-blur-sm transition-colors"
                        >
                          <Crown className="h-5 w-5 text-purple-500 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-200">Roses Premium</span>
                              <span className="text-sm font-medium text-rose">49.90€</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              Visibilité boostée pendant 7 jours dans 5 villes au choix
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setAutoOpenSubscriptionTier('vip');
                            setCurrentView('subscription');
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-4 text-left flex items-start gap-3 bg-dark-50/50 hover:bg-dark-100 rounded-lg backdrop-blur-sm transition-colors"
                        >
                          <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-200">Roses Elite</span>
                              <span className="text-sm font-medium text-rose">169.90€</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              Visibilité boostée pendant 1 mois complet dans 10 villes au choix
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-dark-200">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200"
                      >
                        <X className="h-5 w-5 text-rose" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showChatModal && selectedProfileForChat && (
        <ChatModal
          profile={selectedProfileForChat}
          onClose={() => setShowChatModal(false)}
          onSendMessage={(message: string) => {
            const existingConversation = conversations.find(
              conv => conv.with.name === selectedProfileForChat.name
            );

            if (!existingConversation) {
              const newConversation: Conversation = {
                id: conversations.length + 1,
                with: {
                  name: selectedProfileForChat.name,
                  photo: selectedProfileForChat.photos[0],
                  lastMessage: message,
                  timestamp: new Date(),
                  unread: 0
                }
              };
              setConversations(prev => [newConversation, ...prev]);
            } else {
              setConversations(prev =>
                prev.map(conv =>
                  conv.id === existingConversation.id
                    ? {
                        ...conv,
                        with: {
                          ...conv.with,
                          lastMessage: message,
                          timestamp: new Date()
                        }
                      }
                    : conv
                )
              );
            }

            const conversationId = existingConversation?.id || conversations.length + 1;
            const newMessage: Message = {
              id: Date.now(),
              text: message,
              isOwn: true,
              timestamp: new Date(),
              sender: {
                name: userProfile.username || userProfile.name,
                photo: userProfile.photos[0]
              }
            };

            setConversationsMessages(prev => ({
              ...prev,
              [conversationId]: [...(prev[conversationId] || []), newMessage]
            }));
          }}
          messages={conversationsMessages[conversations.find(
            conv => conv.with.name === selectedProfileForChat.name
          )?.id || 0] || []}
          walletBalance={walletBalance}
          onSendPayment={handleSendPayment}
          isAuthenticated={isAuthenticated}
          onLogin={() => {
            setShowChatModal(false);
            setCurrentView('login');
          }}
        />
      )}

      {showProfileModal && selectedProfileForModal && (
        <ProfileModal
          profile={selectedProfileForModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedProfileForModal(null);
          }}
          onContact={() => {
            setShowProfileModal(false);
            setSelectedProfileForChat(selectedProfileForModal);
            setShowChatModal(true);
          }}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
};

export default App;