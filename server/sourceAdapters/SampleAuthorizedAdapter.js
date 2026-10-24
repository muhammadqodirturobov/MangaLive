import { BaseSourceAdapter } from './BaseSourceAdapter.js';

// Clean authorized 1x1 / sample WebP comic panel buffers for verification
const SAMPLE_WEBP_PANEL = Buffer.from(
  'UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AAA/v5mgAAA',
  'base64'
);

/**
 * MangaLive.uz — Sample Authorized Test Adapter
 *
 * Provides a safe, authorized content source using non-copyrighted test comic panels.
 * Used for automated verification of R2 uploads, page ordering, Supabase schema persistence,
 * and reader rendering without copyright risk.
 */
export class SampleAuthorizedAdapter extends BaseSourceAdapter {
  constructor(options = {}) {
    super('SampleAuthorizedAdapter', options);
  }

  async checkStatus() {
    return { enabled: true, testMode: true };
  }

  async discoverManga() {
    return [
      {
        slug: 'yolg-izlikda-daraja-ko-tarish',
        title: "Yolg'izlikda daraja ko'tarish",
        titleEn: 'Solo Leveling (Authorized Test Sample)',
      },
    ];
  }

  async discoverChapters(mangaSlug, afterChapterNumber = 0) {
    // Offer test Chapter 998 and 999 for testing
    const testChapters = [
      { chapterNumber: 998, title: '998-bob (Test Ingestion 1)', pageCount: 3 },
      { chapterNumber: 999, title: '999-bob (Test Ingestion 2)', pageCount: 3 },
    ];

    return testChapters.filter((c) => c.chapterNumber > afterChapterNumber);
  }

  async fetchChapterPages({ chapterNumber }) {
    const pageCount = 3;
    const pages = [];

    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        pageNumber: i,
        filename: `${String(i).padStart(3, '0')}.webp`,
        buffer: SAMPLE_WEBP_PANEL,
        contentType: 'image/webp',
      });
    }

    return pages;
  }
}
