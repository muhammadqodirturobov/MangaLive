/**
 * MangaLive.uz — Base Source Adapter Interface
 *
 * Defines the standard contract that all manga/chapter source adapters must implement.
 * Any content source (authorized partner feed, local archive, webhook, or test feed)
 * implements this interface so the ingestion engine remains fully source-agnostic.
 */

export class BaseSourceAdapter {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
  }

  /**
   * Check whether this adapter is enabled and authorized.
   * @returns {Promise<{ enabled: boolean, reason?: string }>}
   */
  async checkStatus() {
    return { enabled: true };
  }

  /**
   * Discover available manga series from the source.
   * @returns {Promise<Array<{ slug: string, title: string, titleEn?: string, author?: string, synopsis?: string, coverUrl?: string, genres?: string[] }>>}
   */
  async discoverManga() {
    throw new Error(`${this.name}: discoverManga() is not implemented`);
  }

  /**
   * Discover chapters for a specific manga series.
   * @param {string} mangaSlug
   * @param {number} [afterChapterNumber] - Incremental sync cursor: only return chapters > this number
   * @returns {Promise<Array<{ chapterNumber: number, title?: string, pageCount?: number, chapterRef: any }>>}
   */
  async discoverChapters(mangaSlug, afterChapterNumber = 0) {
    throw new Error(`${this.name}: discoverChapters() is not implemented`);
  }

  /**
   * Fetch chapter page images.
   * @param {object} params
   * @param {string} params.mangaSlug
   * @param {number} params.chapterNumber
   * @param {any} params.chapterRef
   * @returns {Promise<Array<{ pageNumber: number, filename: string, buffer: Buffer, contentType: string }>>}
   */
  async fetchChapterPages(params) {
    throw new Error(`${this.name}: fetchChapterPages() is not implemented`);
  }
}
