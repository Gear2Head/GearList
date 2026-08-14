import React, { useState, useEffect } from 'react';
import {
  Shuffle,
  Sparkles,
  Play,
  Clock,
  Star,
  Tv,
  Film,
  Calendar,
  X,
  RefreshCw,
  CheckCircle,
  Eye,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MediaItem } from '../types';

interface RandomPickModalProps {
  mediaItems: MediaItem[];
  isOpen: boolean;
  onClose: () => void;
  onStartWatching: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
}

export const RandomPickModal: React.FC<RandomPickModalProps> = ({
  mediaItems,
  isOpen,
  onClose,
  onStartWatching,
  onOpenDetails,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | 'anime' | 'tv' | 'movie'>('all');
  const [pickedItem, setPickedItem] = useState<MediaItem | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Eligible pool: Items in 'plan_to_watch'
  const planToWatchPool = mediaItems.filter((i) => {
    if (i.status !== 'plan_to_watch') return false;
    if (selectedType !== 'all' && i.type !== selectedType) return false;
    return true;
  });

  const pickRandomItem = () => {
    const pool = planToWatchPool.length > 0 ? planToWatchPool : mediaItems.filter((i) => selectedType === 'all' || i.type === selectedType);
    if (pool.length === 0) {
      setPickedItem(null);
      return;
    }

    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setPickedItem(pool[randomIdx]);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalItem = pool[Math.floor(Math.random() * pool.length)];
        setPickedItem(finalItem);
        setIsRolling(false);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#3B82F6', '#8B5CF6', '#F59E0B'],
          });
        } catch (e) {
          console.warn(e);
        }
      }
    }, 90);
  };

  useEffect(() => {
    if (isOpen) {
      pickRandomItem();
    }
  }, [isOpen, selectedType]);

  if (!isOpen) return null;

  const totalRuntime = pickedItem
    ? pickedItem.type === 'movie'
      ? pickedItem.episodeDurationMinutes || 120
      : (pickedItem.totalEpisodes || 12) * (pickedItem.episodeDurationMinutes || 24)
    : 0;

  const hours = Math.floor(totalRuntime / 60);
  const minutes = totalRuntime % 60;
  const timeFormatted = hours > 0 ? `${hours}s ${minutes > 0 ? `${minutes}dk` : ''}` : `${minutes}dk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#161618] border border-blue-500/30 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Sıradaki Yapımı Seç</h3>
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold border border-yellow-500/20">
                  Planlananlar Havuzu
                </span>
              </div>
              <p className="text-xs text-gray-400">Kararsız mısın? GearList senin için mükemmel sıradaki yapımı seçsin!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center justify-between gap-2 bg-[#0D0D0E] p-1 rounded-2xl border border-white/5">
          {[
            { id: 'all', label: `Tümü (${mediaItems.filter(i => i.status === 'plan_to_watch').length})` },
            { id: 'anime', label: `⛩️ Anime (${mediaItems.filter(i => i.status === 'plan_to_watch' && i.type === 'anime').length})` },
            { id: 'tv', label: `📺 Dizi (${mediaItems.filter(i => i.status === 'plan_to_watch' && i.type === 'tv').length})` },
            { id: 'movie', label: `🎬 Film (${mediaItems.filter(i => i.status === 'plan_to_watch' && i.type === 'movie').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                selectedType === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Picked Featured Card Showcase */}
        {pickedItem ? (
          <div
            className={`p-5 rounded-2xl bg-[#0D0D0E] border border-blue-500/30 space-y-4 shadow-xl transition-all duration-300 ${
              isRolling ? 'opacity-50 scale-98 blur-[1px]' : 'opacity-100 scale-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative w-full sm:w-36 aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-[#161618] border border-white/10 shadow-lg group">
                <img
                  src={pickedItem.posterUrl}
                  alt={pickedItem.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  {pickedItem.type}
                </div>
                {(pickedItem.scoreMAL || pickedItem.scoreIMDB) && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-yellow-500 text-black text-[10px] font-bold">
                    ⭐ {pickedItem.scoreMAL || pickedItem.scoreIMDB}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Şanslı Seçim
                  </span>
                  <span className="text-gray-500 text-xs">•</span>
                  <span className="text-xs text-gray-400">{pickedItem.releaseYear}</span>
                  <span className="text-gray-500 text-xs">•</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" /> {timeFormatted}
                  </span>
                </div>

                <h4 className="text-lg font-black text-white leading-snug">
                  {pickedItem.title}
                </h4>

                {pickedItem.originalTitle && (
                  <p className="text-xs text-gray-500 font-serif -mt-1">{pickedItem.originalTitle}</p>
                )}

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5">
                  {pickedItem.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] font-semibold text-gray-300 border border-white/5"
                    >
                      {g}
                    </span>
                  ))}
                  {pickedItem.studioOrDirector && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 text-[10px] font-medium border border-purple-500/20">
                      {pickedItem.studioOrDirector}
                    </span>
                  )}
                </div>

                {pickedItem.synopsis && (
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {pickedItem.synopsis}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons inside card */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  onStartWatching(pickedItem);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Şimdi İzlemeye Başla</span>
              </button>

              <button
                onClick={pickRandomItem}
                disabled={isRolling}
                className="py-2.5 px-4 rounded-xl bg-[#1C1C20] hover:bg-[#282830] text-gray-200 text-xs font-semibold border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                <span>Başka Bir Tane Seç</span>
              </button>

              <button
                onClick={() => {
                  onOpenDetails(pickedItem);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-xs font-medium border border-white/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Detaylar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#0D0D0E] border border-white/5 text-center space-y-3">
            <p className="text-xs text-gray-400">
              Bu kategoride 'Planlananlar' listesinde hiç yapım bulunamadı.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
