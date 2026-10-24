/**
 * MangaLive.uz — Bulk Content Import Service
 *
 * Provides utilities for:
 * - CSV parsing and column validation for mangas and chapters
 * - Downloadable CSV template generation
 * - ZIP extraction, validation, and path traversal protection for chapter pages
 * - Natural numerical sorting for page files (e.g. 1.jpg, 2.jpg ... 10.jpg)
 * - Batched database inserts with duplicate detection and error reporting
 * - Supabase Storage uploading with predictable paths
 */

import JSZip from 'jszip';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { convertPdfToChapterPages, PDF_LIMITS } from './pdfChapterService.js';
import { getR2Status, uploadChapterPageToR2 } from './r2StorageService.js';

export { convertPdfToChapterPages, PDF_LIMITS };

// Batch configuration limits
export const IMPORT_LIMITS = {
  MAX_CSV_FILE_SIZE_BYTES: 5 * 1024 * 1024,      // 5 MB CSV
  MAX_ZIP_FILE_SIZE_BYTES: 100 * 1024 * 1024,   // 100 MB ZIP
  MAX_IMAGES_PER_CHAPTER: 200,
  DB_BATCH_SIZE: 20,                            // Rows per DB roundtrip
  CONCURRENT_UPLOADS: 3,                        // Storage parallel upload concurrency
  ALLOWED_IMAGE_EXTS: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
};

/**
 * Natural sort helper for filenames (e.g. 'page-2.jpg' before 'page-10.jpg').
 */
export function naturalSortFilenames(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Parse CSV string into array of object rows.
 * Handles quoted fields, commas inside quotes, and newlines.
 * @param {string} text
 * @returns {Array<Record<string, string>>}
 */
export function parseCSV(text) {
  const lines = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length < 2) return [];

  // Headers in lowercase
  const headers = lines[0].map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] ?? '';
    });
    rows.push(rowObj);
  }

  return rows;
}

/**
 * Generate CSV template string for Manga import.
 * @returns {string}
 */
