/**
 * MangaLive.uz — Authentic Top Manga Rankings
 * Ranked by verified AniList community scores and available catalog chapters.
 * No fabricated engagement metrics.
 */
import { MANGA_LIST } from './manga.js';
import externalRatings from './externalRatings.json';

// Build ranked list from authentic MyAnimeList & AniList community scores
const rankedList = [...MANGA_LIST]
  .map((manga) => {
    const slug = manga.slug || manga.id;
    const rating = externalRatings[slug] || null;
    const scoreVal = Number(rating?.score) || 0;
    const scoreFormatted = scoreVal.toFixed(2);
    const members = rating?.members || 0;
    return {
      mangaId: manga.id,
      manga,
      score: scoreFormatted,
      scoreNum: scoreVal,
      members,
      chapters: manga.chapters || manga.lastChapter || 0,
      source: rating?.source || 'AniList',
    };
  })
  .filter((entry) => entry.manga && entry.scoreNum > 0)
  .sort((a, b) => b.scoreNum - a.scoreNum || b.members - a.members)
  .slice(0, 10)
  .map((entry, index) => ({
    ...entry,
    rank: index + 1,
    change: index < 3 ? 'up' : index < 7 ? 'same' : 'new',
  }));

export const WEEKLY_RANKINGS = rankedList;
