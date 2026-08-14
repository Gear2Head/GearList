import React, { useState } from 'react';
import {
  ListOrdered,
  Plus,
  Trash2,
  Edit2,
  Share2,
  Copy,
  Check,
  FolderPlus,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { CustomList, MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface CustomListsViewProps {
  customLists: CustomList[];
  mediaItems: MediaItem[];
  onCreateList: (list: CustomList) => void;
  onDeleteList: (id: string) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onIncrementEpisode: (id: string) => void;
  onOpenDetails: (item: MediaItem) => void;
  onQuickRate: (id: string, rating: number) => void;
}

export const CustomListsView: React.FC<CustomListsViewProps> = ({
  customLists,
  mediaItems,
  onCreateList,
  onDeleteList,
  onUpdateStatus,
  onIncrementEpisode,
  onOpenDetails,
  onQuickRate,
}) => {
  const [selectedListId, setSelectedListId] = useState<string>(customLists[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedListId, setCopiedListId] = useState<string | null>(null);

  // New list form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🍿');
  const [color, setColor] = useState('#3B82F6');

  const selectedList = customLists.find((l) => l.id === selectedListId) || customLists[0];
  const listItems = mediaItems.filter((item) => item.customListIds?.includes(selectedList?.id));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newList: CustomList = {
      id: `list-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Kişisel özel medya koleksiyonu.',
      icon,
      color,
      isPublic: true,
      createdAt: new Date().toISOString(),
    };

    onCreateList(newList);
    setSelectedListId(newList.id);
    setName('');
    setDescription('');
    setIsCreating(false);
  };

  const handleCopyShareLink = (list: CustomList) => {
    const url = `${window.location.origin}/app/u/kadiralper/list/${list.id}`;
    navigator.clipboard.writeText(url);
    setCopiedListId(list.id);
    setTimeout(() => setCopiedListId(null), 2000);
  };

  const emojiOptions = ['🏆', '🍿', '🔥', '🧠', '🎧', '⚔️', '✨', '🎬', '🌌', '🚀', '⭐', '❤️'];
  const colorOptions = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#6366F1'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <ListOrdered className="w-7 h-7 text-blue-400" /> Özel Medya Listeleri
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Yapımları temalarına, arkadaş önerilerine veya kişisel hedeflerinize göre gruplayın
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/50 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Liste Oluştur</span>
        </button>
      </div>

      {/* Create List Form Box */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-5 sm:p-6 rounded-3xl bg-[#161618] border border-blue-500/30 space-y-4 animate-in slide-in-from-top-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-400" /> Yeni Özel Liste Tanımla
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Kapat
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-400">Liste Adı *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: 2026 Sezonu Favorileri, Haftasonu Maratonu..."
                className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 focus:border-blue-500 text-xs sm:text-sm text-gray-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">İkon Seçin</label>
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#0A0A0B] rounded-xl border border-white/10">
                {emojiOptions.slice(0, 8).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setIcon(em)}
                    className={`w-7 h-7 rounded-lg text-sm transition ${
                      icon === em ? 'bg-blue-500/20 scale-110' : 'hover:bg-white/5'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu listenin amacı veya içeriği hakkında kısa bir not..."
              className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-200 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Tema Rengi:</span>
              <div className="flex gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/5"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Listeyi Kaydet
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List Badges Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {customLists.map((l) => {
          const isSelected = selectedList?.id === l.id;
          const count = mediaItems.filter((i) => i.customListIds?.includes(l.id)).length;
          return (
            <button
              key={l.id}
              onClick={() => setSelectedListId(l.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1A1A1C] text-white shadow-lg shadow-black/40 ring-1'
                  : 'bg-[#161618] hover:bg-[#1A1A1C] text-gray-400 hover:text-gray-200 border-white/5'
              }`}
              style={{
                borderColor: isSelected ? l.color : undefined,
              }}
            >
              <span className="text-base">{l.icon}</span>
              <span>{l.name}</span>
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-md font-mono"
                style={{
                  backgroundColor: `${l.color}20`,
                  color: l.color,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected List Detail Card */}
      {selectedList && (
        <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
            <div className="flex items-start gap-3.5">
              <div
                className="text-3xl p-3 rounded-2xl border"
                style={{
                  backgroundColor: `${selectedList.color}15`,
                  borderColor: `${selectedList.color}40`,
                }}
              >
                {selectedList.icon}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  {selectedList.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed max-w-2xl">
                  {selectedList.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{listItems.length} Medya Eklendi</span>
                  <span>•</span>
                  <span>Herkese Açık (Public)</span>
                </div>
              </div>
            </div>

            {/* List Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => handleCopyShareLink(selectedList)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold transition cursor-pointer"
                title="Paylaşım Linkini Kopyala"
              >
                {copiedListId === selectedList.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Listeyi Paylaş</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onDeleteList(selectedList.id)}
                className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
                title="Listeyi Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Items Grid */}
          {listItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  customLists={customLists}
                  onUpdateStatus={onUpdateStatus}
                  onIncrementEpisode={onIncrementEpisode}
                  onOpenDetails={onOpenDetails}
                  onQuickRate={onQuickRate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3 bg-[#0D0D0E] rounded-2xl border border-dashed border-white/10">
              <span className="text-4xl">📂</span>
              <h4 className="text-base font-bold text-gray-300">Bu listede henüz yapım yok</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Kütüphanenizdeki veya arama sonuçlarındaki herhangi bir yapımı detay kartından bu
                listeye ekleyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
