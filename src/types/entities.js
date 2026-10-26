import externalRatingsData from '../data/externalRatings.json';

/**
 * MangaLive.uz — Entity Normalizers & JSDoc Models
 *
 * Provides bidirectional normalization between Supabase snake_case rows
 * and frontend camelCase data contracts.
 */

/**
 * Normalizes a database row or local object into standard Manga contract.
 * @param {object} raw
 * @returns {import('./schema').Manga}
 */
export function normalizeManga(raw) {
  if (!raw) return null;

  // Extract genre slugs from either direct array or Supabase junction relation
  let genres = [];
  if (Array.isArray(raw.genres)) {
    genres = raw.genres;
  } else if (Array.isArray(raw.manga_genres)) {
    genres = raw.manga_genres.map((mg) => mg.genres?.slug || mg.genre_id).filter(Boolean);
  }

  // Detect whether raw.id or raw.uuid is a real UUID
  const isUuidPattern = (val) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

  const realUuid = isUuidPattern(raw.id)
    ? raw.id.trim()
    : isUuidPattern(raw.uuid)
    ? raw.uuid.trim()
    : isUuidPattern(raw.db_id)
    ? raw.db_id.trim()
    : isUuidPattern(raw.dbId)
    ? raw.dbId.trim()
    : null;

  const realSlug = (raw.slug || (!isUuidPattern(raw.id) ? raw.id : '') || '').trim().toLowerCase();

  // Primary identifier: Database UUID takes precedence when available, fallback to slug for demo data
  const primaryId = realUuid || realSlug;

  // Resolve canonical AniList /10 rating
  const ext = externalRatingsData[realSlug] || (realUuid ? externalRatingsData[realUuid] : null);
  const canonicalRating10 = ext && ext.score
    ? Number(ext.score)
    : raw.rating > 0
    ? (raw.rating <= 5.0 ? Math.round(Number(raw.rating) * 20) / 10 : Number(raw.rating))
    : 0;

  const ratingCount = ext && ext.members
    ? Number(ext.members)
    : Number(raw.rating_count ?? raw.ratingCount ?? 0);

  // Chapter counts: distinguish available chapters to read on MangaLive
  const availableChapters = Number(raw.chapters_count ?? raw.chapters ?? 0);
  const lastChapter = Number(raw.last_chapter_number ?? raw.lastChapter ?? availableChapters ?? 1);

  return {
    id: primaryId,
    uuid: realUuid,
    dbId: realUuid,
    slug: realSlug || primaryId,
    title: raw.title || '',
    titleEn: raw.title_en || raw.titleEn || '',
    author: raw.author || 'Noma\'lum',
    type: raw.type || 'manga',
    status: raw.status || 'davom etmoqda',
    rating: canonicalRating10,
    ratingScale: 10,
    ratingCount,
    hasRating: Boolean(canonicalRating10 > 0),
    ratingSource: ext?.source || 'AniList',
    chapters: availableChapters,
    availableChapters,
    views: Number(raw.views_count ?? raw.views ?? 0),
    genres,
    coverImage: raw.cover_url || raw.coverImage || '',
    bannerImage: raw.banner_url || raw.bannerImage || '',
    coverColor: raw.coverColor || [raw.cover_color_start || '#0d001a', raw.cover_color_end || '#2d004d'],
    coverAccent: raw.cover_accent || raw.coverAccent || '#c084fc',
    synopsis: raw.synopsis || '',
    featuredTagline: raw.featured_tagline || raw.featuredTagline || '',
    isFeatured: Boolean(raw.is_featured ?? raw.isFeatured),
    isPopular: Boolean(raw.is_popular ?? raw.isPopular),
    isNew: Boolean(raw.is_new ?? raw.isNew),
    lastChapter,
    lastUpdated: raw.last_updated_at ? new Date(raw.last_updated_at).toISOString().split('T')[0] : (raw.lastUpdated || ''),
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

/**
 * Normalizes a database row or local chapter object.
 * @param {object} raw
 * @returns {import('./schema').Chapter}
 */
export function normalizeChapter(raw) {
  if (!raw) return null;
  return {
    id: String(raw.id),
    mangaId: raw.manga_id || raw.mangaId,
    number: Number(raw.chapter_number ?? raw.number ?? 1),
    title: raw.title || `${raw.chapter_number || raw.number}-bob`,
    pageCount: Number(raw.pages_count ?? raw.pageCount ?? 8),
    viewsCount: Number(raw.views_count ?? raw.viewsCount ?? 0),
    publishedAt: raw.published_at
      ? new Date(raw.published_at).toISOString().split('T')[0]
      : (raw.publishedAt || ''),
    isNew: Boolean(raw.is_new ?? raw.isNew),
  };
}

/**
 * Normalizes a database row or local chapter page object.
 * @param {object} raw
 * @returns {import('./schema').ChapterPage}
 */
export function normalizeChapterPage(raw) {
  if (!raw) return null;
  const url = raw.image_url || raw.imageUrl || raw.src || '';
  return {
    id: String(raw.id || raw.page_number || raw.pageNumber || Math.random()),
    chapterId: raw.chapter_id || raw.chapterId,
    pageNumber: Number(raw.page_number ?? raw.pageNumber ?? 1),
    src: url,
    imageUrl: url,
    image_url: url,
    alt: raw.alt || `Sahifa ${raw.page_number ?? raw.pageNumber ?? 1}`,
    width: raw.width,
    height: raw.height,
  };
}
