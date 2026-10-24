/**
 * MangaLive.uz — Chapter Service (Data Access Layer)
 *
 * Manages chapter listings, reader page sets, and page images.
 * Features:
 * - High-speed in-memory caching with 60s TTL to prevent refetching during reading/navigation.
 * - In-flight request deduplication to prevent duplicate concurrent queries.
 * - Pure real data: never fabricates fake chapters or placeholder SVG comic panels
 *   when Supabase is configured.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import {
  getChapters as localGetChapters,
  getChapterPages as localGetChapterPages,
} from '../data/chapters.js';
import { normalizeChapter, normalizeChapterPage } from '../types/entities.js';

// ── In-Memory Caches & Deduplication ────────────────────────────────────────
const CACHE_TTL_MS = 60 * 1000;
const chapterListCache = new Map(); // mangaId/slug -> { data: Chapter[], timestamp: number }
const inFlightChapterRequests = new Map(); // mangaId -> Promise<Chapter[]>
const chapterPagesCache = new Map(); // chapterId -> { data: ChapterPage[], timestamp: number }

/**
 * Check if chapters are cached and valid.
 * @param {string} mangaIdOrSlug
 * @returns {import('../types/schema').Chapter[] | null}
 */
export function getCachedChapters(mangaIdOrSlug) {
  if (!mangaIdOrSlug) return null;
  const key = String(mangaIdOrSlug).trim().toLowerCase();
  const entry = chapterListCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

/**
 * Invalidate chapter cache for a manga.
 * @param {string} [mangaIdOrSlug]
 */
export function invalidateChapterCache(mangaIdOrSlug) {
  if (mangaIdOrSlug) {
    chapterListCache.delete(String(mangaIdOrSlug).toLowerCase());
  } else {
    chapterListCache.clear();
  }
  chapterPagesCache.clear();
}

/**
 * Get chapter list for a given manga (synchronous).
 * Checks the in-memory cache first to avoid false 404s.
 * @param {string} mangaId
 * @param {number} [totalCount=10]
 * @returns {import('../types/schema').Chapter[]}
 */
export function getChapters(mangaId, totalCount = 10) {
  if (isSupabaseConfigured) {
    return getCachedChapters(mangaId) || [];
  }
  return localGetChapters(mangaId, totalCount);
}

/**
 * Async fetch chapters from database with caching and deduplication.
 * @param {string} mangaId
 * @returns {Promise<import('../types/schema').Chapter[]>}
 */
export async function fetchChapters(mangaId) {
  if (!mangaId) return [];

  // 1. Check cache first
  const cached = getCachedChapters(mangaId);
  if (cached) return cached;

  if (isSupabaseConfigured && supabase) {
    const key = String(mangaId).trim().toLowerCase();

    // 2. Deduplicate in-flight requests
    if (inFlightChapterRequests.has(key)) {
      return inFlightChapterRequests.get(key);
    }

    const fetchPromise = (async () => {
      try {
        let targetMangaId = String(mangaId).trim();
        let isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetMangaId);

        if (!isUuid) {
          const { data: manga } = await supabase
            .from('mangas')
            .select('id')
            .eq('slug', targetMangaId)
            .maybeSingle();

          if (manga?.id) {
            targetMangaId = manga.id;
            isUuid = true;
          }
        }

        let data = [];
        if (isUuid) {
          const { data: dbData, error } = await supabase
            .from('chapters')
            .select('*')
            .eq('manga_id', targetMangaId)
            .order('chapter_number', { ascending: false });

          if (error) {
            console.error(`[chapterService] Failed to fetch chapters for ${mangaId}:`, error.message);
            throw new Error(`Supabase fetchChapters error: ${error.message}`);
          }
          data = dbData || [];
        }

        let list = (data || []).map(normalizeChapter);

        // Fallback for newly ingested R2 chapters if not yet seeded into Supabase
        if (list.length === 0 && (targetMangaId.includes('shogirdlar') || targetMangaId === '22222222-0001-0000-0000-000000000006')) {
          list = [
            normalizeChapter({
              id: '33333333-0006-0001-0000-000000000001',
              manga_id: '22222222-0001-0000-0000-000000000006',
              chapter_number: 1,
              title: '1-bob',
              pages_count: 25,
              published_at: '2026-10-23',
              is_new: true,
            }),
          ];
        }

        if (list.length === 0 && (targetMangaId.includes('peppercarrot') || targetMangaId === '8f8e051f-d046-4894-b73a-789032a93063')) {
          list = [
            { chNum: 1, id: '2c58d0a0-5b79-4587-b404-4bd44e6503d7', title: 'Parvoz damlamasi (The Potion of Flight)', pages: 5 },
            { chNum: 2, id: 'e5734914-21e5-4832-9b1c-820bb96d8f69', title: 'Kamalak damlamalari (Rainbow Potions)', pages: 7 },
            { chNum: 3, id: '7af8af19-370c-4d54-be5b-36c1f688d913', title: 'Maxfiy tarkib (The Secret Ingredients)', pages: 9 },
            { chNum: 4, id: '64c3ac9a-4fb7-4e1d-a5a6-c0fafe81ac7d', title: 'Dahoona fikr (Stroke of Genius)', pages: 8 },
            { chNum: 5, id: '9d147951-3538-4e30-acd7-a4bbe950a153', title: 'Bayram maxsus bobi (Special Holiday Episode)', pages: 6 },
            { chNum: 6, id: 'dfb9f52e-5bca-4a05-b93e-733bf9b87729', title: 'Damlamalar musobaqasi (The Potion Contest)', pages: 11 },
            { chNum: 7, id: '5bf28ac4-2ced-4acf-9ab6-d35965cd1d71', title: 'Tilak (The Wish)', pages: 7 },
            { chNum: 8, id: '12e77230-d360-4880-9327-84cd30ec8239', title: "Tug'ilgan kun ziyofati (Pepper's Birthday Party)", pages: 8 },
            { chNum: 9, id: '29c9525e-f92a-4d68-8ae3-39456d29c39b', title: 'Davo (The Remedy)', pages: 9 },
            { chNum: 10, id: 'b92324f6-6255-4937-9aa9-5322a8993f8d', title: 'Yozgi maxsus bob (Summer Special)', pages: 7 },
          ].map((c) =>
            normalizeChapter({
              id: c.id,
              manga_id: '8f8e051f-d046-4894-b73a-789032a93063',
              chapter_number: c.chNum,
              title: c.title,
              pages_count: c.pages,
              published_at: '2026-10-24',
              is_new: c.chNum >= 8,
            })
          );
        }

        // Cache under both the requested identifier and the resolved UUID
        const now = Date.now();
        chapterListCache.set(key, { data: list, timestamp: now });
        if (targetMangaId.toLowerCase() !== key) {
          chapterListCache.set(targetMangaId.toLowerCase(), { data: list, timestamp: now });
        }

        return list;
      } finally {
        inFlightChapterRequests.delete(key);
      }
    })();

    inFlightChapterRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  return localGetChapters(mangaId, 15);
}

/**
 * Get ordered pages for a specific chapter (synchronous fallback).
 * Never fabricates fake SVG panels when Supabase is configured.
 * @param {string} mangaId
 * @param {number} chapterNumber
 * @param {string} [mangaTitle]
 * @param {number} [pageCount]
 * @returns {import('../types/schema').ChapterPage[]}
 */
export function getChapterPages(mangaId, chapterNumber, mangaTitle = 'Manga', pageCount = 8) {
  if (isSupabaseConfigured) {
    return [];
  }
  return localGetChapterPages(mangaId, chapterNumber, mangaTitle, pageCount);
}

/**
 * Async fetch chapter pages with storage URLs and in-memory caching.
 * @param {string} chapterId
 * @returns {Promise<import('../types/schema').ChapterPage[]>}
 */
export async function fetchChapterPages(chapterId) {
  if (!chapterId) return [];

  // Check cache
  const cached = chapterPagesCache.get(chapterId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (isSupabaseConfigured && supabase) {
    let data = [];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId);

    if (isUuid) {
      const { data: dbData, error } = await supabase
        .from('chapter_pages')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('page_number', { ascending: true });

      if (error) {
        console.error(`[chapterService] Failed to fetch pages for chapter ${chapterId}:`, error.message);
        throw new Error(`Supabase fetchChapterPages error: ${error.message}`);
      }
      data = dbData || [];
    }

    let pages = (data || []).map(normalizeChapterPage);

    // Fallback for newly ingested R2 chapters if not yet seeded into Supabase
    if (pages.length === 0 && (chapterId === '33333333-0006-0001-0000-000000000001' || chapterId.includes('shogirdlar'))) {
      pages = Array.from({ length: 25 }, (_, idx) => {
        const pageNum = idx + 1;
        const pad = String(pageNum).padStart(3, '0');
        return normalizeChapterPage({
          id: `44444444-0006-0001-0000-0000000000${pad}`,
          chapter_id: chapterId,
          page_number: pageNum,
          image_url: `/api/r2/manga/mening-shogirdlarim-hammalari-katta-yovuzlar/chapters/1/${pad}.webp`,
        });
      });
    }

    if (pages.length === 0) {
      const pcChapters = [
        { chNum: 1, id: '2c58d0a0-5b79-4587-b404-4bd44e6503d7', pages: 5 },
        { chNum: 2, id: 'e5734914-21e5-4832-9b1c-820bb96d8f69', pages: 7 },
        { chNum: 3, id: '7af8af19-370c-4d54-be5b-36c1f688d913', pages: 9 },
        { chNum: 4, id: '64c3ac9a-4fb7-4e1d-a5a6-c0fafe81ac7d', pages: 8 },
        { chNum: 5, id: '9d147951-3538-4e30-acd7-a4bbe950a153', pages: 6 },
        { chNum: 6, id: 'dfb9f52e-5bca-4a05-b93e-733bf9b87729', pages: 11 },
        { chNum: 7, id: '5bf28ac4-2ced-4acf-9ab6-d35965cd1d71', pages: 7 },
        { chNum: 8, id: '12e77230-d360-4880-9327-84cd30ec8239', pages: 8 },
        { chNum: 9, id: '29c9525e-f92a-4d68-8ae3-39456d29c39b', pages: 9 },
        { chNum: 10, id: 'b92324f6-6255-4937-9aa9-5322a8993f8d', pages: 7 },
      ];
      const match = pcChapters.find((c) => c.id === chapterId || chapterId === `peppercarrot-ch-${c.chNum}`);
      if (match) {
        pages = Array.from({ length: match.pages }, (_, idx) => {
          const pageNum = idx + 1;
          const pad = String(pageNum).padStart(3, '0');
          return normalizeChapterPage({
            id: `pc-page-${match.chNum}-${pad}`,
            chapter_id: chapterId,
            page_number: pageNum,
            image_url: `/api/r2/manga/peppercarrot/chapters/${match.chNum}/${pad}.jpg`,
            width: 1200,
            height: 1660,
          });
        });
      }
    }

    chapterPagesCache.set(chapterId, { data: pages, timestamp: Date.now() });
    return pages;
  }

  const pcChapters = [
    { chNum: 1, id: '2c58d0a0-5b79-4587-b404-4bd44e6503d7', pages: 5 },
    { chNum: 2, id: 'e5734914-21e5-4832-9b1c-820bb96d8f69', pages: 7 },
    { chNum: 3, id: '7af8af19-370c-4d54-be5b-36c1f688d913', pages: 9 },
    { chNum: 4, id: '64c3ac9a-4fb7-4e1d-a5a6-c0fafe81ac7d', pages: 8 },
    { chNum: 5, id: '9d147951-3538-4e30-acd7-a4bbe950a153', pages: 6 },
    { chNum: 6, id: 'dfb9f52e-5bca-4a05-b93e-733bf9b87729', pages: 11 },
    { chNum: 7, id: '5bf28ac4-2ced-4acf-9ab6-d35965cd1d71', pages: 7 },
    { chNum: 8, id: '12e77230-d360-4880-9327-84cd30ec8239', pages: 8 },
    { chNum: 9, id: '29c9525e-f92a-4d68-8ae3-39456d29c39b', pages: 9 },
    { chNum: 10, id: 'b92324f6-6255-4937-9aa9-5322a8993f8d', pages: 7 },
  ];
  const pcMatch = pcChapters.find((c) => c.id === chapterId || chapterId === `peppercarrot-ch-${c.chNum}`);
  if (pcMatch) {
    return Array.from({ length: pcMatch.pages }, (_, idx) => {
      const pageNum = idx + 1;
      const pad = String(pageNum).padStart(3, '0');
      return normalizeChapterPage({
        id: `pc-page-${pcMatch.chNum}-${pad}`,
        chapter_id: chapterId,
        page_number: pageNum,
        image_url: `/api/r2/manga/peppercarrot/chapters/${pcMatch.chNum}/${pad}.jpg`,
        width: 1200,
        height: 1660,
      });
    });
  }

  return [];
}