export function getMangaCsvTemplate() {
  const headers = [
    'title',
    'slug',
    'title_en',
    'author',
    'type',
    'status',
    'rating',
    'genres',
    'synopsis',
    'featured_tagline',
    'is_featured',
    'is_popular',
    'is_new',
  ];

  const sampleRow1 = [
    '"Qorong\'u Vodiy"',
    'qorong-u-vodiy',
    '"Dark Valley"',
    '"Jamshid Aliyev"',
    'manga',
    'davom etmoqda',
    '4.8',
    '"harakatli;fantaziya;jangovar"',
    '"Qadimiy vodiyda yashiringan sir haqidagi sarguzasht."',
    '"Yangi serial!"',
    'true',
    'false',
    'true',
  ];

  const sampleRow2 = [
    '"Yengilmas Shamol"',
    'yengilmas-shamol',
    '"Invincible Wind"',
    '"Nigora Karimova"',
    'manhwa',
    'davom etmoqda',
    '4.9',
    '"harakatli;tarixiy"',
    '"Katta janglar va jasorat hikoyasi."',
    '""',
    'false',
    'true',
    'false',
  ];

  return [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
}

/**
 * Generate CSV template string for Chapters import.
 * @returns {string}
 */
export function getChaptersCsvTemplate() {
  const headers = [
    'manga_slug',
    'chapter_number',
    'title',
    'pages_count',
    'published_at',
  ];

  const sampleRow1 = ['nano-mashina', '2', '"2-bob"', '24', '2026-10-23T12:00:00Z'];
  const sampleRow2 = ['nano-mashina', '3', '"3-bob: Maxsus qism"', '26', '2026-10-24T12:00:00Z'];
  const sampleRow3 = ['1hp-klubi-qayta-boshlanish', '5', '"5-bob"', '20', '2026-10-23T12:00:00Z'];

  return [headers.join(','), sampleRow1.join(','), sampleRow2.join(','), sampleRow3.join(',')].join('\n');
}

/**
 * Validate and sanitize parsed manga CSV rows before import.
 * @param {Array<Record<string, string>>} rows
 * @param {Array<string>} existingSlugs
 * @returns {Array<{ row: any, isValid: boolean, errors: string[], isDuplicate: boolean }>}
 */
export function validateMangaRows(rows, existingSlugs = []) {
  const validTypes = ['manga', 'manhwa', 'manhua', 'komiks'];
  const validStatuses = ['davom etmoqda', 'tugallangan', 'pauza'];
  const slugSet = new Set(existingSlugs.map((s) => s.toLowerCase()));
  const batchSlugs = new Set();

  return rows.map((r, index) => {
    const errors = [];
    const title = (r.title || '').trim();

    if (!title) {
      errors.push('Sarlavha (title) kiritilishi shart');
    }

    let slug = (r.slug || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');

    if (!slug && title) {
      slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    }

    if (!slug) {
      errors.push('Slug yaratilmadi');
    }

    const isDuplicate = slugSet.has(slug) || batchSlugs.has(slug);
    if (batchSlugs.has(slug)) {
      errors.push(`Ushbu fayl ichida takrorlangan slug: ${slug}`);
    } else if (slug) {
      batchSlugs.add(slug);
    }

    const type = (r.type || 'manga').toLowerCase().trim();
    if (!validTypes.includes(type)) {
      errors.push(`Noto'g'ri tur: "${type}". Ruxsat etilgan: ${validTypes.join(', ')}`);
    }

    const status = (r.status || 'davom etmoqda').toLowerCase().trim();
    if (!validStatuses.includes(status)) {
      errors.push(`Noto'g'ri holat: "${status}". Ruxsat etilgan: ${validStatuses.join(', ')}`);
    }

    let rating = 0.0;
    if (r.rating) {
      const num = parseFloat(r.rating);
      if (isNaN(num) || num < 0 || num > 5) {
        errors.push(`Reyting 0.0 dan 5.0 gacha bo'lishi kerak`);
      } else {
        rating = num;
      }
    }

    // Split genres by semicolon, comma, or pipe
    const rawGenres = r.genres || '';
    const genres = rawGenres
      .split(/[;,|]/)
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);

    const parsedRow = {
      index: index + 1,
      title,
      slug,
      titleEn: (r.title_en || r.titleen || '').trim(),
      author: (r.author || 'Noma\'lum').trim(),
      type,
      status,
      rating,
      genres,
      synopsis: (r.synopsis || '').trim(),
      featuredTagline: (r.featured_tagline || '').trim(),
      isFeatured: r.is_featured === 'true' || r.is_featured === '1',
      isPopular: r.is_popular === 'true' || r.is_popular === '1',
      isNew: r.is_new === 'true' || r.is_new === '1',
      coverUrl: (r.cover_url || '').trim(),
      bannerUrl: (r.banner_url || '').trim(),
    };

    return {
      row: parsedRow,
      isValid: errors.length === 0,
      errors,
      isDuplicate,
    };
  });
}

/**
 * Validate and sanitize parsed chapter CSV rows.
 * @param {Array<Record<string, string>>} rows
 * @param {Map<string, string>} mangaSlugToIdMap
 * @param {Set<string>} existingMangaChapterPairs
 * @returns {Array<{ row: any, isValid: boolean, errors: string[], isDuplicate: boolean }>}
 */
export function validateChapterRows(rows, mangaSlugToIdMap, existingMangaChapterPairs = new Set()) {
  const batchPairs = new Set();

  return rows.map((r, index) => {
    const errors = [];
    const mangaSlug = (r.manga_slug || r.mangaslug || r.slug || '').trim().toLowerCase();

    if (!mangaSlug) {
      errors.push('Manga slugi (manga_slug) kiritilishi shart');
    } else if (!mangaSlugToIdMap.has(mangaSlug)) {
      errors.push(`Bazada "${mangaSlug}" nomli manga topilmadi`);
    }

    const chNum = parseInt(r.chapter_number || r.chapternumber || r.number, 10);
    if (isNaN(chNum) || chNum <= 0) {
      errors.push('Bob raqami (chapter_number) 0 dan katta butun son bo\'lishi shart');
    }

    const pairKey = `${mangaSlug}:${chNum}`;
    const isDuplicate = existingMangaChapterPairs.has(pairKey) || batchPairs.has(pairKey);
    if (batchPairs.has(pairKey)) {
      errors.push(`Fayl ichida ushbu bob takrorlangan: ${pairKey}`);
    } else if (mangaSlug && chNum > 0) {
      batchPairs.add(pairKey);
    }

    const title = (r.title || '').trim() || `${chNum}-bob`;
    const pagesCount = parseInt(r.pages_count || r.pagescount || '0', 10);

    let publishedAt = new Date().toISOString();
    if (r.published_at) {
      const parsedDate = new Date(r.published_at);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    }

    const parsedRow = {
      index: index + 1,
      mangaSlug,
      mangaId: mangaSlugToIdMap.get(mangaSlug) || null,
      chapterNumber: chNum,
      title,
      pagesCount: isNaN(pagesCount) ? 0 : Math.max(0, pagesCount),
      publishedAt,
    };

    return {
      row: parsedRow,
      isValid: errors.length === 0,
      errors,
      isDuplicate,
    };
  });
}

/**
 * Extract and validate images from a ZIP file with path traversal defense.
 * @param {File} zipFile
 * @param {function} [onProgress]
 * @returns {Promise<Array<{ filename: string, blob: Blob, size: number }>>}
 */
export async function unpackChapterZip(zipFile, onProgress = () => {}) {
  const fileSize = zipFile.size ?? zipFile.byteLength ?? zipFile.length ?? 0;
  if (fileSize > IMPORT_LIMITS.MAX_ZIP_FILE_SIZE_BYTES) {
    throw new Error(`ZIP fayl hajmi juda katta (${(fileSize / (1024 * 1024)).toFixed(1)} MB). Cheklov: 100 MB.`);
  }

  let data = zipFile;
  if (typeof zipFile.arrayBuffer === 'function' && !(zipFile instanceof Blob) && !(zipFile instanceof ArrayBuffer) && !(zipFile instanceof Uint8Array)) {
    data = await zipFile.arrayBuffer();
  }

  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(data);
  const imageEntries = [];

  const files = Object.keys(loadedZip.files);
  const total = files.length;
  let current = 0;

  for (const relativePath of files) {
    current++;
    onProgress(Math.round((current / total) * 100));

    const zipEntry = loadedZip.files[relativePath];

    // Skip directories and metadata/hidden files
    if (zipEntry.dir) continue;
    if (relativePath.includes('__MACOSX') || relativePath.startsWith('.') || relativePath.includes('/.')) continue;

    // Defense against Zip Slip / path traversal
    if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
      console.warn(`[Security] ZIP ichidagi shubhali yo'l bekor qilindi: ${relativePath}`);
      continue;
    }

    // Extract basename
    const basename = relativePath.split(/[/\\]/).pop();
    if (!basename) continue;

    const ext = basename.split('.').pop()?.toLowerCase();
    if (!ext || !IMPORT_LIMITS.ALLOWED_IMAGE_EXTS.includes(ext)) {
      continue;
    }

    const blob = await zipEntry.async('blob');
    imageEntries.push({
      filename: basename,
      blob,
      size: blob.size,
    });
  }

  if (imageEntries.length === 0) {
    throw new Error('ZIP/CBZ arxivida ruxsat etilgan rasm fayllari (JPG, PNG, WebP, AVIF) topilmadi.');
  }

  if (imageEntries.length > IMPORT_LIMITS.MAX_IMAGES_PER_CHAPTER) {
    throw new Error(`Arxivda juda ko'p rasm bor (${imageEntries.length} ta). Bir bob uchun maksimal: ${IMPORT_LIMITS.MAX_IMAGES_PER_CHAPTER} ta.`);
  }

  // Sort files naturally by filename
  imageEntries.sort((a, b) => naturalSortFilenames(a.filename, b.filename));

  return imageEntries;
}

