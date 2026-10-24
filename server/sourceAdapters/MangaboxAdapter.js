import { BaseSourceAdapter } from './BaseSourceAdapter.js';

/**
 * MangaLive.uz — Mangabox Source Adapter Stub
 *
 * STATUS: DISABLED.
 * Mangabox does not currently provide a documented, public, or authorized partner API/feed.
 * In accordance with project policy:
 * - We do NOT bypass authentication, anti-bot mechanisms (Cloudflare WAF), or paywalls.
 * - We do NOT redistribute content without permission.
 *
 * This adapter stub is ready to activate as soon as authorized partner credentials
 * (MANGABOX_API_KEY / MANGABOX_PARTNER_SECRET) or an authorized export feed are supplied.
 */
export class MangaboxAdapter extends BaseSourceAdapter {
  constructor(options = {}) {
    super('MangaboxAdapter', options);
  }

  async checkStatus() {
    const hasApiKey = Boolean(process.env.MANGABOX_API_KEY);
    return {
      enabled: false, // Explicitly disabled
      hasCredentials: hasApiKey,
      reason:
        'Mangabox.uz integration is currently disabled. An authorized partner API key, webhook agreement, or official export feed is required from the Mangabox team before content ingestion can be enabled.',
    };
  }

  async discoverManga() {
    throw new Error(
      'MangaboxAdapter is disabled: no authorized partner API or export feed is available.'
    );
  }

  async discoverChapters() {
    throw new Error(
      'MangaboxAdapter is disabled: no authorized partner API or export feed is available.'
    );
  }

  async fetchChapterPages() {
    throw new Error(
      'MangaboxAdapter is disabled: no authorized partner API or export feed is available.'
    );
  }
}
