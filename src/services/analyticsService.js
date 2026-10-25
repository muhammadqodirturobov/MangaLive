/**
 * MangaLive.uz — Real Analytics & Reading Event Tracking Service
 *
 * Provides genuine, trustworthy engagement tracking:
 * - Session tracking via sessionStorage.
 * - Deduplication window (30 minutes per manga chapter per session).
 * - React StrictMode / re-render guard (in-memory token set).
 * - Bot filtering (webdriver check, known crawler user agents).
 * - Safe Supabase counter increment with graceful fallback.
 * - Honest metric reporting: never fabricates 14K numbers or fake views.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const SESSION_KEY = 'ml_session_id';
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const RECENT_OPENS_KEY = 'ml_recent_opens';
const LOCAL_STATS_KEY = 'ml_local_manga_stats';

// In-memory guard to prevent double-counting on React re-renders or StrictMode
const inMemoryOpenGuards = new Set();

/**
 * Get or create a persistent anonymous session ID for this browser tab/session.
 */
export function getSessionId() {
  if (typeof window === 'undefined') return 'ssr_session';
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `ml_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'fallback_session';
  }
}

/**
 * Determine if the current client is an automated crawler or bot.
 */
function isBot() {
  if (typeof window === 'undefined') return true;
  if (navigator.webdriver) return true;

  const ua = (navigator.userAgent || '').toLowerCase();
  const botSignatures = [
    'bot', 'crawl', 'spider', 'slurp', 'headless', 'googlebot',
    'bingbot', 'yandex', 'baidu', 'lighthouse', 'inspect'
  ];
  return botSignatures.some(sig => ua.includes(sig));
}

/**
 * Check whether this chapter open was already counted recently in this session.
 */
function isDuplicateOpen(mangaKey, chapterNumber) {
  const token = `${mangaKey}_ch_${chapterNumber}`;

  // 1. In-memory check (guards against immediate React StrictMode mounts)
  if (inMemoryOpenGuards.has(token)) {
    return true;
  }

  // 2. Storage timestamp check (guards against repeated reloads within 30 min)
  try {
    const raw = sessionStorage.getItem(RECENT_OPENS_KEY);
    const opens = raw ? JSON.parse(raw) : {};
    const lastOpen = opens[token];
    const now = Date.now();

    if (lastOpen && now - lastOpen < DEDUP_WINDOW_MS) {
      return true;
    }
  } catch {
    // If storage is disabled, proceed
  }

  return false;
}

/**
 * Mark chapter as opened to prevent duplicates.
 */
function markChapterOpened(mangaKey, chapterNumber) {
  const token = `${mangaKey}_ch_${chapterNumber}`;
  inMemoryOpenGuards.add(token);

  try {
    const raw = sessionStorage.getItem(RECENT_OPENS_KEY);
    const opens = raw ? JSON.parse(raw) : {};
    opens[token] = Date.now();
    sessionStorage.setItem(RECENT_OPENS_KEY, JSON.stringify(opens));
  } catch {
    // Storage quota or disabled
  }
}

/**
 * Record a genuine chapter open event.
 *
 * @param {string} mangaId - Manga UUID or slug
 * @param {number|string} chapterNumber - Chapter number
 * @param {string} [mangaSlug] - Optional slug for lookup
 * @returns {Promise<boolean>} Whether the open was recorded as a new view
 */
export async function recordChapterOpen(mangaId, chapterNumber, mangaSlug) {
  if (isBot()) {
    return false;
  }

  const lookupKey = mangaSlug || mangaId;
  const chNum = Number(chapterNumber);

  if (isDuplicateOpen(lookupKey, chNum)) {
    return false;
  }

  // Register in deduplication cache
  markChapterOpened(lookupKey, chNum);

  // Update local stats cache
  try {
    const rawLocal = localStorage.getItem(LOCAL_STATS_KEY);
    const localStats = rawLocal ? JSON.parse(rawLocal) : {};
    const current = localStats[lookupKey] || { views: 0, chapters: {} };
    current.views = (current.views || 0) + 1;
    current.chapters[chNum] = (current.chapters[chNum] || 0) + 1;
    localStats[lookupKey] = current;
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(localStats));
  } catch {
    // Local storage disabled or full
  }

  // Increment Supabase counts if configured
  if (isSupabaseConfigured) {
    try {
      // Find manga id by UUID or slug
      let dbMangaId = mangaId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);

      if (!isUuid) {
        const { data: mData } = await supabase
          .from('mangas')
          .select('id, views_count')
          .or(`slug.eq.${mangaId},id.eq.${mangaId}`)
          .maybeSingle();

        if (mData) {
          dbMangaId = mData.id;
          await supabase
            .from('mangas')
            .update({ views_count: (mData.views_count || 0) + 1 })
            .eq('id', dbMangaId);
        }
      } else {
        const { data: mData } = await supabase
          .from('mangas')
          .select('id, views_count')
          .eq('id', dbMangaId)
          .maybeSingle();

        if (mData) {
          await supabase
            .from('mangas')
            .update({ views_count: (mData.views_count || 0) + 1 })
            .eq('id', dbMangaId);
        }
      }

      // Update chapter views_count
      if (dbMangaId && chNum) {
        const { data: chData } = await supabase
          .from('chapters')
          .select('id, views_count')
          .eq('manga_id', dbMangaId)
          .eq('chapter_number', chNum)
          .maybeSingle();

        if (chData) {
          await supabase
            .from('chapters')
            .update({ views_count: (chData.views_count || 0) + 1 })
            .eq('id', chData.id);
        }
      }
    } catch (err) {
      console.warn('Could not increment Supabase view count:', err?.message);
    }
  }

  return true;
}

/**
 * Format view count honestly:
 * - If 0 or null, returns null (so callers can hide or show 'Yangi')
 * - If 1-999, shows exact count: "12"
 * - If 1000+, shows honest abbreviation: "1.2K"
 *
 * @param {number|null} count
 * @returns {string|null}
 */
export function formatViewCount(count) {
  const n = Number(count);
  if (!n || n <= 0) return null;
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}