/**
 * Automatically parse a chapter archive filename to detect manga slug, chapter number, and format.
 * Supports patterns:
 * - tun-va-tong_ch-88.cbz
 * - tun-va-tong-88.zip
 * - [tun-va-tong] Chapter 88.cbz
 * - tun-va-tong_bob_88.zip
 * - tun_va_tong_88.cbz
 *
 * @param {string} rawFilename
 * @param {Array<{ id: string, slug: string, title: string }>} availableMangas
 * @returns {{
 *   rawFilename: string,
 *   ext: string,
 *   format: 'ZIP' | 'CBZ' | 'UNKNOWN',
 *   matchedManga: { id: string, slug: string, title: string } | null,
 *   detectedSlug: string,
 *   chapterNumber: number | null,
 *   suggestedTitle: string,
 * }}
 */
export function parseChapterArchiveFilename(rawFilename, availableMangas = []) {
  const parts = rawFilename.split('.');
  const ext = (parts.pop() || '').toLowerCase();
  const format = ext === 'cbz' ? 'CBZ' : ext === 'zip' ? 'ZIP' : ext === 'pdf' ? 'PDF' : 'UNKNOWN';

  // Base without extension
  let base = parts.join('.').trim();

  // Strip leading group or brackets if any like [Group], [MangaTitle]
  let leadingBracket = '';
  const bracketMatch = base.match(/^\[(.*?)\]\s*(.*)$/);
  if (bracketMatch) {
    leadingBracket = bracketMatch[1].trim();
    base = bracketMatch[2].trim() || bracketMatch[1].trim();
  }

  // Helper to normalize strings for comparison
  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

  const normalizedBase = normalize(base);
  const normalizedBracket = normalize(leadingBracket);

  // Sort availableMangas by slug length descending to match longest first
  const sortedMangas = [...availableMangas].sort((a, b) => (b.slug?.length || 0) - (a.slug?.length || 0));

  let matchedManga = null;
  let remainingAfterManga = base;

  for (const manga of sortedMangas) {
    const normSlug = normalize(manga.slug);
    const normTitle = normalize(manga.title);

    // Check if bracket matches
    if (normalizedBracket && (normalizedBracket === normSlug || normalizedBracket === normTitle)) {
      matchedManga = manga;
      break;
    }

    // Check if base starts with slug or title
    if (normSlug && normalizedBase.startsWith(normSlug)) {
      matchedManga = manga;
      const slugIndex = base.toLowerCase().indexOf(manga.slug.toLowerCase());
      if (slugIndex >= 0) {
        remainingAfterManga = base.slice(slugIndex + manga.slug.length);
      }
      break;
    }

    if (normTitle && normalizedBase.startsWith(normTitle)) {
      matchedManga = manga;
      const titleIndex = base.toLowerCase().indexOf(manga.title.toLowerCase());
      if (titleIndex >= 0) {
        remainingAfterManga = base.slice(titleIndex + manga.title.length);
      }
      break;
    }
  }

  // Extract chapter number from remaining string (or whole base if no manga matched)
  let chapterNumber = null;
  const chPatterns = [
    /(?:^|[-_.\s])(?:ch|chapter|bob|ep|episode|v|volume|c)[-_.\s]*([0-9]+(?:\.[0-9]+)?)/i,
    /[-_.\s]+([0-9]+(?:\.[0-9]+)?)(?:[-_.\s]|$)/,
    /([0-9]+(?:\.[0-9]+)?)$/,
  ];

  for (const pat of chPatterns) {
    const match = remainingAfterManga.match(pat) || base.match(pat);
    if (match && match[1]) {
      const num = parseFloat(match[1]);
      if (!isNaN(num) && num >= 0) {
        chapterNumber = num;
        break;
      }
    }
  }

  // Fallback detectedSlug if no manga matched directly
  let detectedSlug = '';
  if (matchedManga) {
    detectedSlug = matchedManga.slug;
  } else {
    if (chapterNumber !== null) {
      const chIdx = base.search(new RegExp(`(?:ch|chapter|bob)?[-_\\s]*${chapterNumber}`, 'i'));
      if (chIdx > 0) {
        detectedSlug = normalize(base.slice(0, chIdx)).replace(/^-|-$/g, '');
      }
    }
    if (!detectedSlug) {
      detectedSlug = normalize(base).replace(/^-|-$/g, '');
    }
  }

  const suggestedTitle = chapterNumber !== null && chapterNumber !== undefined ? `${chapterNumber}-bob` : '';

  return {
    rawFilename,
    ext,
    format,
    matchedManga,
    detectedSlug,
    chapterNumber,
    suggestedTitle,
  };
}

/**
 * Helper to check whether a string matches PostgreSQL UUID pattern.
 * @param {any} val
 * @returns {boolean}
 */
export function isUUID(val) {
  return (
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())
  );
}

/**
 * Resolve manga UUID from in-memory manga list or Supabase database.
 * Prevents PostgreSQL 22P02 "invalid input syntax for type uuid" error
 * when a slug (e.g. "tun-va-tong") is passed where a UUID is expected.
 *
 * @param {string} idOrSlug - Manga UUID or text slug
 * @param {Array<{ id: string, slug: string }>} [availableMangas=[]]
 * @returns {Promise<string|null>} Resolves to a valid UUID or null
 */
