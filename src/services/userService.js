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
} from '../data/userStorage.js';

/**
 * Get reading history list.
 * @returns {import('../types/schema').UserReadingHistory[]}
 */
export function getReadingHistory() {
  return localGetReadingHistory();
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
 */
export async function recordReadingProgress(mangaId, mangaTitle, chapterNumber, scrollProgress = 0, mangaSlug = '') {
  // Always update local storage first
  localRecordReadingProgress(mangaId, mangaTitle, chapterNumber, mangaSlug);

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
