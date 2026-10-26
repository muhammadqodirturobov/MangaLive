/**
 * MangaLive.uz — Manga Service (Data Access Layer)
 *
 * Provides a high-performance interface between UI components and PostgreSQL/Supabase.
 * Features:
 * - In-memory caching with 60-second TTL to eliminate navigation lag and repeated requests.
 * - In-flight request deduplication to prevent duplicate concurrent network queries.
 * - Pure real data: never invents placeholder manga, fabricated view counts, or demo fallbacks
 *   when Supabase is configured.
 * - Surfaces real errors to the UI for proper recoverable error states.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import {
  MANGA_LIST as LOCAL_MANGA_LIST,
  getMangaById as localGetMangaById,
  getFeaturedMangas as localGetFeaturedMangas,
  getPopularManga as localGetPopularManga,
  getLatestManga as localGetLatestManga,
  searchManga as localSearchManga,
} from '../data/manga.js';
import { normalizeManga } from '../types/entities.js';
import { formatExternalRating } from './ratingService.js';
import { WEEKLY_RANKINGS } from '../data/rankings.js';

// Legacy export for fallback compatibility
export const MANGA_LIST = isSupabaseConfigured ? [] : LOCAL_MANGA_LIST;
export const searchManga = localSearchManga;

// ── In-Memory Cache & In-Flight Request Deduplication ───────────────────────
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const mangaCache = new Map(); // key -> { data: Manga, timestamp: number }
const inFlightMangaRequests = new Map(); // key -> Promise<Manga | null>
const listCache = new Map(); // cacheKey -> { data: Manga[], timestamp: number }

/**
 * Check if a cached manga record is still valid.
 * @param {string} idOrSlug
 * @returns {import('../types/schema').Manga | null}
 */
