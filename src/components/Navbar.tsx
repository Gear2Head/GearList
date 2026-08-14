import React from 'react';
import {
  Film,
  Tv,
  Music,
  Plus,
  BarChart3,
  ListOrdered,
  Trophy,
  Bot,
  Link2,
  User,
  Sparkles,
  Search,
  Compass,
  Clock,
  Calendar,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab =
  | 'library'
  | 'timeline'
  | 'for_you'
  | 'stats'
  | 'lists'
  | 'achievements'
  | 'gearbot'
  | 'integrations'
  | 'profile';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  userProfile: UserProfile;
  totalWatchHours: number;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  userProfile,
  totalWatchHours,
  onLogout,
}) => {
  const navItems = [
    { id: 'library', label: 'Kütüphanem', icon: Compass },
    { id: 'timeline', label: 'Zaman Çizelgesi', icon: Calendar },
    { id: 'for_you', label: 'Sana Özel (AI)', icon: Sparkles, highlight: true },
    { id: 'stats', label: 'Süre & İstatistikler', icon: BarChart3, badge: `${Math.round(totalWatchHours)}s` },
    { id: 'lists', label: 'Özel Listeler', icon: ListOrdered },
    { id: 'achievements', label: 'Başarımlar', icon: Trophy, badge: `Lv.${userProfile.level}` },
    { id: 'gearbot', label: 'GearBot AI', icon: Bot },
    { id: 'integrations', label: 'Spotify & MAL', icon: Link2 },
    { id: 'profile', label: 'Profilim', icon: User },
  ];

  const spotifyConnected = userProfile.connectedAccounts?.spotify?.connected;
  const malConnected = userProfile.connectedAccounts?.mal?.connected;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0A0A0B]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Brand Logo - Sophisticated Dark GEARLIST */}
          <div
            onClick={() => onSelectTab('library')}
            className="flex items-center gap-3.5 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#161618] border border-white/10 flex items-center justify-center text-blue-500 group-hover:border-blue-500/40 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tighter text-blue-500 leading-none">
                  GEAR<span className="text-white">LIST</span>
                </h1>
                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-0.5 hidden sm:block">
                Time & Media Tracker
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search
                onClick={() => searchQuery.trim() && onOpenAddModal()}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 hover:text-blue-400 cursor-pointer transition"
              />
              <input
                type="text"
                placeholder="Anime, dizi, film veya müzik ara... (Enter ile Canlı Ara)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onOpenAddModal();
                  }
                }}
                className="w-full pl-10 pr-10 py-2 bg-[#161618] hover:bg-[#1A1A1C] border border-white/10 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs sm:text-sm text-gray-200 placeholder-gray-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-200 p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Header Stats & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Total Watch Time Stat */}
            <div
              onClick={() => onSelectTab('stats')}
              className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#161618] border border-white/5 hover:border-white/10 cursor-pointer transition"
              title="Toplam İzleme & Dinleme Süresi"
            >
              <div className="flex flex-col text-left">
                <span className="text-gray-500 uppercase text-[9px] tracking-widest font-bold">
                  Total Watch Time
                </span>
                <span className="text-white font-mono text-sm font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400 inline" />
                  {Math.round(totalWatchHours)} Hours
                </span>
              </div>
            </div>

            {/* Linked Accounts Indicator */}
            <div
              onClick={() => onSelectTab('integrations')}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161618] border border-white/5 hover:border-white/10 cursor-pointer transition"
              title="Bağlı Hesaplar"
            >
              <div className="flex flex-col text-left">
                <span className="text-gray-500 uppercase text-[9px] tracking-widest font-bold">
                  Linked Accounts
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      spotifyConnected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-gray-600'
                    }`}
                    title={spotifyConnected ? 'Spotify Bağlı' : 'Spotify Bağlı Değil'}
                  />
                  <span
                    className={`w-2 h-2 rounded-full ${
                      malConnected ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]' : 'bg-gray-600'
                    }`}
                    title={malConnected ? 'MAL Bağlı' : 'MAL Bağlı Değil'}
                  />
                  <span className="text-[10px] text-gray-400 font-medium">
                    {spotifyConnected || malConnected ? 'Aktif' : 'Bağla'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Add CTA Button */}
            <button
              onClick={onOpenAddModal}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-blue-950/40 hover:shadow-blue-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Quick Add</span>
            </button>

            {/* User Profile Snapshot Pill & Logout */}
            <div className="flex items-center gap-1">
              <div
                onClick={() => onSelectTab('profile')}
                className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-[#161618] border transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userProfile.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-200 truncate max-w-[90px]">
                    {userProfile.displayName}
                  </p>
                  <p className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">
                    Lv.{userProfile.level}
                  </p>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Oturumu Kapat / Hesap Değiştir"
                  className="p-2 rounded-xl bg-[#161618] hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap py-2.5 scrollbar-none w-full border-t border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                } ${item.highlight && !isActive ? 'text-blue-400' : ''}`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-blue-400' : item.highlight ? 'text-blue-400' : 'text-gray-400'
                  }`}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-gray-400 border border-white/5'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
