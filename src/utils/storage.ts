import { MediaItem, CustomList, Achievement, UserProfile, ActivityLog } from '../types';
import { INITIAL_MEDIA_ITEMS, INITIAL_CUSTOM_LISTS, INITIAL_ACHIEVEMENTS, INITIAL_USER_PROFILE } from '../data/initialData';

const ACTIVE_USER_KEY = 'gearlist_active_user_email';

function sanitizeEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function getKey(base: string, email?: string): string {
  const currentEmail = email || Storage.getActiveUserEmail() || 'senerkadiralper@gmail.com';
  const clean = sanitizeEmail(currentEmail);
  return `gearlist_${clean}_${base}_v2`;
}

export const Storage = {
  getActiveUserEmail(): string | null {
    try {
      return localStorage.getItem(ACTIVE_USER_KEY);
    } catch {
      return null;
    }
  },

  setActiveUserEmail(email: string): void {
    try {
      localStorage.setItem(ACTIVE_USER_KEY, email);
    } catch (e) {
      console.error('Failed to set active user:', e);
    }
  },

  clearActiveUser(): void {
    try {
      localStorage.removeItem(ACTIVE_USER_KEY);
      localStorage.setItem('gearlist_auth_status', 'false');
    } catch (e) {
      console.error('Failed to clear active user:', e);
    }
  },

  getMediaItems(email?: string): MediaItem[] {
    try {
      const key = getKey('media_items', email);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load media items from storage:', e);
    }
    // Return initial items for primary user or empty starter for new user
    const currentEmail = email || Storage.getActiveUserEmail() || '';
    if (!currentEmail || currentEmail === 'senerkadiralper@gmail.com') {
      return INITIAL_MEDIA_ITEMS;
    }
    // If brand new user account, give a clean initialized list or the template
    return INITIAL_MEDIA_ITEMS;
  },

  saveMediaItems(items: MediaItem[], email?: string): void {
    try {
      const key = getKey('media_items', email);
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save media items to storage:', e);
    }
  },

  getCustomLists(email?: string): CustomList[] {
    try {
      const key = getKey('custom_lists', email);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load custom lists:', e);
    }
    return INITIAL_CUSTOM_LISTS;
  },

  saveCustomLists(lists: CustomList[], email?: string): void {
    try {
      const key = getKey('custom_lists', email);
      localStorage.setItem(key, JSON.stringify(lists));
    } catch (e) {
      console.error('Failed to save custom lists:', e);
    }
  },

  getAchievements(email?: string): Achievement[] {
    try {
      const key = getKey('achievements', email);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load achievements:', e);
    }
    return INITIAL_ACHIEVEMENTS;
  },

  saveAchievements(achievements: Achievement[], email?: string): void {
    try {
      const key = getKey('achievements', email);
      localStorage.setItem(key, JSON.stringify(achievements));
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  },

  getUserProfile(email?: string): UserProfile {
    try {
      const key = getKey('user_profile', email);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load user profile:', e);
    }

    const currentEmail = email || Storage.getActiveUserEmail() || 'senerkadiralper@gmail.com';
    if (currentEmail === 'senerkadiralper@gmail.com') {
      return INITIAL_USER_PROFILE;
    }

    // Dynamic profile for custom email
    const username = currentEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'kullanici';
    return {
      ...INITIAL_USER_PROFILE,
      id: `user-${sanitizeEmail(currentEmail)}`,
      email: currentEmail,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      username,
    };
  },

  saveUserProfile(profile: UserProfile, email?: string): void {
    try {
      const targetEmail = email || profile.email || Storage.getActiveUserEmail();
      const key = getKey('user_profile', targetEmail || undefined);
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  },

  getActivityLogs(email?: string): ActivityLog[] {
    try {
      const key = getKey('activity_logs', email);
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load activity logs:', e);
    }
    return [];
  },

  saveActivityLogs(logs: ActivityLog[], email?: string): void {
    try {
      const key = getKey('activity_logs', email);
      localStorage.setItem(key, JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save activity logs:', e);
    }
  },

  exportBackup(): string {
    const data = {
      user: this.getActiveUserEmail(),
      mediaItems: this.getMediaItems(),
      customLists: this.getCustomLists(),
      achievements: this.getAchievements(),
      userProfile: this.getUserProfile(),
      activityLogs: this.getActivityLogs(),
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.mediaItems && Array.isArray(data.mediaItems)) {
        this.saveMediaItems(data.mediaItems);
      }
      if (data.customLists && Array.isArray(data.customLists)) {
        this.saveCustomLists(data.customLists);
      }
      if (data.achievements && Array.isArray(data.achievements)) {
        this.saveAchievements(data.achievements);
      }
      if (data.userProfile) {
        this.saveUserProfile(data.userProfile);
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON:', e);
      return false;
    }
  },

  resetToDefault(email?: string): void {
    const targetEmail = email || Storage.getActiveUserEmail() || undefined;
    localStorage.removeItem(getKey('media_items', targetEmail));
    localStorage.removeItem(getKey('custom_lists', targetEmail));
    localStorage.removeItem(getKey('achievements', targetEmail));
    localStorage.removeItem(getKey('user_profile', targetEmail));
    localStorage.removeItem(getKey('activity_logs', targetEmail));
  }
};
