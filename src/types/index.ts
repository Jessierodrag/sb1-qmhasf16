// Ajouter le type d'utilisateur
export type UserType = 'client' | 'pro';

export interface Profile {
  id: number;
  name: string;
  location: string;
  premium: boolean;
  online: boolean;
  interests: string[];
  description: string;
  rating: number;
  imageUrl: string;
  photos: string[];
  thumbnails?: string[];
  physicalInfo: PhysicalInfo;
  personalInfo: PersonalInfo;
  prestations: string;
  reviews: Review[];
  likes?: number;
  isLiked?: boolean;
  phone?: string;
  userId?: string;
  subscription_tier?: string;
}

export interface PhysicalInfo {
  sexe: string;
  ethnique: string;
  nationalite: string;
  age: number;
  yeux: string;
  taille: string;
  poids: string;
  cheveux: string;
  mensurations: string;
  poitrine: string;
  bonnet: string;
  tour_poitrine: string;
  epilation: string;
}

export interface PersonalInfo {
  alcool: string;
  fumeur: string;
  langues: string[];
  orientation: string;
  origine: string;
}

export interface UserProfile {
  id: string;
  user_id?: string; // ID de l'utilisateur dans auth.users (pour conversations)
  name: string;
  firstName?: string; // Prénom (invisible)
  lastName?: string; // Nom (invisible)
  username?: string; // Pseudo (visible)
  location: string;
  description: string;
  interests: string[];
  photos: string[];
  physicalInfo: PhysicalInfo;
  personalInfo: PersonalInfo;
  prestations: string;
  userType: UserType;
  phone?: string; // Ajout du champ téléphone
  is_active?: boolean; // Profil actif ou désactivé
  is_admin?: boolean; // Droits d'administration
  rating?: number;
  reviews?: Review[];
  avatar?: string;
  bio?: string;
  premium?: boolean;
  online?: boolean;
  age?: number;
  languages?: string[];
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationType = 'message' | 'comment' | 'payment' | 'like';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  date: Date;
  read: boolean;
  link?: string;
}

export type PaymentMethod = 'card' | 'bank' | 'paypal' | 'wallet';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  method?: PaymentMethod;
  status?: TransactionStatus;
  timestamp?: Date;
}

export interface Message {
  id: number;
  text: string;
  isOwn: boolean;
  timestamp: Date;
  sender: {
    name: string;
    photo: string;
  };
}

export interface Conversation {
  id: number;
  with: {
    name: string;
    photo: string;
    lastMessage: string;
    timestamp: Date;
    unread: number;
  };
}

export type View = 'home' | 'profile' | 'messages' | 'login' | 'wallet' | 'subscription';

export interface Review {
  id: number;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  date: Date;
}

export interface Post {
  id: string;
  userId: string;
  user_id: string;
  caption: string;
  location: string;
  tags: string[];
  photos: string[];
  thumbnails?: string[];
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_boosted?: boolean;
  user?: {
    id: string;
    user_id: string;
    name: string;
    username?: string;
    photos: string[];
    rating: number;
    location?: string;
    description?: string;
    physicalInfo?: any;
    personalInfo?: any;
    prestations?: string;
    subscription_tier?: string;
  };
}