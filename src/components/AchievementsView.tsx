import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Flame,
  Star,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { Achievement, UserProfile } from '../types';

interface AchievementsViewProps {
  achievements: Achievement[];
  userProfile: UserProfile;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
  userProfile,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXpEarned = achievements
    .filter((a) => a.unlocked)
    .reduce((acc, a) => acc + a.xpReward, 0);

  const filteredAchievements = achievements.filter((a) => {
    const matchesCat = filterCategory === 'all' || a.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unlocked' && a.unlocked) ||
      (filterStatus === 'locked' && !a.unlocked);
    return matchesCat && matchesStatus;
  });

  const getRarityBadge = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return {
          label: 'EFSANEVİ',
          border: 'border-yellow-500/40 shadow-yellow-500/10 bg-[#161618]',
          text: 'text-yellow-400',
          badge: 'bg-yellow-500 text-[#0A0A0B] font-extrabold',
        };
      case 'epic':
        return {
          label: 'EPİK',
          border: 'border-purple-500/40 shadow-purple-500/10 bg-[#161618]',
          text: 'text-purple-400',
          badge: 'bg-purple-500 text-white font-bold',
        };
      case 'rare':
        return {
          label: 'NADİR',
          border: 'border-blue-500/40 shadow-blue-500/10 bg-[#161618]',
          text: 'text-blue-400',
          badge: 'bg-blue-500 text-white font-bold',
        };
      default:
        return {
          label: 'YAYGIN',
          border: 'border-white/5 bg-[#161618]',
          text: 'text-gray-400',
          badge: 'bg-white/10 text-gray-300 font-medium',
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Level Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#161618] via-[#1A1A1C] to-[#121214] border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              Başarım & Rozet Sistemi
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Koleksiyon & Seyir Başarımları
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              İzledikçe, puanladıkça ve müzik dinledikçe XP kazanın, seviye atlayın ve profilinizde
              parıldayan nadir rozetlerin kilidini açın!
            </p>
          </div>

          {/* Level & XP Stats Box */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0A0A0B]/80 border border-white/10 shadow-xl shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 p-0.5 shadow-lg shadow-blue-950/50">
              <div className="w-full h-full bg-[#161618] rounded-[14px] flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">SEVİYE</span>
                <span className="text-xl font-black text-white">{userProfile.level}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100">{userProfile.rankTitle}</h3>
              <p className="text-xs text-blue-400 font-semibold font-mono mt-0.5">
                {unlockedCount} / {achievements.length} Başarım Açıldı
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>Toplam {totalXpEarned.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'anime', label: '⛩️ Anime' },
            { id: 'movie', label: '🎬 Film' },
            { id: 'music', label: '🎵 Müzik' },
            { id: 'general', label: '⚡ Genel' },
            { id: 'social', label: '📑 Koleksiyon' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                filterCategory === c.id
                  ? 'bg-white text-[#0A0A0B] border-white font-bold shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#161618] p-1 rounded-xl border border-white/5">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'unlocked', label: 'Açılanlar' },
            { id: 'locked', label: 'Kilitliler' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterStatus === s.id
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAchievements.map((ach) => {
          const rarity = getRarityBadge(ach.rarity);
          const percent = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

          return (
            <div
              key={ach.id}
              className={`relative flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 group overflow-hidden ${
                ach.unlocked
                  ? `${rarity.border} shadow-xl hover:scale-[1.02]`
                  : 'border-white/5 bg-[#0D0D0E]/60 opacity-60 hover:opacity-85'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  {/* Emoji Icon Container */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border transition-transform group-hover:scale-110 shadow-lg ${
                      ach.unlocked
                        ? 'bg-[#1A1A1C] border-white/10'
                        : 'bg-[#121214] border-white/5 grayscale'
                    }`}
                  >
                    {ach.icon}
                  </div>

                  {/* Rarity and Unlock Badge */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${rarity.badge}`}>
                      {rarity.label}
                    </span>

                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1 font-mono">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-base text-gray-100 flex items-center gap-1.5">
                  <span>{ach.title}</span>
                  {ach.unlocked && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 inline" />
                  )}
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{ach.description}</p>
              </div>

              {/* Progress Bar & Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">İlerleme:</span>
                  <span className="font-mono font-bold text-gray-300">
                    {ach.progress} / {ach.maxProgress} ({percent}%)
                  </span>
                </div>

                <div className="w-full h-2 bg-[#0A0A0B] rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ach.unlocked
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        : 'bg-gray-700'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {ach.unlockedAt && (
                  <p className="text-[10px] text-gray-500 text-right pt-0.5">
                    Kazanıldı: {new Date(ach.unlockedAt).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
