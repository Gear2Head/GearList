import { MediaItem, WatchTimeStats, RealWorldComparison } from '../types';

/**
 * Calculates watch time for Anime items
 * Default episode duration is typically 24 mins unless specified
 */
export function calculateAnimeWatchTime(watchedEpisodes: number, episodeDurationMinutes = 24): number {
  return Math.max(0, watchedEpisodes) * Math.max(1, episodeDurationMinutes);
}

/**
 * Calculates watch time for TV Series
 * Default episode duration is typically 45 mins unless specified
 */
export function calculateTvWatchTime(watchedEpisodes: number, episodeDurationMinutes = 45): number {
  return Math.max(0, watchedEpisodes) * Math.max(1, episodeDurationMinutes);
}

/**
 * Calculates watch time for Movies
 * Considers duration and rewatches (rewatchCount = 0 means watched 1 time if completed)
 */
export function calculateMovieWatchTime(durationMinutes: number, rewatchCount = 0, isCompleted = true): number {
  if (!isCompleted && rewatchCount === 0) return 0;
  const count = Math.max(1, 1 + rewatchCount);
  return Math.max(0, durationMinutes) * count;
}

/**
 * Calculates music listening time
 */
export function calculateMusicListeningTime(minutesListened: number, _tracksCount = 0): number {
  return Math.max(0, minutesListened);
}

/**
 * Calculates remaining time needed to finish in-progress and planned items
 */
export function calculateRemainingTime(items: MediaItem[]): number {
  let remainingMinutes = 0;

  for (const item of items) {
    if (item.status === 'watching' || item.status === 'plan_to_watch') {
      if (item.type === 'movie') {
        remainingMinutes += item.episodeDurationMinutes || item.totalRuntimeMinutes || 120;
      } else if (item.type === 'anime' || item.type === 'tv') {
        const total = item.totalEpisodes || 12;
        const watched = item.watchedEpisodes || 0;
        const left = Math.max(0, total - watched);
        const epDuration = item.episodeDurationMinutes || (item.type === 'anime' ? 24 : 45);
        remainingMinutes += left * epDuration;
      }
    }
  }

  return remainingMinutes;
}

/**
 * Converts ISO timestamps or date strings into human-readable relative time (e.g. '2 saat önce', 'Az önce', '3 gün önce')
 */
