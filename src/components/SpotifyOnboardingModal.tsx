import React, { useState } from 'react';
import { Music, Check, Sparkles, X, ArrowRight, ShieldCheck, Play, Radio } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpotifyOnboardingModalProps {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onConnect: (spotifyUsername: string) => void;
}

export const SpotifyOnboardingModal: React.FC<SpotifyOnboardingModalProps> = ({
  userName,
  isOpen,
  onClose,
  onConnect,
}) => {
  const [spotifyUser, setSpotifyUser] = useState('kadiralper_sp');
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    setIsSyncing(true);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#1DB954', '#10B981', '#34D399', '#059669'],
      });
    } catch (e) {
      console.warn(e);
    }

    setTimeout(() => {
      setIsSyncing(false);
      setSynced(true);
      setTimeout(() => {
        onConnect(spotifyUser || 'spotify_user');
        onClose();
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#161618] border border-green-500/30 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Spotify Icon & Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] mx-auto shadow-lg shadow-green-950/30">
            <Music className="w-8 h-8 fill-current" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
            <Sparkles className="w-3 h-3" /> Spotify Entegrasyon Önerisi
          </div>

          <h3 className="text-xl font-black text-white">
            Hoş Geldin, {userName}! 🎵
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed px-2">
            Dinlediğin anime, dizi & film soundtracklerini ve sanatçı sürelerini GearList genel eğlence sürene dahil etmek ister misin?
          </p>
        </div>

        {/* Highlight Perks */}
        <div className="p-3.5 rounded-2xl bg-[#0D0D0E] border border-white/5 space-y-2 text-xs text-gray-300">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-green-500/10 text-green-400 font-bold">✓</div>
            <span>En çok dinlenen sanatçılar (Hiroyuki Sawano, Hans Zimmer, vb.)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-green-500/10 text-green-400 font-bold">✓</div>
            <span>Profilinde yeşil <strong>"Spotify Doğrulandı"</strong> rozeti</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-green-500/10 text-green-400 font-bold">✓</div>
            <span>+47.5 Saat müzik dinleme süresi toplam grafiğe eklenir</span>
          </div>
        </div>

        {/* Account Username input preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400">Spotify Kullanıcı Adı / Profil Adı</label>
          <div className="relative">
            <input
              type="text"
              value={spotifyUser}
              onChange={(e) => setSpotifyUser(e.target.value)}
              placeholder="kadiralper_sp"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D0D0E] border border-white/10 text-xs text-gray-100 outline-none focus:border-green-500"
            />
            <Music className="w-4 h-4 text-green-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleConnect}
            disabled={isSyncing || synced}
            className="w-full py-3 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs shadow-lg shadow-green-900/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {synced ? (
              <>
                <Check className="w-4 h-4" />
                <span>Spotify Başarıyla Bağlandı!</span>
              </>
            ) : isSyncing ? (
              <span>Senkronize Ediliyor...</span>
            ) : (
              <>
                <Music className="w-4 h-4 fill-black" />
                <span>Spotify'ı Şimdi Bağla & İçe Aktar</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-gray-400 hover:text-gray-200 transition cursor-pointer"
          >
            Daha Sonra Hatırlat / Şimdilik Atla
          </button>
        </div>
      </div>
    </div>
  );
};
