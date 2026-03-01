import React from 'react';
import { UserProfile } from '../types';
import ClientProfile from './ClientProfile';
import ProProfile from './ProProfile';

interface ProfileProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setCurrentView: (view: 'home' | 'profile' | 'messages' | 'wallet') => void;
}

const Profile: React.FC<ProfileProps> = ({ userProfile, setUserProfile, setCurrentView }) => {
  return userProfile.userType === 'pro' ? (
    <ProProfile 
      userProfile={userProfile} 
      setUserProfile={setUserProfile}
      setCurrentView={setCurrentView}
    />
  ) : (
    <ClientProfile userProfile={userProfile} setUserProfile={setUserProfile} />
  );
};

export default Profile;