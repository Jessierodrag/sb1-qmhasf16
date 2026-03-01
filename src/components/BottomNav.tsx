import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Globe, PlusSquare, MessageCircle, User } from 'lucide-react';
import { View, UserType } from '../types';
import SearchModal from './SearchModal';
import NewPostModal from './modals/NewPostModal';

interface BottomNavProps {
  currentView: View;
  setCurrentView: (view: View) => void; // Deprecated, kept for compatibility
  onLocationSelect?: (location: string | null) => void;
  isAuthenticated: boolean;
  onNewPost: (post: { photos: string[]; location: string; tags: string[]; caption: string; }) => void;
  userType?: UserType;
  unreadMessagesCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  setCurrentView,
  onLocationSelect,
  isAuthenticated,
  onNewPost,
  userType = 'client',
  unreadMessagesCount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Détecter la route active depuis l'URL
  const getActiveIcon = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/messages') return 'messages';
    if (location.pathname === '/profile' || location.pathname.startsWith('/profile/')) return 'profile';
    return currentView;
  };
  
  const [activeIcon, setActiveIcon] = useState<string>(getActiveIcon());

  const handleViewChange = (view: View) => {
    if (!isAuthenticated && (view === 'messages' || view === 'profile')) {
      navigate('/login');
    } else {
      // Map view to route
      const routeMap: Record<View, string> = {
        home: '/',
        login: '/login',
        profile: '/profile',
        messages: '/messages',
        wallet: '/wallet',
        subscription: '/subscription',
        admin: '/admin',
        viewProfile: '/profile' // Will be handled by dynamic routes
      };
      navigate(routeMap[view] || '/');
    }
    setActiveIcon(view);
    setShowSearchModal(false);
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
    setActiveIcon('search');
  };

  const handleLocationSelect = (location: string) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    setShowSearchModal(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-dark border-t border-dark-200 px-4 py-2 z-50 pb-safe" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => handleViewChange('home')}
            className={`p-2 rounded-lg transition-colors ${
              activeIcon === 'home' ? 'text-rose' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <Home className="h-6 w-6" />
          </button>
          <button
            onClick={handleSearchClick}
            className={`p-2 rounded-lg transition-colors ${
              activeIcon === 'search' ? 'text-rose' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <Globe className="h-6 w-6" />
          </button>
          {isAuthenticated && userType === 'pro' && (
            <button
              onClick={() => setShowNewPostModal(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-400 transition-colors"
            >
              <PlusSquare className="h-6 w-6" />
            </button>
          )}
          <button
            onClick={() => handleViewChange('messages')}
            className={`relative p-2 rounded-lg transition-colors ${
              activeIcon === 'messages' ? 'text-rose' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <MessageCircle className="h-6 w-6" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 animate-in fade-in zoom-in duration-200">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleViewChange('profile')}
            className={`p-2 rounded-lg transition-colors ${
              activeIcon === 'profile' ? 'text-rose' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            <User className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {showSearchModal && (
        <SearchModal 
          onClose={() => {
            setShowSearchModal(false);
            setActiveIcon(currentView);
          }} 
          onLocationSelect={handleLocationSelect}
        />
      )}

      {showNewPostModal && (
        <NewPostModal
          onClose={() => setShowNewPostModal(false)}
          onPost={onNewPost}
        />
      )}
    </>
  );
};

export default BottomNav;