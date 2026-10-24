import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { uploadToR2, checkR2ObjectExists, isR2Configured, getR2DeliveryUrl } from './r2Storage.js';
import { getImageDimensions } from './sourceAdapters/MangaboxPublicConnector.js';

// Safe environment loader
function loadEnv() {
  const env = { ...process.env };
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const text = fs.readFileSync(fullPath, 'utf8');
      text.split('\n').forEach((line) => {
        const parts = line.trim().split('=');
        if (parts.length >= 2 && !parts[0].startsWith('#')) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          if (!env[key]) env[key] = val;
        }
      });
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Generate a stable deterministic UUID v4-format from a seed string.
 * @param {string} seed
 * @returns {string}
 */
export function generateDeterministicUuid(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

/**
 * Exponential backoff retry wrapper.
 */
export async function withRetry(fn, { maxRetries = 3, initialDelayMs = 1000, factor = 2, logger = console } = {}) {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      const jitter = Math.random() * 200;
      logger.warn(`[Retry ${attempt}/${maxRetries}] Operation failed: ${err.message}. Retrying in ${Math.round(delay + jitter)}ms...`);
      await new Promise((r) => setTimeout(r, delay + jitter));
      delay *= factor;
    }
  }
}

/**
 * Bounded concurrency executor (pool pattern).
 */