export function getCachedManga(idOrSlug) {
  if (!idOrSlug) return null;
  const key = String(idOrSlug).trim().toLowerCase();
  const entry = mangaCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

/**
 * Store a manga in the cache under all its keys (id, uuid, slug).
 * @param {import('../types/schema').Manga} manga
 */
function storeInMangaCache(manga) {
  if (!manga) return;
  const now = Date.now();
  const entry = { data: manga, timestamp: now };
  if (manga.id) mangaCache.set(String(manga.id).toLowerCase(), entry);
  if (manga.uuid) mangaCache.set(String(manga.uuid).toLowerCase(), entry);
  if (manga.slug) mangaCache.set(String(manga.slug).toLowerCase(), entry);
}

/**
 * Invalidate manga cache entry (e.g. after edit or upload in admin).
 * @param {string} [idOrSlug]
 */
export function invalidateMangaCache(idOrSlug) {
  if (idOrSlug) {
    const key = String(idOrSlug).toLowerCase();
    mangaCache.delete(key);
  } else {
    mangaCache.clear();
  }
  listCache.clear();
}

/**
 * Filter local manga list (only used when Supabase is NOT configured).
 */
function localFilterMangas({
  query = '',
  genre = 'barchasi',
  type = 'barchasi',
  status = 'barchasi',
  minRating = '0',
  sort = 'reyting',
} = {}) {
  let result = query ? localSearchManga(query) : [...LOCAL_MANGA_LIST];

  if (genre && genre !== 'barchasi') {
    result = result.filter((m) => m.genres?.includes(genre));
  }
  if (type && type !== 'barchasi') {
    result = result.filter((m) => m.type?.toLowerCase() === type.toLowerCase());
  }
  if (status && status !== 'barchasi') {
    result = result.filter((m) => m.status === status);
  }
  if (minRating && parseFloat(minRating) > 0) {
    result = result.filter((m) => m.rating >= parseFloat(minRating));
  }

  switch (sort) {
    case 'mashhur':
    case 'korishlar':
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
    case 'yangilangan':
      result.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
      break;
    case 'reyting':
    default:
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
  }

  return result;
}

/**
 * Fetch manga list with search, filtering, and sorting.
 * @param {import('../types/schema').MangaFilterOptions} options
 * @returns {Promise<import('../types/schema').Manga[]>}
 */
export async function getMangaList(options = {}) {
  const {
    query = '',
    genre = 'barchasi',
    type = 'barchasi',
    status = 'barchasi',
    minRating = '0',
    sort = 'reyting',
  } = options;

  if (isSupabaseConfigured && supabase) {
    const cacheKey = JSON.stringify({ query: query.trim(), genre, type, status, minRating, sort });
    const cached = listCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    let req = supabase
      .from('mangas')
      .select(`
        *,
        manga_genres (
          genres (slug, name)
        )
      `);

    if (query.trim()) {
      // In PostgREST .or() filters, commas act as delimiters unless the value is wrapped in double quotes.
      const sanitized = query.trim().replace(/"/g, '\\"');
      req = req.or(`title.ilike."%${sanitized}%",title_en.ilike."%${sanitized}%",slug.ilike."%${sanitized}%",author.ilike."%${sanitized}%"`);
    }
    if (type && type !== 'barchasi') {
      req = req.eq('type', type.toLowerCase());
    }
    if (status && status !== 'barchasi') {
      req = req.eq('status', status);
    }
    if (Number(minRating) > 0) {
      req = req.gte('rating', Number(minRating));
    }

    switch (sort) {
      case 'mashhur':
      case 'korishlar':
        req = req.order('views_count', { ascending: false });
        break;
      case 'yangilangan':
        req = req.order('last_updated_at', { ascending: false });
        break;
      case 'reyting':
      default:
        req = req.order('rating', { ascending: false });
        break;
    }

    const { data, error } = await req;
    if (error) {
      console.error('[mangaService] Supabase query error:', error.message);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    let list = (data || []).map(normalizeManga);
    if (genre && genre !== 'barchasi') {
      list = list.filter((m) => m.genres?.includes(genre));
    }

    // Cache individual mangas into mangaCache for instant subsequent detail page opens
    list.forEach(storeInMangaCache);

    listCache.set(cacheKey, { data: list, timestamp: Date.now() });
    return list;
  }

  // Pure local offline fallback (only when Supabase credentials are missing)
  return localFilterMangas(options);
}

/**
 * Synchronous get single manga by ID or slug.
 * Checks the in-memory cache first to avoid false 404s.
 * @param {string} idOrSlug
 * @returns {import('../types/schema').Manga|null}
 */
export function getMangaById(idOrSlug) {
  if (isSupabaseConfigured) {
    return getCachedManga(idOrSlug) || null;
  }
  return localGetMangaById(idOrSlug) || null;
}

/**
 * Asynchronous fetch for single manga by ID or slug with caching and request deduplication.
 * @param {string} idOrSlug
 * @returns {Promise<import('../types/schema').Manga|null>}
 */
export async function fetchMangaById(idOrSlug, options = {}) {
  const forceRefresh = typeof options === 'boolean' ? options : Boolean(options?.forceRefresh);
  if (!idOrSlug) return null;

  // 1. Check cache first unless forceRefresh is explicitly requested
  if (!forceRefresh) {
    const cached = getCachedManga(idOrSlug);
    if (cached) return cached;
  } else {
    invalidateMangaCache(idOrSlug);
  }

  if (isSupabaseConfigured && supabase) {
    const key = String(idOrSlug).trim().toLowerCase();

    // 2. Deduplicate in-flight requests for the same manga
    if (inFlightMangaRequests.has(key)) {
      return inFlightMangaRequests.get(key);
    }

    const fetchPromise = (async () => {
      try {
        const cleanId = String(idOrSlug).trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

        let query = supabase
          .from('mangas')
          .select(`
            *,
            manga_genres (
              genres (slug, name)
            )
          `);

        if (isUuid) {
          query = query.eq('id', cleanId);
        } else {
          query = query.eq('slug', cleanId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error(`[mangaService] Failed to fetch manga ${idOrSlug}:`, error.message);
          throw new Error(`Supabase fetchMangaById error: ${error.message}`);
        }

        if (!data) {
          // If not yet seeded into Supabase, check verified local list before returning null
          const localM = localGetMangaById(cleanId);
          if (localM) {
            const normalized = normalizeManga(localM);
            storeInMangaCache(normalized);
            return normalized;
          }
          return null;
        }

        const normalized = normalizeManga(data);
        storeInMangaCache(normalized);
        return normalized;
      } finally {
        inFlightMangaRequests.delete(key);
      }
    })();

    inFlightMangaRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  // Pure local offline fallback
  return localGetMangaById(idOrSlug) || null;
}

function getDistinctCachedMangas() {
  const seen = new Set();
  const distinct = [];
  for (const entry of mangaCache.values()) {
    const manga = entry.data;
    const uniqueKey = manga?.id || manga?.slug || manga?.uuid;
    if (uniqueKey && !seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      distinct.push(manga);
    }
  }
  return distinct;
}

/**
 * Synchronous get rotating list of featured mangas.
 * @param {number} limit
 * @returns {import('../types/schema').Manga[]}
 */
export function getFeaturedMangas(limit = 10) {
  if (isSupabaseConfigured) {
    // If cache has mangas, return cached featured or top items
    const all = getDistinctCachedMangas();
    const featured = all.filter((m) => m.isFeatured);
    return featured.length > 0 ? featured.slice(0, limit) : all.slice(0, limit);
  }
  return localGetFeaturedMangas(limit);
}

/**
 * Async fetch rotating list of featured mangas from live Supabase.
 * @param {number} limit
 * @returns {Promise<import('../types/schema').Manga[]>}
 */
export async function fetchFeaturedMangas(limit = 10) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('mangas')
      .select(`*, manga_genres (genres (slug, name))`)
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[mangaService] Failed to fetch featured manga:', error.message);
      throw new Error(`Supabase fetchFeaturedMangas error: ${error.message}`);
    }

    let list = (data || []).map(normalizeManga);

    // If no mangas are explicitly marked as featured in DB, fallback to top-rated real mangas
    if (list.length === 0) {
      const { data: topData } = await supabase
        .from('mangas')
        .select(`*, manga_genres (genres (slug, name))`)
        .order('rating', { ascending: false })
        .order('chapters_count', { ascending: false })
        .limit(limit);
      list = (topData || []).map(normalizeManga);
    }

    list.forEach(storeInMangaCache);
    return list;
  }

  return localGetFeaturedMangas(limit);
}

/**
 * Synchronous get popular mangas.
 * @param {number} limit
 * @returns {import('../types/schema').Manga[]}
 */
export function getPopularManga(limit = 8) {
  if (isSupabaseConfigured) {
    const all = getDistinctCachedMangas();
    return all.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, limit);
  }
  return localGetPopularManga(limit);
}

/**
 * Async fetch popular mangas from live Supabase.
 * @param {number} limit
 * @returns {Promise<import('../types/schema').Manga[]>}
 */
export async function fetchPopularManga(limit = 8) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('mangas')
      .select(`*, manga_genres (genres (slug, name))`)
      .order('rating', { ascending: false })
      .order('chapters_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[mangaService] Failed to fetch popular manga:', error.message);
      throw new Error(`Supabase fetchPopularManga error: ${error.message}`);
    }

    let list = (data || []).map(normalizeManga);
    list.forEach(storeInMangaCache);
    return list;
  }

  return localGetPopularManga(limit);
}

