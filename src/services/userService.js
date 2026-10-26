/**
 * MangaLive.uz — User & Reading History Service
 *
 * Implements a hybrid offline-first strategy:
 * - Always reads/writes to local storage for instant UI response and guest users.
 * - When a user is authenticated in Supabase, seamlessly syncs favorites
 *   and reading history with the remote database.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import {
  getReadingHistory as localGetReadingHistory,
  recordReadingProgress as localRecordReadingProgress,
  getLastReadChapter as localGetLastReadChapter,
  getFavorites as localGetFavorites,
  toggleFavorite as localToggleFavorite,
  isMangaFavorited as localIsMangaFavorited,
  getGuestAvatar,
  setGuestAvatar,
  getGuestDisplayName,
  setGuestDisplayName,
} from '../data/userStorage.js';

export { getGuestAvatar, setGuestAvatar, getGuestDisplayName, setGuestDisplayName };

/**
 * Get reading history list.
 * @returns {import('../types/schema').UserReadingHistory[]}
 */
export function getReadingHistory() {
  return localGetReadingHistory();
}

/**
 * Fetch unified reading history merging authenticated remote Supabase records
 * with local-first guest storage, sorted by most recently read.
 * @returns {Promise<Array<{mangaId: string, mangaSlug?: string, mangaTitle: string, chapterNumber: number, coverImage?: string, availableChapters?: number, scrollProgress?: number, timestamp: number}>>}
 */
export async function fetchUnifiedReadingHistory() {
  const localItems = localGetReadingHistory() || [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_reading_history')
          .select(`
            id,
            manga_id,
            last_chapter_number,
            last_page_number,
            scroll_progress,
            read_at,
            mangas (
              id,
              slug,
              title,
              cover_url,
              chapters_count
            )
          `)
          .eq('user_id', user.id)
          .order('read_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteItems = data.map((row) => ({
            mangaId: row.manga_id,
            mangaSlug: row.mangas?.slug || row.manga_id,
            mangaTitle: row.mangas?.title || 'Noma\'lum manga',
            coverImage: row.mangas?.cover_url || '',
            availableChapters: Number(row.mangas?.chapters_count || 0),
            chapterNumber: Number(row.last_chapter_number || 1),
            scrollProgress: Number(row.scroll_progress || 0),
            timestamp: new Date(row.read_at).getTime(),
          }));

          const map = new Map();
          for (const item of remoteItems) {
            const key = String(item.mangaSlug || item.mangaId).toLowerCase();
            map.set(key, item);
          }
          for (const item of localItems) {
            const key = String(item.mangaSlug || item.mangaId).toLowerCase();
            if (!map.has(key) || (item.timestamp && item.timestamp > (map.get(key).timestamp || 0))) {
              map.set(key, { ...map.get(key), ...item });
            }
          }
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
      }
    } catch (err) {
      console.warn('fetchUnifiedReadingHistory remote error:', err.message);
    }
  }

  return localItems;
}

/**
 * Get the last read chapter number for a specific manga.
 * @param {string} mangaIdOrSlug
 * @returns {{mangaId: string, mangaTitle: string, chapterNumber: number, timestamp: number, mangaSlug?: string} | null}
 */
export function getLastReadChapter(mangaIdOrSlug) {
  return localGetLastReadChapter(mangaIdOrSlug);
}

async function resolveMangaUuid(idOrSlug) {
  if (!idOrSlug) return null;
  const isUuid = typeof idOrSlug === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug.trim());
  if (isUuid) return idOrSlug.trim();
  const { data } = await supabase.from('mangas').select('id').eq('slug', idOrSlug.trim()).maybeSingle();
  return data?.id || null;
}

/**
 * Record reading progress in local storage and remote database if authenticated.
 * @param {string} mangaId
 * @param {string} mangaTitle
 * @param {number} chapterNumber
 * @param {number} [scrollProgress=0]
 * @param {string} [mangaSlug]
 * @param {string} [coverImage]
 * @param {number} [availableChapters]
 */
export async function recordReadingProgress(
  mangaId,
  mangaTitle,
  chapterNumber,
  scrollProgress = 0,
  mangaSlug = '',
  coverImage = '',
  availableChapters = 0
) {
  // Always update local storage first
  localRecordReadingProgress(
    mangaId,
    mangaTitle,
    chapterNumber,
    mangaSlug,
    coverImage,
    availableChapters,
    scrollProgress
  );

  // Sync to Supabase if authenticated
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const resolvedId = await resolveMangaUuid(mangaId);
        if (resolvedId) {
          await supabase
            .from('user_reading_history')
            .upsert(
              {
                user_id: user.id,
                manga_id: resolvedId,
                last_chapter_number: chapterNumber,
                scroll_progress: scrollProgress,
                read_at: new Date().toISOString(),
              },
              { onConflict: 'user_id, manga_id' }
            );
        }
      }
    } catch (err) {
      // Non-blocking background sync error
      console.warn('Background sync reading progress failed:', err);
    }
  }
}

/**
 * Get list of favorited manga IDs.
 * @returns {string[]}
 */
export function getFavorites() {
  return localGetFavorites();
}

/**
 * Toggle favorite status of a manga.
 * @param {string} mangaId
 * @returns {boolean}
 */
export async function toggleFavorite(mangaId) {
  const isNowFav = localToggleFavorite(mangaId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const resolvedId = await resolveMangaUuid(mangaId);
        if (resolvedId) {
          if (isNowFav) {
            await supabase.from('user_favorites').insert({
              user_id: user.id,
              manga_id: resolvedId,
            });
          } else {
            await supabase
              .from('user_favorites')
              .delete()
              .match({ user_id: user.id, manga_id: resolvedId });
          }
        }
      }
    } catch (err) {
      console.warn('Background sync favorite failed:', err);
    }
  }

  return isNowFav;
}

/**
 * Check if a manga is currently favorited.
 * @param {string} mangaId
 * @returns {boolean}
 */
export function isMangaFavorited(mangaId) {
  return localIsMangaFavorited(mangaId);
}
