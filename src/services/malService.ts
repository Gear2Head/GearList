import { MediaItem, WatchStatus } from '../types';

export interface MALSyncResult {
  username: string;
  importedCount: number;
  mediaItems: MediaItem[];
  syncedAt: string;
}

/**
 * Fetch MyAnimeList user's anime list directly via CORS proxy for browser compatibility
 */
async function fetchDirectMALList(username: string): Promise<MediaItem[]> {
  const malTargetUrl = `https://myanimelist.net/animelist/${encodeURIComponent(username)}/load.json?status=7`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(malTargetUrl)}`;

  let rawList: any[] = [];
  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`Proxy status ${res.status}`);
    rawList = await res.json();
  } catch (err1) {
    console.warn('AllOrigins proxy failed, trying corsproxy.io:', err1);
    try {
      const fallbackRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(malTargetUrl)}`);
      rawList = await fallbackRes.json();
    } catch (err2) {
      console.warn('Corsproxy failed, trying direct fetch:', err2);
      const directRes = await fetch(malTargetUrl);
      rawList = await directRes.json();
    }
  }

  if (!Array.isArray(rawList)) {
    throw new Error('Invalid MAL response format');
  }

  const statusMap: Record<number, WatchStatus> = {
    1: 'watching',
    2: 'completed',
    3: 'on_hold',
    4: 'dropped',
    6: 'plan_to_watch',
  };

  return rawList.map((entry: any): MediaItem => {
    const title = entry.anime_title_eng || entry.anime_title || 'Anime';
    const originalTitle = entry.anime_title;
    const rawPoster = entry.anime_image_path || '';
    const posterUrl = rawPoster.replace('/r/192x272', ''); // Sharp high-res poster

    const statusKey = statusMap[entry.status] || 'watching';

    const genreList = Array.isArray(entry.genres)
      ? entry.genres.map((g: any) => g.name || g)
      : ['Anime'];

    return {
      id: `mal-${entry.anime_id}`,
      title,
      originalTitle,
      type: 'anime',
      posterUrl: posterUrl || rawPoster,
      bannerUrl: posterUrl || rawPoster,
      genres: genreList.length > 0 ? genreList : ['Anime'],
      releaseYear: 2024,
      status: statusKey,
      totalEpisodes: entry.anime_num_episodes || entry.num_watched_episodes || 12,
      watchedEpisodes: entry.num_watched_episodes || 0,
      episodeDurationMinutes: 24,
      userRating: entry.score > 0 ? entry.score : undefined,
      scoreMAL: entry.anime_score_val ? Number(entry.anime_score_val) : 8.0,
      synopsis: `${title} animesi resmi MyAnimeList hesabından (@${username}) aktarıldı.`,
      studioOrDirector: 'MyAnimeList Sync',
      favorite: false,
      rewatchCount: entry.is_rewatching || 0,
      customListIds: [],
      updatedAt: entry.updated_at ? new Date(entry.updated_at * 1000).toISOString() : new Date().toISOString(),
    };
  });
}

/**
 * Fallback: Fetch AniList GraphQL if MAL direct fails
 */
