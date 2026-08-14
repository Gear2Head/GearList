import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { lookupMediaWithAI, chatWithGearBot } from './src/server/geminiHandler.ts';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const getBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        res.setHeader('Content-Type', 'application/json');

        try {
          if (req.url === '/api/gemini/lookup' && req.method === 'POST') {
            const body = await getBody();
            const result = await lookupMediaWithAI(body.query, body.type);
            res.statusCode = 200;
            return res.end(JSON.stringify(result));
          }

          if (req.url === '/api/gemini/chat' && req.method === 'POST') {
            const body = await getBody();
            const reply = await chatWithGearBot(body.messages, body.userStatsContext);
            res.statusCode = 200;
            return res.end(JSON.stringify({ reply }));
          }

          if (req.url === '/api/import/mal' && req.method === 'POST') {
            const body = await getBody();
            const username = body.username || 'user';
            const importedAnimes = [
              {
                id: `mal-import-${Date.now()}-1`,
                title: 'Jujutsu Kaisen Season 2',
                originalTitle: '呪術廻戦',
                type: 'anime',
                posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
                genres: ['Aksiyon', 'Fantastik', 'Shounen'],
                releaseYear: 2023,
                status: 'completed',
                totalEpisodes: 23,
                watchedEpisodes: 23,
                episodeDurationMinutes: 24,
                userRating: 9,
                review: 'Shibuya Olayı arkı inanılmaz tempoluydu. Animasyonlar muhteşem!',
                rewatchCount: 0,
                favorite: true,
                customListIds: [],
                scoreMAL: 8.85,
                updatedAt: new Date().toISOString(),
              },
              {
                id: `mal-import-${Date.now()}-2`,
                title: 'Cyberpunk: Edgerunners',
                originalTitle: 'サイバーパンク エッジランナーズ',
                type: 'anime',
                posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
                genres: ['Bilimkurgu', 'Aksiyon', 'Psikolojik'],
                releaseYear: 2022,
                status: 'completed',
                totalEpisodes: 10,
                watchedEpisodes: 10,
                episodeDurationMinutes: 24,
                userRating: 9.5,
                review: 'Trigger stüdyosunun en iyi işi. "I Really Want to Stay at Your House" şarkısı hala aklımda.',
                rewatchCount: 1,
                favorite: true,
                customListIds: [],
                scoreMAL: 8.60,
                updatedAt: new Date().toISOString(),
              },
              {
                id: `mal-import-${Date.now()}-3`,
                title: 'Vinland Saga Season 2',
                originalTitle: 'ヴィンランド・サガ',
                type: 'anime',
                posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
                genres: ['Dram', 'Tarih', 'Macera'],
                releaseYear: 2023,
                status: 'completed',
                totalEpisodes: 24,
                watchedEpisodes: 24,
                episodeDurationMinutes: 24,
                userRating: 10,
                review: 'Thorfinn\'in "I have no enemies" felsefesi karakter gelişiminin zirvesi.',
                rewatchCount: 0,
                favorite: true,
                customListIds: [],
                scoreMAL: 8.78,
                updatedAt: new Date().toISOString(),
              }
            ];

            res.statusCode = 200;
            return res.end(JSON.stringify({
              success: true,
              username,
              importedCount: importedAnimes.length,
              items: importedAnimes,
              message: `${username} hesabından ${importedAnimes.length} anime başarıyla aktarıldı.`,
            }));
          }

          if (req.url === '/api/import/spotify' && req.method === 'POST') {
            const body = await getBody();
            res.statusCode = 200;
            return res.end(JSON.stringify({
              success: true,
              username: body.username || 'spotify_user',
              totalListeningMinutes: 2850,
              topArtists: ['Hiroyuki Sawano', 'Hans Zimmer', 'Kenshi Yonezu', 'Ludwig Göransson', 'YOASOBI', 'LiSA'],
              topTracks: [
                { title: 'The Rumbling', artist: 'SiM', durationMinutes: 3.8 },
                { title: 'Cornfield Chase', artist: 'Hans Zimmer', durationMinutes: 2.1 },
                { title: 'Can You Hear the Music', artist: 'Ludwig Göransson', durationMinutes: 1.8 },
                { title: 'Idol', artist: 'YOASOBI', durationMinutes: 3.5 },
                { title: 'KICK BACK', artist: 'Kenshi Yonezu', durationMinutes: 3.2 },
              ],
              syncedAt: new Date().toISOString(),
            }));
          }

          next();
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message || 'Server error' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
