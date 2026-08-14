import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  Film,
  Tv,
  Star,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Check,
  Zap,
  Info,
  Flame,
  Brain,
  Layers,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { MediaItem, RecommendationItem, MediaType, WatchStatus } from '../types';
import { fetchAIRecommendations } from '../services/api';

interface ForYouViewProps {
  mediaItems: MediaItem[];
  favoriteMediaIds: string[];
  onAddMedia: (item: Partial<MediaItem>, status: WatchStatus) => void;
  onOpenDetails: (item: MediaItem) => void;
  onShowToast: (title: string, message?: string, type?: any) => void;
}

export const ForYouView: React.FC<ForYouViewProps> = ({
  mediaItems,
  favoriteMediaIds,
  onAddMedia,
  onOpenDetails,
  onShowToast,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [customMood, setCustomMood] = useState<string>('');
  const [activeMoodTag, setActiveMoodTag] = useState<string>('Zevkime Göre');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, WatchStatus>>({});

  const quickMoods = [
    { label: '✨ Zevkime Göre', prompt: 'İzleme geçmişim ve yüksek puanlarıma göre en iyi yapımları öner' },
    { label: '🧠 Zihin Yakan Bilimkurgu', prompt: 'Ters köşeler ve zaman yolculuğu içeren akıl açıcı yapımlar' },
    { label: '⚔️ Epik Aksiyon & Shounen', prompt: 'Yüksek tempolu, animasyon kalitesi zirve aksiyonlar' },
    { label: '🍿 Hafta Sonu Maratonu', prompt: 'Tek oturuşta veya 1 günde bitirilebilecek kısa ve sürükleyici yapımlar' },
    { label: '💎 10/10 Sinema Başyapıtları', prompt: 'Ödüllü, atmosferi ve sinematografisi büyüleyici filmler' },
    { label: '🌸 Duygusal & Felsefi', prompt: 'Frieren ve Vinland Saga gibi derin karakter gelişimine sahip yapımlar' },
  ];

  const loadRecommendations = async (moodPrompt?: string, typePref?: string) => {
    setIsLoading(true);
    try {
      const watchedTitles = mediaItems.map((i) => i.title);
      const topGenres: string[] = Array.from(new Set(mediaItems.flatMap((i) => i.genres || [])));
      const favoriteTitles = mediaItems
        .filter((i) => i.favorite || (i.userRating || 0) >= 9)
        .map((i) => i.title);

      const items = await fetchAIRecommendations({
        watchedTitles,
        topGenres,
        favoriteTitles,
        preferredType: typePref || selectedType,
        moodPrompt: moodPrompt || customMood || 'Zevkime en uygun yapımları öner',
      });

      setRecommendations(items);
    } catch (err) {
      console.error(err);
      onShowToast('Öneriler yüklenirken gecikme oldu', 'Varsayılan AI öneri listesi sunuldu.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleSelectMood = (mood: { label: string; prompt: string }) => {
    setActiveMoodTag(mood.label);
    setCustomMood(mood.prompt);
    loadRecommendations(mood.prompt, selectedType);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    loadRecommendations(customMood, type);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMood.trim()) return;
    setActiveMoodTag('Özel İstek');
    loadRecommendations(customMood, selectedType);
  };

  const handleQuickAdd = (rec: RecommendationItem, status: WatchStatus) => {
    const newItem: Partial<MediaItem> = {
      title: rec.title,
      originalTitle: rec.originalTitle,
      type: rec.type,
      posterUrl: rec.posterUrl,
      genres: rec.genres,
      releaseYear: rec.releaseYear,
      totalEpisodes: rec.totalEpisodes || (rec.type === 'movie' ? 1 : 12),
      watchedEpisodes: status === 'completed' ? (rec.totalEpisodes || 1) : 0,
      episodeDurationMinutes: rec.episodeDurationMinutes || (rec.type === 'movie' ? 120 : 24),
      totalRuntimeMinutes: rec.totalRuntimeMinutes || 0,
      scoreIMDB: rec.scoreIMDB,
      scoreMAL: rec.scoreMAL,
      synopsis: rec.synopsis,
      studioOrDirector: rec.studioOrDirector,
      status,
      favorite: false,
      rewatchCount: 0,
      customListIds: [],
    };

    onAddMedia(newItem, status);
    setAddedItemIds((prev) => ({ ...prev, [rec.id]: status }));
    onShowToast(
      'Kütüphaneye Eklendi! 🎬',
      `"${rec.title}" ${status === 'watching' ? 'İzleniyor' : 'Planlananlar'} listenize kaydedildi.`,
      'success'
    );
  };

  const filteredRecommendations = recommendations.filter((r) => {
    if (selectedType === 'all') return true;
    return r.type === selectedType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero AI Engine Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#161618] via-[#121214] to-[#0A0A0B] border border-blue-500/20 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400">
            <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            </span>
            <span>Gemini 3.7 Flash Destekli Yapay Zeka Tavsiye Motoru</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Sizin Zevkinize, Sürenize ve <span className="text-blue-400">Ruh Halinize</span> Özel Öneriler
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            İzlediğiniz <strong>{mediaItems.length} yapım</strong>, verdiğiniz puanlar ve müzik
            tercihleriniz yapay zeka tarafından analiz edildi. Zevkinizle %90+ uyuşan, izleme sürenize
            tam oturan yeni başyapıtları keşfedin.
          </p>

          {/* Quick Mood Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {quickMoods.map((mood, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectMood(mood)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeMoodTag === mood.label
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 border border-blue-400/40'
                    : 'bg-[#161618] hover:bg-[#1E1E22] text-gray-300 border border-white/10'
                }`}
              >
                <span>{mood.label}</span>
              </button>
            ))}
          </div>

          {/* Custom AI Prompt Input */}
          <form onSubmit={handleCustomSearch} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={customMood}
                onChange={(e) => setCustomMood(e.target.value)}
                placeholder="Örn: '12 bölümü geçmeyen akıcı anime' veya 'Oppenheimer gibi tarih & gerilim filmleri'..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A0A0B]/90 border border-white/10 focus:border-blue-500/60 text-xs sm:text-sm text-gray-100 placeholder-gray-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/50 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analiz Ediliyor...' : 'Öneri Üret'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Filter Tabs & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Type selector */}
        <div className="flex items-center gap-1.5 bg-[#161618] p-1 rounded-2xl border border-white/5">
          {[
            { id: 'all', label: 'Tüm Öneriler' },
            { id: 'anime', label: 'Animeler' },
            { id: 'tv', label: 'Diziler' },
            { id: 'movie', label: 'Filmler' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTypeChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Counter & Action */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {filteredRecommendations.length} özel yapım eşleştirildi
          </span>
          <button
            onClick={() => loadRecommendations(customMood, selectedType)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-400 border border-blue-500/20 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {isLoading ? (
        <div className="p-16 rounded-3xl bg-[#161618] border border-white/5 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-spin">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-100">
              Yapay Zeka Zevk Verilerinizi İnceliyor...
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              İzleme geçmişi, tür süreleri ve puanlarınıza göre en uygun başyapıtlar listeleniyor.
            </p>
          </div>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#161618] border border-white/5 text-center space-y-3">
          <p className="text-sm text-gray-400">Bu filtrede eşleşen öneri bulunamadı.</p>
          <button
            onClick={() => handleTypeChange('all')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Tüm Türleri Göster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => {
            const addedStatus = addedItemIds[rec.id];

            return (
              <div
                key={rec.id}
                className="group rounded-3xl bg-[#161618] border border-white/5 hover:border-blue-500/40 overflow-hidden transition-all duration-300 flex flex-col shadow-xl hover:shadow-2xl"
              >
                {/* Poster & Badges Banner */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0D0D0E]">
                  <img
                    src={rec.posterUrl}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-600/90 text-white font-black text-xs backdrop-blur-md shadow-lg flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current text-yellow-300" /> %{rec.matchScore} Uyum
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#0A0A0B]/80 text-gray-300 font-bold text-[10px] uppercase border border-white/10">
                      {rec.type}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {rec.scoreIMDB && (
                      <span className="px-2 py-0.5 rounded-lg bg-yellow-500 text-[#0A0A0B] font-bold text-[11px] shadow">
                        ⭐ {rec.scoreIMDB}
                      </span>
                    )}
                    {rec.scoreMAL && (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-500 text-white font-bold text-[11px] shadow">
                        MAL {rec.scoreMAL}
                      </span>
                    )}
                  </div>

                  {/* Bottom Duration info on poster */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-gray-300 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {rec.estimatedFinishTime || `${rec.totalRuntimeMinutes || rec.episodeDurationMinutes} dk`}
                    </span>
                    <span>
                      {rec.type === 'movie' ? 'Film (1 Blm)' : `${rec.totalEpisodes || 12} Bölüm`}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div>
                      <h3 className="font-black text-base text-gray-100 group-hover:text-blue-400 transition leading-snug line-clamp-1">
                        {rec.title}
                      </h3>
                      {rec.originalTitle && (
                        <p className="text-[11px] text-gray-500 truncate">{rec.originalTitle}</p>
                      )}
                    </div>

                    {/* AI Recommendation Reason */}
                    <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[11px]">{rec.reason}</p>
                    </div>

                    {/* Synopsis */}
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {rec.synopsis}
                    </p>

                    {/* Genre Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.genres?.map((genre, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-[#0A0A0B] border border-white/5 text-[10px] text-gray-400 font-medium"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                    {addedStatus ? (
                      <div className="flex-1 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {addedStatus === 'watching' ? 'İzleniyor Listenizde' : 'Planlananlara Eklendi'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleQuickAdd(rec, 'watching')}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>İzlemeye Başla</span>
                        </button>

                        <button
                          onClick={() => handleQuickAdd(rec, 'plan_to_watch')}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Planlananlara Ekle"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Sonra İzle</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
