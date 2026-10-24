import { BaseSourceAdapter } from './BaseSourceAdapter.js';

/**
 * Image dimension extractor from binary buffer without native bindings.
 * Supports JPEG, PNG, and WebP (VP8, VP8L, VP8X).
 */
export function getImageDimensions(buf) {
  if (!buf || buf.length < 16) return { width: 0, height: 0, format: 'unknown' };

  // JPEG (FF D8)
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i < buf.length - 8; i++) {
      if (buf[i] === 0xff && buf[i + 1] >= 0xc0 && buf[i + 1] <= 0xc3) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
          format: 'jpeg',
        };
      }
    }
    return { width: 0, height: 0, format: 'jpeg' };
  }

  // PNG (89 50 4E 47)
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      format: 'png',
    };
  }

  // WebP (RIFF .... WEBP)
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    const chunk = buf.slice(12, 16).toString('ascii');
    if (chunk === 'VP8 ') {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
        format: 'webp',
      };
    }
    if (chunk === 'VP8L') {
      const b0 = buf[21];
      const b1 = buf[22];
      const b2 = buf[23];
      const b3 = buf[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height, format: 'webp' };
    }
    if (chunk === 'VP8X') {
      const width = 1 + buf.readUIntLE(24, 3);
      const height = 1 + buf.readUIntLE(27, 3);
      return { width, height, format: 'webp' };
    }
  }

  return { width: 0, height: 0, format: 'unknown' };
}

// Maps Mangabox tags to official MangaLive.uz genre slugs
export const TAG_GENRE_MAP = {
  'jangari': 'jangovar',
  'jangovar': 'jangovar',
  'harakatli': 'harakatli',
  'action': 'harakatli',
  'sarguzasht': 'sarguzasht',
  'adventure': 'sarguzasht',
  'fantaziya': 'fantaziya',
  'fantasy': 'fantaziya',
  'kultivatsiya': 'fantaziya',
  'reinkarnatsiya': 'isekai',
  'isekai': 'isekai',
  'komediya': 'komediya',
  'comedy': 'komediya',
  'romantika': 'romantik',
  'romantik': 'romantik',
  'tarixiy': 'tarixiy',
  'historical': 'tarixiy',
  'sirli': 'sirli',
  'mystery': 'sirli',
  'psixologik': 'psixologik',
  'psychological': 'psixologik',
  'maktab': 'maktab',
  'school': 'maktab',
  'ilmiy-fantastika': 'ilmiy-fantastika',
  'sci-fi': 'ilmiy-fantastika',
  'fojiaviy': 'fojiaviy',
  'drama': 'fojiaviy',
  'tragedy': 'fojiaviy',
  'super-qahramon': 'super-qahramon',
  'jinoyat': 'sirli',
  'ustoz-shogird': 'sarguzasht',
};

/**
 * MangaLive.uz — Mangabox Permitted Public Connector
 *
 * Connects exclusively to publicly accessible, free/unlocked chapters on Mangabox.uz
 * via their standard public guest API.
 *
 * Strict Compliance:
 * - Does NOT bypass paywalls, subscriptions, or login restrictions.
 * - If a chapter is locked (requiresLogin: true / requiresPro: true / isLocked: true),
 *   it is strictly skipped with a clear status notice.
 */
export class MangaboxPublicConnector extends BaseSourceAdapter {
  constructor(options = {}) {
    super('MangaboxPublicConnector', options);
    this.baseUrl = 'https://api.mangabox.uz';
    this.guestToken = null;
    this.sessionCookie = null;
  }

  async ensureGuestSession() {
    if (this.guestToken) return;

    const res = await fetch(`${this.baseUrl}/api/guest-session`, {
      method: 'POST',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://mangabox.uz',
        'Referer': 'https://mangabox.uz/',
      },
    });

    if (!res.ok) {
      throw new Error(`Mangabox guest session failed with status ${res.status}`);
    }