export async function resolveMangaUuid(idOrSlug, availableMangas = []) {
  if (!idOrSlug) return null;
  const trimmed = String(idOrSlug).trim();

  // 1. If already a valid UUID, return directly
  if (isUUID(trimmed)) {
    return trimmed;
  }

  // 2. Resolve from available in-memory mangas
  const found = availableMangas.find(
    (m) =>
      m.slug?.toLowerCase() === trimmed.toLowerCase() ||
      m.id?.toLowerCase() === trimmed.toLowerCase() ||
      m.title?.toLowerCase() === trimmed.toLowerCase()
  );

  if (found) {
    if (isUUID(found.id)) return found.id;
    if (isUUID(found.uuid)) return found.uuid;
    if (isUUID(found.dbId)) return found.dbId;
  }

  // 3. Fallback: Query Supabase 'mangas' table by slug to fetch true UUID
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('mangas')
        .select('id, slug')
        .eq('slug', trimmed)
        .maybeSingle();

      if (!error && data?.id && isUUID(data.id)) {
        return data.id;
      }
    } catch (err) {
      console.warn(`[resolveMangaUuid] DB query error for slug "${trimmed}":`, err.message);
    }
  }

  return null;
}

/**
 * Query Supabase for existing chapters belonging to a manga.
 * Automatically resolves manga slug to its database UUID before querying.
 *
 * @param {string} mangaIdOrSlug - Manga UUID or slug
 * @param {Array<{ id: string, slug: string }>} [availableMangas=[]]
 * @returns {Promise<Set<number>>} Set of existing chapter numbers
 */
export async function getExistingChapterNumbers(mangaIdOrSlug, availableMangas = []) {
  if (!isSupabaseConfigured || !supabase || !mangaIdOrSlug) return new Set();

  const resolvedUuid = await resolveMangaUuid(mangaIdOrSlug, availableMangas);
  if (!resolvedUuid) {
    console.warn(`[getExistingChapterNumbers] Manga UUID topilmadi: "${mangaIdOrSlug}"`);
    return new Set();
  }

  const { data, error } = await supabase
    .from('chapters')
    .select('chapter_number')
    .eq('manga_id', resolvedUuid);

  if (error) {
    console.warn('[bulkImport] Failed to fetch existing chapters:', error.message);
    return new Set();
  }

  return new Set((data || []).map((c) => Number(c.chapter_number)));
}

/**
 * Inspect a list of selected files (ZIP, CBZ, PDF) and expand them into chapter candidates.
 *
 * Rules:
 * 1. Direct .pdf: 1 candidate (sourceType: 'direct-pdf')
 * 2. ZIP/CBZ containing only images: 1 candidate (sourceType: 'archive-images')
 * 3. ZIP/CBZ containing exactly 1 PDF: 1 candidate (sourceType: 'zip-single-pdf')
 * 4. ZIP/CBZ containing multiple PDFs: multiple candidates, one per PDF (sourceType: 'zip-multi-pdf')
 * 5. ZIP/CBZ containing both images and PDFs: 1 candidate for images, plus 1 candidate per PDF
 * 6. Empty or unsupported archive: 1 candidate with error status
 *
 * @param {File[]} files
 * @param {Array<{ id: string, slug: string, title: string }>} availableMangas
 * @param {function} [onProgress] (current: number, total: number, filename: string) => void
 * @returns {Promise<Array<object>>}
 */