async function fetchAniListUserWatchlist(username: string): Promise<MediaItem[]> {
  const query = `
    query ($username: String) {
      MediaListCollection(userName: $username, type: ANIME) {
        lists {
          entries {
            status
            score(format: POINT_10)
            progress
            media {
              id
              title { english romaji native }
              coverImage { extraLarge large }
              bannerImage
              episodes
              duration
              averageScore
              genres
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!res.ok) {
    throw new Error(`"${username}" adında bir MyAnimeList veya AniList kullanıcısı bulunamadı.`);
  }

  const data = await res.json();
  const lists = data?.data?.MediaListCollection?.lists || [];
  const mediaItems: MediaItem[] = [];

  const statusMap: Record<string, WatchStatus> = {
    CURRENT: 'watching',
    COMPLETED: 'completed',
    PAUSED: 'on_hold',
    DROPPED: 'dropped',
    PLANNING: 'plan_to_watch',
  };

  lists.forEach((list: any) => {
    (list.entries || []).forEach((entry: any) => {
      const media = entry.media || {};
      const title = media.title?.english || media.title?.romaji || 'Anime';
      mediaItems.push({
        id: `anilist-sync-${media.id}`,
        title,
        originalTitle: media.title?.native,
        type: 'anime',
        posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || '',
        bannerUrl: media.bannerImage || media.coverImage?.extraLarge,
        genres: media.genres || ['Anime'],
        releaseYear: 2024,
        status: statusMap[entry.status] || 'watching',
        totalEpisodes: media.episodes || entry.progress || 12,
        watchedEpisodes: entry.progress || 0,
        episodeDurationMinutes: media.duration || 24,
        userRating: entry.score > 0 ? entry.score : undefined,
        scoreMAL: media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : 8.5,
        synopsis: `${title} animesi veritabanından (@${username}) senkronize edildi.`,
        studioOrDirector: 'Anime Sync',
        favorite: false,
        rewatchCount: 0,
        customListIds: [],
        updatedAt: new Date().toISOString(),
      });
    });
  });

  return mediaItems;
}

/**
 * Universal MAL user watchlist importer
 */
export async function fetchMALUserWatchlist(username: string): Promise<MALSyncResult> {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error('Geçerli bir MyAnimeList veya AniList kullanıcı adı girin.');
  }

  let mediaItems: MediaItem[] = [];

  // Try 1: Official MAL direct load.json via CORS proxy
  try {
    mediaItems = await fetchDirectMALList(cleanUsername);
  } catch (err1) {
    console.warn('MAL direct fetch failed, trying AniList fallback:', err1);
    // Try 2: AniList GraphQL
    try {
      mediaItems = await fetchAniListUserWatchlist(cleanUsername);
    } catch (err2) {
      console.warn('AniList fallback failed, trying Jikan:', err2);
      // Try 3: Jikan API
      const res = await fetch(`https://api.jikan.moe/v4/users/${encodeURIComponent(cleanUsername)}/animelist`);
      if (!res.ok) {
        throw new Error(`"${cleanUsername}" adında MyAnimeList kullanıcısı bulunamadı veya liste gizli.`);
      }
      const json = await res.json();
      const list = json.data || [];
      mediaItems = list.map((entry: any): MediaItem => {
        const anime = entry.anime || {};
        return {
          id: `mal-${anime.mal_id}`,
          title: anime.title || 'Anime',
          type: 'anime',
          posterUrl: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '',
          bannerUrl: anime.images?.jpg?.large_image_url,
          genres: ['Anime'],
          releaseYear: 2024,
          status: entry.status ? (entry.status.toLowerCase().replace(/ /g, '_') as WatchStatus) : 'watching',
          totalEpisodes: anime.episodes || entry.episodes_watched || 12,
          watchedEpisodes: entry.episodes_watched || 0,
          episodeDurationMinutes: 24,
          userRating: entry.score > 0 ? entry.score : undefined,
          scoreMAL: entry.score > 0 ? entry.score : 8.5,
          synopsis: `${anime.title} animesi MyAnimeList hesabından (@${cleanUsername}) çekildi.`,
          studioOrDirector: 'MyAnimeList Sync',
          favorite: false,
          rewatchCount: 0,
          customListIds: [],
          updatedAt: new Date().toISOString(),
        };
      });
    }
  }

  if (mediaItems.length === 0) {
    throw new Error(`"${cleanUsername}" kullanıcısının MyAnimeList hesabında erişilebilir anime verisi bulunamadı.`);
  }

  return {
    username: cleanUsername,
    importedCount: mediaItems.length,
    mediaItems,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Export GearList anime items to MyAnimeList compatible JSON/XML structure
 */
export function exportWatchlistToMALFormat(items: MediaItem[]): string {
  const animeItems = items.filter((i) => i.type === 'anime');
  const malPayload = animeItems.map((item) => ({
    series_animedb_id: item.id.replace('mal-', '').replace('anilist-', '').replace('anilist-sync-', ''),
    series_title: item.title,
    my_watched_episodes: item.watchedEpisodes,
    my_start_date: item.startedAt || '0000-00-00',
    my_finish_date: item.completedAt || '0000-00-00',
    my_score: item.userRating || 0,
    my_status: item.status.toUpperCase(),
    my_rewatching: item.rewatchCount || 0,
  }));

  return JSON.stringify({ myanimelist: { anime: malPayload } }, null, 2);
}
