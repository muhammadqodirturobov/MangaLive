/**
 * MangaLive.uz — Data Model & Schema Definitions
 *
 * Defines canonical data contracts for entities consumed by the UI.
 * Standardizes mapping between Supabase snake_case SQL tables
 * and frontend camelCase models.
 */

export type MangaType = 'manga' | 'manhwa' | 'manhua' | 'komiks';

export type MangaStatus = 'davom etmoqda' | 'tugallangan' | 'pauza';

export interface Genre {
  id?: string;
  slug: string;
  name: string;
  icon?: string;
  description?: string;
  count?: number;
}

export interface Manga {
  id: string; // URL slug or UUID
  slug?: string;
  title: string;
  titleEn?: string;
  author: string;
  type: MangaType;
  status: MangaStatus;
  rating: number;
  ratingCount: number;
  chapters: number; // total chapter count
  views: number;
  genres: string[]; // array of genre slugs or names
  coverImage: string;
  bannerImage?: string;
  coverColor?: string[];
  coverAccent?: string;
  synopsis: string;
  featuredTagline?: string;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  lastChapter: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  pageCount: number;
  viewsCount?: number;
  publishedAt: string;
  isNew?: boolean;
}

export interface ChapterPage {
  id: string;
  chapterId?: string;
  pageNumber: number;
  src: string; // CDN/Storage public URL
  alt?: string;
  width?: number;
  height?: number;
}

export interface UserFavorite {
  id?: string;
  userId: string;
  mangaId: string;
  createdAt: string;
  manga?: Manga;
}

export interface UserReadingHistory {
  id?: string;
  userId?: string;
  mangaId: string;
  mangaTitle?: string;
  chapterNumber: number;
  lastPageNumber?: number;
  scrollProgress?: number; // 0 to 100 percent
  timestamp: number | string;
  manga?: Manga;
}

export interface WeeklyRanking {
  mangaId: string;
  weeklyViews: number;
  rank: number;
  change: 'up' | 'down' | 'same' | 'new';
  manga?: Manga;
}

export interface MangaFilterOptions {
  query?: string;
  genre?: string;
  type?: string;
  status?: string;
  minRating?: number | string;
  sort?: 'reyting' | 'mashhur' | 'yangilangan' | 'korishlar';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
