/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { MediaItem, UserProfile, WatchStatus, MediaType, CustomList, ActivityLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pozwhnxadcbnlutmwmjd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_bb4ojC6Nbn2ytnuYJqBSOw_WwCYNXdp';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Auth Helpers ---
export async function signUpWithEmail(email: string, pass: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        display_name: name,
        username: email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''),
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    await upsertUserProfile({
      id: data.user.id,
      email: email,
      displayName: name,
      username: email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      bio: 'GearList kullanıcısı',
    });
  }

  return data;
}

export async function signInWithEmail(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

// --- Profile & Storage Helpers ---
export async function fetchUserProfile(userId: string): Promise<Partial<UserProfile> | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      username: data.username || 'Kullanıcı',
      displayName: data.display_name || 'Kullanıcı',
      avatarUrl: data.avatar_url || '',
      bio: data.bio || '',
    };
  } catch (err) {
    console.error('Profile fetch failed:', err);
    return null;
  }
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { id: string }) {
  const { error } = await supabase.from('profiles').upsert({
    id: profile.id,
    username: profile.username,
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl,
    bio: profile.bio,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error('Error saving profile to DB:', error);
}

export async function uploadImageToStorage(file: File, bucket: 'avatars' | 'banners', userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn(`Bucket '${bucket}' upload failed (it may not exist or require public RLS). Falling back to base64 URL.`, uploadError);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Storage upload exception:', err);
    return null;
  }
}

// --- Media & Watchlist Database Helpers ---
export async function fetchUserWatchlist(userId: string): Promise<MediaItem[]> {
  try {
    const { data, error } = await supabase
      .from('user_media')
      .select(`
        id,
        status,
        progress,
        score,
        review,
        notes,
        started_at,
        completed_at,
        created_at,
        updated_at,
        media:media_id (
          id,
          type,
          title,
          original_title,
          description,
          release_date,
          poster_url,
          backdrop_url,
          genres,
          metadata
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching watchlist from Supabase:', error);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => {
      const media = item.media || {};
      const metadata = media.metadata || {};
      const statusMap: Record<string, WatchStatus> = {
        WATCHING: 'watching',
        COMPLETED: 'completed',
        PLANNED: 'plan_to_watch',
        PAUSED: 'on_hold',
        DROPPED: 'dropped',
      };

      const typeMap: Record<string, MediaType> = {
        ANIME: 'anime',
        MOVIE: 'movie',
        TV: 'tv',
        MUSIC: 'music',
      };

      return {
        id: media.id || item.id,
        title: media.title || 'Başlıksız Medya',
        originalTitle: media.original_title,
        type: typeMap[media.type] || 'anime',
        posterUrl: media.poster_url || '',
        bannerUrl: media.backdrop_url,
        genres: Array.isArray(media.genres) ? media.genres : [],
        releaseYear: media.release_date ? new Date(media.release_date).getFullYear() : (metadata.releaseYear || 2024),
        status: statusMap[item.status] || 'watching',
        totalEpisodes: metadata.totalEpisodes || 12,
        watchedEpisodes: item.progress || 0,
        episodeDurationMinutes: metadata.episodeDurationMinutes || 24,
        userRating: item.score ? Number(item.score) : undefined,
        review: item.review,
        notes: item.notes,
        favorite: metadata.favorite || false,
        rewatchCount: metadata.rewatchCount || 0,
        customListIds: metadata.customListIds || [],
        synopsis: media.description,
        studioOrDirector: metadata.studioOrDirector,
        scoreMAL: metadata.scoreMAL,
        scoreIMDB: metadata.scoreIMDB,
        updatedAt: item.updated_at || new Date().toISOString(),
        startedAt: item.started_at,
        completedAt: item.completed_at,
      };
    });
  } catch (err) {
    console.error('Watchlist query exception:', err);
    return [];
  }
}

export async function saveMediaToWatchlist(userId: string, mediaInput: MediaItem | MediaItem[]) {
  try {
    const items = Array.isArray(mediaInput) ? mediaInput : [mediaInput];
    for (const media of items) {
      const dbType = media.type.toUpperCase();
      const statusMap: Record<WatchStatus, string> = {
        watching: 'WATCHING',
        completed: 'COMPLETED',
        plan_to_watch: 'PLANNED',
        on_hold: 'PAUSED',
        dropped: 'DROPPED',
      };

    // Ensure valid UUID for media
    let mediaUuid = media.id;
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mediaUuid);
    if (!isValidUuid) {
      // If external ID like 'anilist-1234', check if media with this anilist/tmdb metadata exists or generate deterministic UUID
      mediaUuid = crypto.randomUUID();
    }

    const { data: mediaData, error: mediaErr } = await supabase
      .from('media')
      .upsert({
        id: mediaUuid,
        type: dbType === 'MUSIC' ? 'ANIME' : dbType,
        title: media.title,
        original_title: media.originalTitle || null,
        description: media.synopsis || null,
        release_date: `${media.releaseYear}-01-01`,
        poster_url: media.posterUrl || null,
        backdrop_url: media.bannerUrl || null,
        genres: media.genres || [],
        source_provider: 'external_api',
        metadata: {
          totalEpisodes: media.totalEpisodes,
          episodeDurationMinutes: media.episodeDurationMinutes,
          studioOrDirector: media.studioOrDirector,
          scoreMAL: media.scoreMAL,
          scoreIMDB: media.scoreIMDB,
          favorite: media.favorite,
          customListIds: media.customListIds,
        },
      })
      .select('id')
      .single();

    const actualMediaId = mediaData?.id || mediaUuid;

    // 2. Upsert into `user_media` table
    const { error: userMediaErr } = await supabase
      .from('user_media')
      .upsert({
        user_id: userId,
        media_id: actualMediaId,
        status: statusMap[media.status] || 'WATCHING',
        progress: media.watchedEpisodes || 0,
        score: media.userRating || null,
        review: media.review || null,
        notes: media.notes || null,
        started_at: media.startedAt || null,
        completed_at: media.completedAt || null,
        updated_at: new Date().toISOString(),
      });

      if (userMediaErr) {
        console.error('Error saving user_media:', userMediaErr);
      }
    }
  } catch (err) {
    console.error('saveMediaToWatchlist exception:', err);
  }
}

export async function deleteMediaFromWatchlist(userId: string, mediaId: string) {
  try {
    await supabase
      .from('user_media')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId);
  } catch (err) {
    console.error('deleteMediaFromWatchlist error:', err);
  }
}
