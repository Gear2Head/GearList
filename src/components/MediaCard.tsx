import React, { useState } from 'react';
import {
  Star,
  CheckCircle,
  PlayCircle,
  Clock,
  Plus,
  Tv,
  Film,
  Music,
  Compass,
  Repeat,
  FolderPlus,
  Sparkles,
  MessageSquare,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MediaItem, WatchStatus, CustomList } from '../types';
import { formatWatchTime } from '../utils/calculations';

interface MediaCardProps {
  item: MediaItem;
  customLists: CustomList[];
  onUpdateStatus: (id: string, newStatus: WatchStatus) => void;
  onIncrementEpisode: (id: string) => void;
  onOpenDetails: (item: MediaItem) => void;
  onQuickRate: (id: string, rating: number) => void;
  onSelectTag?: (tag: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  customLists,
  onUpdateStatus,
  onIncrementEpisode,
  onOpenDetails,
  onQuickRate,
  onSelectTag,
}) => {
  const [ratingHover, setRatingHover] = useState<number | null>(null);

  // Compute calculated watch time for this item
  const currentWatchMinutes =
    item.type === 'movie'
      ? item.status === 'completed'
        ? (item.episodeDurationMinutes || item.totalRuntimeMinutes || 120) * Math.max(1, 1 + (item.rewatchCount || 0))
        : 0
      : item.watchedEpisodes * (item.episodeDurationMinutes || 24);

  const formattedTime = formatWatchTime(currentWatchMinutes);
  const totalEp = item.totalEpisodes || (item.type === 'movie' ? 1 : 12);
  const progressPercent = Math.min(100, Math.round((item.watchedEpisodes / totalEp) * 100));

  const itemCustomLists = customLists.filter((l) => item.customListIds?.includes(l.id));

  const getTypeTheme = () => {
    switch (item.type) {
      case 'anime':
        return {
          label: 'ANIME',
          textColor: 'text-blue-400',
          badgeBg: 'bg-blue-500 text-white',
          pillBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          progressFill: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
        };
      case 'tv':
        return {
          label: 'SERIES',
          textColor: 'text-purple-400',
          badgeBg: 'bg-purple-500 text-white',
          pillBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          progressFill: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
        };
      case 'movie':
        return {
          label: 'MOVIE',
          textColor: 'text-pink-400',
          badgeBg: 'bg-pink-500 text-white',
          pillBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
          progressFill: 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]',
        };
      case 'music':
        return {
          label: 'MUSIC',
          textColor: 'text-green-400',
          badgeBg: 'bg-green-500 text-white',
          pillBg: 'bg-green-500/10 text-green-400 border-green-500/20',
          progressFill: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]',
        };
      default:
        return {
          label: 'MEDIA',
          textColor: 'text-blue-400',
          badgeBg: 'bg-blue-500 text-white',
          pillBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          progressFill: 'bg-blue-500',
        };
    }
  };

  const typeTheme = getTypeTheme();

  const getStatusBadge = () => {
    switch (item.status) {
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          dot: 'bg-purple-400',
        };
      case 'watching':
        return {
          label: 'Watching',
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dot: 'bg-blue-400 animate-pulse',
        };
      case 'plan_to_watch':
        return {
          label: 'Plan to Watch',
          color: 'bg-white/5 text-gray-300 border-white/10',
          dot: 'bg-gray-400',
        };
      case 'on_hold':
        return {
          label: 'On Hold',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400',
        };
      case 'dropped':
        return {
          label: 'Dropped',
          color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-400',
        };
    }
  };

  const statusBadge = getStatusBadge();

  const handleStatusClick = (newStatus: WatchStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newStatus === 'completed' && item.status !== 'completed') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'],
        });
      } catch (err) {}
    }
    onUpdateStatus(item.id, newStatus);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIncrementEpisode(item.id);
  };

  return (
    <div
      onClick={() => onOpenDetails(item)}
      className="group relative flex flex-col rounded-2xl bg-[#161618] border border-white/5 hover:border-white/15 hover:shadow-[0_8px_30px_rgb(0,0,0,0.6)] transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-[#0D0D0E]">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
          {/* Type Badge */}
          <div className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-[#0A0A0B]/85 backdrop-blur-md border border-white/10 text-white shadow-md flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${typeTheme.badgeBg.split(' ')[0]}`} />
            <span>{typeTheme.label}</span>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-md text-[10px] font-semibold shadow-md ${statusBadge.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            <span>{statusBadge.label}</span>
          </div>
        </div>

        {/* Bottom Poster Info (Release year & Rewatch count) */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-gray-300 z-10">
          <span className="font-mono bg-[#0A0A0B]/80 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5 text-[11px] text-gray-400 font-semibold">
            {item.releaseYear}
          </span>
          {item.rewatchCount > 0 && (
            <span className="flex items-center gap-1 font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded backdrop-blur-sm border border-blue-500/30 text-[11px]">
              <Repeat className="w-3 h-3" /> x{item.rewatchCount}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-4 flex flex-col justify-between gap-3">
        <div>
          {/* Title */}
          <h3 className="font-bold text-sm sm:text-base text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-1">
            {item.title}
          </h3>

          {/* Genres Chips */}
          <div className="flex items-center gap-1.5 mt-1 overflow-hidden text-[10px] text-gray-400">
            {item.genres.slice(0, 3).map((g, idx) => (
              <span key={idx} className="bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-gray-300 shrink-0">
                {g}
              </span>
            ))}
          </div>

          {/* Tag Badges (e.g. Masterpiece, Slow Burn, Must Watch Again) */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-2 overflow-x-auto scrollbar-none">
              {item.tags.slice(0, 2).map((t, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    if (onSelectTag) {
                      e.stopPropagation();
                      onSelectTag(t);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition shrink-0"
                  title="Bu etikete göre filtrele"
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{t}</span>
                </span>
              ))}
            </div>
          )}

          {/* Custom Lists Chips */}
          {itemCustomLists.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 overflow-x-auto scrollbar-none">
              {itemCustomLists.map((cl) => (
                <span
                  key={cl.id}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border"
                  style={{
                    backgroundColor: `${cl.color}15`,
                    borderColor: `${cl.color}30`,
                    color: cl.color,
                  }}
                >
                  <span>{cl.icon}</span>
                  <span className="truncate max-w-[90px]">{cl.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress & Duration Section */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          {/* Episode Progress Counter */}
          {item.type !== 'movie' ? (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-400 text-[11px]">
                  Episode <strong className="text-white font-mono">{item.watchedEpisodes}</strong> of {totalEp}
                </span>
                <span className="text-gray-400 font-mono font-medium text-[11px]">
                  {formattedTime.shortText}
                </span>
              </div>
              {/* Progress Bar with Sophisticated Dark glow */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${typeTheme.progressFill} rounded-full transition-all duration-300`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Duration:</span>
              <span className="font-mono text-gray-200 font-semibold text-xs">
                {item.episodeDurationMinutes || item.totalRuntimeMinutes || 120} min
              </span>
            </div>
          )}

          {/* Rating Stars Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
                const current = ratingHover !== null ? ratingHover : item.userRating || 0;
                const filled = starVal <= current;
                return (
                  <button
                    key={starVal}
                    onMouseEnter={() => setRatingHover(starVal)}
                    onMouseLeave={() => setRatingHover(null)}
                    onClick={() => onQuickRate(item.id, starVal)}
                    className="p-0.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                    title={`${starVal}/10 Score`}
                  >
                    <Star
                      className={`w-3 h-3 ${
                        filled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700 hover:text-gray-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-yellow-500">
              {item.userRating ? `${item.userRating}/10` : <span className="text-gray-600 text-[10px]">Unrated</span>}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
          {/* Quick "Completed" Button */}
          <button
            onClick={(e) => handleStatusClick('completed', e)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              item.status === 'completed'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
            }`}
            title="Mark as Completed"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="truncate">Done</span>
          </button>

          {/* Quick "Watching" Button */}
          <button
            onClick={(e) => handleStatusClick('watching', e)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              item.status === 'watching'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
            }`}
            title="Mark as Watching"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="truncate">Watch</span>
          </button>

          {/* Quick +1 Episode Stepper */}
          {item.type !== 'movie' && (
            <button
              onClick={handleIncrement}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all border border-white/10 text-white flex items-center gap-0.5 active:scale-95 cursor-pointer"
              title="+1 Episode Watched"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>1 Ep</span>
            </button>
          )}

          {/* Quick Review / Note Icon */}
          {item.review && (
            <div
              className="p-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10"
              title={`Note: "${item.review.slice(0, 40)}..."`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
