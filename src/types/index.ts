export type MediaType = 'anime' | 'movie' | 'tv' | 'music';

export type WatchStatus = 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  posterUrl: string;
  bannerUrl?: string;
  genres: string[];
  releaseYear: number;
  status: WatchStatus;
  
  // Episode & Duration Info
  totalEpisodes?: number; // for anime & tv (movies = 1)
  watchedEpisodes: number;
  episodeDurationMinutes: number; // e.g. 24 for anime, 50 for tv, 148 for movie
  totalRuntimeMinutes?: number; // computed or fixed for movie
  
  // User Personal Data
  userRating?: number; // 1 to 10
  review?: string;
  reviewDate?: string;
  isSpoiler?: boolean;
  notes?: string;
  rewatchCount: number;
  favorite: boolean;
  customListIds: string[];
  
  // Media details
  synopsis?: string;
  studioOrDirector?: string;
  tags?: string[]; // Custom tags e.g. 'Must Watch Again', 'Slow Burn', 'Masterpiece'
  scoreMAL?: number; // External score if imported
  scoreIMDB?: number;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SyncWatchlistUpdate {
  mediaId: string;
  title: string;
  type: MediaType;
  posterUrl: string;
  source: 'anilist' | 'tvmaze' | 'mal' | 'simkl' | 'spotify';
  previousEpisode: number;
  newEpisode: number;
  totalEpisodes?: number;
  minutesAdded: number;
  status: WatchStatus;
  notes: string;
}

export interface SyncWatchlistResult {
  success: boolean;
  syncedAt: string;
  totalItemsChecked: number;
  updatedItemsCount: number;
  totalMinutesAdded: number;
  updates: SyncWatchlistUpdate[];
  message: string;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or lucide icon name
  color: string;
  isPublic: boolean;
  createdAt: string;
  itemCount?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'anime' | 'movie' | 'tv' | 'music' | 'general' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

export interface UserProfile {
  id: string;
  email?: string;
  isLoggedIn?: boolean;
  username: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  rankTitle: string;
  joinedDate: string;
  favoriteMediaIds: string[]; // Up to 4 pinned items
  weeklyWatchGoalHours?: number; // Target hours per week (e.g. 15)
  socialLinks: {
    mal?: string;
    spotify?: string;
    letterboxd?: string;
    twitter?: string;
  };
  connectedAccounts: {
    spotify: {
      connected: boolean;
      username?: string;
      totalListeningMinutes: number;
      topArtists: string[];
      topTracks: { title: string; artist: string; durationMinutes: number }[];
      syncedAt?: string;
    };
    mal: {
      connected: boolean;
      username?: string;
      syncedAt?: string;
      importedCount?: number;
    };
  };
}

export interface ActivityLog {
  id: string;
  mediaId: string;
  mediaTitle: string;
  mediaType: MediaType;
  posterUrl: string;
  action: 'started' | 'episode_watched' | 'completed' | 'rated' | 'reviewed';
  details?: string;
  timestamp: string;
}

export interface WatchTimeStats {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  
  animeMinutes: number;
  animeEpisodes: number;
  
  tvMinutes: number;
  tvEpisodes: number;
  
  movieMinutes: number;
  moviesWatched: number;
  
  musicMinutes: number;
  musicTracks: number;
  
  remainingWatchMinutes: number; // for currently watching & plan_to_watch
  completionRate: number; // percentage of completed vs total items
}

export interface RealWorldComparison {
  title: string;
  value: string;
  icon: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  recommendedMedia?: Partial<MediaItem>[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  posterUrl: string;
  bannerUrl?: string;
  genres: string[];
  releaseYear: number;
  totalEpisodes?: number;
  episodeDurationMinutes: number;
  totalRuntimeMinutes?: number;
  scoreIMDB?: number;
  scoreMAL?: number;
  matchScore: number; // e.g. 96 (%)
  reason: string; // "İzlediğin Steins;Gate ve Interstellar yapımlarına benzer zaman paradoksları içerir."
  synopsis: string;
  studioOrDirector?: string;
  tags: string[];
  estimatedFinishTime?: string; // "4 saat 48 dakika"
}

export interface GenreBreakdown {
  genre: string;
  minutes: number;
  hours: number;
  percentage: number;
  itemCount: number;
  color: string;
}
