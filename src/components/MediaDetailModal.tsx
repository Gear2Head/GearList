import React, { useState } from 'react';
import {
  X,
  Star,
  CheckCircle,
  PlayCircle,
  Clock,
  Plus,
  Minus,
  Heart,
  Repeat,
  Sparkles,
  Trash2,
  Bookmark,
  Share2,
  Calendar,
  Layers,
  AlertTriangle,
  FolderPlus,
  Check,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MediaItem, WatchStatus, CustomList } from '../types';
import { formatWatchTime } from '../utils/calculations';

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

interface MediaDetailModalProps {
  item: MediaItem | null;
  customLists: CustomList[];
  onClose: () => void;
  onSave: (updatedItem: MediaItem) => void;
  onDelete: (id: string) => void;
  onCreateCustomList: (name: string) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  customLists,
  onClose,
  onSave,
  onDelete,
  onCreateCustomList,
}) => {
  if (!item) return null;

  const [formData, setFormData] = useState<MediaItem>({ ...item });
  const [newListName, setNewListName] = useState('');
  const [showCreateList, setShowCreateList] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [aiTrivia, setAiTrivia] = useState<string | null>(null);
  const [isLoadingTrivia, setIsLoadingTrivia] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const toggleTag = (tag: string) => {
    const current = formData.tags || [];
    const exists = current.includes(tag);
    const updated = exists ? current.filter((t) => t !== tag) : [...current, tag];
    setFormData({ ...formData, tags: updated });
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim();
    if (!clean) return;
    const current = formData.tags || [];
    if (!current.includes(clean)) {
      setFormData({ ...formData, tags: [...current, clean] });
    }
    setCustomTagInput('');
  };

  const totalEp = formData.totalEpisodes || (formData.type === 'movie' ? 1 : 12);
  const currentDuration = formData.episodeDurationMinutes || 24;

  // Calculate live watch time for preview
  const currentWatchMinutes =
    formData.type === 'movie'
      ? formData.status === 'completed'
        ? (formData.episodeDurationMinutes || 120) * Math.max(1, 1 + (formData.rewatchCount || 0))
        : 0
      : formData.watchedEpisodes * currentDuration * Math.max(1, 1 + (formData.status === 'completed' ? (formData.rewatchCount || 0) : 0));

  const formattedWatchTime = formatWatchTime(currentWatchMinutes);

  const handleStatusChange = (newStatus: WatchStatus) => {
    let updatedWatched = formData.watchedEpisodes;
    if (newStatus === 'completed') {
      updatedWatched = totalEp;
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } else if (newStatus === 'plan_to_watch' && formData.watchedEpisodes === totalEp) {
      updatedWatched = 0;
    }

    setFormData({
      ...formData,
      status: newStatus,
      watchedEpisodes: updatedWatched,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : formData.completedAt,
    });
  };

  const handleEpisodeChange = (newCount: number) => {
    const val = Math.max(0, Math.min(totalEp, newCount));
    let newStatus = formData.status;
    if (val === totalEp && val > 0) {
      newStatus = 'completed';
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
    } else if (val > 0 && newStatus === 'plan_to_watch') {
      newStatus = 'watching';
    }

    setFormData({
      ...formData,
      watchedEpisodes: val,
      status: newStatus,
    });
  };

  const toggleCustomList = (listId: string) => {
    const current = formData.customListIds || [];
    const exists = current.includes(listId);
    const updated = exists ? current.filter((id) => id !== listId) : [...current, listId];
    setFormData({ ...formData, customListIds: updated });
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    onCreateCustomList(newListName.trim());
    setNewListName('');
    setShowCreateList(false);
  };

  const handleFetchAiTrivia = async () => {
    setIsLoadingTrivia(true);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              text: `"${formData.title}" (${formData.type}, ${formData.releaseYear}) hakkında sinema/anime severlerin çok az bildiği 2 adet şaşırtıcı kamera arkası veya yapım detayı / eğlenceli trivia paylaş. Kısa ve vurucu olsun.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiTrivia(data.reply || 'Bu yapım türünün en sevilen örneklerinden biri!');
    } catch (e) {
      setAiTrivia('Bu yapım yüksek izlenme ve beğeni oranına sahip popüler bir eser!');
    } finally {
      setIsLoadingTrivia(false);
    }
  };

  const getRatingLabel = (score: number) => {
    if (score >= 10) return '🏆 Başyapıt (Masterpiece)';
    if (score >= 9) return '⭐ Harika / Kusursuza Yakın';
    if (score >= 8) return '🔥 Çok İyi';
    if (score >= 7) return '👍 İyi';
    if (score >= 6) return '👌 Fena Değil';
    if (score >= 5) return '😐 Ortalama';
    return '👎 Zayıf';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-8 bg-[#161618] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Banner Backdrop */}
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-[#0A0A0B] shrink-0">
          <img
            src={formData.bannerUrl || formData.posterUrl}
            alt={formData.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/60 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0A0A0B]/80 hover:bg-[#161618] text-gray-300 hover:text-white backdrop-blur-md border border-white/10 transition z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => setFormData({ ...formData, favorite: !formData.favorite })}
            className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-md border transition z-20 cursor-pointer ${
              formData.favorite
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-[#0A0A0B]/80 border-white/10 text-gray-400 hover:text-rose-400'
            }`}
            title="Favorilere Ekle"
          >
            <Heart className={`w-5 h-5 ${formData.favorite ? 'fill-rose-500' : ''}`} />
          </button>

          {/* Header Info inside banner */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4 z-10">
            <img
              src={formData.posterUrl}
              alt={formData.title}
              className="w-20 sm:w-28 aspect-[3/4] object-cover rounded-xl border-2 border-white/10 shadow-xl shrink-0 -mb-6"
            />
            <div className="flex-1 min-w-0 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {formData.type.toUpperCase()} • {formData.releaseYear}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-white truncate mt-1">
                {formData.title}
              </h2>
              {formData.originalTitle && (
                <p className="text-xs text-gray-400 truncate">{formData.originalTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 pt-10 space-y-6">
          {/* Status Bar Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              İzleme Durumu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: 'completed', label: 'İzlendi 🎉', color: 'purple' },
                  { id: 'watching', label: 'İzleniyor ⚡', color: 'emerald' },
                  { id: 'plan_to_watch', label: 'Planlanıyor 📌', color: 'amber' },
                  { id: 'on_hold', label: 'Beklemede ⏸️', color: 'blue' },
                  { id: 'dropped', label: 'Bırakıldı ❌', color: 'rose' },
                ] as const
              ).map((s) => {
                const isActive = formData.status === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleStatusChange(s.id as WatchStatus)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Episode Stepper & Calculated Watch Time */}
          <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400">İzlenen Bölüm</span>
                <p className="text-xs text-gray-500">
                  {formData.episodeDurationMinutes} dakika / bölüm
                </p>
              </div>

              {/* Calculated Watch Time Display Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm font-bold">{formattedWatchTime.formattedText}</span>
              </div>
            </div>

            {formData.type !== 'movie' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEpisodeChange(formData.watchedEpisodes - 1)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition border border-white/5"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={totalEp}
                    value={formData.watchedEpisodes}
                    onChange={(e) => handleEpisodeChange(parseInt(e.target.value))}
                    className="flex-1 accent-blue-500 h-2 bg-[#0A0A0B] rounded-lg cursor-pointer"
                  />

                  <button
                    onClick={() => handleEpisodeChange(formData.watchedEpisodes + 1)}
                    className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 transition font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <div className="min-w-[60px] text-right">
                    <span className="text-base font-extrabold text-gray-100 font-mono">
                      {formData.watchedEpisodes}
                    </span>
                    <span className="text-xs text-gray-500 font-medium"> / {totalEp}</span>
                  </div>
                </div>

                {/* Quick Max Episode Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleEpisodeChange(totalEp)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    Tümünü İzledim ({totalEp} Bölüm)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Film Süresi:</span>
                <span className="font-mono font-bold text-gray-200">
                  {formData.episodeDurationMinutes || 120} Dakika
                </span>
              </div>
            )}

            {/* Rewatch Counter */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-blue-400" /> Tekrar İzleme (Rewatch) Sayısı:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      rewatchCount: Math.max(0, (formData.rewatchCount || 0) - 1),
                    })
                  }
                  className="w-6 h-6 rounded bg-white/5 text-gray-300 flex items-center justify-center text-xs hover:bg-white/10"
                >
                  -
                </button>
                <span className="font-bold text-sm text-gray-100 min-w-[20px] text-center font-mono">
                  x{formData.rewatchCount || 0}
                </span>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      rewatchCount: (formData.rewatchCount || 0) + 1,
                    })
                  }
                  className="w-6 h-6 rounded bg-white/5 text-gray-300 flex items-center justify-center text-xs hover:bg-white/10"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 10-Star Rating Bar */}
          <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Puanınız (1 - 10)
              </label>
              <span className="text-xs font-bold text-yellow-500">
                {formData.userRating
                  ? `${formData.userRating}/10 • ${getRatingLabel(formData.userRating)}`
                  : 'Henüz Puanlanmadı'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                const active = (hoverRating !== null ? hoverRating : formData.userRating || 0) >= star;
                return (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setFormData({ ...formData, userRating: star })}
                    className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        active ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Lists Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-blue-400" /> Özel Listelere Ekle
              </label>
              <button
                onClick={() => setShowCreateList(!showCreateList)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Yeni Liste Oluştur
              </button>
            </div>

            {showCreateList && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0D0D0E] border border-white/10 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Örn: 2026 Favorilerim..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="flex-1 bg-[#0A0A0B] px-3 py-1.5 rounded-lg text-xs text-gray-100 outline-none border border-white/10"
                />
                <button
                  onClick={handleCreateList}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
                >
                  Ekle
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {customLists.map((cl) => {
                const isSelected = formData.customListIds?.includes(cl.id);
                return (
                  <button
                    key={cl.id}
                    onClick={() => toggleCustomList(cl.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400'
                    }`}
                  >
                    <span>{cl.icon}</span>
                    <span>{cl.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-blue-400 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tags Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" /> Özel Etiketler (Tags)
              </label>
              <span className="text-[10px] text-gray-500">Kütüphanede filtreleme için</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((t) => {
                const isSelected = (formData.tags || []).includes(t);
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
                placeholder="Özel etiket ekle..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                className="flex-1 px-3 py-1.5 bg-[#0D0D0E] border border-white/10 rounded-xl text-xs text-gray-200 outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 cursor-pointer"
              >
                + Ekle
              </button>
            </div>
          </div>

          {/* User Review & Spoiler Tag */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Yorumunuz & Düşünceleriniz
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSpoiler || false}
                  onChange={(e) => setFormData({ ...formData, isSpoiler: e.target.checked })}
                  className="rounded border-gray-700 text-rose-500 focus:ring-rose-500/30"
                />
                <span className="text-rose-400 font-medium">⚠️ Spoiler İçerir</span>
              </label>
            </div>
            <textarea
              rows={3}
              placeholder="Bu yapım hakkındaki samimi düşünceleriniz, en sevdiğiniz sahneler veya replikler..."
              value={formData.review || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  review: e.target.value,
                  reviewDate: new Date().toISOString().split('T')[0],
                })
              }
              className="w-full p-3 rounded-xl bg-[#0A0A0B] border border-white/10 focus:border-blue-500 text-xs sm:text-sm text-gray-200 placeholder-gray-500 outline-none transition"
            />
          </div>

          {/* Personal Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Kişisel Notlar (Sadece size özel)
            </label>
            <input
              type="text"
              placeholder="Örn: 5. bölümden sonra soundtrackleri dinle, arkadaşına öner..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 focus:border-blue-500 text-xs text-gray-200 placeholder-gray-600 outline-none"
            />
          </div>

          {/* AI Behind-the-Scenes Trivia Generator */}
          <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" /> GearAI Kamera Arkası & Trivia
              </span>
              <button
                onClick={handleFetchAiTrivia}
                disabled={isLoadingTrivia}
                className="text-xs px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 font-medium cursor-pointer transition disabled:opacity-50"
              >
                {isLoadingTrivia ? 'Yükleniyor...' : 'AI Trivia Getir'}
              </button>
            </div>
            {aiTrivia && (
              <p className="text-xs text-gray-300 leading-relaxed pt-1 bg-[#161618] p-2.5 rounded-xl border border-white/5">
                {aiTrivia}
              </p>
            )}
          </div>

          {/* Synopsis & Metadata */}
          {formData.synopsis && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Konu & Özet
              </span>
              <p className="text-xs text-gray-400 leading-relaxed bg-[#0D0D0E] p-3 rounded-xl border border-white/5">
                {formData.synopsis}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#0A0A0B] border-t border-white/5 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => onDelete(formData.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Kütüphaneden Sil</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs sm:text-sm transition cursor-pointer border border-white/5"
            >
              Vazgeç
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/60 transition cursor-pointer"
            >
              Kaydet & Güncelle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
