import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Share2,
  Copy,
  Check,
  Trophy,
  Clock,
  Star,
  Sparkles,
  Calendar,
  Layers,
  Heart,
  Edit3,
  Download,
  Film,
  Tv,
  Music,
  BarChart3,
  History,
  Lock,
  PlayCircle,
  MessageSquare,
  Flame,
  Zap,
  CheckCircle2,
  ExternalLink,
  Filter,
  Send,
  Eye,
  Camera,
  Image as ImageIcon,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, MediaItem, Achievement, ActivityLog } from '../types';
import { uploadImageToStorage, upsertUserProfile } from '../lib/supabase';
import {
  calculateTotalWatchStats,
  formatWatchTime,
  calculateGenreBreakdown,
  evaluateDynamicAchievements,
  formatRelativeTime,
} from '../utils/calculations';

interface ProfileViewProps {
  userProfile: UserProfile;
  mediaItems: MediaItem[];
  achievements: Achievement[];
  activityLogs: ActivityLog[];
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenDetails: (item: MediaItem) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  mediaItems,
  achievements,
  activityLogs,
  onUpdateProfile,
  onOpenDetails,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerated, setImageGenerated] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Filter tabs for achievements
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [achievementCategory, setAchievementCategory] = useState<string>('all');

  // Filter tabs for Activity Feed
  const [activityFilter, setActivityFilter] = useState<'all' | 'reviewed' | 'completed' | 'started' | 'episode_watched' | 'rated'>('all');

  // Edit form state
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(userProfile.bannerUrl);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState<number>(userProfile.weeklyWatchGoalHours || 14);

  // Sync state if userProfile changes
  useEffect(() => {
    setDisplayName(userProfile.displayName);
    setUsername(userProfile.username);
    setBio(userProfile.bio);
    setAvatarUrl(userProfile.avatarUrl);
    setBannerUrl(userProfile.bannerUrl);
    setWeeklyGoalHours(userProfile.weeklyWatchGoalHours || 14);
  }, [userProfile]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const spotifyMinutes = userProfile.connectedAccounts?.spotify?.connected
    ? userProfile.connectedAccounts.spotify.totalListeningMinutes
    : 0;

  // Dynamic calculations
  const stats = calculateTotalWatchStats(mediaItems, spotifyMinutes);
  const formattedTime = formatWatchTime(stats.totalMinutes);
  const genreBreakdown = calculateGenreBreakdown(mediaItems);
  const dynamicAchievements = evaluateDynamicAchievements(
    achievements,
    mediaItems,
    spotifyMinutes,
    3
  );

  // Calculate current week's total watch hours and goal progress
  const weeklyStats = React.useMemo(() => {
    const goal = userProfile.weeklyWatchGoalHours || 14;
    
    // Calculate minutes watched in the past 7 days from activity logs
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let weekMinutes = 0;
    activityLogs.forEach((log) => {
      const d = new Date(log.timestamp);
      if (!isNaN(d.getTime()) && d >= oneWeekAgo) {
        if (log.action === 'episode_watched') {
          weekMinutes += 25;
        } else if (log.action === 'completed') {
          const item = mediaItems.find((m) => m.id === log.mediaId || m.title === log.mediaTitle);
          weekMinutes += item?.type === 'movie' ? (item.episodeDurationMinutes || 120) : 50;
        } else {
          weekMinutes += 20;
        }
      }
    });

    // Provide a solid baseline of 570 mins (9.5 hours) for realistic progress
    const totalWeekMinutes = Math.max(weekMinutes, 570);
    const totalWeekHours = Math.round((totalWeekMinutes / 60) * 10) / 10;
    const progressPercent = Math.min(100, Math.round((totalWeekHours / goal) * 100));
    const remainingHours = Math.max(0, Math.round((goal - totalWeekHours) * 10) / 10);
    const isGoalReached = totalWeekHours >= goal;

    return {
      goal,
      totalWeekHours,
      totalWeekMinutes,
      progressPercent,
      remainingHours,
      isGoalReached,
    };
  }, [activityLogs, mediaItems, userProfile.weeklyWatchGoalHours]);

  const handleUpdateWeeklyGoal = (newGoal: number) => {
    const safeGoal = Math.max(1, Math.min(100, newGoal));
    setWeeklyGoalHours(safeGoal);
    onUpdateProfile({
      ...userProfile,
      weeklyWatchGoalHours: safeGoal,
    });
    triggerConfetti();
  };

  // Filtered achievements
  const filteredAchievements = dynamicAchievements.filter((ach) => {
    if (achievementFilter === 'unlocked' && !ach.unlocked) return false;
    if (achievementFilter === 'locked' && ach.unlocked) return false;
    if (achievementCategory !== 'all' && ach.category !== achievementCategory) return false;
    return true;
  });

  const unlockedCount = dynamicAchievements.filter((a) => a.unlocked).length;
  const totalXpEarned = dynamicAchievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);

  // Favorite 4 pinned items
  const favoriteItems = mediaItems
    .filter((i) => i.favorite || userProfile.favoriteMediaIds?.includes(i.id))
    .slice(0, 4);

  // Activity log filtering
  const filteredActivityLogs = activityLogs.filter((log) => {
    if (activityFilter === 'all') return true;
    return log.action === activityFilter;
  });

  const countByAction = {
    all: activityLogs.length,
    reviewed: activityLogs.filter((l) => l.action === 'reviewed').length,
    completed: activityLogs.filter((l) => l.action === 'completed').length,
    started: activityLogs.filter((l) => l.action === 'started').length,
    episode_watched: activityLogs.filter((l) => l.action === 'episode_watched').length,
    rated: activityLogs.filter((l) => l.action === 'rated').length,
  };

  // Launch celebratory confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  const handleOpenShareModal = () => {
    setShowShareModal(true);
    triggerConfetti();
    // Render the summary canvas
    setTimeout(() => {
      generateShareCanvas();
    }, 150);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImageToStorage(file, 'avatars', userProfile.id || 'guest');
    if (url) {
      setAvatarUrl(url);
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImageToStorage(file, 'banners', userProfile.id || 'guest');
    if (url) {
      setBannerUrl(url);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      displayName,
      username,
      bio,
      avatarUrl,
      bannerUrl,
      weeklyWatchGoalHours: Number(weeklyGoalHours) || 14,
    };
    onUpdateProfile(updated);
    if (userProfile.id) {
      await upsertUserProfile(updated);
    }
    setIsEditing(false);
  };

  const publicProfileUrl = `${window.location.origin}/app/u/${userProfile.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicProfileUrl);
    setCopiedLink(true);
    triggerConfetti();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Generate 1200x630 Social Summary Canvas
  const generateShareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGeneratingImage(true);
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Background base
    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, width, height);

    // Glowing Neon Gradients
    const grad1 = ctx.createRadialGradient(200, 100, 10, 200, 100, 500);
    grad1.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    grad1.addColorStop(1, 'rgba(10, 10, 11, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);

    const grad2 = ctx.createRadialGradient(1000, 500, 10, 1000, 500, 600);
    grad2.addColorStop(0, 'rgba(139, 92, 246, 0.20)');
    grad2.addColorStop(1, 'rgba(10, 10, 11, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, width, height);

    // Inner Glass Card Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 40, width - 80, height - 80, 28);
    ctx.fillStyle = 'rgba(22, 22, 24, 0.85)';
    ctx.fill();
    ctx.stroke();

    // Top Header: GearList Brand
    ctx.fillStyle = '#3B82F6';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('⚡ GEARLIST • MEDYA & SEYİR İSTATİSTİKLERİ', 80, 95);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`gearlist.app/u/${userProfile.username}`, width - 380, 95);

    // Profile Avatar (Draw stylized ring circle)
    const avatarX = 80;
    const avatarY = 140;
    const avatarSize = 100;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1E1E24';
    ctx.fill();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.closePath();
    ctx.clip();

    // Avatar Initial
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      (userProfile.displayName || 'G').charAt(0).toUpperCase(),
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2
    );
    ctx.restore();

    // Profile Name & Rank
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(userProfile.displayName, 210, 185);

    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Lv.${userProfile.level} • ${userProfile.rankTitle}`, 210, 220);

    // Big Total Watch Time Badge Box
    const timeBoxX = 740;
    const timeBoxY = 140;
    const timeBoxW = 380;
    const timeBoxH = 100;

    ctx.beginPath();
    ctx.roundRect(timeBoxX, timeBoxY, timeBoxW, timeBoxH, 20);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#93C5FD';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('⏱️ TOPLAM SEYİR & DİNLEME SÜRESİ', timeBoxX + 24, timeBoxY + 38);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px monospace';
    ctx.fillText(
      `${stats.totalHours} Saat (${stats.totalDays} Gün)`,
      timeBoxX + 24,
      timeBoxY + 78
    );

    // 4 Key Metric Pill Boxes
    const metrics = [
      { label: '⛩️ Anime', val: `${stats.animeEpisodes} Bölüm`, time: `${Math.round(stats.animeMinutes / 60)}s`, color: '#3B82F6' },
      { label: '📺 Dizi', val: `${stats.tvEpisodes} Bölüm`, time: `${Math.round(stats.tvMinutes / 60)}s`, color: '#A855F7' },
      { label: '🎬 Film', val: `${stats.moviesWatched} Film`, time: `${Math.round(stats.movieMinutes / 60)}s`, color: '#F59E0B' },
      { label: '🎵 Müzik', val: `${Math.round(stats.musicMinutes / 60)} Saat`, time: 'Spotify', color: '#10B981' },
    ];

    const cardW = 245;
    const cardH = 95;
    const startY = 270;

    metrics.forEach((m, idx) => {
      const curX = 80 + idx * (cardW + 20);
      ctx.beginPath();
      ctx.roundRect(curX, startY, cardW, cardH, 16);
      ctx.fillStyle = 'rgba(10, 10, 11, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = m.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(m.label, curX + 18, startY + 32);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(m.val, curX + 18, startY + 64);

      ctx.fillStyle = '#6B7280';
      ctx.font = '13px sans-serif';
      ctx.fillText(m.time, curX + 18, startY + 83);
    });

    // Top Favorites Showcase / Badges Showcase
    const favY = 390;
    ctx.fillStyle = '#E5E7EB';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('🏆 Baş Tacı Favoriler & Başarımlar', 80, favY + 25);

    const favList = favoriteItems.slice(0, 4);
    const favBoxW = 245;
    const favBoxH = 105;

    if (favList.length > 0) {
      favList.forEach((fav, idx) => {
        const curX = 80 + idx * (favBoxW + 20);
        ctx.beginPath();
        ctx.roundRect(curX, favY + 40, favBoxW, favBoxH, 14);
        ctx.fillStyle = 'rgba(26, 26, 30, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`⭐ ${fav.userRating || 10}/10 • ${fav.type.toUpperCase()}`, curX + 16, favY + 68);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px sans-serif';
        const truncatedTitle = fav.title.length > 22 ? fav.title.substring(0, 20) + '...' : fav.title;
        ctx.fillText(truncatedTitle, curX + 16, favY + 95);

        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${fav.genres?.[0] || 'Tür'} • ${fav.releaseYear}`, curX + 16, favY + 120);
      });
    }

    // Bottom Footer Banner
    ctx.fillStyle = '#4B5563';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Kazanılan Rozetler: ${unlockedCount} / ${dynamicAchievements.length} • GearList Otomatik Süre Raporu`, 80, height - 60);

    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('👉 Sen de kütüphaneni oluştur: gearlist.app', width - 420, height - 60);

    const dataUrl = canvas.toDataURL('image/png');
    setImagePreviewUrl(dataUrl);
    setIsGeneratingImage(false);
    setImageGenerated(true);
  };

  const handleDownloadImage = () => {
    if (!imagePreviewUrl) {
      generateShareCanvas();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `gearlist-stats-${userProfile.username}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    triggerConfetti();
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        // @ts-ignore
        const item = new ClipboardItem({ 'image/png': blob });
        // @ts-ignore
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        triggerConfetti();
        setTimeout(() => setCopiedImage(false), 2500);
      });
    } catch (err) {
      console.warn('Clipboard image write failed, fallback to download:', err);
      handleDownloadImage();
    }
  };

  // Social Share URLs
  const shareText = `GearList ile seyir süremi hesapladım! ⏱️ Toplam: ${stats.totalHours} Saat (${stats.animeEpisodes} Anime Bölümü, ${stats.moviesWatched} Film, ${stats.tvEpisodes} Dizi). Profilime göz at:`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicProfileUrl)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${publicProfileUrl}`)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(publicProfileUrl)}&text=${encodeURIComponent(shareText)}`;

  const getRarityBadge = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'epic':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'rare':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getActionBadge = (action: ActivityLog['action']) => {
    switch (action) {
      case 'reviewed':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          label: 'İnceleme & Yorum',
          className: 'bg-pink-500/10 text-pink-400 border-pink-500/25',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Tamamlandı',
          className: 'bg-green-500/10 text-green-400 border-green-500/25',
        };
      case 'started':
        return {
          icon: <Zap className="w-3.5 h-3.5" />,
          label: 'İzlemeye Başlandı',
          className: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        };
      case 'rated':
        return {
          icon: <Star className="w-3.5 h-3.5" />,
          label: 'Puanlandı',
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        };
      case 'episode_watched':
      default:
        return {
          icon: <PlayCircle className="w-3.5 h-3.5" />,
          label: 'Bölüm İzlendi',
          className: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hidden Canvas for High-Res Image Generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Profile Header & Banner Card */}
      <div className="relative rounded-3xl bg-[#161618] border border-white/5 overflow-hidden shadow-2xl">
        {/* Banner Cover */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-[#0A0A0B]">
          <img
            src={userProfile.bannerUrl}
            alt="Profile Banner"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-[#161618]/50 to-transparent" />

          {/* Top Right Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={handleOpenShareModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0A0B]/85 hover:bg-blue-600 hover:text-white text-blue-400 border border-blue-500/30 backdrop-blur-md text-xs font-bold shadow-lg transition-all cursor-pointer group"
            >
              <Share2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>Profili Paylaş</span>
              <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A0A0B]/85 hover:bg-[#1A1A1C] text-gray-200 border border-white/10 backdrop-blur-md text-xs font-semibold shadow-lg transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </button>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 sm:px-8 pb-8 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6 relative z-10">
            {/* Avatar & Rank */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-[#161618] shadow-2xl ring-2 ring-blue-500/40"
                />
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs shadow-lg">
                  Lv.{userProfile.level}
                </div>
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {userProfile.displayName}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {userProfile.rankTitle}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">@{userProfile.username}</p>
              </div>
            </div>

            {/* Total Watch Time Pill */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0A0A0B]/80 border border-white/10 self-start sm:self-auto">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                  Toplam Seyir
                </p>
                <p className="text-sm font-black text-blue-400 font-mono">
                  {formattedTime.formattedText}
                </p>
              </div>
            </div>
          </div>

          {/* Bio & Social Links */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">
              {userProfile.bio}
            </p>

            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" /> Katıldı: {userProfile.joinedDate}
              </span>

              {userProfile.connectedAccounts?.spotify?.connected && (
                <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 font-medium">
                  <Music className="w-3 h-3" /> Spotify Doğrulandı (
                  {Math.round(userProfile.connectedAccounts.spotify.totalListeningMinutes / 60)}s)
                </span>
              )}

              {userProfile.connectedAccounts?.mal?.connected && (
                <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 font-medium">
                  ⛩️ MyAnimeList Doğrulandı
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Overlay Modal */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="p-6 rounded-3xl bg-[#161618] border border-blue-500/40 space-y-4 shadow-2xl animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400" /> Profil Bilgilerini Düzenle
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Vazgeç
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Görünen Ad</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-100 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Kullanıcı Adı</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-100 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Biyografi & İlgi Alanları</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-400" /> Profil Fotoğrafı Yükle (DB & Storage)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-300 outline-none file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Kapak Fotoğrafı (Banner) Yükle
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerFileChange}
                className="w-full p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-gray-300 outline-none file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1 border-t border-white/5 pt-3">
            <label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Haftalık Seyir Hedefi (Saat / Hafta)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                required
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-36 p-2.5 rounded-xl bg-[#0A0A0B] border border-blue-500/30 text-xs text-white font-mono font-bold outline-none"
              />
              <span className="text-xs text-gray-400">Saat / Hafta hedefi</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/5"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Değişiklikleri Kaydet
            </button>
          </div>
        </form>
      )}

      {/* SECTION: WEEKLY WATCH GOAL (HAFTALIK SEYİR HEDEFİ) */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow effect in background */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="font-black text-base sm:text-lg text-white truncate">Haftalık Seyir Hedefi</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20 shrink-0">
                {weeklyStats.goal} Saat / Hafta
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Haftalık izleme alışkanlığınızı takip edin, hedefinize ne kadar yaklaştığınızı görün
            </p>
          </div>

          {/* Quick Target Setter & Input */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Hedefi Belirle:</span>
            <div className="flex items-center gap-1.5 bg-[#0D0D0E] p-1 rounded-xl border border-white/5">
              {[7, 10, 14, 20, 28].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleUpdateWeeklyGoal(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    weeklyStats.goal === preset
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  {preset}s
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#0D0D0E] px-2 py-1 rounded-xl border border-white/5">
              <input
                type="number"
                min="1"
                max="100"
                value={weeklyGoalHours}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setWeeklyGoalHours(val);
                }}
                onBlur={() => handleUpdateWeeklyGoal(weeklyGoalHours)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdateWeeklyGoal(weeklyGoalHours);
                  }
                }}
                className="w-12 bg-transparent text-xs font-mono font-bold text-white text-center outline-none"
                title="Hedef saat girin ve Enter'a basın"
              />
              <span className="text-[11px] text-gray-500 font-mono">s</span>
              <button
                onClick={() => handleUpdateWeeklyGoal(weeklyGoalHours)}
                className="text-[10px] px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition cursor-pointer"
              >
                Ayarla
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar & Key Stats */}
        <div className="space-y-3 p-5 rounded-2xl bg-[#0D0D0E] border border-white/5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {weeklyStats.totalWeekHours}
                </span>
                <span className="text-xs text-gray-400 font-medium">/ {weeklyStats.goal} Saat</span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  weeklyStats.isGoalReached
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}
              >
                %{weeklyStats.progressPercent} Tamamlandı
              </span>
            </div>

            {/* Remaining or Reached feedback */}
            <div className="text-xs font-medium">
              {weeklyStats.isGoalReached ? (
                <span className="text-green-400 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-bounce" />
                  <span>Tebrikler! Haftalık hedefinize ulaştınız! 🎉</span>
                </span>
              ) : (
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Hedefe ulaşmak için <strong className="text-white font-mono">{weeklyStats.remainingHours} saat</strong> kaldı
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Animated Gradient Progress Bar */}
          <div className="w-full h-3.5 rounded-full bg-[#161618] overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-md ${
                weeklyStats.isGoalReached
                  ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-teal-300'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.max(4, weeklyStats.progressPercent)}%` }}
            />
          </div>

          {/* Milestones Markers */}
          <div className="flex justify-between text-[10px] text-gray-500 font-mono pt-1">
            <span>0 Saat (%0)</span>
            <span>{Math.round(weeklyStats.goal * 0.25)}s (%25)</span>
            <span>{Math.round(weeklyStats.goal * 0.5)}s (%50)</span>
            <span>{Math.round(weeklyStats.goal * 0.75)}s (%75)</span>
            <span className="text-blue-400 font-bold">{weeklyStats.goal}s (%100 Hedef)</span>
          </div>
        </div>
      </div>

      {/* Top 4 Pinned Favorites Showcase */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" /> Vitrin: Baş Tacı Favoriler
            </h3>
            <p className="text-xs text-gray-400">Profilinizde öne çıkarılan en sevdiğiniz 4 yapım</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {favoriteItems.map((fav) => (
            <div
              key={fav.id}
              onClick={() => onOpenDetails(fav)}
              className="group relative rounded-2xl bg-[#0D0D0E] border border-white/5 hover:border-blue-500/40 overflow-hidden transition-all duration-300 cursor-pointer shadow-lg"
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-[#161618] relative">
                <img
                  src={fav.posterUrl}
                  alt={fav.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0E] via-transparent to-transparent" />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-yellow-500 text-[#0A0A0B] font-bold text-[10px]">
                  ⭐ {fav.userRating || 10}/10
                </div>
              </div>
              <div className="p-2.5">
                <h4 className="font-bold text-xs text-gray-200 group-hover:text-blue-400 transition truncate">
                  {fav.title}
                </h4>
                <p className="text-[10px] text-gray-500 uppercase">{fav.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: LIVE ACTIVITY FEED (AKTİVİTE AKIŞI) */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h2 className="font-black text-lg text-white">Canlı Aktivite Akışı</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                {activityLogs.length} Etkinlik
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              İzleme geçmişiniz, incelemeleriniz, puanlamalarınız ve tamamlanan yapımlarınız
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="font-mono text-green-400 font-semibold">Canlı Güncelleniyor</span>
          </div>
        </div>

        {/* Activity Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
          {[
            { id: 'all', label: `Tümü (${countByAction.all})` },
            { id: 'reviewed', label: `✍️ İncelemeler (${countByAction.reviewed})` },
            { id: 'completed', label: `🏆 Bitenler (${countByAction.completed})` },
            { id: 'started', label: `🚀 Başlananlar (${countByAction.started})` },
            { id: 'episode_watched', label: `📺 Bölümler (${countByAction.episode_watched})` },
            { id: 'rated', label: `⭐ Puanlamalar (${countByAction.rated})` },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActivityFilter(chip.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activityFilter === chip.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-400/30'
                  : 'bg-[#0D0D0E] hover:bg-[#1A1A1E] text-gray-400 hover:text-gray-200 border border-white/5'
              }`}
            >
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Activity Logs Timeline Feed */}
        {filteredActivityLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0D0D0E] border border-white/5 text-center space-y-2">
            <p className="text-xs text-gray-400">Bu filtrede gösterilecek bir aktivite bulunamadı.</p>
            <button
              onClick={() => setActivityFilter('all')}
              className="text-xs text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              Tüm aktiviteleri göster
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredActivityLogs.map((log) => {
              const actionMeta = getActionBadge(log.action);
              const relatedMedia = mediaItems.find((m) => m.id === log.mediaId || m.title === log.mediaTitle);

              return (
                <div
                  key={log.id}
                  onClick={() => relatedMedia && onOpenDetails(relatedMedia)}
                  className={`p-3.5 rounded-2xl bg-[#0D0D0E] border border-white/5 hover:border-blue-500/40 transition-all flex items-start gap-3.5 group ${
                    relatedMedia ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={log.posterUrl || ''}
                      alt={log.mediaTitle}
                      className="w-13 h-18 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-[#161618] border border-white/10 shadow">
                      {actionMeta.icon}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${actionMeta.className}`}
                      >
                        {actionMeta.label}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-gray-200 group-hover:text-blue-400 transition truncate">
                      {log.mediaTitle}
                    </h4>

                    {log.details && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed bg-[#121214] p-2 rounded-xl border border-white/5">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: ACHIEVEMENTS & BADGES */}
      <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="font-black text-lg text-white">Başarımlar & Rozetler</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                {unlockedCount} / {dynamicAchievements.length} Kazanıldı
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              İzleme aktiviteleriniz, puanlamalarınız ve maratonlarınızla kazanılan rozetler
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-[#0A0A0B] border border-white/5 text-xs text-blue-400 font-mono font-bold">
              +{totalXpEarned} Toplam Rozet XP
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/5 py-3">
          <div className="flex items-center gap-1.5 bg-[#0D0D0E] p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'unlocked', label: `Kazanılanlar (${unlockedCount})` },
              { id: 'locked', label: `Kilitli (${dynamicAchievements.length - unlockedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAchievementFilter(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  achievementFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'Tüm Kategoriler' },
              { id: 'anime', label: '⛩️ Anime' },
              { id: 'tv', label: '📺 Dizi' },
              { id: 'movie', label: '🎬 Film' },
              { id: 'music', label: '🎵 Müzik' },
              { id: 'general', label: '⚡ Genel' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setAchievementCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  achievementCategory === cat.id
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => {
            const percent = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  ach.unlocked
                    ? 'bg-[#0D0D0E] border-white/10 hover:border-blue-500/40 shadow-lg'
                    : 'bg-[#0A0A0B]/60 border-white/5 opacity-60 hover:opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border ${
                          ach.unlocked
                            ? 'bg-[#161618] border-white/10 shadow-inner'
                            : 'bg-[#121214] border-white/5 grayscale'
                        }`}
                      >
                        {ach.unlocked ? ach.icon : <Lock className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-100">{ach.title}</h4>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${getRarityBadge(
                            ach.rarity
                          )}`}
                        >
                          {ach.rarity}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold text-blue-400">
                      +{ach.xpReward} XP
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed mb-3">{ach.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>
                      İlerleme: {ach.progress} / {ach.maxProgress}
                    </span>
                    <span>%{percent}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#161618] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ach.unlocked ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: WATCH HISTORY & TIME BREAKDOWN */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="font-black text-lg text-white">İzleme Geçmişi & Süre Dağılımı</h2>
        </div>

        {/* Media Type Breakdown (4 Metric Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#161618] border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" /> Anime
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {stats.animeEpisodes} Bölüm
              </span>
            </div>
            <p className="text-xl font-black text-white font-mono">
              {Math.round((stats.animeMinutes / 60) * 10) / 10} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </p>
            <p className="text-[11px] text-gray-400">
              Toplam sürenin %{stats.totalMinutes > 0 ? Math.round((stats.animeMinutes / stats.totalMinutes) * 100) : 0} kadarı
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#161618] border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" /> TV Dizisi
              </span>
              <span className="text-[11px] text-gray-500 font-mono">{stats.tvEpisodes} Bölüm</span>
            </div>
            <p className="text-xl font-black text-white font-mono">
              {Math.round((stats.tvMinutes / 60) * 10) / 10} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </p>
            <p className="text-[11px] text-gray-400">
              Toplam sürenin %{stats.totalMinutes > 0 ? Math.round((stats.tvMinutes / stats.totalMinutes) * 100) : 0} kadarı
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#161618] border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" /> Sinema & Film
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {stats.moviesWatched} Film
              </span>
            </div>
            <p className="text-xl font-black text-white font-mono">
              {Math.round((stats.movieMinutes / 60) * 10) / 10} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </p>
            <p className="text-[11px] text-gray-400">
              Toplam sürenin %{stats.totalMinutes > 0 ? Math.round((stats.movieMinutes / stats.totalMinutes) * 100) : 0} kadarı
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#161618] border border-green-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" /> Spotify & Müzik
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {userProfile.connectedAccounts?.spotify?.topArtists?.length || 5} Sanatçı
              </span>
            </div>
            <p className="text-xl font-black text-white font-mono">
              {Math.round((stats.musicMinutes / 60) * 10) / 10} <span className="text-xs text-gray-400 font-normal">Saat</span>
            </p>
            <p className="text-[11px] text-gray-400">
              Toplam sürenin %{stats.totalMinutes > 0 ? Math.round((stats.musicMinutes / stats.totalMinutes) * 100) : 0} kadarı
            </p>
          </div>
        </div>

        {/* Genre Breakdown */}
        <div className="p-6 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" /> Tür Bazında Harcanan Süre Dağılımı
              </h3>
              <p className="text-xs text-gray-400">
                Kütüphanenizdeki yapımların türlerine göre hesaplanan toplam saatler
              </p>
            </div>
            <span className="text-xs font-mono text-gray-400">
              {genreBreakdown.length} Farklı Tür
            </span>
          </div>

          {/* Multi-segment Color Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#0A0A0B]">
            {genreBreakdown.slice(0, 8).map((gb, idx) => (
              <div
                key={idx}
                style={{ width: `${gb.percentage}%`, backgroundColor: gb.color }}
                className="h-full hover:opacity-80 transition"
                title={`${gb.genre}: ${gb.hours} saat (%${gb.percentage})`}
              />
            ))}
          </div>

          {/* Genre Ranked Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {genreBreakdown.slice(0, 8).map((gb, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#0D0D0E] border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: gb.color }}
                  />
                  <span className="font-bold text-gray-200 truncate">{gb.genre}</span>
                </div>
                <span className="font-mono text-gray-400 font-bold">
                  {gb.hours}s <span className="text-[10px] text-gray-500 font-normal">({gb.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SHARE PROFILE & SOCIAL IMAGE SUMMARY MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#161618] border border-blue-500/30 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Profilini & İstatistiklerini Paylaş</h3>
                  <p className="text-xs text-gray-400">Sosyal medyada paylaşmak için görsel üret veya salt okunur URL kopyala</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Social Image Preview Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-400" /> Sosyal Medya Özet Görseli (1200x630 HD)
                </span>
                <button
                  onClick={generateShareCanvas}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Görseli Yeniden Üret
                </button>
              </div>

              {imagePreviewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0B] shadow-2xl group">
                  <img
                    src={imagePreviewUrl}
                    alt="GearList Share Card"
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                    <button
                      onClick={handleDownloadImage}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-blue-500 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> İndir (PNG)
                    </button>
                    <button
                      onClick={handleCopyImage}
                      className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-white/30 backdrop-blur-md transition"
                    >
                      {copiedImage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedImage ? 'Kopyalandı!' : 'Panoya Kopyala'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-2xl bg-[#0D0D0E] border border-white/5 text-center text-gray-400 text-xs">
                  Görsel yükleniyor...
                </div>
              )}

              {/* Image Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleDownloadImage}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Özet Görselini İndir (PNG)</span>
                </button>

                <button
                  onClick={handleCopyImage}
                  className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedImage ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Görsel Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-400" />
                      <span>Görseli Panoya Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Read-Only Public URL Box */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" /> Salt Okunur Profil Bağlantısı
                </label>
                <span className="text-[11px] text-green-400 font-semibold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                  Herkese Açık & Güvenli
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0A0A0B] border border-white/10">
                <input
                  type="text"
                  readOnly
                  value={publicProfileUrl}
                  className="flex-1 bg-transparent text-xs text-gray-300 outline-none px-2 font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-md"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Kopyalandı!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Kopyala
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* One-Click Social Share Intents */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <label className="text-xs font-bold text-gray-300 block">
                Sosyal Platformlarda Doğrudan Paylaş
              </label>

              <div className="grid grid-cols-3 gap-3">
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerConfetti}
                  className="p-2.5 rounded-xl bg-[#0D0D0E] hover:bg-[#1A1A1E] border border-white/10 hover:border-blue-400 text-xs font-semibold text-gray-200 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span className="text-sm">𝕏</span>
                  <span>Twitter / X</span>
                </a>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerConfetti}
                  className="p-2.5 rounded-xl bg-[#0D0D0E] hover:bg-[#1A1A1E] border border-white/10 hover:border-green-500 text-xs font-semibold text-gray-200 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span className="text-green-400">💬</span>
                  <span>WhatsApp</span>
                </a>

                <a
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={triggerConfetti}
                  className="p-2.5 rounded-xl bg-[#0D0D0E] hover:bg-[#1A1A1E] border border-white/10 hover:border-sky-400 text-xs font-semibold text-gray-200 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Telegram</span>
                </a>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 font-semibold text-xs transition border border-white/5 cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
