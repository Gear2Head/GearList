import { MediaItem, MediaType } from '../types';

// ==========================================
// 1. AniList GraphQL API (Anime)
// ==========================================
const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

const ANILIST_SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      startDate {
        year
      }
      episodes
      duration
      genres
      averageScore
      description
      studios(isMain: true) {
        nodes {
          name
        }
      }
    }
  }
}
`;

const ANILIST_TRENDING_QUERY = `
query {
  Page(page: 1, perPage: 12) {
    media(type: ANIME, sort: TRENDING_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
      startDate {
        year
      }
      episodes
      duration
      genres
      averageScore
      description
      studios(isMain: true) {
        nodes {
          name
        }
      }
    }
  }
}
`;

export async function searchAniListAnime(query: string): Promise<MediaItem[]> {
  try {
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_SEARCH_QUERY,
        variables: { search: query, page: 1, perPage: 10 },
      }),
    });

    const result = await response.json();
    const list = result?.data?.Page?.media || [];

    return list.map((item: any): MediaItem => {
      const studio = item.studios?.nodes?.[0]?.name || 'Unknown Studio';
      const title = item.title?.english || item.title?.romaji || 'Anime';
      const cleanSynopsis = item.description ? item.description.replace(/<[^>]*>?/gm, '') : '';

      return {
        id: `anilist-${item.id}`,
        title: title,
        originalTitle: item.title?.native || item.title?.romaji,
        type: 'anime',
        posterUrl: item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '',
        bannerUrl: item.bannerImage || item.coverImage?.extraLarge,
        genres: item.genres || ['Anime'],
        releaseYear: item.startDate?.year || 2024,
        status: 'plan_to_watch',
        totalEpisodes: item.episodes || 12,
        watchedEpisodes: 0,
        episodeDurationMinutes: item.duration || 24,
        userRating: undefined,
        scoreMAL: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : 8.0,
        synopsis: cleanSynopsis,
        studioOrDirector: studio,
        rewatchCount: 0,
        favorite: false,
        customListIds: [],
        updatedAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('AniList Search Error:', error);
    return [];
  }
}

export async function fetchTrendingAniListAnime(): Promise<MediaItem[]> {
  try {
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_TRENDING_QUERY,
      }),
    });

    const result = await response.json();
    const list = result?.data?.Page?.media || [];

    return list.map((item: any): MediaItem => {
      const studio = item.studios?.nodes?.[0]?.name || 'Unknown Studio';
      const title = item.title?.english || item.title?.romaji || 'Anime';
      const cleanSynopsis = item.description ? item.description.replace(/<[^>]*>?/gm, '') : '';

      return {
        id: `anilist-${item.id}`,
        title: title,
        originalTitle: item.title?.native || item.title?.romaji,
        type: 'anime',
        posterUrl: item.coverImage?.extraLarge || item.coverImage?.large || '',
        bannerUrl: item.bannerImage || item.coverImage?.extraLarge,
        genres: item.genres || ['Anime'],
        releaseYear: item.startDate?.year || 2024,
        status: 'watching',
        totalEpisodes: item.episodes || 12,
        watchedEpisodes: 0,
        episodeDurationMinutes: item.duration || 24,
        userRating: undefined,
        scoreMAL: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : 8.2,
        synopsis: cleanSynopsis,
        studioOrDirector: studio,
        rewatchCount: 0,
        favorite: false,
        customListIds: [],
        updatedAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('AniList Trending Error:', error);
    return [];
  }
}

// ==========================================
// 2. TVMaze API (TV Shows & Series)
// ==========================================
export async function searchTVMazeShows(query: string): Promise<MediaItem[]> {
  try {
    const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    return data.map((entry: any): MediaItem => {
      const show = entry.show || {};
      const cleanSummary = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : '';
      const year = show.premiered ? new Date(show.premiered).getFullYear() : 2023;

      return {
        id: `tvmaze-${show.id}`,
        title: show.name || 'Dizi',
        type: 'tv',
        posterUrl: show.image?.original || show.image?.medium || '',
        bannerUrl: show.image?.original,
        genres: show.genres || ['Drama'],
        releaseYear: year,
        status: 'plan_to_watch',
        totalEpisodes: show.status === 'Ended' ? 24 : 10,
        watchedEpisodes: 0,
        episodeDurationMinutes: show.averageRuntime || show.runtime || 45,
        scoreIMDB: show.rating?.average || 7.8,
        synopsis: cleanSummary,
        studioOrDirector: show.network?.name || show.webChannel?.name || 'TV Production',
        rewatchCount: 0,
        favorite: false,
        customListIds: [],
        updatedAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('TVMaze Search Error:', error);
    return [];
  }
}

// ==========================================
// 3. iTunes Search API (Music & Albums)
// ==========================================
export async function searchiTunesMusic(query: string): Promise<MediaItem[]> {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`);
    const data = await response.json();
    const results = data.results || [];

    return results.map((track: any): MediaItem => {
      const artwork = track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : '';
      const durationMin = track.trackTimeMillis ? Math.round(track.trackTimeMillis / 60000) : 4;
      const year = track.releaseDate ? new Date(track.releaseDate).getFullYear() : 2024;

      return {
        id: `itunes-${track.trackId}`,
        title: track.trackName || 'Şarkı',
        originalTitle: track.collectionName,
        type: 'music',
        posterUrl: artwork || '',
        bannerUrl: artwork,
        genres: [track.primaryGenreName || 'Müzik'],
        releaseYear: year,
        status: 'completed',
        totalEpisodes: 1,
        watchedEpisodes: 1,
        episodeDurationMinutes: durationMin,
        scoreIMDB: 9.0,
        synopsis: `Sanatçı: ${track.artistName} | Albüm: ${track.collectionName || 'Single'}`,
        studioOrDirector: track.artistName || 'Müzisyen',
        rewatchCount: 1,
        favorite: false,
        customListIds: [],
        updatedAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('iTunes Search Error:', error);
    return [];
  }
}

// ==========================================
// Combined Multi-Search across APIs
// ==========================================
export async function searchRealAPIs(query: string, typeFilter?: MediaType | 'all'): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  const promises: Promise<MediaItem[]>[] = [];

  if (!typeFilter || typeFilter === 'all' || typeFilter === 'anime') {
    promises.push(searchAniListAnime(query));
  }
  if (!typeFilter || typeFilter === 'all' || typeFilter === 'tv' || typeFilter === 'movie') {
    promises.push(searchTVMazeShows(query));
  }
  if (!typeFilter || typeFilter === 'all' || typeFilter === 'music') {
    promises.push(searchiTunesMusic(query));
  }

  const resultsNested = await Promise.all(promises);
  return resultsNested.flat();
}
