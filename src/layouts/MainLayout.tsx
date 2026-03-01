import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import AgeVerification from '../components/AgeVerification';
import { Notification, UserProfile, UserType, Profile } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

interface MainLayoutProps {
  isAuthenticated: boolean;
  userProfile: UserProfile;
  userType: UserType;
  handleLogout: () => void;
  onSearchResultClick: (profile: Profile) => void;
  onNewPost: (post: { photos: string[]; location: string; tags: string[]; caption: string; }) => void;
  onLocationSelect?: (location: string | null) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  isAuthenticated,
  userProfile,
  userType,
  handleLogout,
  onSearchResultClick,
  onNewPost,
  onLocationSelect
}) => {
  const location = useLocation();
  const [showAgeVerification, setShowAgeVerification] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const { notifications, unreadCount: notificationsUnreadCount, markAllAsRead } = useNotifications(
    isAuthenticated ? userProfile?.user_id || userProfile?.id : null
  );

  const { unreadCount, refresh: refreshUnreadCount } = useUnreadMessages(
    isAuthenticated ? userProfile?.user_id || userProfile?.id : null
  );

  const handleAcceptAge = () => {
    setShowAgeVerification(false);
  };

  const handleDeclineAge = () => {
    window.location.href = 'https://www.google.com';
  };

  // Convertir le path en View pour le Header/BottomNav
  const getViewFromPath = (pathname: string) => {
    if (pathname === '/') return 'home';
    if (pathname === '/login') return 'login';
    if (pathname === '/profile') return 'profile';
    if (pathname.startsWith('/profile/')) return 'viewProfile';
    if (pathname === '/messages') return 'messages';
    if (pathname === '/wallet') return 'wallet';
    if (pathname === '/subscription') return 'subscription';
    if (pathname === '/admin') return 'admin';
    return 'home';
  };

  if (showAgeVerification) {
    return <AgeVerification onAccept={handleAcceptAge} onDecline={handleDeclineAge} />;
  }

  return (
    <div className="min-h-screen bg-dark text-gray-200">
      <Header
        currentView={getViewFromPath(location.pathname)}
        setCurrentView={() => {}} // Now handled by router
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        notificationsUnreadCount={notificationsUnreadCount}
        onMarkAllNotificationsRead={markAllAsRead}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        setIsAuthenticated={() => {}}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
        userType={userType}
        onSearchResultClick={onSearchResultClick}
      />

      <div className="pt-24 sm:pt-20 pb-16">
        <Outlet />
      </div>

      <BottomNav
        currentView={getViewFromPath(location.pathname)}
        setCurrentView={() => {}} // Now handled by router
        onLocationSelect={onLocationSelect}
        isAuthenticated={isAuthenticated}
        onNewPost={onNewPost}
        userType={userType}
        unreadMessagesCount={unreadCount}
      />
    </div>
  );
};

export default MainLayout;
