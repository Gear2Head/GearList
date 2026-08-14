import { UserProfile, MediaItem } from '../types';

export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'dbc88cb0804e4555bc1f404ae3c99e62';
export const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '0bb9c748eed94357ad4d7aa7ccb46b7e';

export function getSpotifyAuthUrl(redirectUri?: string): string {
  let targetRedirectUri = redirectUri || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  if (targetRedirectUri.endsWith('/')) {
    targetRedirectUri = targetRedirectUri.slice(0, -1);
  }

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
  ].join(' ');

  return `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(
    SPOTIFY_CLIENT_ID
  )}&response_type=code&redirect_uri=${encodeURIComponent(
    targetRedirectUri
  )}&scope=${encodeURIComponent(scopes)}&show_dialog=true`;
}

export async function exchangeSpotifyCodeForToken(code: string, redirectUri?: string): Promise<string | null> {
  let targetRedirectUri = redirectUri || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  if (targetRedirectUri.endsWith('/')) {
    targetRedirectUri = targetRedirectUri.slice(0, -1);
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', targetRedirectUri);
  params.append('client_id', SPOTIFY_CLIENT_ID);
  params.append('client_secret', SPOTIFY_CLIENT_SECRET);

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('gearlist_spotify_access_token', data.access_token);
      return data.access_token;
    }
    console.error('Spotify token exchange error response:', data);
    return null;
  } catch (err) {
    console.error('Spotify token exchange failed:', err);
    return null;
  }
}

export async function handleSpotifyOAuthCallback(redirectUri?: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Check URL query params for ?code=...
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    const token = await exchangeSpotifyCodeForToken(code, redirectUri);
    if (token) {
      // Clean query string from browser address bar
      window.history.replaceState(null, '', window.location.pathname);
      return token;
    }
  }

  // 2. Fallback check URL hash fragment #access_token=...
  const hash = window.location.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    if (accessToken) {
      localStorage.setItem('gearlist_spotify_access_token', accessToken);
      window.history.replaceState(null, '', window.location.pathname);
      return accessToken;
    }
  }

  return localStorage.getItem('gearlist_spotify_access_token');
}

export interface SpotifySyncedData {
  username: string;
  totalListeningMinutes: number;
  topArtists: string[];
  topTracks: { title: string; artist: string; durationMinutes: number }[];
  syncedAt: string;
}

export async function fetchSpotifyUserData(accessToken: string): Promise<SpotifySyncedData> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. User Profile
  const profileRes = await fetch('https://api.spotify.com/v1/me', { headers });
  if (!profileRes.ok) {
    if (profileRes.status === 401) {
      localStorage.removeItem('gearlist_spotify_access_token');
      throw new Error('Spotify oturum süresi doldu. Lütfen tekrar bağlanın.');
    }
    throw new Error(`Spotify API hatası (${profileRes.status}).`);
  }
  const profileData = await profileRes.json();

  // 2. Top Tracks
  const topTracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', { headers });
  let topTracks: { title: string; artist: string; durationMinutes: number }[] = [];
  if (topTracksRes.ok) {
    const topData = await topTracksRes.json();
    topTracks = (topData.items || []).map((t: any) => ({
      title: t.name,
      artist: t.artists?.[0]?.name || 'Bilinmeyen Sanatçı',
      durationMinutes: Math.round((t.duration_ms / 60000) * 10) / 10,
    }));
  }

  // 3. Top Artists
  const topArtistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', { headers });
  let topArtists: string[] = [];
  if (topArtistsRes.ok) {
    const artistData = await topArtistsRes.json();
    topArtists = (artistData.items || []).map((a: any) => a.name);
  }

  // 4. Recently Played Tracks
  const recentRes = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers });
  let recentMinutes = 0;
  if (recentRes.ok) {
    const recentData = await recentRes.json();
    recentMinutes = (recentData.items || []).reduce((acc: number, item: any) => {
      return acc + Math.round((item.track.duration_ms || 0) / 60000);
    }, 0);
  }

  return {
    username: profileData.display_name || profileData.id || 'Spotify Kullanıcısı',
    totalListeningMinutes: Math.max(recentMinutes, 120),
    topArtists: topArtists,
    topTracks: topTracks,
    syncedAt: new Date().toISOString(),
  };
}