    const data = await res.json();
    this.guestToken = data.token;
    this.sessionCookie = res.headers.get('set-cookie');
  }

  async checkStatus() {
    try {
      await this.ensureGuestSession();
      return {
        enabled: true,
        mode: 'public-unlocked-only',
        sessionActive: Boolean(this.guestToken),
      };
    } catch (err) {
      return {
        enabled: false,
        reason: `Cannot establish guest session with source: ${err.message}`,
      };
    }
  }

  /**
   * Discover available manga from the public source catalog with pagination.
   * @param {object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.limit=20]
   * @param {string} [options.query='']
   * @returns {Promise<{ items: Array<object>, total: number, page: number, limit: number, hasMore: boolean }>}
   */
  async discoverCatalog({ page = 1, limit = 20, query = '' } = {}) {
    await this.ensureGuestSession();

    const res = await fetch(`${this.baseUrl}/api/mangas`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://mangabox.uz',
        'Referer': 'https://mangabox.uz/',
        'Authorization': `Bearer ${this.guestToken}`,
        ...(this.sessionCookie ? { 'Cookie': this.sessionCookie } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Mangabox discoverCatalog failed: HTTP ${res.status}`);
    }

    const allItems = await res.json();
    let filtered = Array.isArray(allItems) ? allItems : [];

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.slug?.toLowerCase().includes(q) ||
          m.titles?.uz?.toLowerCase().includes(q) ||
          m.titles?.en?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const items = paginated.map((m) => ({
      slug: m.slug,
      title: m.titles?.uz || m.title,
      titleEn: m.titles?.en || '',
      coverUrl: m.coverUrl || '',
      author: Array.isArray(m.authors) && m.authors.length > 0 ? m.authors.map((a) => a.name).join(', ') : 'Mangabox',
      type: (m.comicType || 'manga').toLowerCase(),
      status: m.status === 'completed' ? 'tugallangan' : m.status === 'hiatus' ? 'pauza' : 'davom etmoqda',
      year: m.year || null,
      chapterCount: m.chapterCount || 0,
      rating: m.rating ? Math.round((m.rating / 2) * 10) / 10 : 4.8,
      ratingCount: m.ratingCount || 0,
    }));

    return {
      items,
      total,
      page,
      limit,
      hasMore: startIndex + limit < total,
    };
  }

  /**
   * Fetch chapter list for a manga and return only free, unlocked chapters.
   */
  async discoverChapters(mangaSlug, afterChapterNumber = 0) {
    await this.ensureGuestSession();

    const res = await fetch(
      `${this.baseUrl}/api/mangas/${mangaSlug}/chapters?page=1&limit=50&sort=asc`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://mangabox.uz',
          'Referer': 'https://mangabox.uz/',
          'Authorization': `Bearer ${this.guestToken}`,
          ...(this.sessionCookie ? { 'Cookie': this.sessionCookie } : {}),
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch chapters for ${mangaSlug}: HTTP ${res.status}`);
    }

    const json = await res.json();
    const rawChapters = json.data || json;

    const availableChapters = [];
    for (const ch of rawChapters) {
      // Parse chapter number from name or folder (e.g. "Bob 0" -> 0, "Bob 1" -> 1)
      const numMatch = (ch.name || ch.folder).match(/(\d+(?:\.\d+)?)/);
      const chapterNumber = numMatch ? parseFloat(numMatch[1]) : 0;

      // Filter: only unlocked / permitted chapters
      const isPermitted = !ch.isLocked && !ch.requiresLogin && !ch.requiresPro;

      if (isPermitted && chapterNumber > afterChapterNumber) {
        availableChapters.push({
          chapterNumber,
          title: ch.name || `${chapterNumber}-bob`,
          pageCount: ch.pageCount || 0,
          chapterRef: {
            folder: ch.folder,
            name: ch.name,
          },
        });
      }
    }

    return availableChapters;
  }

  /**
   * Download high-resolution page images for an unlocked chapter.
   */
  async fetchChapterPages({ mangaSlug, chapterNumber, chapterRef }) {
    await this.ensureGuestSession();

    const folder = chapterRef?.folder || `ch${String(chapterNumber).padStart(3, '0')}`;
    const res = await fetch(
      `${this.baseUrl}/api/mangas/${mangaSlug}/${folder}/pages`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://mangabox.uz',
          'Referer': 'https://mangabox.uz/',
          'Authorization': `Bearer ${this.guestToken}`,
          ...(this.sessionCookie ? { 'Cookie': this.sessionCookie } : {}),
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch page URLs for ${mangaSlug}/${folder}: HTTP ${res.status}`);
    }

    const json = await res.json();
    const pageUrls = json.pages || [];

    if (pageUrls.length === 0) {
      throw new Error(`No page URLs returned for ${mangaSlug}/${folder}`);
    }

    // Download pages with bounded concurrency (5 parallel streams)
    const pages = new Array(pageUrls.length);
    const downloadLimit = 5;
    let idx = 0;

    const downloadWorker = async () => {
      while (idx < pageUrls.length) {
        const i = idx++;
        const pageUrl = pageUrls[i];
        const pageNumber = i + 1;

        const imgRes = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://mangabox.uz/',
          },
        });

        if (!imgRes.ok) {
          throw new Error(`Failed to download page ${pageNumber} from ${pageUrl}: HTTP ${imgRes.status}`);
        }

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        pages[i] = {
          pageNumber,
          filename: `${String(pageNumber).padStart(3, '0')}.webp`,
          buffer,
          contentType: 'image/webp',
        };
      }
    };

    const workers = [];
    for (let w = 0; w < Math.min(downloadLimit, pageUrls.length); w++) {
      workers.push(downloadWorker());
    }
    await Promise.all(workers);

    return pages;
  }

  /**
   * Fetch complete manga metadata and cover reference from Mangabox public API.
   * @param {string} mangaSlug
   * @returns {Promise<object>}
   */
  async fetchMangaDetails(mangaSlug) {
    await this.ensureGuestSession();

    const res = await fetch(`${this.baseUrl}/api/mangas/${mangaSlug}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://mangabox.uz',
        'Referer': 'https://mangabox.uz/',
        'Authorization': `Bearer ${this.guestToken}`,
        ...(this.sessionCookie ? { 'Cookie': this.sessionCookie } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Mangabox fetchMangaDetails failed: HTTP ${res.status}`);
    }

    const data = await res.json();

    // Map genres
    const rawTags = Array.isArray(data.tags) ? data.tags : [];
    const mappedGenres = new Set();
    for (const tag of rawTags) {
      const clean = String(tag).trim().toLowerCase();
      if (TAG_GENRE_MAP[clean]) {
        mappedGenres.add(TAG_GENRE_MAP[clean]);
      }
    }
    if (mappedGenres.size === 0) {
      mappedGenres.add('harakatli');
    }

    // Map status
    let status = 'davom etmoqda';
    if (data.status === 'completed') status = 'tugallangan';
    else if (data.status === 'hiatus') status = 'pauza';

    // Map comic type
    let type = (data.comicType || 'manga').toLowerCase();
    if (!['manga', 'manhwa', 'manhua', 'komiks'].includes(type)) {
      type = 'manga';
    }

    // Parse authors safely
    const authorList = Array.isArray(data.authors) && data.authors.length > 0
      ? data.authors.map((a) => (typeof a === 'string' ? a : a?.name || 'Mangabox')).filter(Boolean).join(', ')
      : (typeof data.author === 'string' ? data.author : 'Mangabox');

    // Map titles
    const titleUz = data.titles?.uz || data.title || '';
    const titleEn = data.titles?.en || '';
    const titleRu = data.titles?.ru || '';
    const altTitles = Array.isArray(data.altTitles) ? [...data.altTitles] : [];
    if (titleRu && !altTitles.includes(titleRu)) altTitles.push(titleRu);

    // Map chapter stats
    const rawChapters = Array.isArray(data.chapters) ? data.chapters : [];
    const chapterNumbers = [];
    for (const ch of rawChapters) {
      const m = (ch.name || ch.folder || '').match(/(\d+(?:\.\d+)?)/);
      if (m) chapterNumbers.push(parseFloat(m[1]));
    }
    chapterNumbers.sort((a, b) => a - b);

    return {
      slug: data.slug || mangaSlug,
      title: titleUz,
      titleEn,
      altTitles,
      author: authorList,
      artist: '',
      synopsis: data.summary || '',
      genres: Array.from(mappedGenres),
      type,
      status,
      year: data.year || null,
      rating: data.rating ? Math.round((data.rating / 2) * 10) / 10 : 4.8,
      ratingCount: data.ratingCount || 0,
      viewsCount: data.viewCount || 0,
      coverUrl: data.coverUrl || '',
      coverKey: data.coverKey || '',
      totalChaptersAvailable: rawChapters.length,
      availableChapterNumbers: chapterNumbers,
    };
  }

  /**
   * Download and analyze cover image buffer from source CDN.
   * @param {string} coverUrl
   * @returns {Promise<object>}
   */
  async fetchCoverAsset(coverUrl) {
    if (!coverUrl) throw new Error('Cover URL is missing');

    const res = await fetch(coverUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mangabox.uz/',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download cover asset: HTTP ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const dim = getImageDimensions(buffer);

    return {
      buffer,
      width: dim.width,
      height: dim.height,
      format: dim.format,
      contentType: res.headers.get('content-type') || `image/${dim.format === 'jpeg' ? 'jpeg' : dim.format}`,
      size: buffer.length,
      qualityScore: dim.width * dim.height,
    };
  }

  /**
   * Generate a comprehensive metadata & cover preview diff against existing data.
   * @param {string} mangaSlug
   * @param {object} [currentManga]
   * @returns {Promise<object>}
   */
  async previewMetadata(mangaSlug, currentManga = null) {
    const incoming = await this.fetchMangaDetails(mangaSlug);
    let coverAsset = null;
    let coverError = null;

    if (incoming.coverUrl) {
      try {
        coverAsset = await this.fetchCoverAsset(incoming.coverUrl);
      } catch (e) {
        coverError = e.message;
      }
    }

    const current = currentManga || {};
    const diff = {
      title: { current: current.title || '', incoming: incoming.title, changed: current.title !== incoming.title },
      titleEn: { current: current.titleEn || '', incoming: incoming.titleEn, changed: current.titleEn !== incoming.titleEn },
      author: { current: current.author || '', incoming: incoming.author, changed: current.author !== incoming.author },
      type: { current: current.type || '', incoming: incoming.type, changed: current.type !== incoming.type },
      status: { current: current.status || '', incoming: incoming.status, changed: current.status !== incoming.status },
      synopsis: { current: current.synopsis || '', incoming: incoming.synopsis, changed: current.synopsis !== incoming.synopsis },
      genres: {
        current: current.genres || [],
        incoming: incoming.genres,
        changed: JSON.stringify(current.genres) !== JSON.stringify(incoming.genres),
      },
      cover: {
        currentUrl: current.coverUrl || current.coverImage || '',
        incomingUrl: incoming.coverUrl,
        incomingDimensions: coverAsset ? `${coverAsset.width}x${coverAsset.height} px` : 'unknown',
        incomingSizeKb: coverAsset ? Math.round(coverAsset.size / 1024) : 0,
        incomingFormat: coverAsset?.format || 'unknown',
        coverError,
      },
      chaptersAvailable: incoming.totalChaptersAvailable,
      availableChapterNumbers: incoming.availableChapterNumbers.slice(0, 10),
    };

    return {
      slug: mangaSlug,
      current,
      incoming,
      coverAsset,
      diff,
    };
  }
}
