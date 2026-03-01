import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Wallet from './pages/Wallet';
import Subscription from './pages/Subscription';
import Login from './pages/Login';
import PublicProfile from './pages/PublicProfile';
import Admin from './pages/Admin';
import ChatModal from './components/modals/ChatModal';
import ProfileModal from './components/modals/ProfileModal';
import { useAuth } from './hooks/useAuth';
import { Transaction, Conversation, Profile as ProfileType, Message, UserProfile, type SubscriptionTier } from './types';
import { X, LogIn, UserPlus, User, Sparkles, Crown, BadgeCheck, Shield } from 'lucide-react';

const AppContent = () => {
  const { 
    isAuthenticated, 
    isAdmin, 
    userType, 
    userProfile, 
    setUserProfile,
    setUserType,
    handleLogout,
    handleLogin
  } = useAuth();

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedProfileForChat, setSelectedProfileForChat] = useState<ProfileType | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<ProfileType | null>(null);
  const [viewedUserProfile, setViewedUserProfile] = useState<UserProfile | null>(null);
  const [autoOpenSubscriptionTier, setAutoOpenSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const [showMenu, setShowMenu] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('walletBalance', JSON.stringify(walletBalance));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('conversationsMessages', JSON.stringify(conversationsMessages));
  }, [walletBalance, transactions, conversations, conversationsMessages]);

  const handleNewPost = async (post: {
    photos: string[];
    location: string;
    tags: string[];
    caption: string;
  }) => {
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
  };

  const handleSearchResultClick = (profile: ProfileType) => {
    setSelectedProfileForModal(profile);
    setShowProfileModal(true);
  };

  const handleViewProfile = (profile: UserProfile) => {
    setViewedUserProfile(profile);
  };

  const wrappedHandleLogout = async () => {
    const success = await handleLogout();
    if (success) {
      setWalletBalance(0);
      setTransactions([]);
      setConversations([]);
      setConversationsMessages({});
      setShowChatModal(false);
      setShowProfileModal(false);
      setShowMenu(false);
    }
  };

  return (
    <>
      <Routes>
        <Route element={
          <MainLayout
            isAuthenticated={isAuthenticated}
            userProfile={userProfile}
            userType={userType}
            handleLogout={wrappedHandleLogout}
            onSearchResultClick={handleSearchResultClick}
            onNewPost={handleNewPost}
            onLocationSelect={setSelectedLocation}
          />
        }>
          <Route path="/" element={
            <ErrorBoundary>
              <Home
                setShowMessage={setShowChatModal}
                setShowComments={() => {}}
                setSelectedProfile={(profile) => {
                  setSelectedProfileForChat(profile);
                }}
                isAuthenticated={isAuthenticated}
                userProfile={userProfile}
                selectedLocation={selectedLocation}
                onNavigateToLogin={() => {}}
              />
            </ErrorBoundary>
          } />
          
          <Route path="/login" element={
            <ErrorBoundary>
              <Login
                setIsAuthenticated={(auth) => {}}
                setCurrentView={() => {}}
                setUserType={setUserType}
                setUserProfile={setUserProfile}
              />
            </ErrorBoundary>
          } />

          <Route path="/profile" element={
            <ErrorBoundary>
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Profile
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  setCurrentView={() => {}}
                />
              </ProtectedRoute>
            </ErrorBoundary>
          } />

          <Route path="/profile/:userId" element={
            <ErrorBoundary>
              <PublicProfile
                viewedProfile={viewedUserProfile!}
                currentUserProfile={userProfile}
                isAuthenticated={isAuthenticated}
                onBack={() => window.history.back()}
              />
            </ErrorBoundary>
          } />

          <Route path="/messages" element={
            <ErrorBoundary>
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Messages
                  userProfile={userProfile}
                  onMessagesRead={() => {}}
                  onViewProfile={handleViewProfile}
                />
              </ProtectedRoute>
            </ErrorBoundary>
          } />

          <Route path="/wallet" element={
            <ErrorBoundary>
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Wallet
                  walletBalance={walletBalance}
                  setWalletBalance={setWalletBalance}
                  transactions={transactions}
                  setTransactions={setTransactions}
                />
              </ProtectedRoute>
            </ErrorBoundary>
          } />

          <Route path="/subscription" element={
            <ErrorBoundary>
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Subscription
                  autoOpenTier={autoOpenSubscriptionTier}
                  onAutoOpenComplete={() => setAutoOpenSubscriptionTier(null)}
                />
              </ProtectedRoute>
            </ErrorBoundary>
          } />

          <Route path="/admin" element={
            <ErrorBoundary>
              <ProtectedRoute isAuthenticated={isAuthenticated} requireAdmin={true} isAdmin={isAdmin}>
                <Admin />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
        </Route>
      </Routes>

      {/* Menu latéral */}
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
                    <a
                      href="/login"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 block"
                    >
                      <LogIn className="h-5 w-5 text-rose" />
                      <span>Se connecter</span>
                    </a>
                    <a
                      href="/login"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 mt-2 block"
                    >
                      <UserPlus className="h-5 w-5 text-rose" />
                      <span>S'inscrire</span>
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="/profile"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 block"
                    >
                      <User className="h-5 w-5 text-rose" />
                      <span>Mon Profil</span>
                    </a>

                    {userType === 'pro' && (
                      <a
                        href="/subscription"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 mt-2 block"
                      >
                        <Crown className="h-5 w-5 text-rose" />
                        <span>Mon Abonnement</span>
                      </a>
                    )}

                    {isAdmin && (
                      <a
                        href="/admin"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-dark-100 rounded-lg text-gray-200 mt-2 bg-rose-500/20 border border-rose-500/30 block"
                      >
                        <Shield className="h-5 w-5 text-rose" />
                        <span>Administration</span>
                      </a>
                    )}

                    {userType === 'pro' && (
                      <div className="mt-6">
                        <h3 className="px-4 text-sm font-medium text-gray-400 mb-3">Offres Premium</h3>
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              setAutoOpenSubscriptionTier('basic');
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
                          wrappedHandleLogout();
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

      {/* Chat Modal */}
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
          onLogin={() => setShowChatModal(false)}
        />
      )}

      {/* Profile Modal */}
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
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
