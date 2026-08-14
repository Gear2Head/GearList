import { MediaItem, CustomList, Achievement, UserProfile } from '../types';

export const INITIAL_CUSTOM_LISTS: CustomList[] = [];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first-step',
    title: 'İlk Adım',
    description: 'Kütüphanene ilk dizi, film veya animeyi ekle.',
    icon: '🚀',
    category: 'general',
    rarity: 'common',
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    xpReward: 100,
  },
  {
    id: 'ach-otaku-apprentice',
    title: 'Otaku Çırağı',
    description: 'En az 25 anime bölümü izle.',
    icon: '⛩️',
    category: 'anime',
    rarity: 'common',
    progress: 0,
    maxProgress: 25,
    unlocked: false,
    xpReward: 250,
  },
  {
    id: 'ach-cinema-lover',
    title: 'Sinema Tutkunu',
    description: '10 uzun metrajlı film bitir.',
    icon: '🎬',
    category: 'movie',
    rarity: 'rare',
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    xpReward: 300,
  },
  {
    id: 'ach-music-head',
    title: 'Müzik Gurmesi',
    description: 'En az 50 saat müzik veya soundtrack dinle.',
    icon: '🎧',
    category: 'music',
    rarity: 'rare',
    progress: 0,
    maxProgress: 50,
    unlocked: false,
    xpReward: 400,
  },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: '',
  email: '',
  isLoggedIn: false,
  username: '',
  displayName: '',
  avatarUrl: '',
  bannerUrl: '',
  bio: '',
  level: 1,
  xp: 0,
  nextLevelXp: 100,
  rankTitle: 'Yeni Üye',
  joinedDate: new Date().toISOString().split('T')[0],
  favoriteMediaIds: [],
  weeklyWatchGoalHours: 10,
  socialLinks: {},
  connectedAccounts: {
    spotify: {
      connected: false,
      totalListeningMinutes: 0,
      topArtists: [],
      topTracks: [],
    },
    mal: {
      connected: false,
    },
  },
};

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [];
