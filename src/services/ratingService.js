import externalRatingsData from '../data/externalRatings.json';

/**
 * Get the verified external rating for a manga by slug, id, or manga object.
 * @param {string|object} slugOrManga
 * @returns {{ source: string, externalId: number, title: string, score: number, scale: number, members: number, url: string, syncedAt: string } | null}
 */
export function getExternalRating(slugOrManga) {
  if (!slugOrManga) return null;
  const key = typeof slugOrManga === 'object'
    ? (slugOrManga.slug || slugOrManga.id || '')
    : String(slugOrManga);

  const cleanKey = String(key).toLowerCase().trim();
  return externalRatingsData[cleanKey] || null;
}

/**
 * Format rating for consistent, authentic display.
 * Compact format for outer pages (Homepage, cards, carousels, rankings): "8.76" (omit /10)
 * Detailed format for inner detail page: "8.76/10" with source (MyAnimeList/AniList) and voter count.
 *
 * @param {string|object} slugOrManga
 * @returns {{
 *   badge: string,
 *   score: string,
 *   compactScore: string,
 *   detailScore: string,
 *   members: string,
 *   rawMembers: number,
 *   hasRating: boolean,
 *   source: string,
 *   url?: string
 * }}
 */
export function formatExternalRating(slugOrManga) {
  const rating = getExternalRating(slugOrManga);
  if (!rating || rating.score == null) {
    return {
      badge: "Baholanmagan",
      score: "—",
      compactScore: "—",
      detailScore: "—",
      members: "",
      rawMembers: 0,
      hasRating: false,
      source: "AniList",
      url: null,
    };
  }

  const numScore = Number(rating.score);
  const formattedScore = isNaN(numScore) ? "—" : numScore.toFixed(2);

  const memberFormatted =
    rating.members >= 1000000
      ? `${(rating.members / 1000000).toFixed(1)}M`
      : rating.members >= 1000
      ? `${(rating.members / 1000).toFixed(1)}K`
      : `${rating.members || 0}`;

  return {
    badge: `${formattedScore}/10`,
    score: formattedScore,
    compactScore: formattedScore,
    detailScore: `${formattedScore}/10`,
    members: memberFormatted,
    rawMembers: rating.members || 0,
    hasRating: true,
    source: rating.source || "AniList",
    url: rating.url,
  };
}
