/**
 * MangaLive.uz — Centralized Chapter Access Policy
 *
 * Policy:
 * 1. Chapter 1 (and prologue / Chapter 0) is 100% free and publicly accessible
 *    to all unauthenticated guest visitors.
 * 2. Chapter 2 and all subsequent chapters require an authenticated user account.
 * 3. Never lock or display unavailable chapters.
 */

/**
 * Check if a chapter is locked for the current visitor.
 * @param {number|string} chapterNumber
 * @param {object|null} user - Authenticated Supabase user object from useAuth()
 * @returns {boolean} True if locked, false if accessible
 */
export function isChapterLocked(chapterNumber, user) {
  // Signed-in users have full access to all published chapters
  if (user) return false;

  const num = typeof chapterNumber === 'number' ? chapterNumber : parseFloat(chapterNumber);
  if (isNaN(num)) return false;

  // Chapter 1 and Chapter 0 (prologue) are free to all guests
  return num > 1;
}

/**
 * Check if visitor can access chapter.
 * @param {number|string} chapterNumber
 * @param {object|null} user
 * @returns {boolean}
 */
export function canAccessChapter(chapterNumber, user) {
  return !isChapterLocked(chapterNumber, user);
}

export const CHAPTER_LOCK_REASON =
  "2-bob va undan keyingi boblarni o'qish uchun bepul hisobingizga kiring yoki ro'yxatdan o'ting.";
