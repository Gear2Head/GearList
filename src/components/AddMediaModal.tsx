import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  Film,
  Tv,
  Music,
  Plus,
  Clock,
  Check,
  Bookmark,
  Calendar,
  Layers,
  ArrowRight,
  Tag,
  Star,
} from 'lucide-react';
import { MediaItem, MediaType, WatchStatus, CustomList } from '../types';
import { searchAllExternalMedia, ExternalMediaResult } from '../services/externalMedia';
import { lookupMediaAI } from '../services/api';

interface AddMediaModalProps {
  isOpen: boolean;
  customLists: CustomList[];
  initialSearchQuery?: string;
  onClose: () => void;
  onAdd: (item: MediaItem) => void;
}

const PRESET_TAGS = [
  'Masterpiece',
  'Must Watch Again',
  'Slow Burn',
  'Mind Bending',
  'Comfort Show',
  'Peak Fiction',
  'Emotional Damage',
  'Aesthetic',
  'Great Soundtrack',
];

export const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  customLists,
  initialSearchQuery = '',
  onClose,
  onAdd,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalMediaResult[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [type, setType] = useState<MediaType>('anime');
  const [releaseYear, setReleaseYear] = useState<number>(new Date().getFullYear());
  const [totalEpisodes, setTotalEpisodes] = useState<number>(12);
  const [watchedEpisodes, setWatchedEpisodes] = useState<number>(0);
  const [episodeDurationMinutes, setEpisodeDurationMinutes] = useState<number>(24);
  const [genres, setGenres] = useState<string>('Aksiyon, Macera');
  const [synopsis, setSynopsis] = useState<string>('');
  const [studioOrDirector, setStudioOrDirector] = useState<string>('');
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [status, setStatus] = useState<WatchStatus>('plan_to_watch');
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Masterpiece']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [userRating, setUserRating] = useState<number>(0);

  const handleLiveSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      // 1. Try real external APIs (AniList, TVMaze, iTunes Movies & Songs)
      const results = await searchAllExternalMedia(searchQuery, selectedType);
      if (results && results.length > 0) {
        setSearchResults(results);
      } else {
        // Fallback to Gemini AI enricher if external returns empty
        const aiResult = await lookupMediaAI(searchQuery, selectedType === 'all' ? 'anime' : selectedType);
        setSearchResults([
          {
            title: aiResult.title || searchQuery,
            originalTitle: aiResult.originalTitle,
            type: (aiResult.type as MediaType) || 'anime',
            releaseYear: aiResult.releaseYear || 2024,
            totalEpisodes: aiResult.totalEpisodes || 12,
            episodeDurationMinutes: aiResult.episodeDurationMinutes || 24,
            genres: aiResult.genres || ['Genel'],
            tags: ['Masterpiece'],
            synopsis: aiResult.synopsis || '',
            studioOrDirector: aiResult.studioOrDirector,
            posterUrl: aiResult.posterUrl || '',
            source: 'gemini',
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item: ExternalMediaResult) => {
    setTitle(item.title);
    if (item.originalTitle) setOriginalTitle(item.originalTitle);
    setType(item.type as MediaType);
    setReleaseYear(item.releaseYear);
    setTotalEpisodes(item.totalEpisodes);
    setEpisodeDurationMinutes(item.episodeDurationMinutes);
    setGenres(item.genres.join(', '));
    setSynopsis(item.synopsis);
    if (item.studioOrDirector) setStudioOrDirector(item.studioOrDirector);
    setPosterUrl(item.posterUrl);
    if (item.tags && item.tags.length > 0) {
      setSelectedTags(item.tags);
    }
    setSearchResults([]);
  };

  const handleQuickStatusChange = (newStatus: WatchStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setWatchedEpisodes(type === 'movie' ? 1 : totalEpisodes);
    } else if (newStatus === 'plan_to_watch') {
      setWatchedEpisodes(0);
    }
  };

  const toggleList = (id: string) => {
    setSelectedListIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim();
    if (!clean) return;
    if (!selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
    }
    setCustomTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const genreList = genres
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    const newItem: MediaItem = {
      id: `media-${Date.now()}`,
      title: title.trim(),
      originalTitle: originalTitle.trim() || undefined,
      type,
      posterUrl,
      bannerUrl: posterUrl,
      genres: genreList.length > 0 ? genreList : ['Genel'],
      tags: selectedTags,
      releaseYear: Number(releaseYear) || 2024,
      status,
      totalEpisodes: type === 'movie' ? 1 : Number(totalEpisodes) || 12,
      watchedEpisodes: Number(watchedEpisodes) || 0,
      episodeDurationMinutes: Number(episodeDurationMinutes) || (type === 'movie' ? 120 : (type === 'tv' ? 45 : 24)),
      totalRuntimeMinutes: (Number(totalEpisodes) || 1) * (Number(episodeDurationMinutes) || 24),
      userRating: userRating > 0 ? userRating : undefined,
      rewatchCount: 0,
      favorite: false,
      customListIds: selectedListIds,
      synopsis: synopsis.trim() || undefined,
      studioOrDirector: studioOrDirector.trim() || undefined,
      updatedAt: new Date().toISOString(),
      startedAt: status === 'watching' ? new Date().toISOString() : undefined,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#161618] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#0A0A0B]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Kütüphaneye Yeni Medya Ekle
              </h2>
              <p className="text-xs text-gray-400">
                AniList, TVMaze ve iTunes API ile %100 gerçek kapak ve süre bilgisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Real API Smart Search Box */}
          <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Gerçek API'lerden Canlı Arama
              </label>
              <span className="text-[10px] text-gray-400 font-mono">AniList • TVMaze • iTunes</span>
            </div>

            {/* Type selector before search */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'Tümü' },
                { id: 'anime', label: '⛩️ Anime (AniList)' },
                { id: 'tv', label: '📺 Dizi (TVMaze)' },
                { id: 'movie', label: '🎬 Film (iTunes)' },
                { id: 'music', label: '🎵 Müzik (iTunes)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-[#161618] text-gray-300 border-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Örn: Solo Leveling, Interstellar, Breaking Bad, YOASOBI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLiveSearch()}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#0A0A0B] border border-white/10 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleLiveSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-blue-950/50"
              >
                {isSearching ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin">⚙️</span> Çekiliyor...
                  </span>
                ) : (
                  <>
                    <span>Ara & Doldur</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Live Search Results Dropdown List */}
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto p-2 bg-[#161618] rounded-xl border border-white/10">
                <span className="text-[11px] font-bold text-gray-400 px-1">
                  Bulunan Gerçek Sonuçlar (Seçmek için tıklayın):
                </span>
                {searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectResult(res)}
                    className="p-2 rounded-xl bg-[#0D0D0E] hover:bg-[#202024] border border-white/5 hover:border-blue-500/40 transition cursor-pointer flex items-center gap-3 group"
                  >
                    <img
                      src={res.posterUrl}
                      alt={res.title}
                      className="w-10 h-14 object-cover rounded-lg shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                          {res.type}
                        </span>
                        <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-blue-400 transition">
                          {res.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {res.releaseYear} • {res.totalEpisodes} Bölüm • {res.episodeDurationMinutes} dk/bölüm • {res.genres.join(', ')}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-blue-400 px-2 py-1 rounded-lg bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition">
                      Seç +
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Details */}
          <form id="add-media-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Title & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Başlık *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Yapım adı..."
                  className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 focus:border-blue-500 text-xs sm:text-sm text-gray-100 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Tür</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MediaType)}
                  className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 focus:border-blue-500 text-xs sm:text-sm text-gray-100 outline-none"
                >
                  <option value="anime" className="bg-[#161618]">⛩️ Anime</option>
                  <option value="tv" className="bg-[#161618]">📺 Dizi</option>
                  <option value="movie" className="bg-[#161618]">🎬 Film</option>
                  <option value="music" className="bg-[#161618]">🎵 Müzik</option>
                </select>
              </div>
            </div>

            {/* Episodes & Runtime */}
            <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-white/5 space-y-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Süre & Bölüm Parametreleri
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {type !== 'movie' && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Toplam Bölüm</label>
                    <input
                      type="number"
                      min={1}
                      value={totalEpisodes}
                      onChange={(e) => setTotalEpisodes(parseInt(e.target.value) || 1)}
                      className="w-full p-2 rounded-xl bg-[#161618] border border-white/10 text-xs sm:text-sm text-gray-100 outline-none font-mono"
                    />
                  </div>
                )}

                {type !== 'movie' && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">İzlenen Bölüm</label>
                    <input
                      type="number"
                      min={0}
                      max={totalEpisodes}
                      value={watchedEpisodes}
                      onChange={(e) => setWatchedEpisodes(parseInt(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl bg-[#161618] border border-white/10 text-xs sm:text-sm text-gray-100 outline-none font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">
                    {type === 'movie' ? 'Film Süresi (Dk)' : 'Bölüm Süresi (Dk)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={episodeDurationMinutes}
                    onChange={(e) => setEpisodeDurationMinutes(parseInt(e.target.value) || 24)}
                    className="w-full p-2 rounded-xl bg-[#161618] border border-white/10 text-xs sm:text-sm text-gray-100 outline-none font-mono text-blue-400 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Tags Selector (Masterpiece, Slow Burn, Must Watch Again, etc.) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" /> Özel Etiketler (Tagging)
                </label>
                <span className="text-[10px] text-gray-500">Kütüphanede filtreleme için kullanılır</span>
              </div>

              {/* Preset Tag Chips */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((t) => {
                  const isSelected = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 ring-1 ring-blue-500/30'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400'
                      }`}
                    >
                      🏷️ {t}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Yeni özel etiket yaz..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                  className="flex-1 px-3 py-1.5 bg-[#0A0A0B] border border-white/10 rounded-xl text-xs text-gray-200 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300"
                >
                  + Etiket Ekle
                </button>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Başlangıç Durumu</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'plan_to_watch', label: '📌 Planlanıyor' },
                  { id: 'watching', label: '⚡ İzleniyor' },
                  { id: 'completed', label: '🎉 İzlendi' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleQuickStatusChange(s.id as WatchStatus)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      status === s.id
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-white/5 border-white/5 text-gray-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-gray-400">Türler (Virgülle ayırın)</label>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  placeholder="Aksiyon, Dram, Bilimkurgu..."
                  className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs sm:text-sm text-gray-100 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Çıkış Yılı</label>
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(parseInt(e.target.value) || 2024)}
                  className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs sm:text-sm text-gray-100 outline-none font-mono"
                />
              </div>
            </div>

            {/* Poster URL with live thumbnail preview */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Afiş / Kapak Görseli URL</label>
              <div className="flex gap-2">
                <img
                  src={posterUrl}
                  alt="Preview"
                  className="w-10 h-14 object-cover rounded-lg border border-white/10 shrink-0"
                />
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-300 outline-none"
                />
              </div>
            </div>

            {/* Custom Lists Checklist */}
            {customLists.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-blue-400" /> Listelere Dahil Et
                </label>
                <div className="flex flex-wrap gap-2">
                  {customLists.map((cl) => {
                    const selected = selectedListIds.includes(cl.id);
                    return (
                      <button
                        key={cl.id}
                        type="button"
                        onClick={() => toggleList(cl.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition ${
                          selected
                            ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                            : 'bg-white/5 border-white/5 text-gray-400'
                        }`}
                      >
                        <span>{cl.icon}</span>
                        <span>{cl.name}</span>
                        {selected && <Check className="w-3 h-3 text-blue-400 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0A0A0B] border-t border-white/5 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs sm:text-sm transition cursor-pointer border border-white/5"
          >
            İptal
          </button>
          <button
            type="submit"
            form="add-media-form"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/50 transition cursor-pointer"
          >
            Kütüphaneye Ekle
          </button>
        </div>
      </div>
    </div>
  );
};
