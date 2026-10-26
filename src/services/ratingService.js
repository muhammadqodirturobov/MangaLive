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
 * Example: "AniList 8.5/10 · 47.6K a'zo" or "Baholanmagan"
 * @param {string|object} slugOrManga
 * @returns {{ badge: string, score: string, members: string, hasRating: boolean, source: string, url?: string }}
 */
export function formatExternalRating(slugOrManga) {
  const rating = getExternalRating(slugOrManga);
  if (!rating || !rating.score) {
    return {
      badge: "Baholanmagan",
      score: "—",
      members: "",
      hasRating: false,
      source: "AniList",
    };
  }

  const memberFormatted =
    rating.members >= 1000000
      ? `${(rating.members / 1000000).toFixed(1)}M`
      : rating.members >= 1000
      ? `${(rating.members / 1000).toFixed(1)}K`
      : `${rating.members}`;

  return {
    badge: `${rating.source} ${rating.score}/10`,
    score: `${rating.score}`,
    members: `${memberFormatted} a'zo`,
    hasRating: true,
    source: rating.source,
    url: rating.url,
  };
}
