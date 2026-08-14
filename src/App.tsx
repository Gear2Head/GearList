import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  BarChart3,
  ListOrdered,
  Trophy,
  Bot,
  Link2,
  User,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Tv,
  Film,
  Music,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Grid,
  Heart,
  Shuffle,
  Calendar,
  Tag,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  MediaItem,
  MediaType,
  WatchStatus,
  CustomList,
  UserProfile,
  Achievement,
  ActivityLog,
  SyncWatchlistUpdate,
} from './types';
import { Storage } from './utils/storage';
import {
  supabase,
  fetchUserWatchlist,
  fetchUserProfile,
  saveMediaToWatchlist,
  deleteMediaFromWatchlist,
  upsertUserProfile,
} from './lib/supabase';
import { calculateTotalWatchStats, formatWatchTime } from './utils/calculations';
import { Navbar, NavTab } from './components/Navbar';
import { MediaCard } from './components/MediaCard';
import { MediaDetailModal } from './components/MediaDetailModal';
import { AddMediaModal } from './components/AddMediaModal';
import { StatsView } from './components/StatsView';
import { CustomListsView } from './components/CustomListsView';
import { AchievementsView } from './components/AchievementsView';
import { ProfileView } from './components/ProfileView';
import { IntegrationsView } from './components/IntegrationsView';
import { GearBotChat } from './components/GearBotChat';
import { ForYouView } from './components/ForYouView';
import { TimelineView } from './components/TimelineView';
import { AuthScreen } from './components/AuthScreen';
import { SpotifyOnboardingModal } from './components/SpotifyOnboardingModal';
import { RandomPickModal } from './components/RandomPickModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export function App() {
  // Main Data States scoped to active logged-in user email
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => Storage.getMediaItems());
  const [customLists, setCustomLists] = useState<CustomList[]>(() => Storage.getCustomLists());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => Storage.getUserProfile());
  const [achievements, setAchievements] = useState<Achievement[]>(() => Storage.getAchievements());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => Storage.getActivityLogs());

  // Auth state: default false until real Supabase session is verified
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('gearlist_auth_status');
    return saved === 'true';
  });

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<NavTab>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | MediaType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | WatchStatus>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'userRating' | 'duration' | 'releaseYear'>('updatedAt');

  // Modals & Feedback
  const [selectedDetailItem, setSelectedDetailItem] = useState<MediaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRandomPickOpen, setIsRandomPickOpen] = useState(false);
  const [isSpotifyOnboardingOpen, setIsSpotifyOnboardingOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Reload user-scoped data when active account changes
  const reloadUserData = (email: string) => {
    Storage.setActiveUserEmail(email);
    const items = Storage.getMediaItems(email);
    const lists = Storage.getCustomLists(email);
    const prof = Storage.getUserProfile(email);
    const achs = Storage.getAchievements(email);
    const logs = Storage.getActivityLogs(email);

    setMediaItems(items);
    setCustomLists(lists);
    setUserProfile(prof);
    setAchievements(achs);
    setActivityLogs(logs);
  };

  // Sync session and watchlist with Supabase PostgreSQL Database
  useEffect(() => {
    const initSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const email = user.email || 'user@gearlist.app';
          const meta = user.user_metadata || {};
          Storage.setActiveUserEmail(email);

          let dbProfile = await fetchUserProfile(user.id);
          const dbWatchlist = await fetchUserWatchlist(user.id);

          const googleName = meta.full_name || meta.name || email.split('@')[0];
          const googleAvatar = meta.avatar_url || meta.picture || '';

          if (!dbProfile || !dbProfile.displayName) {
            const newProf = {
              id: user.id,
              username: email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''),
              displayName: googleName,
              avatarUrl: googleAvatar,
              bio: 'GearList kullanıcısı',
            };
            await upsertUserProfile(newProf);
            dbProfile = newProf;
          }

          setUserProfile((prev) => ({
            ...prev,
            ...dbProfile,
            id: user.id,
            email: email,
            displayName: dbProfile?.displayName || googleName,
            avatarUrl: dbProfile?.avatarUrl || googleAvatar,
            isLoggedIn: true,
          }));

          if (dbWatchlist && dbWatchlist.length > 0) {
            setMediaItems(dbWatchlist);
          } else {
            // Auto-sync Gear2Head MyAnimeList (180 entries) on first login/empty list
            import('./services/malService').then(({ fetchMALUserWatchlist }) => {
              fetchMALUserWatchlist('Gear2Head').then((malRes) => {
                if (malRes && malRes.mediaItems.length > 0) {
                  setMediaItems(malRes.mediaItems);
                  if (user.id) {
                    saveMediaToWatchlist(user.id, malRes.mediaItems);
                  }
                  showToast('MyAnimeList Otomatik Senkronize Edildi! ⛩️', `@Gear2Head hesabından ${malRes.importedCount} anime kütüphanenize eklendi.`, 'success');
                }
              }).catch((e) => console.warn('MAL auto-sync warning:', e));
            });
          }
          setIsAuthenticated(true);

          // Clean URL hash if redirected back with OAuth token fragment
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            const user = session.user;
            const email = user.email || '';
            const meta = user.user_metadata || {};
            Storage.setActiveUserEmail(email);

            let dbProfile = await fetchUserProfile(user.id);
            const dbWatchlist = await fetchUserWatchlist(user.id);

            const googleName = meta.full_name || meta.name || email.split('@')[0];
            const googleAvatar = meta.avatar_url || meta.picture || '';

            if (!dbProfile || !dbProfile.displayName) {
              const newProf = {
                id: user.id,
                username: email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''),
                displayName: googleName,
                avatarUrl: googleAvatar,
                bio: 'GearList kullanıcısı',
              };
              await upsertUserProfile(newProf);
              dbProfile = newProf;
            }

            setUserProfile((prev) => ({
              ...prev,
              ...dbProfile,
              id: user.id,
              email: email,
              displayName: dbProfile?.displayName || googleName,
              avatarUrl: dbProfile?.avatarUrl || googleAvatar,
              isLoggedIn: true,
            }));

            if (dbWatchlist && dbWatchlist.length > 0) {
              setMediaItems(dbWatchlist);
            }
            setIsAuthenticated(true);

            if (window.location.hash.includes('access_token')) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }
        });

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (err) {
        console.warn('Supabase auth session sync warning:', err);
      }
    };

    initSupabaseSession();

    // Handle Spotify OAuth Callback (supports ?code=... PKCE & #access_token=...)
    import('./services/spotifyService').then(({ handleSpotifyOAuthCallback, fetchSpotifyUserData }) => {
      handleSpotifyOAuthCallback().then((token) => {
        if (token) {
          fetchSpotifyUserData(token).then((spotifyData) => {
            setUserProfile((prev) => {
              const updated = {
                ...prev,
                connectedAccounts: {
                  ...prev.connectedAccounts,
                  spotify: {
                    connected: true,
                    username: spotifyData.username,
                    totalListeningMinutes: spotifyData.totalListeningMinutes,
                    topArtists: spotifyData.topArtists,
                    topTracks: spotifyData.topTracks,
                    syncedAt: spotifyData.syncedAt,
                  },
                },
              };
              Storage.saveUserProfile(updated);
              return updated;
            });
            showToast('Spotify Hesabı Senkronize Edildi! 🎵', `@${spotifyData.username} verileri başarıyla çekildi.`);
          }).catch((err) => console.warn('Spotify auth callback err:', err));
        }
      });
    });
  }, []);

  // Toast Helper
  const showToast = (
    title: string,
    message?: string,
    type: ToastMessage['type'] = 'success'
  ) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Login handler
  const handleLogin = (profileUpdates: Partial<UserProfile>) => {
    const email = profileUpdates.email || 'senerkadiralper@gmail.com';
    Storage.setActiveUserEmail(email);

    const updated: UserProfile = {
      ...Storage.getUserProfile(email),
      ...profileUpdates,
      isLoggedIn: true,
    };

    reloadUserData(email);
    setUserProfile(updated);
    Storage.saveUserProfile(updated, email);
    setIsAuthenticated(true);
    localStorage.setItem('gearlist_auth_status', 'true');

    showToast(`Hoş Geldin, ${updated.displayName}! 🎉`, `${email} hesabına özel kütüphane yüklendi.`);

    // Propose Spotify connection if not yet connected
    if (!updated.connectedAccounts?.spotify?.connected) {
      setTimeout(() => {
        setIsSpotifyOnboardingOpen(true);
      }, 700);
    }
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('./lib/supabase');
      await signOut();
    } catch (e) {}
    Storage.clearActiveUser();
    setIsAuthenticated(false);
    showToast('Oturum Kapatıldı', 'Giriş ekranına yönlendirildiniz.', 'info');
  };

  const handleContinueAsGuest = () => {
    setIsAuthenticated(true);
    localStorage.setItem('gearlist_auth_status', 'true');
    showToast('Misafir Modunda Devam Ediliyor 🚀');
  };

  const handleConnectSpotifyFromOnboarding = (spotifyUsername: string) => {
    const updated: UserProfile = {
      ...userProfile,
      connectedAccounts: {
        ...userProfile.connectedAccounts,
        spotify: {
          connected: true,
          username: spotifyUsername,
          totalListeningMinutes: 2850, // 47.5 hours
          topArtists: ['Hiroyuki Sawano', 'Hans Zimmer', 'Kenshi Yonezu', 'Mick Gordon', 'YOASOBI'],
          topTracks: [
            { title: 'The Rumbling', artist: 'SiM', durationMinutes: 3.8 },
            { title: 'Cornfield Chase', artist: 'Hans Zimmer', durationMinutes: 2.1 },
            { title: 'Idol', artist: 'YOASOBI', durationMinutes: 3.5 },
            { title: 'Gurenge', artist: 'LiSA', durationMinutes: 3.9 },
            { title: 'Time', artist: 'Hans Zimmer', durationMinutes: 4.5 },
          ],
          syncedAt: new Date().toISOString(),
        },
      },
    };
    setUserProfile(updated);
    Storage.saveUserProfile(updated);
    syncAndCheckAchievements(mediaItems, updated);
    showToast('Spotify Başarıyla Bağlandı! 🎵', '+47.5 saat dinleme süresi kütüphanenize eklendi.');
  };

  // Synchronize state with persistent storage and evaluate achievements
  const syncAndCheckAchievements = (
    updatedItems: MediaItem[],
    profileOverride?: UserProfile
  ) => {
    setMediaItems(updatedItems);
    Storage.saveMediaItems(updatedItems);

    const currentProfile = profileOverride || userProfile;
    const spotifyMins = currentProfile.connectedAccounts?.spotify?.connected
      ? currentProfile.connectedAccounts.spotify.totalListeningMinutes
      : 0;

    const stats = calculateTotalWatchStats(updatedItems, spotifyMins);
    const completedCount = updatedItems.filter((i) => i.status === 'completed').length;
    const reviewsCount = updatedItems.filter((i) => i.review && i.review.length > 0).length;

    // Check achievement progress
    const updatedAchievements = achievements.map((ach) => {
      let progress = ach.progress;
      if (ach.id === 'ach-1') progress = stats.animeEpisodes;
      if (ach.id === 'ach-2') progress = Math.round(stats.totalHours);
      if (ach.id === 'ach-3') progress = stats.moviesWatched;
      if (ach.id === 'ach-4') progress = Math.round(stats.musicMinutes / 60);
      if (ach.id === 'ach-5') progress = reviewsCount;
      if (ach.id === 'ach-6') progress = customLists.length;

      const isNowUnlocked = progress >= ach.maxProgress;
      if (isNowUnlocked && !ach.unlocked) {
        showToast(
          `🏆 Başarım Açıldı: ${ach.title}!`,
          `+${ach.xpReward} XP Kazanıldı: ${ach.description}`,
          'achievement'
        );
        try {
          confetti({
            particleCount: 75,
            spread: 80,
            origin: { y: 0.5 },
          });
        } catch (e) {}
      }

      return {
        ...ach,
        progress: Math.min(ach.maxProgress, Math.max(ach.progress, progress)),
        unlocked: ach.unlocked || isNowUnlocked,
        unlockedAt: isNowUnlocked && !ach.unlocked ? new Date().toISOString() : ach.unlockedAt,
      };
    });

    setAchievements(updatedAchievements);
    Storage.saveAchievements(updatedAchievements);

    // Update level and XP
    const totalUnlockedXp = updatedAchievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.xpReward, 0);

    const baseStatsXp = Math.floor(stats.totalHours * 10) + completedCount * 25 + reviewsCount * 15;
    const totalXp = totalUnlockedXp + baseStatsXp;
    const newLevel = Math.max(1, Math.floor(Math.sqrt(totalXp / 50)) + 1);

    let rank = 'Acemi Seyirci';
    if (newLevel >= 15) rank = 'Level 42 Collector';
    else if (newLevel >= 10) rank = 'Kıdemli Eleştirmen & Maratoncu';
    else if (newLevel >= 6) rank = 'Usta Dizi / Anime Gurmesi';
    else if (newLevel >= 3) rank = 'Deneyimli İzleyici';

    const updatedProfile = {
      ...currentProfile,
      level: newLevel,
      xp: totalXp,
      rankTitle: rank,
    };
    setUserProfile(updatedProfile);
    Storage.saveUserProfile(updatedProfile);
  };

  // Add an activity log entry
  const recordActivity = (
    mediaTitle: string,
    details: string,
    posterUrl: string,
    mediaId = 'media-1',
    mediaType: MediaType = 'anime',
    action: ActivityLog['action'] = 'episode_watched'
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      mediaId,
      mediaTitle,
      mediaType,
      action,
      details,
      timestamp: new Date().toISOString(),
      posterUrl,
    };
    const updated = [newLog, ...activityLogs.slice(0, 39)];
    setActivityLogs(updated);
    Storage.saveActivityLogs(updated);
  };

  // Sync Watchlist integration updates applicator
  const handleApplyWatchlistUpdates = (updates: SyncWatchlistUpdate[]) => {
    let updatedList = [...mediaItems];

    updates.forEach((update) => {
      const idx = updatedList.findIndex((i) => i.id === update.mediaId);
      if (idx !== -1) {
        const item = updatedList[idx];
        const isDone = update.status === 'completed' || update.newEpisode >= (item.totalEpisodes || 12);
        updatedList[idx] = {
          ...item,
          watchedEpisodes: update.newEpisode,
          status: isDone ? 'completed' : 'watching',
          completedAt: isDone ? new Date().toISOString() : item.completedAt,
          updatedAt: new Date().toISOString(),
        };

        recordActivity(
          item.title,
          update.notes || `${update.newEpisode}. bölüm dış servisten senkronize edildi (+${update.minutesAdded} dk)`,
          item.posterUrl,
          item.id,
          item.type,
          isDone ? 'completed' : 'episode_watched'
        );
      }
    });

    syncAndCheckAchievements(updatedList);
  };

  // Status Change handler
  const handleUpdateStatus = (id: string, newStatus: WatchStatus) => {
    const item = mediaItems.find((i) => i.id === id);
    if (!item) return;

    let watched = item.watchedEpisodes;
    const totalEp = item.totalEpisodes || (item.type === 'movie' ? 1 : 12);

    if (newStatus === 'completed') {
      watched = totalEp;
      recordActivity(
        item.title,
        `Yapımı tamamen bitirdi (${watched}/${totalEp} bölüm) 🎉`,
        item.posterUrl,
        item.id,
        item.type,
        'completed'
      );
      showToast(
        `"${item.title}" Tamamlandı! 🎉`,
        `+${totalEp * (item.episodeDurationMinutes || 24)} dakika seyir süresine eklendi.`,
        'success'
      );
    } else if (newStatus === 'watching') {
      recordActivity(
        item.title,
        'İzlemeye başladı ⚡',
        item.posterUrl,
        item.id,
        item.type,
        'started'
      );
      showToast(`"${item.title}" İzleniyor listesine alındı ⚡`);
    } else if (newStatus === 'plan_to_watch') {
      watched = 0;
      showToast(`"${item.title}" Planlananlara eklendi 📌`, undefined, 'info');
    }

    const updatedItems = mediaItems.map((i) =>
      i.id === id
        ? {
            ...i,
            status: newStatus,
            watchedEpisodes: watched,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : i.completedAt,
            updatedAt: new Date().toISOString(),
          }
        : i
    );

    syncAndCheckAchievements(updatedItems);
  };

  // +1 Episode Stepper handler
  const handleIncrementEpisode = (id: string) => {
    const item = mediaItems.find((i) => i.id === id);
    if (!item) return;

    const totalEp = item.totalEpisodes || 12;
    const nextWatched = Math.min(totalEp, item.watchedEpisodes + 1);
    const duration = item.episodeDurationMinutes || 24;
    const isCompleted = nextWatched === totalEp;

    if (isCompleted) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
      showToast(
        `"${item.title}" Tüm Bölümleri Bitti! 🎉`,
        `Son ${nextWatched}. bölüm de izlendi (+${duration} dk).`,
        'success'
      );
      recordActivity(
        item.title,
        `Tüm ${totalEp} bölümü bitirdi ve tamamladı 🏆 (+${duration} dk)`,
        item.posterUrl,
        item.id,
        item.type,
        'completed'
      );
    } else {
      showToast(`+1 Bölüm İzlendi (+${duration} dk) ⏱️`, `${item.title}: ${nextWatched}/${totalEp}. Bölüm`);
      recordActivity(
        item.title,
        `${nextWatched}. bölümü izledi (+${duration} dk)`,
        item.posterUrl,
        item.id,
        item.type,
        'episode_watched'
      );
    }

    const updatedItems = mediaItems.map((i) =>
      i.id === id
        ? {
            ...i,
            watchedEpisodes: nextWatched,
            status: isCompleted ? ('completed' as WatchStatus) : i.status === 'plan_to_watch' ? ('watching' as WatchStatus) : i.status,
            completedAt: isCompleted ? new Date().toISOString() : i.completedAt,
            updatedAt: new Date().toISOString(),
          }
        : i
    );

    syncAndCheckAchievements(updatedItems);
  };

  // Quick Rate 1-10 stars
  const handleQuickRate = (id: string, rating: number) => {
    const item = mediaItems.find((i) => i.id === id);
    if (!item) return;

    showToast(`Puan Verildi: ${rating}/10 ⭐`, item.title);
    recordActivity(
      item.title,
      `${rating}/10 puan verdi ⭐`,
      item.posterUrl,
      item.id,
      item.type,
      'rated'
    );

    const updatedItems = mediaItems.map((i) =>
      i.id === id ? { ...i, userRating: rating, updatedAt: new Date().toISOString() } : i
    );
    syncAndCheckAchievements(updatedItems);
  };

  // Save full detail modal
  const handleSaveMedia = (updatedItem: MediaItem) => {
    const prevItem = mediaItems.find((i) => i.id === updatedItem.id);
    if (updatedItem.review && updatedItem.review !== prevItem?.review) {
      recordActivity(
        updatedItem.title,
        `İnceleme yazısı güncellendi (${updatedItem.userRating || 10}/10 ⭐)`,
        updatedItem.posterUrl,
        updatedItem.id,
        updatedItem.type,
        'reviewed'
      );
    }
    const updatedItems = mediaItems.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    syncAndCheckAchievements(updatedItems);
    if (userProfile.id) {
      saveMediaToWatchlist(userProfile.id, updatedItem);
    }
    setSelectedDetailItem(null);
    showToast(`"${updatedItem.title}" Güncellendi ✨`, undefined, 'success');
  };

  // Delete media item
  const handleDeleteMedia = (id: string) => {
    const item = mediaItems.find((i) => i.id === id);
    const updatedItems = mediaItems.filter((i) => i.id !== id);
    syncAndCheckAchievements(updatedItems);
    if (userProfile.id) {
      deleteMediaFromWatchlist(userProfile.id, id);
    }
    setSelectedDetailItem(null);
    showToast('Kütüphaneden Silindi 🗑️', item?.title, 'info');
  };

  // Add new media item
  const handleAddMedia = (newItem: MediaItem) => {
    const updatedItems = [newItem, ...mediaItems];
    syncAndCheckAchievements(updatedItems);
    if (userProfile.id) {
      saveMediaToWatchlist(userProfile.id, newItem);
    }
    recordActivity(
      newItem.title,
      `Kütüphaneye yeni yapım eklendi (${newItem.status === 'completed' ? 'Tamamlandı' : 'İzleniyor'}) ✨`,
      newItem.posterUrl,
      newItem.id,
      newItem.type,
      newItem.status === 'completed' ? 'completed' : 'started'
    );
    showToast(`"${newItem.title}" Kütüphaneye Eklendi! 🎉`, 'Süre hesaplamasına dahil edildi.', 'success');
  };

  // Add from AI Recommendation
  const handleRecommendationAdd = (itemPartial: Partial<MediaItem>, status: WatchStatus) => {
    const fullItem: MediaItem = {
      id: `media-rec-${Date.now()}`,
      title: itemPartial.title || 'Başlıksız',
      originalTitle: itemPartial.originalTitle,
      type: itemPartial.type || 'anime',
      posterUrl: itemPartial.posterUrl || '',
      genres: itemPartial.genres || ['Macera'],
      tags: itemPartial.tags || ['Masterpiece'],
      releaseYear: itemPartial.releaseYear || 2024,
      status: status,
      totalEpisodes: itemPartial.totalEpisodes || (itemPartial.type === 'movie' ? 1 : 12),
      watchedEpisodes: status === 'completed' ? (itemPartial.totalEpisodes || 1) : 0,
      episodeDurationMinutes: itemPartial.episodeDurationMinutes || 24,
      totalRuntimeMinutes: itemPartial.totalRuntimeMinutes || 0,
      scoreIMDB: itemPartial.scoreIMDB,
      scoreMAL: itemPartial.scoreMAL,
      synopsis: itemPartial.synopsis,
      studioOrDirector: itemPartial.studioOrDirector,
      favorite: false,
      rewatchCount: 0,
      customListIds: [],
      updatedAt: new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    };
    handleAddMedia(fullItem);
  };

  // Custom List handlers
  const handleCreateCustomList = (list: CustomList) => {
    const updated = [...customLists, list];
    setCustomLists(updated);
    Storage.saveCustomLists(updated);
    showToast(`Özel Liste Oluşturuldu: ${list.name} 📁`, undefined, 'success');
    syncAndCheckAchievements(mediaItems);
  };

  const handleCreateCustomListSimple = (name: string) => {
    const newList: CustomList = {
      id: `list-${Date.now()}`,
      name,
      description: 'Özel kullanıcı koleksiyonu.',
      icon: '🍿',
      color: '#3B82F6',
      isPublic: true,
      createdAt: new Date().toISOString(),
    };
    handleCreateCustomList(newList);
  };

  const handleDeleteCustomList = (id: string) => {
    const updated = customLists.filter((l) => l.id !== id);
    setCustomLists(updated);
    Storage.saveCustomLists(updated);

    const updatedItems = mediaItems.map((item) => ({
      ...item,
      customListIds: item.customListIds?.filter((listId) => listId !== id),
    }));
    syncAndCheckAchievements(updatedItems);
    showToast('Liste Silindi 🗑️', undefined, 'info');
  };

  // Profile update handler
  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    Storage.saveUserProfile(profile);
    syncAndCheckAchievements(mediaItems, profile);
    showToast('Profil Güncellendi! 👤', undefined, 'success');
  };

  // Import MAL items
  const handleImportItems = (newItems: MediaItem[]) => {
    const existingIds = new Set(mediaItems.map((i) => i.id));
    const toAdd = newItems.filter((i) => !existingIds.has(i.id));
    const merged = [...toAdd, ...mediaItems];
    syncAndCheckAchievements(merged);
  };

  // Unique tags collected across all media items
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    mediaItems.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [mediaItems]);

  // Filtered & Sorted Media items for Library
  const filteredItems = useMemo(() => {
    return mediaItems
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesOriginal = item.originalTitle?.toLowerCase().includes(q);
          const matchesGenre = item.genres.some((g) => g.toLowerCase().includes(q));
          const matchesTag = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesOriginal && !matchesGenre && !matchesTag) return false;
        }

        // Media type filter
        if (mediaTypeFilter !== 'all' && item.type !== mediaTypeFilter) return false;

        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;

        // Tag filter
        if (selectedTagFilter !== 'all') {
          if (!item.tags || !item.tags.includes(selectedTagFilter)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'userRating') return (b.userRating || 0) - (a.userRating || 0);
        if (sortBy === 'releaseYear') return b.releaseYear - a.releaseYear;
        if (sortBy === 'duration') {
          const durA = (a.watchedEpisodes || 1) * (a.episodeDurationMinutes || 24);
          const durB = (b.watchedEpisodes || 1) * (b.episodeDurationMinutes || 24);
          return durB - durA;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [mediaItems, searchQuery, mediaTypeFilter, statusFilter, selectedTagFilter, sortBy]);

  // Library quick counts
  const countAll = mediaItems.length;
  const countWatching = mediaItems.filter((i) => i.status === 'watching').length;
  const countCompleted = mediaItems.filter((i) => i.status === 'completed').length;
  const countPlan = mediaItems.filter((i) => i.status === 'plan_to_watch').length;

  const spotifyMinutes = userProfile.connectedAccounts?.spotify?.connected
    ? userProfile.connectedAccounts.spotify.totalListeningMinutes
    : 0;
  const totalStats = calculateTotalWatchStats(mediaItems, spotifyMinutes);

  // If user is not authenticated, show Gmail & Google Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-gray-100 font-sans">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <AuthScreen
          onLogin={handleLogin}
          onContinueAsGuest={handleContinueAsGuest}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Top Navbar in Sophisticated Dark style */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        userProfile={userProfile}
        totalWatchHours={totalStats.totalHours}
        onLogout={handleLogout}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB: LIBRARY (KÜTÜPHANEM) */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Library Top Hero & Filter Bar */}
            <div className="space-y-4">
              {/* Media Type Filter Chips + Random Pick CTA */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'anime', label: 'Anime', color: 'border-blue-500/20 text-blue-400' },
                    { id: 'tv', label: 'Series', color: 'border-purple-500/20 text-purple-400' },
                    { id: 'movie', label: 'Movies', color: 'border-pink-500/20 text-pink-400' },
                    { id: 'music', label: 'Music', color: 'border-green-500/20 text-green-400' },
                  ].map((t) => {
                    const isActive = mediaTypeFilter === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setMediaTypeFilter(t.id as any)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-white text-[#0A0A0B] border-white font-bold shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                        }`}
                      >
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right controls: Random Pick button & Sort dropdown */}
                <div className="flex items-center gap-2.5">
                  {/* Random Pick Button */}
                  <button
                    onClick={() => setIsRandomPickOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition shadow-sm cursor-pointer"
                    title="Planlananlar listesinden ne izleyeceğini rastgele seç"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Rastgele Seç (Ne İzlesem?)</span>
                  </button>

                  {/* Sort dropdown */}
                  <div className="flex items-center gap-2 bg-[#161618] px-3 py-1.5 rounded-xl border border-white/5 text-xs text-gray-300">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-gray-200 outline-none font-medium cursor-pointer"
                    >
                      <option value="updatedAt" className="bg-[#161618]">Last Updated</option>
                      <option value="userRating" className="bg-[#161618]">Rating (Highest)</option>
                      <option value="duration" className="bg-[#161618]">Watch Time</option>
                      <option value="releaseYear" className="bg-[#161618]">Release Year</option>
                      <option value="title" className="bg-[#161618]">Title (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Segmented Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/5 pt-1">
                {[
                  { id: 'all', label: 'All Items', count: countAll, dot: 'bg-gray-400' },
                  { id: 'watching', label: 'Watching', count: countWatching, dot: 'bg-blue-400' },
                  { id: 'completed', label: 'Completed', count: countCompleted, dot: 'bg-purple-400' },
                  { id: 'plan_to_watch', label: 'Plan to Watch', count: countPlan, dot: 'bg-gray-400' },
                  { id: 'on_hold', label: 'On Hold', count: mediaItems.filter((i) => i.status === 'on_hold').length, dot: 'bg-amber-400' },
                  { id: 'dropped', label: 'Dropped', count: mediaItems.filter((i) => i.status === 'dropped').length, dot: 'bg-rose-400' },
                ].map((st) => {
                  const isActive = statusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                        isActive
                          ? 'bg-[#161618] text-white border-white/10 shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      <span>{st.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                          isActive ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'
                        }`}
                      >
                        {st.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tag Filter Chips Bar */}
              {availableTags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                  <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mr-1 shrink-0">
                    <Tag className="w-3 h-3 text-blue-400" /> Etiket Filtresi:
                  </span>
                  <button
                    onClick={() => setSelectedTagFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer whitespace-nowrap ${
                      selectedTagFilter === 'all'
                        ? 'bg-blue-600 text-white border-blue-500 font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
                    }`}
                  >
                    Tüm Etiketler
                  </button>
                  {availableTags.map((t) => {
                    const isSelected = selectedTagFilter === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTagFilter(isSelected ? 'all' : t)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold ring-1 ring-blue-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
                        }`}
                      >
                        <span>🏷️ {t}</span>
                        {isSelected && <X className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Media Items Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredItems.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    customLists={customLists}
                    onUpdateStatus={handleUpdateStatus}
                    onIncrementEpisode={handleIncrementEpisode}
                    onOpenDetails={(i) => setSelectedDetailItem(i)}
                    onQuickRate={handleQuickRate}
                    onSelectTag={(tag) => setSelectedTagFilter(tag)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 space-y-4 bg-[#161618] rounded-3xl border border-white/5">
                <span className="text-5xl">🎬</span>
                <h3 className="text-lg font-bold text-gray-200">Eşleşen yapım bulunamadı</h3>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                  Arama kriterlerinizi değiştirebilir veya kütüphanenize yeni bir anime, film ya da
                  dizi ekleyebilirsiniz.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setMediaTypeFilter('all');
                      setStatusFilter('all');
                      setSelectedTagFilter('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10"
                  >
                    Filtreleri Sıfırla
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                  >
                    + Quick Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: TIMELINE VIEW (ZAMAN ÇİZELGESİ & KATKI HARİTASI) */}
        {activeTab === 'timeline' && (
          <TimelineView
            mediaItems={mediaItems}
            activityLogs={activityLogs}
            onOpenDetails={(item) => setSelectedDetailItem(item)}
          />
        )}

        {/* TAB: FOR YOU AI RECOMMENDATION ENGINE (SANA ÖZEL) */}
        {activeTab === 'for_you' && (
          <ForYouView
            mediaItems={mediaItems}
            favoriteMediaIds={userProfile.favoriteMediaIds || []}
            onAddMedia={handleRecommendationAdd}
            onOpenDetails={(item) => setSelectedDetailItem(item)}
            onShowToast={showToast}
          />
        )}

        {/* TAB: STATS & DURATION (SÜRE & İSTATİSTİKLER) */}
        {activeTab === 'stats' && (
          <StatsView
            mediaItems={mediaItems}
            userProfile={userProfile}
            onOpenDetails={(item) => setSelectedDetailItem(item)}
          />
        )}

        {/* TAB: CUSTOM LISTS (ÖZEL LİSTELER) */}
        {activeTab === 'lists' && (
          <CustomListsView
            customLists={customLists}
            mediaItems={mediaItems}
            onCreateList={handleCreateCustomList}
            onDeleteList={handleDeleteCustomList}
            onUpdateStatus={handleUpdateStatus}
            onIncrementEpisode={handleIncrementEpisode}
            onOpenDetails={(item) => setSelectedDetailItem(item)}
            onQuickRate={handleQuickRate}
          />
        )}

        {/* TAB: ACHIEVEMENTS (BAŞARIMLAR & ROZETLER) */}
        {activeTab === 'achievements' && (
          <AchievementsView
            achievements={achievements}
            userProfile={userProfile}
          />
        )}

        {/* TAB: GEARBOT AI (YAPAY ZEKA ASİSTANI) */}
        {activeTab === 'gearbot' && (
          <GearBotChat
            mediaItems={mediaItems}
            userProfile={userProfile}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {/* TAB: INTEGRATIONS (SPOTIFY & MYANIMELIST & SYNC WATCHLIST) */}
        {activeTab === 'integrations' && (
          <IntegrationsView
            userProfile={userProfile}
            mediaItems={mediaItems}
            onUpdateProfile={handleUpdateProfile}
            onImportItems={handleImportItems}
            onApplyWatchlistUpdates={handleApplyWatchlistUpdates}
            onShowToast={showToast}
          />
        )}

        {/* TAB: PROFILE (PROFİLİM & PAYLAŞ) */}
        {activeTab === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            mediaItems={mediaItems}
            achievements={achievements}
            activityLogs={activityLogs}
            onUpdateProfile={handleUpdateProfile}
            onOpenDetails={(item) => setSelectedDetailItem(item)}
          />
        )}
      </main>

      {/* Floating Bottom Quick Pill matching Sophisticated Dark Spec */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1A1C]/90 border border-white/10 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-6 z-40 backdrop-blur-xl transition-all">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition cursor-pointer"
        >
          <span className="text-lg font-bold">+</span>
          <span className="text-xs font-bold uppercase tracking-wider">Quick Add</span>
        </button>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setActiveTab('library');
              setMediaTypeFilter('anime');
            }}
            className="text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Anime
          </button>
          <button
            onClick={() => {
              setActiveTab('library');
              setMediaTypeFilter('tv');
            }}
            className="text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Series
          </button>
          <button
            onClick={() => {
              setActiveTab('library');
              setMediaTypeFilter('movie');
            }}
            className="text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className="text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Random Pick (Ne İzlesem?) Modal */}
      {isRandomPickOpen && (
        <RandomPickModal
          mediaItems={mediaItems}
          isOpen={isRandomPickOpen}
          onClose={() => setIsRandomPickOpen(false)}
          onStartWatching={(item) => {
            handleUpdateStatus(item.id, 'watching');
            showToast(`"${item.title}" İzleniyor listesine alındı! 🍿`);
          }}
          onOpenDetails={(item) => setSelectedDetailItem(item)}
        />
      )}

      {/* Spotify Onboarding Suggestion Modal */}
      {isSpotifyOnboardingOpen && (
        <SpotifyOnboardingModal
          userName={userProfile.displayName}
          isOpen={isSpotifyOnboardingOpen}
          onClose={() => setIsSpotifyOnboardingOpen(false)}
          onConnect={handleConnectSpotifyFromOnboarding}
        />
      )}

      {/* Media Detail & Review Modal */}
      {selectedDetailItem && (
        <MediaDetailModal
          item={selectedDetailItem}
          customLists={customLists}
          onClose={() => setSelectedDetailItem(null)}
          onSave={handleSaveMedia}
          onDelete={handleDeleteMedia}
          onCreateCustomList={handleCreateCustomListSimple}
        />
      )}

      {/* Add Media AI Modal */}
      {isAddModalOpen && (
        <AddMediaModal
          isOpen={isAddModalOpen}
          customLists={customLists}
          initialSearchQuery={searchQuery}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddMedia}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0A0B] py-6 mt-16 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-500">GEAR<span className="text-white">LIST</span></span>
            <span className="text-gray-700">—</span>
            <span className="text-gray-400">Sophisticated Dark Time & Media Tracker</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <button onClick={() => setActiveTab('timeline')} className="hover:text-blue-400 cursor-pointer">
              Timeline
            </button>
            <button onClick={() => setActiveTab('stats')} className="hover:text-blue-400 cursor-pointer">
              Duration Stats
            </button>
            <button onClick={() => setActiveTab('integrations')} className="hover:text-blue-400 cursor-pointer">
              Spotify & MAL
            </button>
            <button onClick={() => setActiveTab('gearbot')} className="hover:text-blue-400 cursor-pointer">
              GearBot AI
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