export function formatRelativeTime(timestamp: string): string {
  if (!timestamp) return 'Az önce';

  // If already relative format in Turkish or English
  if (
    timestamp.includes('önce') ||
    timestamp.includes('ago') ||
    timestamp.includes('Az önce') ||
    timestamp.includes('Just now')
  ) {
    return timestamp;
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return timestamp;
  }

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 0 || diffSeconds < 60) {
    return 'Az önce';
  }

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) {
    return `${minutes} dakika önce`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} saat önce`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `Dün, ${timeStr}`;
  }
  if (days < 7) {
    return `${days} gün önce`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} hafta önce`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ay önce`;
  }

  const years = Math.floor(days / 365);
  return `${years} yıl önce`;
}


/**
 * Compute all aggregated watch time statistics across media items + connected music
 */
export function calculateTotalWatchStats(items: MediaItem[], spotifyMinutes = 0): WatchTimeStats {
  let animeMinutes = 0;
  let animeEpisodes = 0;
  
  let tvMinutes = 0;
  let tvEpisodes = 0;
  
  let movieMinutes = 0;
  let moviesWatched = 0;

  let musicMinutes = spotifyMinutes;
  let musicTracks = 0;

  let totalCompleted = 0;

  for (const item of items) {
    if (item.status === 'completed') {
      totalCompleted++;
    }

    if (item.type === 'anime') {
      const epMins = item.episodeDurationMinutes || 24;
      const watched = item.watchedEpisodes;
      const rewatchMultiplier = Math.max(1, 1 + (item.rewatchCount || 0));
      animeMinutes += watched * epMins * (item.status === 'completed' ? rewatchMultiplier : 1);
      animeEpisodes += watched * (item.status === 'completed' ? rewatchMultiplier : 1);
    } else if (item.type === 'tv') {
      const epMins = item.episodeDurationMinutes || 45;
      const watched = item.watchedEpisodes;
      const rewatchMultiplier = Math.max(1, 1 + (item.rewatchCount || 0));
      tvMinutes += watched * epMins * (item.status === 'completed' ? rewatchMultiplier : 1);
      tvEpisodes += watched * (item.status === 'completed' ? rewatchMultiplier : 1);
    } else if (item.type === 'movie') {
      const duration = item.episodeDurationMinutes || item.totalRuntimeMinutes || 120;
      if (item.status === 'completed') {
        const movieWatchTime = calculateMovieWatchTime(duration, item.rewatchCount, true);
        movieMinutes += movieWatchTime;
        moviesWatched += Math.max(1, 1 + (item.rewatchCount || 0));
      } else if (item.status === 'watching') {
        movieMinutes += Math.round(duration * 0.5); // Halfway estimate
      }
    } else if (item.type === 'music') {
      const duration = (item.watchedEpisodes * (item.episodeDurationMinutes || 4)) || item.totalRuntimeMinutes || 0;
      musicMinutes += duration;
      musicTracks += item.watchedEpisodes || 1;
    }
  }

  const totalMinutes = animeMinutes + tvMinutes + movieMinutes + musicMinutes;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalDays = Math.round((totalHours / 24) * 10) / 10;

  const remainingWatchMinutes = calculateRemainingTime(items);
  const completionRate = items.length > 0 ? Math.round((totalCompleted / items.length) * 100) : 0;

  return {
    totalMinutes,
    totalHours,
    totalDays,
    animeMinutes,
    animeEpisodes,
    tvMinutes,
    tvEpisodes,
    movieMinutes,
    moviesWatched,
    musicMinutes,
    musicTracks,
    remainingWatchMinutes,
    completionRate,
  };
}

/**
 * Format minutes into readable Gün, Saat, Dakika string
 */
export function formatWatchTime(totalMinutes: number): {
  days: number;
  hours: number;
  minutes: number;
  formattedText: string;
  shortText: string;
} {
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = Math.floor(totalMinutes % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Gün`);
  if (hours > 0) parts.push(`${hours} Saat`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} Dakika`);

  const formattedText = parts.join(' ');
  const shortText = `${days}g ${hours}s ${minutes}d`;

  return { days, hours, minutes, formattedText, shortText };
}

/**
 * Generate fun real world comparisons based on total minutes spent watching/listening
 */
export function getRealWorldComparisons(totalMinutes: number): RealWorldComparison[] {
  const hours = totalMinutes / 60;
  const days = hours / 24;

  const flightTokyo = Math.round((hours / 11.5) * 10) / 10; // Istanbul to Tokyo ~11.5 hours
  const uniSemester = Math.round((hours / 240) * 100) / 100; // ~240 lecture hours per semester
  const espressoCount = Math.floor(totalMinutes / 5); // 5 mins per espresso break
  const booksRead = Math.round((hours / 6) * 10) / 10; // Average book takes ~6 hours
  const earthOrbit = Math.round((hours / 90) * 10) / 10; // ISS orbits Earth every 90 mins (1.5 hr)
  const stepsWalked = Math.round(hours * 4.5 * 1000); // 4.5km/h = ~6000 steps

  return [
    {
      title: 'İstanbul - Tokyo Uçuşu',
      value: `${flightTokyo} kez`,
      icon: '✈️',
      description: 'Bu sürede İstanbul ile Tokyo arasında durmaksızın uçabilirdin.',
    },
    {
      title: 'Üniversite Eğitimi',
      value: `${uniSemester} Dönem`,
      icon: '🎓',
      description: 'Tam bir üniversite yarıyılının ders saatlerine denk.',
    },
    {
      title: 'Kitap Okuma Süresi',
      value: `${booksRead} Roman`,
      icon: '📚',
      description: 'Ortalama 350 sayfalık klasik romanları baştan sona bitirebilirdin.',
    },
    {
      title: 'Espresso Kahve Molası',
      value: `${espressoCount.toLocaleString('tr-TR')} Fincan`,
      icon: '☕',
      description: 'Her biri 5 dakikalık lezzetli kahve sohbetlerine eşdeğer.',
    },
    {
      title: 'Dünya Yörünge Turu',
      value: `${earthOrbit} Tur`,
      icon: '🌍',
      description: 'Uluslararası Uzay İstasyonu ile Dünya çevresini turlama süresi.',
    },
    {
      title: 'Yürüyüş Mesafesi',
      value: `${stepsWalked.toLocaleString('tr-TR')} Adım`,
      icon: '🚶',
      description: 'Sürekli yürüyerek kat edilebilecek tahmini adım sayısı.',
    },
  ];
}

/**
 * Calculate user level, rank and XP based on watch time & activity
 */
export function calculateLevelAndRank(
  totalMinutes: number,
  completedCount: number,
  reviewsCount: number,
  unlockedAchievementsCount: number
): {
  level: number;
  xp: number;
  nextLevelXp: number;
  progressPercent: number;
  rankTitle: string;
} {
  // XP formula: 1 min = 1 XP, 1 completed = 100 XP, 1 review = 50 XP, 1 achievement = 200 XP
  const totalXp = Math.floor(
    totalMinutes +
    completedCount * 100 +
    reviewsCount * 50 +
    unlockedAchievementsCount * 200
  );

  // Level formula: Level = Math.floor(sqrt(XP / 100)) + 1
  const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 150)) + 1);
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 150;
  const nextLevelXp = Math.pow(level, 2) * 150;
  const levelXpSpan = nextLevelXp - currentLevelBaseXp;
  const xpInCurrentLevel = totalXp - currentLevelBaseXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / levelXpSpan) * 100)));

  let rankTitle = 'Seyir Çaylağı';
  if (level >= 30) rankTitle = 'Efsanevi Sinefil & Otaku';
  else if (level >= 25) rankTitle = 'Maraton Üstadı (Grandmaster)';
  else if (level >= 20) rankTitle = 'Kültürel Baş Denetçi';
  else if (level >= 15) rankTitle = 'Binge Efendisi';
  else if (level >= 10) rankTitle = 'Kıdemli Eleştirmen';
  else if (level >= 5) rankTitle = 'Tutkulu İzleyici';
  else if (level >= 2) rankTitle = 'Hevesli Seyirci';

  return {
    level,
    xp: totalXp,
    nextLevelXp,
    progressPercent,
    rankTitle,
  };
}

/**
 * Genre colors lookup for dark theme visualization
 */
const GENRE_COLOR_MAP: Record<string, string> = {
  'Aksiyon': '#3B82F6', // Blue
  'Action': '#3B82F6',
  'Bilimkurgu': '#8B5CF6', // Purple
  'Sci-Fi': '#8B5CF6',
  'Dram': '#EC4899', // Pink
  'Drama': '#EC4899',
  'Macera': '#10B981', // Emerald
  'Adventure': '#10B981',
  'Fantastik': '#F59E0B', // Amber
  'Fantasy': '#F59E0B',
  'Gerilim': '#EF4444', // Red
  'Thriller': '#EF4444',
  'Gizem': '#6366F1', // Indigo
  'Mystery': '#6366F1',
  'Shounen': '#F97316', // Orange
  'Korku': '#DC2626', // Dark Red
  'Horror': '#DC2626',
  'Romantik': '#F43F5E', // Rose
  'Romance': '#F43F5E',
  'Komedi': '#EAB308', // Yellow
  'Comedy': '#EAB308',
  'Animasyon': '#06B6D4', // Cyan
  'Animation': '#06B6D4',
  'Psikolojik': '#A855F7', // Purple
  'Psychological': '#A855F7',
  'Suç': '#64748B', // Slate
  'Crime': '#64748B',
  'Tarih': '#D97706',
  'History': '#D97706',
  'Biyografi': '#14B8A6', // Teal
  'Biography': '#14B8A6',
  'Müzik': '#22C55E', // Green
  'Music': '#22C55E',
};

/**
 * Calculates time spent per genre and returns ranked breakdown
 */
export function calculateGenreBreakdown(items: MediaItem[]): {
  genre: string;
  minutes: number;
  hours: number;
  percentage: number;
  itemCount: number;
  color: string;
}[] {
  const genreMinutesMap: Record<string, { minutes: number; count: number }> = {};
  let totalCalculatedMinutes = 0;

  for (const item of items) {
    let itemMinutes = 0;
    if (item.type === 'anime') {
      const epMins = item.episodeDurationMinutes || 24;
      itemMinutes = (item.watchedEpisodes || 0) * epMins;
    } else if (item.type === 'tv') {
      const epMins = item.episodeDurationMinutes || 45;
      itemMinutes = (item.watchedEpisodes || 0) * epMins;
    } else if (item.type === 'movie') {
      const duration = item.episodeDurationMinutes || item.totalRuntimeMinutes || 120;
      itemMinutes = item.status === 'completed' ? duration * Math.max(1, 1 + (item.rewatchCount || 0)) : (item.status === 'watching' ? duration * 0.5 : 0);
    } else if (item.type === 'music') {
      itemMinutes = item.totalRuntimeMinutes || ((item.watchedEpisodes || 1) * 4);
    }

    if (itemMinutes > 0) {
      const itemGenres = item.genres && item.genres.length > 0 ? item.genres : ['Diğer'];
      const minutesPerGenre = itemMinutes / itemGenres.length;

      for (const g of itemGenres) {
        const normalized = g.trim();
        if (!genreMinutesMap[normalized]) {
          genreMinutesMap[normalized] = { minutes: 0, count: 0 };
        }
        genreMinutesMap[normalized].minutes += minutesPerGenre;
        genreMinutesMap[normalized].count += 1;
        totalCalculatedMinutes += minutesPerGenre;
      }
    }
  }

  const result = Object.entries(genreMinutesMap).map(([genre, data]) => {
    const minutes = Math.round(data.minutes);
    const hours = Math.round((minutes / 60) * 10) / 10;
    const percentage = totalCalculatedMinutes > 0 ? Math.round((minutes / totalCalculatedMinutes) * 100) : 0;
    const color = GENRE_COLOR_MAP[genre] || '#94A3B8';
    return {
      genre,
      minutes,
      hours,
      percentage,
      itemCount: data.count,
      color,
    };
  });

  return result.sort((a, b) => b.minutes - a.minutes);
}

/**
 * Dynamically evaluate achievements against actual user media activity
 */
export function evaluateDynamicAchievements(
  currentAchievements: import('../types').Achievement[],
  items: MediaItem[],
  spotifyMinutes = 0,
  customListsCount = 3
): import('../types').Achievement[] {
  // Aggregate stats
  const totalStats = calculateTotalWatchStats(items, spotifyMinutes);
  const animeEpisodes = totalStats.animeEpisodes;
  const completedTvSeries = items.filter(i => i.type === 'tv' && i.status === 'completed').length;
  const tvEpisodes = totalStats.tvEpisodes;
  const completedMovies = totalStats.moviesWatched;
  const ratedCount = items.filter(i => (i.userRating || 0) > 0).length;
  const ratedMovies = items.filter(i => i.type === 'movie' && (i.userRating || 0) > 0).length;
  const reviewedCount = items.filter(i => !!i.review && i.review.trim().length > 0).length;
  const uniqueGenres = new Set(items.flatMap(i => i.genres || [])).size;
  const hasSpotify = spotifyMinutes > 0;
  const perfectRatingsCount = items.filter(i => (i.userRating || 0) >= 10).length;

  const baseDefinitions: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'anime' | 'movie' | 'tv' | 'music' | 'general' | 'social';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    maxProgress: number;
    currentVal: number;
    xpReward: number;
  }[] = [
    {
      id: 'ach-first-step',
      title: 'İlk Adım',
      description: 'Kütüphanene ilk dizi, film veya animeyi ekle.',
      icon: '🚀',
      category: 'general',
      rarity: 'common',
      maxProgress: 1,
      currentVal: items.length,
      xpReward: 100,
    },
    {
      id: 'ach-otaku-apprentice',
      title: 'Otaku Çırağı',
      description: 'En az 25 anime bölümü izle.',
      icon: '⛩️',
      category: 'anime',
      rarity: 'common',
      maxProgress: 25,
      currentVal: animeEpisodes,
      xpReward: 250,
    },
    {
      id: 'ach-otaku-master',
      title: 'Otaku Üstadı',
      description: 'Toplamda 100 anime bölümünü tamamla.',
      icon: '⚔️',
      category: 'anime',
      rarity: 'rare',
      maxProgress: 100,
      currentVal: animeEpisodes,
      xpReward: 600,
    },
    {
      id: 'ach-tv-finisher',
      title: 'Dizi Maratoncusu',
      description: 'En az 1 tam TV dizisini baştan sona bitir.',
      icon: '📺',
      category: 'tv',
      rarity: 'common',
      maxProgress: 1,
      currentVal: completedTvSeries,
      xpReward: 350,
    },
    {
      id: 'ach-tv-legend',
      title: 'Dizi Sezon Şampiyonu',
      description: 'Toplamda 50 TV dizisi bölümü izle.',
      icon: '🏆',
      category: 'tv',
      rarity: 'rare',
      maxProgress: 50,
      currentVal: tvEpisodes,
      xpReward: 500,
    },
    {
      id: 'ach-cinephile-initiate',
      title: 'Sinema Tutkunu',
      description: '10 uzun metrajlı filmi tamamla.',
      icon: '🎬',
      category: 'movie',
      rarity: 'common',
      maxProgress: 10,
      currentVal: completedMovies,
      xpReward: 300,
    },
    {
      id: 'ach-cinephile-master',
      title: 'Sinefil Efsanesi',
      description: 'Toplamda 25 filmi tamamla.',
      icon: '🎞️',
      category: 'movie',
      rarity: 'epic',
      maxProgress: 25,
      currentVal: completedMovies,
      xpReward: 700,
    },
    {
      id: 'ach-rated-fifty',
      title: 'Usta Puanlayıcı (50 Yapım)',
      description: 'Kütüphanendeki 50 yapıma veya filme puan ver.',
      icon: '⭐',
      category: 'general',
      rarity: 'epic',
      maxProgress: 50,
      currentVal: ratedCount,
      xpReward: 800,
    },
    {
      id: 'ach-critic-gold',
      title: 'Usta Eleştirmen',
      description: '10 farklı yapıma detaylı puan ve inceleme bırak.',
      icon: '✍️',
      category: 'general',
      rarity: 'rare',
      maxProgress: 10,
      currentVal: reviewedCount,
      xpReward: 500,
    },
    {
      id: 'ach-binge-god',
      title: 'Binge Canavarı (50 Saat)',
      description: 'Toplamda 50 saatten fazla seyir süresine ulaş.',
      icon: '⚡',
      category: 'general',
      rarity: 'epic',
      maxProgress: 50,
      currentVal: Math.floor(totalStats.totalHours),
      xpReward: 800,
    },
    {
      id: 'ach-century-club',
      title: '100 Saatler Kulübü',
      description: 'Toplamda 100 saatlik seyir ve dinleme süresini devir.',
      icon: '👑',
      category: 'general',
      rarity: 'legendary',
      maxProgress: 100,
      currentVal: Math.floor(totalStats.totalHours),
      xpReward: 1500,
    },
    {
      id: 'ach-music-maestro',
      title: 'Müzik Kaşifi',
      description: 'Spotify hesabını bağla veya 20 saatlik müzik dinle.',
      icon: '🎵',
      category: 'music',
      rarity: 'rare',
      maxProgress: 20,
      currentVal: hasSpotify ? Math.max(20, Math.floor(spotifyMinutes / 60)) : Math.floor(spotifyMinutes / 60),
      xpReward: 400,
    },
    {
      id: 'ach-genre-master',
      title: 'Kültür Bukalemunu',
      description: '8 farklı türde (Aksiyon, Bilimkurgu, Romantik, vb.) yapım izle.',
      icon: '🌌',
      category: 'general',
      rarity: 'epic',
      maxProgress: 8,
      currentVal: uniqueGenres,
      xpReward: 750,
    },
    {
      id: 'ach-custom-curator',
      title: 'Küratör',
      description: '3 farklı özel liste oluştur ve doldur.',
      icon: '📑',
      category: 'social',
      rarity: 'common',
      maxProgress: 3,
      currentVal: customListsCount,
      xpReward: 300,
    },
    {
      id: 'ach-masterpiece-hunter',
      title: 'Başyapıt Avcısı',
      description: 'En az 3 farklı yapıma 10/10 tam puan ver.',
      icon: '💎',
      category: 'general',
      rarity: 'rare',
      maxProgress: 3,
      currentVal: perfectRatingsCount,
      xpReward: 450,
    },
  ];

  return baseDefinitions.map(def => {
    const existing = currentAchievements.find(a => a.id === def.id);
    const progress = Math.min(def.maxProgress, def.currentVal);
    const isUnlocked = def.currentVal >= def.maxProgress;
    const unlockedAt = isUnlocked
      ? existing?.unlockedAt || new Date().toISOString()
      : undefined;

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      rarity: def.rarity,
      progress,
      maxProgress: def.maxProgress,
      unlocked: isUnlocked,
      unlockedAt,
      xpReward: def.xpReward,
    };
  });
}
