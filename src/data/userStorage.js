/**
 * MangaLive.uz — User Storage & State Helper
 *
 * Local-first reading history and favorites tracking (localStorage).
 * Works completely offline and without requiring a backend database,
 * matching UX patterns from MangaBox.uz, MangaDex, and MangaLab.
 */

const HISTORY_KEY = 'mangalive_reading_history';
const FAVORITES_KEY = 'mangalive_favorites';
const GUEST_AVATAR_KEY = 'mangalive_guest_avatar';
const GUEST_NAME_KEY = 'mangalive_guest_name';

/**
 * Get guest chosen avatar URL.
 * @returns {string|null}
 */
export function getGuestAvatar() {
  try {
    return localStorage.getItem(GUEST_AVATAR_KEY);
  } catch {
    return null;
  }
}

/**
 * Persist guest avatar choice.
 * @param {string} avatarUrl
 */
export function setGuestAvatar(avatarUrl) {
  try {
    if (avatarUrl) {
      localStorage.setItem(GUEST_AVATAR_KEY, avatarUrl);
    } else {
      localStorage.removeItem(GUEST_AVATAR_KEY);
    }
  } catch (err) {
    console.warn('Failed to save guest avatar:', err);
  }
}

/**
 * Get guest chosen display name.
 * @returns {string|null}
 */
export function getGuestDisplayName() {
  try {
    return localStorage.getItem(GUEST_NAME_KEY);
  } catch {
    return null;
  }
}

/**
 * Set guest chosen display name.
 * @param {string} name
 */
export function setGuestDisplayName(name) {
  try {
    if (name) {
      localStorage.setItem(GUEST_NAME_KEY, name.trim());
    } else {
      localStorage.removeItem(GUEST_NAME_KEY);
    }
  } catch (err) {
    console.warn('Failed to save guest display name:', err);
  }
}

/**
 * Get reading history list.
 * @returns {Array<{mangaId: string, mangaTitle: string, chapterNumber: number, timestamp: number}>}
 */
export function getReadingHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Record a chapter read in history.
 * @param {string} mangaId
 * @param {string} mangaTitle
 * @param {number} chapterNumber
 * @param {string} [mangaSlug]
 * @param {string} [coverImage]
 * @param {number} [availableChapters]
 * @param {number} [scrollProgress]
 */
export function recordReadingProgress(
  mangaId,
  mangaTitle,
  chapterNumber,
  mangaSlug = '',
  coverImage = '',
  availableChapters = 0,
  scrollProgress = 0
) {
  try {
    const history = getReadingHistory();
    const cleanId = String(mangaId).toLowerCase();
    const cleanSlug = mangaSlug ? String(mangaSlug).toLowerCase() : '';

    const filtered = history.filter(
      (item) =>
        String(item.mangaId).toLowerCase() !== cleanId &&
        (!cleanSlug || !item.mangaSlug || String(item.mangaSlug).toLowerCase() !== cleanSlug)
    );

    filtered.unshift({
      mangaId,
      mangaSlug: mangaSlug || undefined,
      mangaTitle,
      chapterNumber: Number(chapterNumber) || 1,
      coverImage: coverImage || undefined,
      availableChapters: Number(availableChapters) || undefined,
      scrollProgress: Number(scrollProgress) || 0,
      timestamp: Date.now(),
    });

    // Keep last 30 items
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch {
    // Storage quota fallback
  }
}

/**
 * Get the last read chapter record for a manga.
 * @param {string} mangaIdOrSlug
 * @returns {{mangaId: string, mangaTitle: string, chapterNumber: number, timestamp: number, mangaSlug?: string} | null}
 */
export function getLastReadChapter(mangaIdOrSlug) {
  if (!mangaIdOrSlug) return null;
  const history = getReadingHistory();
  const key = String(mangaIdOrSlug).toLowerCase();
  const found = history.find(
    (item) =>
      String(item.mangaId).toLowerCase() === key ||
      (item.mangaSlug && String(item.mangaSlug).toLowerCase() === key)
  );
  return found || null;
}

/**
 * Get favorites list of manga IDs.
 * @returns {string[]}
 */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggle favorite status of a manga.
 * @param {string} mangaId
 * @returns {boolean} true if now favorited, false if removed
 */
export function toggleFavorite(mangaId) {
  try {
    const favs = getFavorites();
    const index = favs.indexOf(mangaId);
    let isFav = false;
    if (index >= 0) {
      favs.splice(index, 1);
      isFav = false;
    } else {
      favs.push(mangaId);
      isFav = true;
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return isFav;
  } catch {
    return false;
  }
}

/**
 * Check if a manga is favorited.
 * @param {string} mangaId
 * @returns {boolean}
 */
export function isMangaFavorited(mangaId) {
  return getFavorites().includes(mangaId);
}
