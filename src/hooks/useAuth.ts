import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '../lib/auth';
import { UserProfile, UserType } from '../types';
import { checkIsAdmin } from '../lib/admin';

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

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState<UserType>('client');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : defaultUserProfile;
  });

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
  }, [userProfile]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      setIsAuthenticated(false);
      setUserProfile(defaultUserProfile);
      setUserType('client');
      setIsAdmin(false);
      localStorage.clear();
      return true;
    } else {
      console.error('Logout error:', error);
      return false;
    }
  };

  const handleLogin = (user: UserProfile, type: UserType) => {
    setUserProfile(user);
    setUserType(type);
    setIsAuthenticated(true);
  };

  return {
    isAuthenticated,
    isAdmin,
    userType,
    userProfile,
    setUserProfile,
    setUserType,
    handleLogout,
    handleLogin
  };
};
