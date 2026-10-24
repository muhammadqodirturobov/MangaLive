/**
 * MangaLive.uz — Weekly Rankings Data
 * Illustrative data. Sorted by a fictional "weekly views" metric.
 * Replace with real API data when backend is available.
 */
import { MANGA_LIST } from './manga.js';

export const WEEKLY_RANKINGS = [
  { mangaId: 'solo-leveling-ragnarok',                     weeklyViews: 45200, rank: 1, change: 'up'   },
  { mangaId: 'nano-mashina',                              weeklyViews: 38400, rank: 2, change: 'up'   },
  { mangaId: '10-000-yil-keyingi-dunyoda-darajani-oshirish', weeklyViews: 31200, rank: 3, change: 'same' },
  { mangaId: '4000-yildan-song-qaytib-kelgan-arximag',    weeklyViews: 28900, rank: 4, change: 'same' },
  { mangaId: '66-666-yildan-song-qora-sehrgarning-qaytishi', weeklyViews: 24700, rank: 5, change: 'down' },
  { mangaId: 'mening-shogirdlarim-hammalari-katta-yovuzlar', weeklyViews: 22100, rank: 6, change: 'up'   },
  { mangaId: '1hp-klubi-qayta-boshlanish',                 weeklyViews: 19800, rank: 7, change: 'new'  },
]
  .map((entry) => ({
    ...entry,
    manga: MANGA_LIST.find((m) => m.id === entry.mangaId || m.slug === entry.mangaId),
  }))
  .filter((entry) => entry.manga);

