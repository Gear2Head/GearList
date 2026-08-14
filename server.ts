import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookupMediaWithAI, chatWithGearBot, generateRecommendationsWithAI } from './src/server/geminiHandler.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API: AI Media Lookup & Runtime Enrichment
app.post('/api/gemini/lookup', async (req, res) => {
  try {
    const { query, type } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const result = await lookupMediaWithAI(query, type);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/gemini/lookup:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// API: Multi-turn Chatbot (GearBot AI)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, userStatsContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    const reply = await chatWithGearBot(messages, userStatsContext);
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// API: AI-Powered Recommendation Engine
app.post('/api/gemini/recommendations', async (req, res) => {
  try {
    const { watchedTitles, topGenres, favoriteTitles, preferredType, moodPrompt } = req.body;
    const recommendations = await generateRecommendationsWithAI({
      watchedTitles,
      topGenres,
      favoriteTitles,
      preferredType,
      moodPrompt,
    });
    res.json({ recommendations });
  } catch (error: any) {
    console.error('Error in /api/gemini/recommendations:', error);
    res.status(500).json({ error: error.message || 'Recommendation generation failed' });
  }
});

// API: MyAnimeList Profile Scraper / Sync Simulation
app.post('/api/import/mal', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Comprehensive public catalog items with accurate runtimes & episode counts
    const timestamp = Date.now();
    const importedAnimes = [
      {
        id: `mal-import-${timestamp}-1`,
        title: 'Jujutsu Kaisen Season 2',
        originalTitle: '呪術廻戦 懐玉・玉折 / 渋谷事変',
        type: 'anime',
        posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
        genres: ['Aksiyon', 'Fantastik', 'Shounen'],
        releaseYear: 2023,
        status: 'completed',
        totalEpisodes: 23,
        watchedEpisodes: 23,
        episodeDurationMinutes: 24,
        totalRuntimeMinutes: 552,
        userRating: 9,
        review: 'Shibuya Olayı arkı inanılmaz tempoluydu. Mappa animasyonları göz kamaştırıcı.',
        reviewDate: '2026-04-10',
        isSpoiler: false,
        rewatchCount: 0,
        favorite: true,
        customListIds: ['list-masterpieces'],
        synopsis: 'Gojo Satoru ve Geto Suguru’nun gençlik günleri ile lanetlerin Tokyo Shibuya’da başlattığı topyekûn kaos.',
        studioOrDirector: 'MAPPA',
        scoreMAL: 8.85,
        scoreIMDB: 8.6,
        updatedAt: new Date().toISOString(),
        completedAt: '2026-04-10T22:00:00Z',
      },
      {
        id: `mal-import-${timestamp}-2`,
        title: 'Cyberpunk: Edgerunners',
        originalTitle: 'サイバーパンク エッジランナーズ',
        type: 'anime',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
        genres: ['Bilimkurgu', 'Aksiyon', 'Psikolojik'],
        releaseYear: 2022,
        status: 'completed',
        totalEpisodes: 10,
        watchedEpisodes: 10,
        episodeDurationMinutes: 24,
        totalRuntimeMinutes: 240,
        userRating: 9.5,
        review: 'Trigger stüdyosunun en iyi işi. "I Really Want to Stay at Your House" şarkısı hala aklımda.',
        reviewDate: '2026-03-15',
        isSpoiler: false,
        rewatchCount: 1,
        favorite: true,
        customListIds: ['list-weekend-marathon'],
        synopsis: 'Night City sokaklarında hayatta kalmaya çalışan yetenekli ama fevri bir sokak çocuğu, edgerunner olarak bilinen bir paralı askere dönüşür.',
        studioOrDirector: 'Studio Trigger / Hiroyuki Imaishi',
        scoreMAL: 8.60,
        scoreIMDB: 8.3,
        updatedAt: new Date().toISOString(),
        completedAt: '2026-03-15T21:30:00Z',
      },
      {
        id: `mal-import-${timestamp}-3`,
        title: 'Vinland Saga Season 2',
        originalTitle: 'ヴィンランド・サガ',
        type: 'anime',
        posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        genres: ['Dram', 'Tarih', 'Macera'],
        releaseYear: 2023,
        status: 'completed',
        totalEpisodes: 24,
        watchedEpisodes: 24,
        episodeDurationMinutes: 24,
        totalRuntimeMinutes: 576,
        userRating: 10,
        review: 'Thorfinn\'in "I have no enemies" felsefesi karakter gelişiminin zirvesi.',
        reviewDate: '2026-05-02',
        isSpoiler: false,
        rewatchCount: 0,
        favorite: true,
        customListIds: ['list-masterpieces'],
        synopsis: 'Geçmişin travmalarıyla yüzleşen Thorfinn, şiddetsiz ve barışçıl bir toprak olan Vinland arayışına başlar.',
        studioOrDirector: 'MAPPA / Shuuhei Yabuta',
        scoreMAL: 8.78,
        scoreIMDB: 8.8,
        updatedAt: new Date().toISOString(),
        completedAt: '2026-05-02T23:15:00Z',
      },
      {
        id: `mal-import-${timestamp}-4`,
        title: 'Demon Slayer: Kimetsu no Yaiba - Hashira Training',
        originalTitle: '鬼滅の刃 柱稽古編',
        type: 'anime',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
        genres: ['Aksiyon', 'Fantastik', 'Shounen'],
        releaseYear: 2024,
        status: 'completed',
        totalEpisodes: 8,
        watchedEpisodes: 8,
        episodeDurationMinutes: 26,
        totalRuntimeMinutes: 208,
        userRating: 8.5,
        review: 'Ufotable yine final bölümünde görsel bir şölen sundu. Sonsuzluk Kalesi arkı için heyecan dorukta.',
        reviewDate: '2026-07-01',
        isSpoiler: false,
        rewatchCount: 0,
        favorite: false,
        customListIds: [],
        synopsis: 'Muzan Kibutsuji ile nihai hesaplaşmaya hazırlanan Tanjiro ve İblis Kesici Birliği, Hashiralar önderliğinde zorlu bir eğitimden geçer.',
        studioOrDirector: 'ufotable / Haruo Sotozaki',
        scoreMAL: 8.24,
        scoreIMDB: 8.5,
        updatedAt: new Date().toISOString(),
        completedAt: '2026-07-01T20:00:00Z',
      },
      {
        id: `mal-import-${timestamp}-5`,
        title: 'Attack on Titan: The Final Season',
        originalTitle: '進撃の巨人 The Final Season',
        type: 'anime',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        genres: ['Aksiyon', 'Dram', 'Gizem', 'Shounen'],
        releaseYear: 2023,
        status: 'completed',
        totalEpisodes: 30,
        watchedEpisodes: 30,
        episodeDurationMinutes: 25,
        totalRuntimeMinutes: 750,
        userRating: 10,
        review: 'Özgürlük arayışının getirdiği yıkım ve insan doğasının döngüsel trajedisi. Gerçek bir başyapıt finali.',
        reviewDate: '2026-02-28',
        isSpoiler: false,
        rewatchCount: 1,
        favorite: true,
        customListIds: ['list-masterpieces'],
        synopsis: 'Eren Yeager’ın Rumbling kararı dünyayı geri dönülemez bir savaşa sürüklerken eski yoldaşları onu durdurmak zorundadır.',
        studioOrDirector: 'MAPPA / Yuuichirou Hayashi',
        scoreMAL: 9.05,
        scoreIMDB: 9.1,
        updatedAt: new Date().toISOString(),
        completedAt: '2026-02-28T22:30:00Z',
      }
    ];

    res.json({
      success: true,
      username,
      importedCount: importedAnimes.length,
      items: importedAnimes,
      message: `${username} hesabından ${importedAnimes.length} anime başarıyla aktarıldı.`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Import failed' });
  }
});

// API: Spotify Connect & Playlist / Listening Stats Import
app.post('/api/import/spotify', async (req, res) => {
  try {
    const { username } = req.body;
    res.json({
      success: true,
      username: username || 'spotify_user',
      totalListeningMinutes: 2850, // ~47.5 saat
      topArtists: ['Hiroyuki Sawano', 'Hans Zimmer', 'Kenshi Yonezu', 'Ludwig Göransson', 'YOASOBI', 'LiSA'],
      topTracks: [
        { title: 'The Rumbling', artist: 'SiM', durationMinutes: 3.8 },
        { title: 'Cornfield Chase', artist: 'Hans Zimmer', durationMinutes: 2.1 },
        { title: 'Can You Hear the Music', artist: 'Ludwig Göransson', durationMinutes: 1.8 },
        { title: 'Idol', artist: 'YOASOBI', durationMinutes: 3.5 },
        { title: 'KICK BACK', artist: 'Kenshi Yonezu', durationMinutes: 3.2 },
      ],
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Spotify sync failed' });
  }
});

// API: Sync Watchlist from Connected External Services (AniList, TVMaze, MAL, Simkl)
app.post('/api/sync/watchlist', async (req, res) => {
  try {
    const { currentWatchingItems = [] } = req.body;

    const updates: any[] = [];
    let totalMinutesAdded = 0;

    // Simulate checking external tracking providers for progress increments
    if (Array.isArray(currentWatchingItems) && currentWatchingItems.length > 0) {
      currentWatchingItems.forEach((item: any) => {
        const totalEp = item.totalEpisodes || (item.type === 'movie' ? 1 : 12);
        const watched = item.watchedEpisodes || 0;
        const duration = item.episodeDurationMinutes || 24;

        if (watched < totalEp) {
          const nextWatched = Math.min(totalEp, watched + 1);
          const minutesAdded = (nextWatched - watched) * duration;
          totalMinutesAdded += minutesAdded;
          const isCompleted = nextWatched === totalEp;

          updates.push({
            mediaId: item.id,
            title: item.title,
            type: item.type,
            posterUrl: item.posterUrl,
            source: item.type === 'anime' ? 'anilist' : item.type === 'tv' ? 'tvmaze' : 'mal',
            previousEpisode: watched,
            newEpisode: nextWatched,
            totalEpisodes: totalEp,
            minutesAdded,
            status: isCompleted ? 'completed' : 'watching',
            notes: isCompleted
              ? `Final bölüm izlendi ve tamamlandı (+${minutesAdded} dk)`
              : `${nextWatched}. bölüm dış servisten senkronize edildi (+${minutesAdded} dk)`,
          });
        }
      });
    } else {
      // If no watching items passed, provide simulated live tracker updates
      updates.push(
        {
          mediaId: 'media-solo-leveling',
          title: 'Solo Leveling',
          type: 'anime',
          posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
          source: 'anilist',
          previousEpisode: 16,
          newEpisode: 17,
          totalEpisodes: 25,
          minutesAdded: 24,
          status: 'watching',
          notes: 'AniList üzerinden 17. bölüm aktivitesi senkronize edildi (+24 dk)',
        },
        {
          mediaId: 'media-severance',
          title: 'Severance (Ayrılık)',
          type: 'tv',
          posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
          source: 'tvmaze',
          previousEpisode: 12,
          newEpisode: 13,
          totalEpisodes: 19,
          minutesAdded: 54,
          status: 'watching',
          notes: 'TVMaze üzerinden 2. Sezon 3. Bölüm izleme kaydı çekildi (+54 dk)',
        }
      );
      totalMinutesAdded = 78;
    }

    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      totalItemsChecked: Math.max(currentWatchingItems.length, updates.length),
      updatedItemsCount: updates.length,
      totalMinutesAdded,
      updates,
      message: `${updates.length} yapım için son izleme durumları başarıyla güncellendi (+${totalMinutesAdded} dakika).`,
    });
  } catch (error: any) {
    console.error('Error in /api/sync/watchlist:', error);
    res.status(500).json({ error: error.message || 'Sync watchlist failed' });
  }
});

// In production, serve static files from dist
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`GearList server running on port ${PORT}`);
});
