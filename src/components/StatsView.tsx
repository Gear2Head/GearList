import React, { useState } from 'react';
import {
  Clock,
  Film,
  Tv,
  Music,
  BarChart3,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Flame,
  CheckCircle2,
  PieChart,
  Star,
} from 'lucide-react';
import { MediaItem, UserProfile } from '../types';
import { calculateTotalWatchStats, formatWatchTime } from '../utils/calculations';
import { GenrePieChart } from './GenrePieChart';

interface StatsViewProps {
  mediaItems: MediaItem[];
  userProfile: UserProfile;
  onOpenDetails: (item: MediaItem) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  mediaItems,
  userProfile,
  onOpenDetails,
}) => {
  const [timeUnit, setTimeUnit] = useState<'hours' | 'days' | 'minutes'>('hours');

  const spotifyMinutes = userProfile.connectedAccounts?.spotify?.connected
    ? userProfile.connectedAccounts.spotify.totalListeningMinutes
    : 0;

  const stats = calculateTotalWatchStats(mediaItems, spotifyMinutes);
  const formattedTotal = formatWatchTime(stats.totalMinutes);

  // Genre breakdown
  const genreCounts: { [genre: string]: { count: number; minutes: number } } = {};
  mediaItems.forEach((item) => {
    const itemMins =
      item.type === 'movie'
        ? item.status === 'completed'
          ? (item.episodeDurationMinutes || 120) * Math.max(1, 1 + (item.rewatchCount || 0))
          : 0
        : item.watchedEpisodes * (item.episodeDurationMinutes || 24);

    item.genres.forEach((g) => {
      if (!genreCounts[g]) {
        genreCounts[g] = { count: 0, minutes: 0 };
      }
      genreCounts[g].count += 1;
      genreCounts[g].minutes += itemMins;
    });
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1].minutes - a[1].minutes)
    .slice(0, 7);

  // Top longest watched items
  const longestWatched = [...mediaItems]
    .map((item) => {
      const mins =
        item.type === 'movie'
          ? item.status === 'completed'
            ? (item.episodeDurationMinutes || 120)
            : 0
          : item.watchedEpisodes * (item.episodeDurationMinutes || 24);
      return { item, mins };
    })
    .filter((x) => x.mins > 0)
    .sort((a, b) => b.mins - a.mins)
    .slice(0, 5);

  const animePercent = stats.totalMinutes > 0 ? Math.round((stats.animeMinutes / stats.totalMinutes) * 100) : 0;
  const tvPercent = stats.totalMinutes > 0 ? Math.round((stats.tvMinutes / stats.totalMinutes) * 100) : 0;
  const moviePercent = stats.totalMinutes > 0 ? Math.round((stats.movieMinutes / stats.totalMinutes) * 100) : 0;
  const musicPercent = stats.totalMinutes > 0 ? Math.round((stats.musicMinutes / stats.totalMinutes) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner - Sophisticated Dark */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#161618] via-[#1A1A1C] to-[#121214] border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Süre & Seyir Analitikleri
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Kapsamlı Zaman & Tür Analizi
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              Her animenin, dizinin ve filmin bölüm bazlı gerçek süreleri hesaplanarak tüm
              hayatınızdaki seyir geçmişiniz anlık olarak görselleştirilir.
            </p>
          </div>

          {/* Big Total Time Display */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0A0A0B]/80 p-5 rounded-2xl border border-white/10 shadow-xl shrink-0">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <span className="text-gray-500 uppercase text-[10px] tracking-widest font-bold block">
                TOPLAM GEÇİRİLEN SÜRE
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                {formattedTotal.formattedText}
              </div>
              <p className="text-xs text-blue-400 font-semibold mt-0.5">
                ≈ {stats.totalDays.toFixed(1)} Kesintisiz Gün ({stats.totalHours.toFixed(1)} Saat)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards in Sophisticated Dark Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Anime Stats */}
        <div className="p-5 rounded-2xl bg-[#161618] border border-white/5 hover:border-blue-500/30 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
              <span>⛩️</span> ANIME SEYRİ
            </span>
            <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
              %{animePercent}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">
              {Math.round(stats.animeMinutes / 60)} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </h3>
            <p className="text-xs text-gray-400">
              Toplam <strong className="text-gray-200 font-mono">{stats.animeEpisodes}</strong> bölüm izlendi
            </p>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] rounded-full"
              style={{ width: `${animePercent}%` }}
            />
          </div>
        </div>

        {/* Series/TV Stats */}
        <div className="p-5 rounded-2xl bg-[#161618] border border-white/5 hover:border-purple-500/30 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
              <span>📺</span> DİZİ & SHOW
            </span>
            <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
              %{tvPercent}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">
              {Math.round(stats.tvMinutes / 60)} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </h3>
            <p className="text-xs text-gray-400">
              Toplam <strong className="text-gray-200 font-mono">{stats.tvEpisodes}</strong> bölüm tamamlandı
            </p>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] rounded-full"
              style={{ width: `${tvPercent}%` }}
            />
          </div>
        </div>

        {/* Movie Stats */}
        <div className="p-5 rounded-2xl bg-[#161618] border border-white/5 hover:border-pink-500/30 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400 flex items-center gap-1.5">
              <span>🎬</span> FİLM & SİNEMA
            </span>
            <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
              %{moviePercent}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">
              {Math.round(stats.movieMinutes / 60)} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </h3>
            <p className="text-xs text-gray-400">
              Toplam <strong className="text-gray-200 font-mono">{stats.moviesWatched}</strong> film seyredildi
            </p>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)] rounded-full"
              style={{ width: `${moviePercent}%` }}
            />
          </div>
        </div>

        {/* Music Stats (Spotify) */}
        <div className="p-5 rounded-2xl bg-[#161618] border border-white/5 hover:border-green-500/30 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 flex items-center gap-1.5">
              <span>🎵</span> SPOTIFY MÜZİK
            </span>
            <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
              %{musicPercent}
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">
              {Math.round(stats.musicMinutes / 60)} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </h3>
            <p className="text-xs text-gray-400">
              {userProfile.connectedAccounts?.spotify?.connected ? (
                <span className="text-green-400 font-medium">Spotify Hesabı Bağlı</span>
              ) : (
                <span>Spotify bağlanabilir</span>
              )}
            </p>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] rounded-full"
              style={{ width: `${musicPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Multi-Color Timeline / Distribution Bar */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              Medya Türü Dağılım Oranı
            </h3>
            <p className="text-xs text-gray-400">
              Toplam izleme sürenizin türlere göre oransal kırılımı
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Anime (%{animePercent})
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Dizi (%{tvPercent})
            </span>
            <span className="flex items-center gap-1.5 text-pink-400">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Film (%{moviePercent})
            </span>
            {musicPercent > 0 && (
              <span className="flex items-center gap-1.5 text-green-400">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Müzik (%{musicPercent})
              </span>
            )}
          </div>
        </div>

        {/* The Stacked Bar */}
        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${animePercent}%` }}
            className="h-full bg-blue-500 transition-all duration-500"
            title={`Anime: %${animePercent}`}
          />
          <div
            style={{ width: `${tvPercent}%` }}
            className="h-full bg-purple-500 transition-all duration-500"
            title={`Dizi: %${tvPercent}`}
          />
          <div
            style={{ width: `${moviePercent}%` }}
            className="h-full bg-pink-500 transition-all duration-500"
            title={`Film: %${moviePercent}`}
          />
          <div
            style={{ width: `${musicPercent}%` }}
            className="h-full bg-green-500 transition-all duration-500"
            title={`Müzik: %${musicPercent}`}
          />
        </div>
      </div>

      {/* DEDICATED VISUAL PIE CHART: GENRE PERCENTAGE BREAKDOWN */}
      <GenrePieChart mediaItems={mediaItems} onOpenDetails={onOpenDetails} />

      {/* Grid: Genre Breakdown & Top Longest Watched */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Breakdown Chart */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> En Çok Zaman Harcanan Türler
            </h3>
            <span className="text-xs text-gray-500 font-mono font-medium">Tür / Süre</span>
          </div>

          <div className="space-y-3">
            {sortedGenres.map(([genre, data]) => {
              const genrePercent =
                stats.totalMinutes > 0 ? Math.round((data.minutes / stats.totalMinutes) * 100) : 0;
              const hours = Math.round(data.minutes / 60);

              return (
                <div key={genre} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-200 flex items-center gap-1.5">
                      <span>🏷️</span> {genre}
                      <span className="text-[11px] text-gray-500 font-normal">({data.count} Yapım)</span>
                    </span>
                    <span className="font-mono font-bold text-gray-300">
                      {hours} Saat ({genrePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, genrePercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Longest Marathons */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> En Uzun Süren Maratonlarınız
            </h3>
            <span className="text-xs text-gray-500 font-mono">Top 5 Yapım</span>
          </div>

          <div className="space-y-3">
            {longestWatched.map(({ item, mins }, index) => {
              const formatted = formatWatchTime(mins);
              return (
                <div
                  key={item.id}
                  onClick={() => onOpenDetails(item)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#0D0D0E] border border-white/5 hover:border-white/15 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-black text-sm text-gray-500 w-5">
                      #{index + 1}
                    </span>
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-9 h-12 object-cover rounded-lg border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-200 group-hover:text-blue-400 transition truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">
                        {item.type} • {item.watchedEpisodes}/{item.totalEpisodes || 1} Bölüm
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span className="text-xs font-black text-blue-400 font-mono block">
                      {formatted.shortText}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {item.episodeDurationMinutes} dk/blm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
