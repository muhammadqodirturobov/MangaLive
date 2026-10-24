import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { BaseSourceAdapter } from './BaseSourceAdapter.js';

const ALLOWED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);

/**
 * Natural numerical sort for filenames (e.g. 'page-2.jpg' before 'page-10.jpg')
 */
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * MangaLive.uz — Local Archive Source Adapter
 *
 * Imports authorized ZIP/CBZ/PDF chapter archives from a local staging directory.
 * Safely parses archives, protects against directory traversal, and enforces natural page order.
 */
export class LocalArchiveAdapter extends BaseSourceAdapter {
  constructor(options = {}) {
    super('LocalArchiveAdapter', options);
    this.directory = options.directory || path.resolve(process.cwd(), 'imports');
  }

  async checkStatus() {
    return {
      enabled: true,
      directory: this.directory,
      directoryExists: fs.existsSync(this.directory),
    };
  }

  /**
   * Scan directory for archives formatted like:
   * [manga-slug]_ch_[chapterNumber].[zip|cbz|pdf] or [manga-slug]-[chapterNumber].[zip|cbz]
   */
  async discoverManga() {
    if (!fs.existsSync(this.directory)) return [];

    const files = fs.readdirSync(this.directory);
    const slugs = new Set();

    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (!['.zip', '.cbz', '.pdf'].includes(ext)) continue;

      const parsed = this.parseArchiveFilename(f);
      if (parsed) {
        slugs.add(parsed.mangaSlug);
      }
    }

    return Array.from(slugs).map((slug) => ({
      slug,
      title: slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    }));
  }

  /**
   * Discover chapters for a manga from matching archive filenames.
   */
  async discoverChapters(mangaSlug, afterChapterNumber = 0) {
    if (!fs.existsSync(this.directory)) return [];

    const files = fs.readdirSync(this.directory);
    const chapters = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!['.zip', '.cbz', '.pdf'].includes(ext)) continue;

      const parsed = this.parseArchiveFilename(file);
      if (parsed && parsed.mangaSlug === mangaSlug && parsed.chapterNumber > afterChapterNumber) {
        chapters.push({
          chapterNumber: parsed.chapterNumber,
          title: `${parsed.chapterNumber}-bob`,
          chapterRef: {
            filePath: path.join(this.directory, file),
            filename: file,
            ext,
          },
        });
      }
    }

    return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  }

  /**
   * Extract page images from archive (ZIP/CBZ) with natural numerical sorting.
   */
  async fetchChapterPages({ chapterRef }) {
    const { filePath, ext } = chapterRef;
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archive file not found: ${filePath}`);
    }

    if (ext === '.zip' || ext === '.cbz') {
      const fileBuffer = fs.readFileSync(filePath);
      const zip = await JSZip.loadAsync(fileBuffer);
      const imageEntries = [];

      zip.forEach((relativePath, zipEntry) => {
        // Protect against directory traversal & ignore directories
        if (zipEntry.dir || relativePath.includes('..') || relativePath.startsWith('/')) {
          return;
        }
        // Ignore macOS / hidden metadata files
        if (relativePath.includes('__MACOSX') || path.basename(relativePath).startsWith('.')) {
          return;
        }

        const fileExt = path.extname(relativePath).toLowerCase().replace('.', '');
        if (ALLOWED_IMAGE_EXTS.has(fileExt)) {
          imageEntries.push({
            path: relativePath,
            name: path.basename(relativePath),
            ext: fileExt === 'jpg' ? 'jpeg' : fileExt,
            entry: zipEntry,
          });
        }
      });

      // Natural sort by filename
      imageEntries.sort((a, b) => naturalSort(a.name, b.name));

      const pages = [];
      for (let i = 0; i < imageEntries.length; i++) {
        const item = imageEntries[i];
        const pageBuffer = await item.entry.async('nodebuffer');
        pages.push({
          pageNumber: i + 1,
          filename: `${String(i + 1).padStart(3, '0')}.${item.ext}`,
          buffer: pageBuffer,
          contentType: `image/${item.ext}`,
        });
      }

      return pages;
    }

    throw new Error(`File type ${ext} requires PDF preprocessing before ingestion.`);
  }

  /**
   * Helper to parse filenames like:
   * - solo-leveling-ch-1.zip
   * - tun-va-tong_1.cbz
   * - manga-slug-chapter-12.zip
   */
  parseArchiveFilename(filename) {
    const base = path.basename(filename, path.extname(filename)).toLowerCase();

    // Match patterns: <slug>_ch_<num>, <slug>-ch-<num>, <slug>_chapter_<num>, <slug>-<num>
    const match =
      base.match(/^([a-z0-9_-]+?)[-_](?:ch|chapter|bob)[-_]?([0-9]+(?:\.[0-9]+)?)$/i) ||
      base.match(/^([a-z0-9_-]+?)[-_]([0-9]+)$/i);

    if (match) {
      return {
        mangaSlug: match[1].replace(/[-_]+$/, ''),
        chapterNumber: parseFloat(match[2]),
      };
    }
    return null;
  }
}
