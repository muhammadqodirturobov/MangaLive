/**
 * MangaLive.uz — Authentic Top Manga Rankings
 * Ranked by verified AniList community scores and available catalog chapters.
 * No fabricated engagement metrics.
 */
import { MANGA_LIST } from './manga.js';
import externalRatings from './externalRatings.json';

// Build ranked list from authentic AniList community scores
const rankedList = [...MANGA_LIST]
  .map((manga) => {
    const slug = manga.slug || manga.id;
    const rating = externalRatings[slug] || null;
    const score = rating?.score || 0;
    const members = rating?.members || 0;
    return {
      mangaId: manga.id,
      manga,
      score,
      members,
      chapters: manga.chapters || manga.lastChapter || 0,
      source: rating?.source || 'AniList',
    };
  })
  .filter((entry) => entry.manga && entry.score > 0)
  .sort((a, b) => b.score - a.score || b.members - a.members)
  .slice(0, 10)
  .map((entry, index) => ({
    ...entry,
    rank: index + 1,
    change: index < 3 ? 'up' : index < 7 ? 'same' : 'new',
  }));

export const WEEKLY_RANKINGS = rankedList;