export async function asyncPool(limit, items, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

/**
 * MangaLive.uz — Resumable Bulk Ingestion Engine
 */
export class IngestionEngine {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      concurrency: options.concurrency || 4,
      dryRun: Boolean(options.dryRun),
      limitManga: options.limitManga || null,
      limitChaptersPerManga: options.limitChaptersPerManga || null,
      journalPath: options.journalPath || path.resolve(process.cwd(), 'data', 'ingestion-journal.json'),
      sqlSeedPath: options.sqlSeedPath || path.resolve(process.cwd(), 'supabase', 'seed_catalog_batch.sql'),
      onProgress: options.onProgress || (() => {}),
      logger: options.logger || console,
    };

    this.journal = this.loadJournal();
  }

  loadJournal() {
    const { journalPath } = this.options;
    try {
      if (fs.existsSync(journalPath)) {
        const raw = fs.readFileSync(journalPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      this.options.logger.warn('Could not read existing journal, starting fresh:', e.message);
    }

    return {
      jobId: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      stats: {
        mangaProcessed: 0,
        chaptersCompleted: 0,
        chaptersSkipped: 0,
        chaptersFailed: 0,
        pagesUploaded: 0,
        totalBytesUploaded: 0,
        totalDurationMs: 0,
      },
      mangas: {},
    };
  }

  saveJournal() {
    const { journalPath } = this.options;
    try {
      const dir = path.dirname(journalPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.journal.lastUpdatedAt = new Date().toISOString();
      fs.writeFileSync(journalPath, JSON.stringify(this.journal, null, 2), 'utf8');
    } catch (e) {
      this.options.logger.error('Failed to write journal:', e.message);
    }
  }

  appendSqlSeed(sqlStatement) {
    const { sqlSeedPath, dryRun } = this.options;
    if (dryRun) return;

    try {
      const dir = path.dirname(sqlSeedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(sqlSeedPath, sqlStatement + '\n', 'utf8');
    } catch (e) {
      this.options.logger.warn('Failed to append to SQL seed file:', e.message);
    }
  }

  /**
   * Run bulk synchronization across the catalog.
   * @param {object} [syncOptions]
   * @param {string} [syncOptions.targetMangaSlug]
   * @returns {Promise<object>}
   */
  async runSync({ targetMangaSlug = null } = {}) {
    const { logger, dryRun, concurrency, limitManga, limitChaptersPerManga } = this.options;
    const startTime = Date.now();

    logger.log('\n====================================================');
    logger.log(`  MangaLive.uz — Resumable Ingestion Pipeline [DryRun: ${dryRun}]`);
    logger.log('====================================================');
    logger.log(`Page Upload Concurrency: ${concurrency}`);
    logger.log(`Journal Checkpoint:      ${this.options.journalPath}`);

    if (!isR2Configured() && !dryRun) {
      throw new Error('Cloudflare R2 is not configured in server environment');
    }

    // 1. Adapter Status Check
    const adapterStatus = await this.adapter.checkStatus();
    if (!adapterStatus.enabled) {
      logger.error(`Source adapter "${this.adapter.name}" is disabled:`, adapterStatus.reason);
      return { status: 'ADAPTER_DISABLED', reason: adapterStatus.reason };
    }

    // 2. Discover manga catalog
    let mangaCatalog = [];
    if (typeof this.adapter.discoverCatalog === 'function') {
      const cat = await this.adapter.discoverCatalog({ limit: 1000 });
      mangaCatalog = cat.items;
    } else if (typeof this.adapter.discoverManga === 'function') {
      mangaCatalog = await this.adapter.discoverManga();
    }

    let targets = targetMangaSlug
      ? mangaCatalog.filter((m) => m.slug === targetMangaSlug)
      : mangaCatalog;

    if (limitManga && limitManga > 0) {
      targets = targets.slice(0, limitManga);
    }

    logger.log(`\nDiscovered ${targets.length} target manga(s) for this run.\n`);

    // In-memory empirical samples for projections
    const samplePageSizes = [];
    const samplePageUploadTimes = [];

    for (let mIdx = 0; mIdx < targets.length; mIdx++) {
      const mangaHeader = targets[mIdx];
      const slug = mangaHeader.slug;

      logger.log(`\n────────────────────────────────────────────────────`);
      logger.log(`[Manga ${mIdx + 1}/${targets.length}] "${mangaHeader.title}" (${slug})`);

      // Initialize or get journal entry
      if (!this.journal.mangas[slug]) {
        this.journal.mangas[slug] = {
          slug,
          title: mangaHeader.title,
          status: 'IN_PROGRESS',
          completedChapters: [],
          failedChapters: [],
          coverUploaded: false,
          r2CoverUrl: null,
        };
      }
      const mangaJournal = this.journal.mangas[slug];

      // 3. Fetch full metadata & Cover Quality Check
      let details = mangaHeader;
      if (typeof this.adapter.fetchMangaDetails === 'function') {
        try {
          details = await this.adapter.fetchMangaDetails(slug);
        } catch (e) {
          logger.warn(`Could not fetch full details for ${slug}, using catalog header:`, e.message);
        }
      }

      const mangaUuid = generateDeterministicUuid(`manga:${slug}`);

      // 4. Ingest Cover to R2 with Quality Guard
      if (!mangaJournal.coverUploaded && details.coverUrl && !dryRun) {
        try {
          if (typeof this.adapter.fetchCoverAsset === 'function') {
            const coverAsset = await this.adapter.fetchCoverAsset(details.coverUrl);

            // Anti-degradation check: minimum 300px width and >10KB
            if (coverAsset.width >= 300 && coverAsset.size > 10000) {
              const ext = coverAsset.format === 'jpeg' ? 'jpg' : coverAsset.format;
              const objectKey = `manga/${slug}/cover.${ext}`;

              logger.log(`Uploading Cover: ${coverAsset.width}x${coverAsset.height} px (${Math.round(coverAsset.size / 1024)} KB)...`);
              const uploadRes = await uploadToR2({
                key: objectKey,
                body: coverAsset.buffer,
                contentType: coverAsset.contentType,
              });

              mangaJournal.coverUploaded = true;
              mangaJournal.r2CoverUrl = uploadRes.publicUrl;
              this.journal.stats.totalBytesUploaded += coverAsset.size;
              logger.log(`Cover saved to R2 -> ${uploadRes.publicUrl}`);
            } else {
              logger.warn(`Cover for ${slug} rejected by quality guard (${coverAsset.width}x${coverAsset.height}, ${coverAsset.size} bytes)`);
            }
          }
        } catch (covErr) {
          logger.warn(`Cover upload error for ${slug}:`, covErr.message);
        }
        this.saveJournal();
      }

      // 5. Append Manga record to SQL Seed
      const coverUrlForDb = mangaJournal.r2CoverUrl || details.coverUrl || null;
      const escapedTitle = (details.title || '').replace(/'/g, "''");
      const escapedTitleEn = (details.titleEn || '').replace(/'/g, "''");
      const rawAuthor = details.author;
      const authorStr = typeof rawAuthor === 'string'
        ? rawAuthor
        : Array.isArray(rawAuthor)
          ? rawAuthor.map((a) => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ')
          : 'Mangabox';
      const escapedAuthor = (authorStr || 'Mangabox').replace(/'/g, "''");
      const escapedSynopsis = (details.synopsis || '').replace(/'/g, "''");

      this.appendSqlSeed(`
-- Manga: ${escapedTitle}
INSERT INTO public.mangas (
  id, slug, title, title_en, author, type, status, rating, rating_count, synopsis, cover_url, is_featured, is_popular, is_new
) VALUES (
  '${mangaUuid}', '${slug}', '${escapedTitle}', '${escapedTitleEn}', '${escapedAuthor}', '${details.type || 'manhua'}', '${details.status || 'davom etmoqda'}', ${details.rating || 4.8}, ${details.ratingCount || 10}, '${escapedSynopsis}', ${coverUrlForDb ? `'${coverUrlForDb}'` : 'NULL'}, true, true, true
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, title_en = EXCLUDED.title_en, author = EXCLUDED.author, cover_url = COALESCE(EXCLUDED.cover_url, mangas.cover_url), synopsis = EXCLUDED.synopsis;
`);

      // 6. Discover unlocked chapters
      const discoveredChapters = await this.adapter.discoverChapters(slug);
      logger.log(`Discovered ${discoveredChapters.length} unlocked/permitted chapter(s) for ${slug}.`);

      let chaptersToProcess = discoveredChapters;
      if (limitChaptersPerManga && limitChaptersPerManga > 0) {
        chaptersToProcess = chaptersToProcess.slice(0, limitChaptersPerManga);
      }

      for (const ch of chaptersToProcess) {
        const chNum = ch.chapterNumber;

        // Resumable check: Skip if already completed in journal
        if (mangaJournal.completedChapters.includes(chNum)) {
          logger.log(`[Resume] Chapter ${chNum} already completed in journal — Skipping.`);
          this.journal.stats.chaptersSkipped++;
          continue;
        }

        logger.log(`\nProcessing Chapter ${chNum}: "${ch.title}" (${ch.pageCount || '?'} pages)...`);

        if (dryRun) {
          logger.log(`[DryRun] Would fetch and upload all pages for Chapter ${chNum}`);
          mangaJournal.completedChapters.push(chNum);
          this.journal.stats.chaptersCompleted++;
          this.saveJournal();
          continue;
        }

        // 7. Download pages with retry
        let rawPages = [];
        try {
          rawPages = await withRetry(
            () =>
              this.adapter.fetchChapterPages({
                mangaSlug: slug,
                chapterNumber: chNum,
                chapterRef: ch.chapterRef,
              }),
            { maxRetries: 3, initialDelayMs: 1500, logger }
          );
        } catch (fetchErr) {
          logger.error(`Failed to fetch pages for Chapter ${chNum}:`, fetchErr.message);
          mangaJournal.failedChapters.push({ chapterNumber: chNum, error: fetchErr.message });
          this.journal.stats.chaptersFailed++;
          this.saveJournal();
          continue;
        }

        if (!rawPages || rawPages.length === 0) {
          logger.warn(`Chapter ${chNum} returned 0 pages — Skipping.`);
          this.journal.stats.chaptersSkipped++;
          continue;
        }

        // 8. Validate, inspect dimensions & natural sort
        const validatedPages = [];
        for (const p of rawPages) {
          if (!p.buffer || p.buffer.length < 500) {
            logger.warn(`Corrupted page buffer on page ${p.pageNumber} — skipping page`);
            continue;
          }
          const dim = getImageDimensions(p.buffer);
          validatedPages.push({
            pageNumber: p.pageNumber,
            buffer: p.buffer,
            width: dim.width,
            height: dim.height,
            format: dim.format,
            contentType: p.contentType || `image/${dim.format === 'jpeg' ? 'jpeg' : dim.format}`,
          });
        }

        // Natural sort by pageNumber
        validatedPages.sort((a, b) => a.pageNumber - b.pageNumber);

        // 9. Upload pages to Cloudflare R2 with bounded concurrency
        const chapterUuid = generateDeterministicUuid(`chapter:${slug}:${chNum}`);
        let chapterUploadFailed = false;
        const pageRecords = [];

        await asyncPool(concurrency, validatedPages, async (page) => {
          if (chapterUploadFailed) return;

          const paddedNum = String(page.pageNumber).padStart(3, '0');
          const ext = page.format === 'jpeg' ? 'jpg' : page.format === 'png' ? 'png' : 'webp';
          const objectKey = `manga/${slug}/chapters/${chNum}/${paddedNum}.${ext}`;

          const pageStart = Date.now();

          try {
            // Idempotent R2 check: skip if object already exists in bucket
            const alreadyExists = await checkR2ObjectExists(objectKey);

            let publicUrl = getR2DeliveryUrl(objectKey);
            if (!alreadyExists) {
              const uploadRes = await withRetry(
                () =>
                  uploadToR2({
                    key: objectKey,
                    body: page.buffer,
                    contentType: page.contentType,
                  }),
                { maxRetries: 3, logger }
              );
              publicUrl = uploadRes.publicUrl;
            }

            const pageElapsed = Date.now() - pageStart;
            samplePageUploadTimes.push(pageElapsed);
            samplePageSizes.push(page.buffer.length);

            this.journal.stats.pagesUploaded++;
            this.journal.stats.totalBytesUploaded += page.buffer.length;

            pageRecords.push({
              pageNumber: page.pageNumber,
              objectKey,
              publicUrl,
              width: page.width,
              height: page.height,
            });
          } catch (upErr) {
            chapterUploadFailed = true;
            logger.error(`Upload failed for page ${page.pageNumber}:`, upErr.message);
          }
        });

        if (chapterUploadFailed || pageRecords.length !== validatedPages.length) {
          logger.error(`Chapter ${chNum} aborted: not all pages uploaded successfully.`);
          mangaJournal.failedChapters.push({ chapterNumber: chNum, error: 'Partial page upload failure' });
          this.journal.stats.chaptersFailed++;
          this.saveJournal();
          continue;
        }

        // 10. Append Chapter and Pages to SQL Seed
        pageRecords.sort((a, b) => a.pageNumber - b.pageNumber);

        const escapedChTitle = (ch.title || `${chNum}-bob`).replace(/'/g, "''");
        let sqlCh = `
-- Chapter ${chNum} of ${slug}
INSERT INTO public.chapters (id, manga_id, chapter_number, title, pages_count, published_at)
VALUES ('${chapterUuid}', '${mangaUuid}', ${chNum}, '${escapedChTitle}', ${pageRecords.length}, now())
ON CONFLICT (manga_id, chapter_number) DO UPDATE SET title = EXCLUDED.title, pages_count = EXCLUDED.pages_count;

INSERT INTO public.chapter_pages (id, chapter_id, page_number, image_url) VALUES
`;
        const pageInserts = pageRecords.map((p) => {
          const pageUuid = generateDeterministicUuid(`page:${slug}:${chNum}:${p.pageNumber}`);
          return `  ('${pageUuid}', '${chapterUuid}', ${p.pageNumber}, '${p.publicUrl}')`;
        });
        sqlCh += pageInserts.join(',\n') + '\nON CONFLICT (chapter_id, page_number) DO UPDATE SET image_url = EXCLUDED.image_url;\n';

        this.appendSqlSeed(sqlCh);

        // Update journal
        mangaJournal.completedChapters.push(chNum);
        this.journal.stats.chaptersCompleted++;
        this.saveJournal();

        logger.log(`✅ Chapter ${chNum} successfully ingested: ${pageRecords.length} pages verified in R2.`);
      }

      mangaJournal.status = 'COMPLETED';
      this.journal.stats.mangaProcessed++;
      this.saveJournal();
    }

    const totalDurationMs = Date.now() - startTime;
    this.journal.stats.totalDurationMs += totalDurationMs;
    this.saveJournal();

    // 11. Compute Empirical Metrics & Projections
    const empiricalMetrics = this.computeMetrics(samplePageSizes, samplePageUploadTimes, totalDurationMs);

    logger.log('\n====================================================');
    logger.log('🎉 INGESTION RUN FINISHED — EMPIRICAL METRICS & AUDIT');
    logger.log('====================================================');
    logger.log(`Chapters Completed: ${this.journal.stats.chaptersCompleted}`);
    logger.log(`Chapters Skipped:   ${this.journal.stats.chaptersSkipped}`);
    logger.log(`Chapters Failed:    ${this.journal.stats.chaptersFailed}`);
    logger.log(`Pages Uploaded:     ${this.journal.stats.pagesUploaded}`);
    logger.log(`Total Volume:       ${(this.journal.stats.totalBytesUploaded / (1024 * 1024)).toFixed(2)} MB`);
    logger.log(`Elapsed Runtime:    ${(totalDurationMs / 1000).toFixed(1)} s`);

    return {
      status: 'SUCCESS',
      stats: this.journal.stats,
      metrics: empiricalMetrics,
    };
  }

  /**
   * Compute empirical projections from measured sample data.
   */
  computeMetrics(pageSizes, uploadTimes, durationMs) {
    if (pageSizes.length === 0) {
      return { sampleCount: 0 };
    }

    const totalBytes = pageSizes.reduce((a, b) => a + b, 0);
    const avgPageSizeBytes = totalBytes / pageSizes.length;
    const avgPageSizeKb = Math.round(avgPageSizeBytes / 1024);

    const avgUploadTimeMs = uploadTimes.length > 0 ? uploadTimes.reduce((a, b) => a + b, 0) / uploadTimes.length : 300;
    const pagesPerSecond = durationMs > 0 ? (pageSizes.length / (durationMs / 1000)).toFixed(2) : 0;

    const estimatedPagesPerChapter = 20;
    const estimatedChapterMb = ((avgPageSizeBytes * estimatedPagesPerChapter) / (1024 * 1024)).toFixed(2);

    // Cost model: Cloudflare R2 standard storage = $0.015 / GB-month, Egress = $0.00 (Free)
    const gbPer100Chapters = ((avgPageSizeBytes * estimatedPagesPerChapter * 100) / (1024 * 1024 * 1024)).toFixed(2);
    const gbPer1000Chapters = ((avgPageSizeBytes * estimatedPagesPerChapter * 1000) / (1024 * 1024 * 1024)).toFixed(2);
    const gbPer10000Chapters = ((avgPageSizeBytes * estimatedPagesPerChapter * 10000) / (1024 * 1024 * 1024)).toFixed(2);

    return {
      samplesMeasured: pageSizes.length,
      averagePageSizeKb: avgPageSizeKb,
      averagePageUploadTimeMs: Math.round(avgUploadTimeMs),
      measuredThroughputPagesPerSec: Number(pagesPerSecond),
      estimatedChapterSizeMb: Number(estimatedChapterMb),
      storageProjections: {
        chapters100: {
          pages: 100 * estimatedPagesPerChapter,
          estimatedGb: Number(gbPer100Chapters),
          monthlyCostR2: `$${(Number(gbPer100Chapters) * 0.015).toFixed(3)}`,
          egressCost: '$0.00 (Zero Egress Fees)',
        },
        chapters1000: {
          pages: 1000 * estimatedPagesPerChapter,
          estimatedGb: Number(gbPer1000Chapters),
          monthlyCostR2: `$${(Number(gbPer1000Chapters) * 0.015).toFixed(2)}`,
          egressCost: '$0.00 (Zero Egress Fees)',
        },
        chapters10000: {
          pages: 10000 * estimatedPagesPerChapter,
          estimatedGb: Number(gbPer10000Chapters),
          monthlyCostR2: `$${(Number(gbPer10000Chapters) * 0.015).toFixed(2)}`,
          egressCost: '$0.00 (Zero Egress Fees)',
        },
      },
    };
  }
}
