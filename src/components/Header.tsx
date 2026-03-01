import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, X, Check } from 'lucide-react';
import { View, Notification, UserType, Profile } from '../types';
import { renderFullStars } from '../utils/stars';
import { formatDistanceToNow } from '../utils/date';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  notifications: any[];
  notificationsUnreadCount: number;
  onMarkAllNotificationsRead: () => void;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  setIsAuthenticated: (auth: boolean) => void;
  isAuthenticated: boolean;
  handleLogout: () => void;
  userType: UserType;
  onSearchResultClick?: (profile: Profile) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  showNotifications,
  setShowNotifications,
  notifications,
  notificationsUnreadCount,
  onMarkAllNotificationsRead,
  showMenu,
  setShowMenu,
  isAuthenticated,
  onSearchResultClick
}) => {
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchProfiles = async () => {
      if (searchQuery.trim().length >= 2) {
        const query = searchQuery.toLowerCase();

        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) {
          console.error('Search error:', error);
          setSearchResults([]);
          return;
        }

        if (data) {
          const results = data
            .filter(profile => {
              const matchName = (profile.name || '').toLowerCase().includes(query);
              const matchUsername = (profile.username || '').toLowerCase().includes(query);
              const matchLocation = (profile.location || '').toLowerCase().includes(query);
              const matchDescription = (profile.description || '').toLowerCase().includes(query);
              const matchPrestations = (profile.prestations || '').toLowerCase().includes(query);
              const matchInterests = (profile.interests || []).some((interest: string) =>
                interest.toLowerCase().includes(query)
              );

              return matchName || matchUsername || matchLocation || matchDescription || matchPrestations || matchInterests;
            })
            .map(p => ({
              id: p.id,
              user_id: p.user_id,
              name: p.name,
              username: p.username || p.name,
              location: p.location || '',
              description: p.description || '',
              interests: p.interests || [],
              photos: p.photos || [],
              physicalInfo: p.physical_info || {},
              personalInfo: p.personal_info || {},
              prestations: p.prestations || '',
              userType: p.user_type === 'professional' ? 'pro' : 'client',
              rating: 0,
              reviewCount: 0,
              price: 0,
              isOnline: false,
              lastSeen: new Date()
            } as Profile));

          setSearchResults(results);
          setShowSearchResults(true);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    searchProfiles();
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchResults(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowNotifications]);

  // Marquer toutes les notifications comme lues quand le panneau s'ouvre
  useEffect(() => {
    if (showNotifications && notificationsUnreadCount > 0) {
      // Petit délai pour une meilleure UX
      const timer = setTimeout(() => {
        onMarkAllNotificationsRead();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showNotifications, notificationsUnreadCount, onMarkAllNotificationsRead]);

  return (
    <nav className="glass border-b border-white/5 fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentView('home')}
            className="text-xl sm:text-2xl font-bold text-gradient hover:scale-105 transition-transform duration-200 flex items-center gap-2"
          >
            <span className="text-2xl">🔥</span>
            Fire Roses
          </button>

          {isAuthenticated && (
            <div id="search-container" className="hidden sm:block flex-1 max-w-xl mx-8 relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, ville, prestation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 rounded-full glass-light text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                />
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl shadow-card max-h-96 overflow-y-auto animate-slide-up">
                  {searchResults.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        if (onSearchResultClick) {
                          onSearchResultClick(profile);
                        }
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-all duration-200 text-left border-b border-white/5 last:border-b-0"
                    >
                      <img
                        src={profile.photos[0]}
                        alt={profile.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/30"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-100">{profile.username || profile.name}</h4>
                        {profile.username && profile.username !== profile.name && (
                          <p className="text-xs text-gray-400">{profile.name}</p>
                        )}
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {profile.location}
                        </p>
                        {profile.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {renderFullStars(profile.rating)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 group"
              >
                <Bell className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform" />
                {notificationsUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-rose-500 to-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shadow-glow-rose animate-glow">
                    {notificationsUnreadCount > 9 ? '9+' : notificationsUnreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 hover:bg-white/10 rounded-full transition-all duration-200 group"
            >
              <Menu className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {isAuthenticated && (
          <div className="sm:hidden px-4 pb-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-full glass-light text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              />
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 mx-4 glass rounded-xl shadow-card max-h-96 overflow-y-auto z-50 animate-slide-up">
                {searchResults.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      if (onSearchResultClick) {
                        onSearchResultClick(profile);
                      }
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-dark-100 transition-colors text-left"
                  >
                    <img
                      src={profile.photos[0]}
                      alt={profile.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-200">{profile.name}</h4>
                      <p className="text-sm text-gray-400">{profile.location}</p>
                      {profile.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {renderFullStars(profile.rating)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Panneau des notifications */}
        {showNotifications && (
          <div
            ref={notificationsRef}
            className="absolute right-4 top-full mt-2 w-80 glass rounded-xl shadow-card max-h-96 overflow-hidden z-50 animate-slide-up"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-gray-100">Notifications</h3>
              {notifications.filter(n => !n.read).length > 0 && (
                <button
                  onClick={onMarkAllNotificationsRead}
                  className="text-sm text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1 font-medium"
                >
                  <Check className="h-4 w-4" />
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer ${
                      !notification.read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        !notification.read ? 'bg-rose-500 shadow-glow-rose' : 'bg-transparent'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-100">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;