/**
 * Synchronous get latest updated mangas.
 * @param {number} limit
 * @returns {import('../types/schema').Manga[]}
 */
export function getLatestManga(limit = 10) {
  if (isSupabaseConfigured) {
    const all = getDistinctCachedMangas();
    return all.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0)).slice(0, limit);
  }
  return localGetLatestManga(limit);
}

/**
 * Async fetch latest updated mangas from live Supabase.
 * @param {number} limit
 * @returns {Promise<import('../types/schema').Manga[]>}
 */
export async function fetchLatestManga(limit = 10) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('mangas')
      .select(`*, manga_genres (genres (slug, name))`)
      .order('last_updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[mangaService] Failed to fetch latest manga:', error.message);
      throw new Error(`Supabase fetchLatestManga error: ${error.message}`);
    }

    let list = (data || []).map(normalizeManga);
    list.forEach(storeInMangaCache);
    return list;
  }

  return localGetLatestManga(limit);
}

/**
 * Async fetch real rankings from Supabase.
 * @param {'weekly' | 'monthly' | 'alltime'} period
 * @returns {Promise<Array<{ rank: number, mangaId: string, manga: any, score: string, metricLabel: string }>>}
 */
export async function fetchRankings(period = 'weekly') {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('mangas')
      .select(`*, manga_genres (genres (slug, name))`)
      .order('rating', { ascending: false })
      .order('rating_count', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Reyting ma'lumotlarini yuklashda xatolik: ${error.message}`);
    }

    const list = (data || []).map(normalizeManga);
    list.forEach(storeInMangaCache);

    return list.map((manga, idx) => {
      const ext = formatExternalRating(manga.slug || manga.id);
      return {
        rank: idx + 1,
        mangaId: manga.id,
        manga,
        score: ext.hasRating ? ext.score : '—',
        metricLabel: ext.hasRating ? `${ext.source} (${ext.members})` : "Baholanmagan",
      };
    });
  }

  return WEEKLY_RANKINGS.map((item, idx) => {
    const ext = formatExternalRating(item.manga?.slug || item.mangaId);
    return {
      rank: idx + 1,
      mangaId: item.mangaId,
      manga: item.manga,
      score: ext.hasRating ? ext.score : `${Number(item.score).toFixed(2)}`,
      metricLabel: ext.hasRating ? `${ext.source} (${ext.members})` : "Baholanmagan",
    };
  });
}

/**
 * Test the database connection by reading manga records through mangaService.
 * @returns {Promise<any>}
 */
export async function testMangaConnection() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      isConfigured: false,
      message: "Supabase muhit o'zgaruvchilari (VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY) kiritilmagan.",
      data: null,
      error: null,
    };
  }

  try {
    const { data, error, count } = await supabase
      .from('mangas')
      .select('id, slug, title, status, rating, chapters_count', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('[mangaService] Supabase connection test query failed:', error);
      return {
        success: false,
        isConfigured: true,
        message: `Supabase bilan ulanishda xatolik: ${error.message}${error.details ? ` (${error.details})` : ''}`,
        code: error.code,
        error: error.message,
        data: null,
      };
    }

    const normalized = (data || []).map(normalizeManga);
    return {
      success: true,
      isConfigured: true,
      message: `Supabase bilan ulanish muvaffaqiyatli o'rnatildi! 'mangas' jadvalidan ${count ?? normalized.length} ta yozuv o'qildi.`,
      count: count ?? normalized.length,
      data: normalized,
      error: null,
    };
  } catch (err) {
    console.error('[mangaService] Unexpected connection test exception:', err);
    return {
      success: false,
      isConfigured: true,
      message: `Supabase bilan ulanishda kutilmagan xatolik: ${err.message}`,
      error: err.message,
      data: null,
    };
  }
}
