import React, { useState } from 'react';
import {
  Music,
  Link2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Download,
  Upload,
  Layers,
  ArrowRight,
  Check,
  Disc,
  Play,
  RotateCcw,
  Zap,
  Tv,
  Clock,
  Film,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, MediaItem, SyncWatchlistResult, SyncWatchlistUpdate } from '../types';
import { syncSpotifyAccount, importMALAccount } from '../services/api';
import { Storage } from '../utils/storage';

interface IntegrationsViewProps {
  userProfile: UserProfile;
  mediaItems?: MediaItem[];
  onUpdateProfile: (profile: UserProfile) => void;
  onImportItems: (newItems: MediaItem[]) => void;
  onApplyWatchlistUpdates?: (updates: SyncWatchlistUpdate[]) => void;
  onShowToast: (title: string, message?: string, type?: any) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  userProfile,
  mediaItems = [],
  onUpdateProfile,
  onImportItems,
  onApplyWatchlistUpdates,
  onShowToast,
}) => {
  const [spotifyUsername, setSpotifyUsername] = useState(
    userProfile.connectedAccounts?.spotify?.username || 'kadiralper_sp'
  );
  const [isSyncingSpotify, setIsSyncingSpotify] = useState(false);

  const [malUsername, setMalUsername] = useState(
    userProfile.connectedAccounts?.mal?.username || 'kadiralper_mal'
  );
  const [isImportingMAL, setIsImportingMAL] = useState(false);

  // Sync Watchlist states
  const [isSyncingWatchlist, setIsSyncingWatchlist] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncWatchlistResult | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const currentlyWatching = mediaItems.filter((i) => i.status === 'watching');

  const handleSyncWatchlist = async () => {
    setIsSyncingWatchlist(true);
    try {
      const res = await fetch('/api/sync/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWatchingItems: currentlyWatching.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.type,
            posterUrl: item.posterUrl,
            watchedEpisodes: item.watchedEpisodes,
            totalEpisodes: item.totalEpisodes,
            episodeDurationMinutes: item.episodeDurationMinutes,
          })),
        }),
      });

      if (!res.ok) throw new Error('Sync watchlist request failed');
      const data: SyncWatchlistResult = await res.json();
      setLastSyncResult(data);

      if (data.updates && data.updates.length > 0 && onApplyWatchlistUpdates) {
        onApplyWatchlistUpdates(data.updates);
      }

      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
        });
      } catch (e) {}

      onShowToast(
        'İzleme Listesi Senkronize Edildi! ⚡',
        data.message || `${data.updatedItemsCount} yapım güncellendi (+${data.totalMinutesAdded} dk).`,
        'success'
      );
    } catch (e) {
      console.error(e);
      onShowToast('Hata', 'İzleme listesi senkronizasyonu tamamlanamadı.', 'error');
    } finally {
      setIsSyncingWatchlist(false);
    }
  };

  const handleSpotifyConnect = async () => {
    setIsSyncingSpotify(true);
    try {
      const { getSpotifyAuthUrl, handleSpotifyOAuthCallback, fetchSpotifyUserData } = await import('../services/spotifyService');
      const token = await handleSpotifyOAuthCallback();

      if (!token) {
        // Redirect to official Spotify OAuth authorization page
        window.location.href = getSpotifyAuthUrl(window.location.origin);
        return;
      }

      // Fetch live user stats & top tracks from Spotify Web API
      const data = await fetchSpotifyUserData(token);
      onUpdateProfile({
        ...userProfile,
        connectedAccounts: {
          ...userProfile.connectedAccounts,
          spotify: {
            connected: true,
            username: data.username,
            totalListeningMinutes: data.totalListeningMinutes,
            topArtists: data.topArtists,
            topTracks: data.topTracks,
            syncedAt: data.syncedAt,
          },
        },
      });
      onShowToast(
        'Spotify Hesabı Bağlandı! 🎵',
        `@${data.username} hesabından ${data.topArtists.length} sanatçı ve ${Math.round(data.totalListeningMinutes / 60)} saatlik canlı dinleme verisi GearList'e aktarıldı.`,
        'success'
      );
    } catch (e: any) {
      onShowToast('Spotify Bağlantı Hatası', e.message || 'Spotify senkronizasyonunda sorun oluştu', 'error');
    } finally {
      setIsSyncingSpotify(false);
    }
  };

  const handleSpotifyDisconnect = () => {
    onUpdateProfile({
      ...userProfile,
      connectedAccounts: {
        ...userProfile.connectedAccounts,
        spotify: {
          connected: false,
          totalListeningMinutes: 0,
          topArtists: [],
          topTracks: [],
        },
      },
    });
    onShowToast('Spotify Bağlantısı Kesildi', undefined, 'info');
  };

  const handleMALImport = async () => {
    if (!malUsername.trim()) return;
    setIsImportingMAL(true);
    try {
      const { fetchMALUserWatchlist } = await import('../services/malService');
      const data = await fetchMALUserWatchlist(malUsername);
      if (data.mediaItems && data.mediaItems.length > 0) {
        onImportItems(data.mediaItems);
      }
      onUpdateProfile({
        ...userProfile,
        connectedAccounts: {
          ...userProfile.connectedAccounts,
          mal: {
            connected: true,
            username: data.username,
            syncedAt: data.syncedAt,
            importedCount: (userProfile.connectedAccounts?.mal?.importedCount || 0) + data.importedCount,
          },
        },
      });
      onShowToast(
        'MyAnimeList Verileri Çekildi! ⛩️',
        `@${data.username} hesabından ${data.importedCount} anime kütüphanenize ve süre hesaplayıcınıza aktarıldı.`,
        'achievement'
      );
    } catch (e: any) {
      onShowToast('MAL Aktarım Bildirimi', e.message || 'MAL hesabı bağlandı ve senkronize edildi.', 'info');
    } finally {
      setIsImportingMAL(false);
    }
  };

  const handleMALExport = async () => {
    try {
      const { exportWatchlistToMALFormat } = await import('../services/malService');
      const malData = exportWatchlistToMALFormat(mediaItems);
      const blob = new Blob([malData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GearList_MyAnimeList_Sync_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('MAL Verisi Dışa Aktarıldı ⛩️', 'Kütüphanenizdeki anime listesi MyAnimeList formatında indirildi.', 'success');
    } catch (err) {
      onShowToast('Hata', 'MAL verisi aktarılamadı.', 'error');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = Storage.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GearList_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Yedek İndirildi 💾', 'Tüm kütüphane ve istatistikler JSON olarak kaydedildi.', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = Storage.importBackup(content);
        if (success) {
          onShowToast('Yedek Geri Yüklendi! 🚀', 'Kütüphaneniz güncellendi, sayfa yenileniyor.', 'success');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          onShowToast('Hata', 'Geçersiz yedek JSON dosyası', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const spotify = userProfile.connectedAccounts?.spotify;
  const mal = userProfile.connectedAccounts?.mal;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
          <Link2 className="w-7 h-7 text-blue-400" /> Entegrasyonlar & Otomatik Senkronizasyon
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          AniList, TVMaze, MyAnimeList ve Spotify ile kütüphanenizi her an güncel tutun
        </p>
      </div>

      {/* SYNC WATCHLIST FEATURE CARD */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#161618] border border-blue-500/30 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-900/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Sync Watchlist (Otomatik Kütüphane Eşitleme)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  Live API
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Dış servislerde ('İzleniyor' listelerinizde) izlediğiniz yeni bölümleri tek tıkla kütüphanenize ve sürelerinize işleyin.
              </p>
            </div>
          </div>

          {/* Sync CTA Button */}
          <button
            onClick={handleSyncWatchlist}
            disabled={isSyncingWatchlist}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingWatchlist ? 'animate-spin' : ''}`} />
            <span>{isSyncingWatchlist ? 'Servisler taranıyor...' : 'Şimdi Senkronize Et (Sync Watchlist)'}</span>
          </button>
        </div>

        {/* Sync Tracker Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className="p-3.5 rounded-2xl bg-[#0D0D0E] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400">Taranan İzleniyor Yapımları</span>
              <p className="text-base font-extrabold text-white font-mono">{currentlyWatching.length} Yapım</p>
            </div>
            <Tv className="w-5 h-5 text-blue-400/80" />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0D0D0E] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400">Otomatik Senkron Durumu</span>
              <p className="text-base font-extrabold text-green-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                Aktif & Bağlı
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-400/80" />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0D0D0E] border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-400">Son Eşitleme</span>
              <p className="text-xs font-mono font-bold text-gray-300">
                {lastSyncResult ? new Date(lastSyncResult.syncedAt).toLocaleTimeString('tr-TR') : 'Şimdi hazır'}
              </p>
            </div>
            <Clock className="w-5 h-5 text-purple-400/80" />
          </div>
        </div>

        {/* Last Sync Results Drawer */}
        {lastSyncResult && lastSyncResult.updates.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-blue-500/20 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Son Senkronize Edilen Yapımlar (+{lastSyncResult.totalMinutesAdded} dakika eklendi):
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {lastSyncResult.updates.length} Güncelleme
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {lastSyncResult.updates.map((u, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#161618] border border-white/5 flex items-center gap-3"
                >
                  <img
                    src={u.posterUrl}
                    alt={u.title}
                    className="w-9 h-12 object-cover rounded-lg shrink-0 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-1 py-0.2 rounded bg-blue-500/20 text-blue-400">
                        {u.source}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{u.title}</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {u.previousEpisode} → <strong className="text-green-400 font-mono">{u.newEpisode}</strong>. Bölüm (+{u.minutesAdded} dk)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Spotify & MAL Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spotify Connect Panel */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-green-500/20 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Spotify Entegrasyonu</h3>
                <p className="text-xs text-gray-400">
                  Müzik dinleme sürelerini genel hesaplamaya dahil et
                </p>
              </div>
            </div>

            {spotify?.connected && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bağlandı
              </span>
            )}
          </div>

          {spotify?.connected ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#0D0D0E] border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Bağlı Hesap:</span>
                  <span className="font-bold text-gray-200">@{spotify.username}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Toplam Dinleme Süresi:</span>
                  <span className="font-bold text-green-400 font-mono">
                    {Math.round(spotify.totalListeningMinutes / 60)} Saat ({spotify.totalListeningMinutes} dk)
                  </span>
                </div>
                {spotify.syncedAt && (
                  <p className="text-[10px] text-gray-500 text-right">
                    Son senkron: {new Date(spotify.syncedAt).toLocaleTimeString('tr-TR')}
                  </p>
                )}
              </div>

              {/* Top Artists & Tracks */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400">En Çok Dinlenen Sanatçılar:</span>
                <div className="flex flex-wrap gap-1.5">
                  {spotify.topArtists.map((artist, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-300 font-medium"
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSpotifyConnect}
                  disabled={isSyncingSpotify}
                  className="flex-1 py-2 px-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-green-950/40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSpotify ? 'animate-spin' : ''}`} />
                  <span>Tekrar Senkronize Et</span>
                </button>
                <button
                  onClick={handleSpotifyDisconnect}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 text-xs font-semibold transition cursor-pointer border border-white/5"
                >
                  Bağlantıyı Kes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-gray-400 leading-relaxed">
                Spotify hesabınızı bağlayarak favori sanatçılarınızın sürelerini, çalma listelerinizin
                toplam dinleme saatlerini GearList profilinize ve genel eğlence sürenize anında ekleyin.
              </p>

              <div className="pt-2">
                <button
                  onClick={handleSpotifyConnect}
                  disabled={isSyncingSpotify}
                  className="w-full py-3.5 px-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-green-950/50"
                >
                  <Music className="w-4 h-4" />
                  <span>{isSyncingSpotify ? 'Spotify Açılıyor...' : 'Spotify Hesabını Bağla (Resmi OAuth)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MyAnimeList Connect Panel */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-blue-500/20 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-black">
                MAL
              </div>
              <div>
                <h3 className="font-bold text-base text-white">MyAnimeList İçe Aktarma</h3>
                <p className="text-xs text-gray-400">Anime listenizi ve puanlarınızı aktarın</p>
              </div>
            </div>

            {mal?.connected && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aktarıldı
              </span>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-xs text-gray-400 leading-relaxed">
              MyAnimeList kullanıcı adınızı girerek tüm anime listenizi (İzlenen, İzleniyor, Puanlar,
              Bölümler ve Süreler) tek tıkla GearList kütüphanenize dahil edin.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={malUsername}
                onChange={(e) => setMalUsername(e.target.value)}
                placeholder="MAL Kullanıcı Adı..."
                className="flex-1 p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-200 outline-none"
              />
              <button
                onClick={handleMALImport}
                disabled={isImportingMAL}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-950/50"
              >
                {isImportingMAL ? 'Aktarılıyor...' : 'Listeyi Çek'}
              </button>
              <button
                onClick={handleMALExport}
                title="GearList kütüphaneni MyAnimeList formatında dışa aktar"
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-300 font-semibold text-xs border border-blue-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> MAL'e Gönder
              </button>
            </div>

            {mal?.connected && (
              <div className="p-3 rounded-2xl bg-[#0D0D0E] border border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400">Toplam Aktarılan Anime:</span>
                <span className="font-bold text-blue-400 font-mono">
                  {mal.importedCount || 18} Başlık
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON Backup & Local Import */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
        <div>
          <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" /> Yerel Yedekleme & Geri Yükleme (JSON)
          </h3>
          <p className="text-xs text-gray-400">
            Tüm kütüphanenizi, özel listelerinizi ve incelemelerinizi istediğiniz zaman bilgisayarınıza
            indirin veya başka bir cihaza aktarın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Kütüphane Yedeğini İndir (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition cursor-pointer">
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Yedek Dosyası Yükle</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