export async function inspectAndExpandChapterFiles(files, availableMangas = [], onProgress = () => {}) {
  const candidates = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    onProgress(i + 1, total, file.name);

    const ext = (file.name.split('.').pop() || '').toLowerCase();

    // 1. Direct PDF file
    if (ext === 'pdf') {
      const parsed = parseChapterArchiveFilename(file.name, availableMangas);
      candidates.push({
        id: `pdf-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        sourceType: 'direct-pdf',
        filename: file.name,
        archiveName: null,
        pdfFile: file,
        fileSize: file.size,
        format: 'PDF',
        mangaId: parsed.matchedManga?.id || '',
        mangaSlug: parsed.matchedManga?.slug || parsed.detectedSlug || '',
        chapterNumber: parsed.chapterNumber ?? '',
        chapterTitle: parsed.suggestedTitle || (parsed.chapterNumber !== null && parsed.chapterNumber !== undefined && parsed.chapterNumber !== '' ? `${parsed.chapterNumber}-bob` : ''),
        isDuplicate: false,
        status: 'pending',
        error: null,
        uploadedPages: 0,
      });
      continue;
    }

    // 2. ZIP or CBZ archive
    if (ext === 'zip' || ext === 'cbz') {
      const isCbz = ext === 'cbz';
      if (file.size > IMPORT_LIMITS.MAX_ZIP_FILE_SIZE_BYTES) {
        candidates.push({
          id: `archive-err-${Date.now()}-${i}`,
          sourceType: 'unknown',
          filename: file.name,
          archiveName: file.name,
          fileSize: file.size,
          format: isCbz ? 'CBZ' : 'ZIP',
          mangaId: '',
          mangaSlug: '',
          chapterNumber: '',
          chapterTitle: '',
          isDuplicate: false,
          status: 'failed',
          error: `Arxiv hajmi juda katta (${(file.size / (1024 * 1024)).toFixed(1)} MB). Cheklov: 100 MB.`,
          uploadedPages: 0,
        });
        continue;
      }

      let loadedZip;
      try {
        const zip = new JSZip();
        loadedZip = await zip.loadAsync(file);
      } catch (err) {
        candidates.push({
          id: `archive-err-${Date.now()}-${i}`,
          sourceType: 'unknown',
          filename: file.name,
          archiveName: file.name,
          fileSize: file.size,
          format: isCbz ? 'CBZ' : 'ZIP',
          mangaId: '',
          mangaSlug: '',
          chapterNumber: '',
          chapterTitle: '',
          isDuplicate: false,
          status: 'failed',
          error: `Arxivni o'qib bo'lmadi: ${err.message}`,
          uploadedPages: 0,
        });
        continue;
      }

      const zipEntries = Object.keys(loadedZip.files);
      const pdfEntries = [];
      const imageEntries = [];

      for (const relPath of zipEntries) {
        const zipEntry = loadedZip.files[relPath];
        if (zipEntry.dir) continue;
        if (relPath.includes('__MACOSX') || relPath.startsWith('.') || relPath.includes('/.')) continue;
        // Zip-Slip defense
        if (relPath.includes('..') || relPath.startsWith('/') || relPath.startsWith('\\')) {
          console.warn(`[Security] ZIP ichidagi shubhali yo'l e'tiborga olinmadi: ${relPath}`);
          continue;
        }

        const basename = relPath.split(/[/\\]/).pop();
        if (!basename) continue;

        const entryExt = (basename.split('.').pop() || '').toLowerCase();
        if (entryExt === 'pdf') {
          pdfEntries.push({
            path: relPath,
            basename,
            uncompressedSize: zipEntry._data?.uncompressedSize || file.size,
          });
        } else if (IMPORT_LIMITS.ALLOWED_IMAGE_EXTS.includes(entryExt)) {
          imageEntries.push({
            path: relPath,
            basename,
            uncompressedSize: zipEntry._data?.uncompressedSize || 0,
          });
        }
      }

      const zipParsed = parseChapterArchiveFilename(file.name, availableMangas);

      // Sub-case A: Pure image archive
      if (pdfEntries.length === 0 && imageEntries.length > 0) {
        candidates.push({
          id: `zip-img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: 'archive-images',
          filename: file.name,
          archiveName: file.name,
          file,
          fileSize: file.size,
          format: isCbz ? 'CBZ' : 'ZIP',
          mangaId: zipParsed.matchedManga?.id || '',
          mangaSlug: zipParsed.matchedManga?.slug || zipParsed.detectedSlug || '',
          chapterNumber: zipParsed.chapterNumber ?? '',
          chapterTitle: zipParsed.suggestedTitle || (zipParsed.chapterNumber !== null && zipParsed.chapterNumber !== undefined && zipParsed.chapterNumber !== '' ? `${zipParsed.chapterNumber}-bob` : ''),
          isDuplicate: false,
          status: 'pending',
          error: null,
          uploadedPages: 0,
        });
        continue;
      }

      // Sub-case B: Exactly 1 PDF inside archive
      if (pdfEntries.length === 1 && imageEntries.length === 0) {
        const pdfEntry = pdfEntries[0];
        const pdfParsed = parseChapterArchiveFilename(pdfEntry.basename, availableMangas);
        const matchedManga = pdfParsed.matchedManga || zipParsed.matchedManga;
        const detectedSlug = pdfParsed.detectedSlug || zipParsed.detectedSlug;
        const chNum = pdfParsed.chapterNumber ?? zipParsed.chapterNumber;
        const title = pdfParsed.suggestedTitle || zipParsed.suggestedTitle || (chNum !== null && chNum !== undefined && chNum !== '' ? `${chNum}-bob` : '');

        candidates.push({
          id: `zip-pdf-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: 'zip-single-pdf',
          filename: pdfEntry.basename === file.name.replace(/\.[^/.]+$/, '')
            ? file.name
            : `${file.name} (${pdfEntry.basename})`,
          archiveName: file.name,
          zipFile: file,
          pdfEntryPath: pdfEntry.path,
          fileSize: file.size,
          format: 'PDF',
          mangaId: matchedManga?.id || '',
          mangaSlug: matchedManga?.slug || detectedSlug || '',
          chapterNumber: chNum ?? '',
          chapterTitle: title,
          isDuplicate: false,
          status: 'pending',
          error: null,
          uploadedPages: 0,
        });
        continue;
      }

      // Sub-case C: Multiple PDFs inside archive
      if (pdfEntries.length > 1) {
        pdfEntries.sort((a, b) => naturalSortFilenames(a.basename, b.basename));

        if (imageEntries.length > 0) {
          candidates.push({
            id: `zip-img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            sourceType: 'archive-images',
            filename: `${file.name} (Rasmlar)`,
            archiveName: file.name,
            file,
            fileSize: file.size,
            format: isCbz ? 'CBZ' : 'ZIP',
            mangaId: zipParsed.matchedManga?.id || '',
            mangaSlug: zipParsed.matchedManga?.slug || zipParsed.detectedSlug || '',
            chapterNumber: zipParsed.chapterNumber ?? '',
            chapterTitle: zipParsed.suggestedTitle || (zipParsed.chapterNumber !== null && zipParsed.chapterNumber !== undefined && zipParsed.chapterNumber !== '' ? `${zipParsed.chapterNumber}-bob` : ''),
            isDuplicate: false,
            status: 'pending',
            error: null,
            uploadedPages: 0,
          });
        }

        pdfEntries.forEach((pdfEntry, idx) => {
          const pdfParsed = parseChapterArchiveFilename(pdfEntry.basename, availableMangas);
          const matchedManga = pdfParsed.matchedManga || zipParsed.matchedManga;
          const detectedSlug = pdfParsed.detectedSlug || zipParsed.detectedSlug;
          let chNum = pdfParsed.chapterNumber;
          if (chNum === null || chNum === undefined) {
            chNum = (zipParsed.chapterNumber !== null && zipParsed.chapterNumber !== undefined && zipParsed.chapterNumber !== '')
              ? zipParsed.chapterNumber + idx
              : idx + 1;
          }
          const title = pdfParsed.suggestedTitle || (chNum !== null && chNum !== undefined && chNum !== '' ? `${chNum}-bob` : '');

          candidates.push({
            id: `zip-pdf-${Date.now()}-${i}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
            sourceType: 'zip-multi-pdf',
            filename: `${file.name} ➔ ${pdfEntry.basename}`,
            archiveName: file.name,
            zipFile: file,
            pdfEntryPath: pdfEntry.path,
            fileSize: pdfEntry.uncompressedSize || file.size,
            format: 'PDF',
            mangaId: matchedManga?.id || '',
            mangaSlug: matchedManga?.slug || detectedSlug || '',
            chapterNumber: chNum ?? '',
            chapterTitle: title,
            isDuplicate: false,
            status: 'pending',
            error: null,
            uploadedPages: 0,
          });
        });
        continue;
      }

      // Sub-case D: 1 PDF and some images
      if (pdfEntries.length === 1 && imageEntries.length > 0) {
        candidates.push({
          id: `zip-img-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: 'archive-images',
          filename: `${file.name} (Rasmlar)`,
          archiveName: file.name,
          file,
          fileSize: file.size,
          format: isCbz ? 'CBZ' : 'ZIP',
          mangaId: zipParsed.matchedManga?.id || '',
          mangaSlug: zipParsed.matchedManga?.slug || zipParsed.detectedSlug || '',
          chapterNumber: zipParsed.chapterNumber ?? '',
          chapterTitle: zipParsed.suggestedTitle || '',
          isDuplicate: false,
          status: 'pending',
          error: null,
          uploadedPages: 0,
        });

        const pdfEntry = pdfEntries[0];
        const pdfParsed = parseChapterArchiveFilename(pdfEntry.basename, availableMangas);
        const matchedManga = pdfParsed.matchedManga || zipParsed.matchedManga;
        const detectedSlug = pdfParsed.detectedSlug || zipParsed.detectedSlug;
        const chNum = pdfParsed.chapterNumber ?? zipParsed.chapterNumber;
        const title = pdfParsed.suggestedTitle || zipParsed.suggestedTitle || (chNum !== null && chNum !== undefined && chNum !== '' ? `${chNum}-bob` : '');

        candidates.push({
          id: `zip-pdf-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          sourceType: 'zip-single-pdf',
          filename: `${file.name} ➔ ${pdfEntry.basename}`,
          archiveName: file.name,
          zipFile: file,
          pdfEntryPath: pdfEntry.path,
          fileSize: file.size,
          format: 'PDF',
          mangaId: matchedManga?.id || '',
          mangaSlug: matchedManga?.slug || detectedSlug || '',
          chapterNumber: chNum ?? '',
          chapterTitle: title,
          isDuplicate: false,
          status: 'pending',
          error: null,
          uploadedPages: 0,
        });
        continue;
      }

      // Sub-case E: Empty archive (0 images, 0 PDFs)
      candidates.push({
        id: `archive-empty-${Date.now()}-${i}`,
        sourceType: 'unknown',
        filename: file.name,
        archiveName: file.name,
        fileSize: file.size,
        format: isCbz ? 'CBZ' : 'ZIP',
        mangaId: '',
        mangaSlug: '',
        chapterNumber: '',
        chapterTitle: '',
        isDuplicate: false,
        status: 'failed',
        error: 'Arxivda ruxsat etilgan rasm (JPG, PNG, WebP) yoki PDF fayllar topilmadi.',
        uploadedPages: 0,
      });
      continue;
    }

    // 3. Unsupported format
    candidates.push({
      id: `unsupported-${Date.now()}-${i}`,
      sourceType: 'unsupported',
      filename: file.name,
      archiveName: null,
      fileSize: file.size,
      format: ext.toUpperCase() || 'UNKNOWN',
      mangaId: '',
      mangaSlug: '',
      chapterNumber: '',
      chapterTitle: '',
      isDuplicate: false,
      status: 'failed',
      error: `Qo'llab-quvvatlanmaydigan format (.${ext}). Faqat .ZIP, .CBZ va .PDF fayllar qabul qilinadi.`,
      uploadedPages: 0,
    });
  }

  return candidates;
}

/**
 * Ingest a single chapter candidate (images from archive, single PDF from ZIP, multi-PDF from ZIP, or direct PDF).
 *
 * @param {object} params
 * @param {object} params.candidate
 * @param {string} params.mangaId
 * @param {string} params.mangaSlug
 * @param {number} params.chapterNumber
 * @param {string} params.chapterTitle
 * @param {boolean} [params.overwrite=false]
 * @param {function} [params.onProgress] (stage: string, pct: number, current: number, total: number) => void
 * @returns {Promise<{ chapterId: string, pagesCount: number, pageUrls: string[] }>}
 */
export async function ingestSingleChapterCandidate({
  candidate,
  mangaId,
  mangaSlug,
  chapterNumber,
  chapterTitle,
  overwrite = false,
  onProgress = () => {},
  availableMangas = [],
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  if (!mangaId && !mangaSlug) {
    throw new Error('Manga tanlanmagan');
  }

  if (chapterNumber === undefined || chapterNumber === null || isNaN(chapterNumber) || chapterNumber < 0) {
    throw new Error('Bob raqami noto\'g\'ri');
  }

  // Resolve to actual UUID before any database interaction
  const resolvedMangaId = await resolveMangaUuid(mangaId || mangaSlug, availableMangas);
  if (!resolvedMangaId) {
    throw new Error(`Manga UUID topilmadi (id/slug: "${mangaId || mangaSlug}"). Iltimos, mangani qayta tanlang.`);
  }

  // Resolve clean slug for Supabase Storage paths
  let cleanSlug = (mangaSlug || candidate?.mangaSlug || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  if (!cleanSlug) {
    const matched = availableMangas.find((m) => m.id === resolvedMangaId);
    if (matched?.slug) cleanSlug = matched.slug;
  }
  if (!cleanSlug) {
    cleanSlug = resolvedMangaId;
  }

  let images = [];

  // Stage 1: Extraction / Conversion
  if (candidate.sourceType === 'archive-images') {
    onProgress('extracting', 10, 0, 0);
    images = await unpackChapterZip(candidate.file, (pct) => onProgress('extracting', pct, 0, 0));
  } else if (candidate.sourceType === 'direct-pdf') {
    onProgress('converting', 0, 0, 0);
    images = await convertPdfToChapterPages(candidate.pdfFile, {
      maxPages: IMPORT_LIMITS.MAX_IMAGES_PER_CHAPTER,
      onProgress: (cur, tot) => onProgress('converting', Math.round((cur / tot) * 100), cur, tot),
    });
  } else if (candidate.sourceType === 'zip-single-pdf' || candidate.sourceType === 'zip-multi-pdf') {
    onProgress('extracting', 30, 0, 0);
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(candidate.zipFile);
    const entry = loadedZip.file(candidate.pdfEntryPath);
    if (!entry) {
      throw new Error(`Arxiv ichida "${candidate.pdfEntryPath}" fayli topilmadi`);
    }
    const pdfBlob = await entry.async('blob');
    onProgress('converting', 0, 0, 0);
    images = await convertPdfToChapterPages(pdfBlob, {
      maxPages: IMPORT_LIMITS.MAX_IMAGES_PER_CHAPTER,
      onProgress: (cur, tot) => onProgress('converting', Math.round((cur / tot) * 100), cur, tot),
    });
  } else {
    throw new Error(`Noma'lum manba turi: ${candidate.sourceType}`);
  }

  if (!images || images.length === 0) {
    throw new Error('Bob uchun sahifalar topilmadi');
  }

  if (images.length > IMPORT_LIMITS.MAX_IMAGES_PER_CHAPTER) {
    throw new Error(
      `Bobda juda ko'p sahifa mavjud (${images.length} ta). Maksimal limit: ${IMPORT_LIMITS.MAX_IMAGES_PER_CHAPTER} ta.`
    );
  }

  // Stage 2: Database Record (using resolved UUID)
  const { data: existingChapter, error: checkErr } = await supabase
    .from('chapters')
    .select('id, pages_count')
    .match({ manga_id: resolvedMangaId, chapter_number: chapterNumber })
    .maybeSingle();

  if (checkErr) {
    throw new Error(`Bob mavjudligini tekshirishda xatolik: ${checkErr.message}`);
  }

  let chapterId = null;

  if (existingChapter) {
    if (!overwrite) {
      throw new Error(`Bob #${chapterNumber} allaqachon mavjud (takroriy)`);
    }
    chapterId = existingChapter.id;
    await supabase
      .from('chapters')
      .update({
        title: chapterTitle || `${chapterNumber}-bob`,
        pages_count: images.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId);
  } else {
    const { data: newCh, error: insertChErr } = await supabase
      .from('chapters')
      .insert({
        manga_id: resolvedMangaId,
        chapter_number: chapterNumber,
        title: chapterTitle || `${chapterNumber}-bob`,
        pages_count: images.length,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertChErr) {
      throw new Error(`Bob yozuvini yaratishda xatolik: ${insertChErr.message}`);
    }
    chapterId = newCh.id;
  }

  // Stage 3: Upload pages
  onProgress('uploading', 0, 0, images.length);
  const { uploaded, failed, pageUrls } = await uploadChapterPagesBatch({
    mangaSlug: cleanSlug,
    chapterNumber,
    chapterId,
    images,
    onProgress: (pct) => onProgress('uploading', pct, Math.round((pct / 100) * images.length), images.length),
  });

  if (failed > 0) {
    throw new Error(
      `Bob sahifalari to'liq yuklanmadi: ${uploaded}/${images.length} ta yuklandi, ${failed} ta xatolik berdi.`
    );
  }

  return { chapterId, pagesCount: uploaded, pageUrls };
}

/**
 * Ingest a single chapter archive (ZIP or CBZ) end-to-end.
 * Kept for backwards compatibility, forwards to ingestSingleChapterCandidate.
 */
export async function ingestSingleChapterArchive({
  file,
  mangaId,
  mangaSlug,
  chapterNumber,
  chapterTitle,
  overwrite = false,
  onPageProgress = () => {},
}) {
  return ingestSingleChapterCandidate({
    candidate: { sourceType: 'archive-images', file },
    mangaId,
    mangaSlug,
    chapterNumber,
    chapterTitle,
    overwrite,
    onProgress: (stage, pct, cur, tot) => onPageProgress(pct, tot),
  });
}

/**
 * Upload multiple chapter page images to Supabase Storage in managed batches.
 * @param {object} params
 * @param {string} params.mangaSlug
 * @param {number} params.chapterNumber
 * @param {string} params.chapterId
 * @param {Array<{ filename: string, blob: Blob }>} params.images
 * @param {function} [params.onProgress]
 * @returns {Promise<{ uploaded: number, failed: number, pageUrls: string[] }>}
 */
export async function uploadChapterPagesBatch({
  mangaSlug,
  chapterNumber,
  chapterId,
  images,
  onProgress = () => {},
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  const cleanSlug = mangaSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const pageUrls = [];
  let uploaded = 0;
  let failed = 0;

  // Check if Cloudflare R2 is available on server
  const r2Info = await getR2Status();
  const useR2 = Boolean(r2Info?.configured);

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const pageNum = i + 1;
    const paddedNum = String(pageNum).padStart(3, '0');
    const ext = item.filename.split('.').pop()?.toLowerCase() || 'webp';
    let publicUrl = '';

    try {
      if (useR2) {
        // Upload to Cloudflare R2
        publicUrl = await uploadChapterPageToR2({
          mangaSlug: cleanSlug,
          chapterNumber,
          pageNumber: pageNum,
          blob: item.blob,
          filename: item.filename,
        });
      } else {
        // Fallback to Supabase Storage 'manga-chapters' bucket
        const storagePath = `${cleanSlug}/ch-${chapterNumber}/${paddedNum}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('manga-chapters')
          .upload(storagePath, item.blob, {
            cacheControl: '31536000',
            upsert: true,
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          });

        if (uploadErr) {
          throw new Error(uploadErr.message);
        }

        const { data: { publicUrl: sbUrl } } = supabase.storage
          .from('manga-chapters')
          .getPublicUrl(storagePath);
        publicUrl = sbUrl;
      }

      pageUrls.push(publicUrl);
      uploaded++;

      // Optionally record in chapter_pages if chapterId is known
      if (chapterId) {
        await supabase.from('chapter_pages').upsert(
          {
            chapter_id: chapterId,
            page_number: pageNum,
            image_url: publicUrl,
          },
          { onConflict: 'chapter_id, page_number' }
        );
      }
    } catch (err) {
      console.warn(`[BulkImport] Sahifa ${pageNum} yuklanmadi (${useR2 ? 'R2' : 'Supabase'}):`, err.message);
      failed++;
    }

    onProgress(Math.round(((i + 1) / images.length) * 100));
  }

  // Update chapter pages_count if chapter exists
  if (chapterId && uploaded > 0) {
    await supabase
      .from('chapters')
      .update({ pages_count: uploaded })
      .eq('id', chapterId);
  }

  return { uploaded, failed, pageUrls };
}

/**
 * Execute batched database insertion of validated manga rows.
 * @param {Array<any>} validatedRows
 * @param {object} options
 * @param {boolean} options.skipDuplicates
 * @param {Map<string, string>} options.genreNameToIdMap
 * @param {function} [options.onProgress]
 * @returns {Promise<{ inserted: number, updated: number, failed: number, errors: string[] }>}
 */
export async function executeMangaBulkImport(validatedRows, { skipDuplicates = true, genreNameToIdMap = new Map(), onProgress = () => {} }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];

  const rowsToProcess = validatedRows.filter((vr) => vr.isValid);
  const total = rowsToProcess.length;

  for (let i = 0; i < total; i += IMPORT_LIMITS.DB_BATCH_SIZE) {
    const chunk = rowsToProcess.slice(i, i + IMPORT_LIMITS.DB_BATCH_SIZE);

    for (const item of chunk) {
      const r = item.row;

      if (item.isDuplicate && skipDuplicates) {
        continue;
      }

      const mangaPayload = {
        slug: r.slug,
        title: r.title,
        title_en: r.titleEn || null,
        author: r.author || 'Noma\'lum',
        type: r.type,
        status: r.status,
        rating: r.rating,
        synopsis: r.synopsis,
        featured_tagline: r.featuredTagline || null,
        is_featured: r.isFeatured,
        is_popular: r.isPopular,
        is_new: r.isNew,
        cover_url: r.coverUrl || null,
        banner_url: r.bannerUrl || null,
      };

      try {
        let savedMangaId = null;

        if (item.isDuplicate && !skipDuplicates) {
          // Update existing
          const { data, error: upErr } = await supabase
            .from('mangas')
            .update(mangaPayload)
            .eq('slug', r.slug)
            .select('id')
            .single();

          if (upErr) throw upErr;
          savedMangaId = data.id;
          updated++;
        } else {
          // Insert new
          const { data, error: inErr } = await supabase
            .from('mangas')
            .insert(mangaPayload)
            .select('id')
            .single();

          if (inErr) throw inErr;
          savedMangaId = data.id;
          inserted++;
        }

        // Link genres if mapped
        if (savedMangaId && Array.isArray(r.genres) && r.genres.length > 0) {
          const matchedGenreIds = r.genres
            .map((g) => genreNameToIdMap.get(g))
            .filter(Boolean);

          if (matchedGenreIds.length > 0) {
            const junctionRows = matchedGenreIds.map((gId) => ({
              manga_id: savedMangaId,
              genre_id: gId,
            }));
            await supabase.from('manga_genres').upsert(junctionRows, { onConflict: 'manga_id, genre_id' });
          }
        }
      } catch (err) {
        failed++;
        errors.push(`[Qator ${r.index}] "${r.title}" importida xatolik: ${err.message}`);
      }
    }

    onProgress(Math.round((Math.min(i + IMPORT_LIMITS.DB_BATCH_SIZE, total) / total) * 100));
  }

  return { inserted, updated, failed, errors };
}

/**
 * Execute batched database insertion of validated chapter rows.
 * @param {Array<any>} validatedRows
 * @param {object} options
 * @param {boolean} options.skipDuplicates
 * @param {function} [options.onProgress]
 * @returns {Promise<{ inserted: number, updated: number, failed: number, errors: string[] }>}
 */
export async function executeChaptersBulkImport(validatedRows, { skipDuplicates = true, onProgress = () => {} }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase ulanishi mavjud emas');
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];

  const rowsToProcess = validatedRows.filter((vr) => vr.isValid);
  const total = rowsToProcess.length;

  for (let i = 0; i < total; i += IMPORT_LIMITS.DB_BATCH_SIZE) {
    const chunk = rowsToProcess.slice(i, i + IMPORT_LIMITS.DB_BATCH_SIZE);

    for (const item of chunk) {
      const r = item.row;

      if (item.isDuplicate && skipDuplicates) {
        continue;
      }

      // Ensure manga_id is a UUID to prevent PostgreSQL 22P02 syntax error
      let chapterMangaId = r.mangaId;
      if (!isUUID(chapterMangaId)) {
        const resolved = await resolveMangaUuid(r.mangaSlug || chapterMangaId);
        if (resolved) {
          chapterMangaId = resolved;
        }
      }

      const chapterPayload = {
        manga_id: chapterMangaId,
        chapter_number: r.chapterNumber,
        title: r.title,
        pages_count: r.pagesCount,
        published_at: r.publishedAt,
      };

      try {
        if (item.isDuplicate && !skipDuplicates) {
          const { error: upErr } = await supabase
            .from('chapters')
            .update(chapterPayload)
            .match({ manga_id: chapterMangaId, chapter_number: r.chapterNumber });

          if (upErr) throw upErr;
          updated++;
        } else {
          const { error: inErr } = await supabase
            .from('chapters')
            .insert(chapterPayload);

          if (inErr) throw inErr;
          inserted++;
        }
      } catch (err) {
        failed++;
        errors.push(`[Qator ${r.index}] "${r.mangaSlug}" ${r.chapterNumber}-bob importida xatolik: ${err.message}`);
      }
    }

    onProgress(Math.round((Math.min(i + IMPORT_LIMITS.DB_BATCH_SIZE, total) / total) * 100));
  }

  return { inserted, updated, failed, errors };
}
