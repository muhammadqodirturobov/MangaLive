import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import {
  uploadToR2,
  checkR2ObjectExists,
  getR2DeliveryUrl,
} from './r2Storage.js';
import { getImageDimensions } from './sourceAdapters/MangaboxPublicConnector.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadEnv() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      fs.readFileSync(p, 'utf8').split('\n').forEach((l) => {
        const parts = l.trim().split('=');
        if (parts.length >= 2 && !parts[0].startsWith('#')) {
          env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      });
    }
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MANGABOX_API = 'https://api.mangabox.uz';

function deterministicUuid(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-');
}

async function asyncPool(limit, items, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchWithRetry(url, fetchOpts = {}, { retries = 3, initialDelayMs = 800, timeoutMs = 15000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Fetch timeout of ${timeoutMs}ms exceeded`)), timeoutMs);
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 401 || res.status === 403) {
        const err = new Error(`HTTP ${res.status} Unauthorized / Locked`);
        err.statusCode = res.status;
        throw err;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (err.statusCode === 401 || err.statusCode === 403) {
        throw err; // Do not retry auth blocks
      }
      if (attempt < retries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

async function fetchBufferWithRetry(url, fetchOpts = {}, { retries = 3, initialDelayMs = 1000, timeoutMs = 60000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Buffer download timeout of ${timeoutMs}ms exceeded`)), timeoutMs);
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
      });
      if (res.status === 401 || res.status === 403) {
        const err = new Error(`HTTP ${res.status} Unauthorized / Locked`);
        err.statusCode = res.status;
        throw err;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      clearTimeout(timer);
      return { buffer: buf, contentType: res.headers.get('content-type') || 'image/webp' };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (err.statusCode === 401 || err.statusCode === 403) {
        throw err;
      }
      if (attempt < retries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

// ── Source Connectors ────────────────────────────────────────────────────────

let mbSession = null;
async function getMangaboxSession() {
  if (mbSession) return mbSession;
  const res = await fetch(`${MANGABOX_API}/api/guest-session`, {
    method: 'POST',
    headers: {
      'User-Agent': BROWSER_UA,
      'Origin': 'https://mangabox.uz',
      'Referer': 'https://mangabox.uz/',
    },
  });
  const data = await res.json();
  mbSession = { token: data.token, cookie: res.headers.get('set-cookie') || '' };
  return mbSession;
}

async function fetchMangaboxChapters(slug) {
  const session = await getMangaboxSession();
  const res = await fetch(`${MANGABOX_API}/api/mangas/${slug}/chapters?page=1&limit=200&sort=asc`, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Origin': 'https://mangabox.uz',
      'Referer': 'https://mangabox.uz/',
      'Authorization': `Bearer ${session.token}`,
      ...(session.cookie ? { 'Cookie': session.cookie } : {}),
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch chapters for ${slug}: HTTP ${res.status}`);
  const json = await res.json();
  const rawChapters = json.data || json || [];
  return rawChapters.map((ch) => {
    const numMatch = (ch.name || ch.folder || '').match(/(\d+(?:\.\d+)?)/);
    const num = numMatch ? parseFloat(numMatch[1]) : 0;
    return {
      number: num,
      title: ch.name || `Bob ${num}`,
      folder: ch.folder,
      isLocked: !!ch.isLocked || !!ch.requiresLogin || !!ch.requiresPro,
    };
  }).filter((c) => c.number > 0).sort((a, b) => a.number - b.number);
}

async function fetchMangaboxChapterPages(slug, folder) {
  const session = await getMangaboxSession();
  try {
    const res = await fetchWithRetry(`${MANGABOX_API}/api/mangas/${slug}/${folder}/pages`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Origin': 'https://mangabox.uz',
        'Referer': 'https://mangabox.uz/',
        'Authorization': `Bearer ${session.token}`,
        ...(session.cookie ? { 'Cookie': session.cookie } : {}),
      },
    }, { retries: 2, initialDelayMs: 600 });
    const json = await res.json();
    return { pages: json.pages || [], locked: false };
  } catch (err) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return { pages: [], locked: true };
    }
    throw err;
  }
}

async function fetchMangaLabChapters(slug) {
  const chapterLinks = [];
  const res = await fetchWithRetry(`https://mangalab.uz/${slug}/`, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  }, { retries: 4, initialDelayMs: 1000, timeoutMs: 15000 });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes(`/${slug}/`) && href.includes('/bob/')) {
      chapterLinks.push(href);
    }
  });

  try {
    const listRes = await fetchWithRetry(`https://mangalab.uz/${slug}/chapters/?order=asc`, {
      headers: {
        'User-Agent': BROWSER_UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://mangalab.uz/${slug}/`,
      },
    }, { retries: 3, initialDelayMs: 1000, timeoutMs: 15000 });
    const listHtml = await listRes.text();
    const $list = cheerio.load(listHtml);
    $list('a').each((_, el) => {
      const href = $list(el).attr('href') || '';
      if (href.includes('/bob/')) {
        chapterLinks.push(href);
      }
    });
  } catch (e) {
    console.warn(`MangaLab ajax chapter list warning: ${e.message}`);
  }

  const seen = new Set();
  const chapters = [];
  for (const href of chapterLinks) {
    const m = href.match(/\/bob\/(\d+)/);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      chapters.push({
        number: parseInt(m[1], 10),
        title: `${m[1]}-bob`,
        href,
        isLocked: false,
      });
    }
  }
  return chapters.sort((a, b) => a.number - b.number);
}

async function fetchTopmangaChapters(topmangaSlug) {
  const url = `https://auth.topmanga.uz/api/manga/${topmangaSlug}/chapters/`;
  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Origin': 'https://topmanga.uz',
      'Referer': 'https://topmanga.uz/',
    },
  }, { retries: 3, initialDelayMs: 1000, timeoutMs: 25000 });
  const rawChapters = await res.json();
  return (rawChapters || []).map((ch) => {
    const numMatch = (ch.title || '').match(/(\d+(?:\.\d+)?)/);
    const num = numMatch ? parseFloat(numMatch[1]) : 0;
    const sortedImages = (ch.images || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    return {
      number: num,
      title: ch.title || `Bob ${num}`,
      isLocked: !!ch.locked || ch.is_free === false || ch.access_type === 'paid',
      pages: sortedImages.map((img, idx) => ({
        pageNumber: idx + 1,
        url: img.url,
      })),
      sourceType: 'topmanga',
    };
  }).filter((c) => c.number > 0).sort((a, b) => a.number - b.number);
}

async function fetchMangaLabChapterPages(chapterPath) {
  const url = chapterPath.startsWith('http') ? chapterPath : `https://mangalab.uz${chapterPath}`;
  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  }, { retries: 3, initialDelayMs: 1000 });

  const rawSetCookie = res.headers.get('set-cookie') || '';
  const sessionCookie = rawSetCookie.split(';')[0];
  const html = await res.text();

  const startIdx = html.indexOf('[{"id":');
  if (startIdx === -1) throw new Error('Could not find page JSON array in HTML');

  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') {
      depth--;
      if (depth === 0) { endIdx = i + 1; break; }
    }
  }
  if (endIdx === -1) throw new Error('Could not find end of page JSON');
  const pageData = JSON.parse(html.slice(startIdx, endIdx));
  pageData.sort((a, b) => a.id - b.id);

  const pages = [];
  let pageIdx = 1;
  for (const p of pageData) {
    if (Array.isArray(p.segments) && p.segments.length > 0) {
      for (const seg of p.segments) {
        if (seg.url) pages.push({ pageNumber: pageIdx++, url: seg.url, width: seg.width, height: seg.height });
      }
    } else if (p.url) {
      pages.push({ pageNumber: pageIdx++, url: p.url, width: p.width, height: p.height });
    }
  }

  return { pages, sessionCookie, referer: url };
}

// ── Bulk Engine Class ───────────────────────────────────────────────────────

export class FastBulkImporter {
  constructor(options = {}) {
    this.chapterConcurrency = options.chapterConcurrency || 3;
    this.pageConcurrency = options.pageConcurrency || 5;
    this.rateLimit = options.rateLimit || 100;
    this.retries = options.retries || 3;
    this.limitChapters = options.limitChapters || null;
    this.metrics = {
      startTime: Date.now(),
      pagesCompleted: 0,
      pagesSkipped: 0,
      chaptersCompleted: 0,
      bytesUploaded: 0,
      failures: 0,
      retries: 0,
    };
  }

  startTicker(seriesName, totalChapters, totalPagesEst) {
    this.tickerInterval = setInterval(() => {
      const elapsedSec = Math.max(1, (Date.now() - this.metrics.startTime) / 1000);
      const ppm = Math.round((this.metrics.pagesCompleted / elapsedSec) * 60);
      const kbps = Math.round(this.metrics.bytesUploaded / 1024 / elapsedSec);
      const remainingPages = Math.max(0, totalPagesEst - this.metrics.pagesCompleted);
      const etaMin = ppm > 0 ? (remainingPages / ppm).toFixed(1) : '?';

      console.log(
        `[BULK PROGRESS] ${seriesName} | Chapters: ${this.metrics.chaptersCompleted}/${totalChapters} | Pages: ${this.metrics.pagesCompleted} (Skipped: ${this.metrics.pagesSkipped}) (${ppm} pg/min, ${kbps} KB/s) | ETA: ~${etaMin}m | Retries: ${this.metrics.retries} | Failures: ${this.metrics.failures}`
      );
    }, 6000);
  }

  stopTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
  }

  async importSeries(seriesConfig) {
    const { name, slug, sourceUrl, isMangaLab } = seriesConfig;
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🚀 STARTING BULK IMPORT: ${name} (${slug})`);
    console.log(`Chapter Concurrency: ${this.chapterConcurrency} | Page Concurrency: ${this.pageConcurrency}`);
    console.log(`${'═'.repeat(70)}\n`);

    // 1. Resolve Manga Record in DB
    const { data: dbManga } = await supabase.from('mangas').select('id, chapters_count').eq('slug', slug).single();
    if (!dbManga) {
      console.error(`❌ Manga record for ${slug} does not exist in Supabase!`);
      return;
    }
    const mangaId = dbManga.id;

    // 2. Query Existing Chapters in Supabase
    const { data: existingChapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, pages_count')
      .eq('manga_id', mangaId);

    const existingMap = new Map();
    for (const c of existingChapters || []) {
      existingMap.set(c.chapter_number, c);
    }

    // 3. Discover Source Chapter List
    console.log(`Discovering remote source chapters for ${slug}…`);
    let sourceChapters = [];
    if (seriesConfig.sourceType === 'topmanga' || seriesConfig.topmangaSlug) {
      sourceChapters = await fetchTopmangaChapters(seriesConfig.topmangaSlug);
    } else if (isMangaLab || seriesConfig.sourceType === 'mangalab') {
      sourceChapters = await fetchMangaLabChapters(slug);
    } else {
      sourceChapters = await fetchMangaboxChapters(slug);
    }

    console.log(`Source reports ${sourceChapters.length} total chapters.`);

    // 4. Determine Missing or Incomplete Chapters
    const missingQueue = [];
    for (const sc of sourceChapters) {
      if (sc.isLocked) continue;
      const exist = existingMap.get(sc.number);
      if (!exist || exist.pages_count === 0) {
        missingQueue.push(sc);
      }
    }

    const toProcess = this.limitChapters ? missingQueue.slice(0, this.limitChapters) : missingQueue;
    console.log(`Total missing/incomplete chapters to process: ${toProcess.length}`);
    if (toProcess.length === 0) {
      console.log(`✅ All unlocked chapters for ${name} are already imported and published!\n`);
      return { chaptersImported: 0, pagesImported: 0 };
    }

    const estimatedPages = toProcess.length * 45;
    this.metrics.startTime = Date.now();
    this.startTicker(name, toProcess.length, estimatedPages);

    // 5. Process Chapters via Queue
    await asyncPool(this.chapterConcurrency, toProcess, async (ch) => {
      await this.processSingleChapter(slug, mangaId, ch, seriesConfig);
    });

    this.stopTicker();

    // 6. Update Final Manga Metadata in Supabase
    const { count: finalCount } = await supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('manga_id', mangaId);

    await supabase.from('mangas').update({
      chapters_count: finalCount || 0,
      last_updated_at: new Date().toISOString(),
    }).eq('id', mangaId);

    console.log(`\n✅ COMPLETED BULK IMPORT FOR: ${name} (Now has ${finalCount} published chapters)\n`);
    return {
      chaptersImported: this.metrics.chaptersCompleted,
      pagesImported: this.metrics.pagesCompleted,
    };
  }

  async processSingleChapter(slug, mangaId, ch, seriesConfig = {}) {
    const isMangaLab = seriesConfig.isMangaLab || seriesConfig.sourceType === 'mangalab';
    const isTopManga = seriesConfig.sourceType === 'topmanga' || ch.sourceType === 'topmanga';
    const chNum = ch.number;
    let pageList = [];
    let referer = 'https://mangabox.uz/';
    let sessionCookie = '';

    try {
      if (isTopManga) {
        pageList = ch.pages || [];
        referer = 'https://topmanga.uz/';
      } else if (isMangaLab) {
        const pageData = await fetchMangaLabChapterPages(ch.href);
        pageList = pageData.pages;
        referer = pageData.referer;
        sessionCookie = pageData.sessionCookie;
      } else {
        const pageData = await fetchMangaboxChapterPages(slug, ch.folder);
        if (pageData.locked) {
          console.log(`  [LOCKED] Chapter ${chNum} on MangaBox requires user login/pro. Skipping.`);
          return;
        }
        pageList = pageData.pages.map((url, idx) => ({ pageNumber: idx + 1, url }));
      }
    } catch (err) {
      console.error(`  ❌ Failed to fetch page URLs for Chapter ${chNum}: ${err.message}`);
      this.metrics.failures++;
      return;
    }

    if (!pageList || pageList.length === 0) {
      console.warn(`  ⚠️ Chapter ${chNum} returned 0 pages. Skipping.`);
      return;
    }

    const chapterUuid = deterministicUuid(`chapter:${mangaId}:${chNum}`);
    const pageRecords = [];
    let hasPageFailure = false;

    // Concurrently download and upload pages for this chapter
    await asyncPool(this.pageConcurrency, pageList, async (p) => {
      if (hasPageFailure) return;

      const ext = p.url.includes('.png') ? 'png' : p.url.includes('.webp') ? 'webp' : 'jpg';
      const objectKey = `manga/${slug}/chapters/${chNum}/${String(p.pageNumber).padStart(3, '0')}.${ext}`;
      const r2Url = getR2DeliveryUrl(objectKey);

      // Check R2 existence
      const exists = await checkR2ObjectExists(objectKey);
      if (exists) {
        this.metrics.pagesSkipped++;
        pageRecords.push({
          pageNumber: p.pageNumber,
          objectKey,
          r2Url,
          width: p.width || 800,
          height: p.height || 2000,
        });
        return;
      }

      // Download and upload with retries
      let uploaded = false;
      for (let attempt = 1; attempt <= this.retries; attempt++) {
        try {
          const { buffer: buf, contentType } = await fetchBufferWithRetry(p.url, {
            headers: {
              'User-Agent': BROWSER_UA,
              'Referer': referer,
              'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
              ...(sessionCookie ? { 'Cookie': sessionCookie } : {}),
            },
          }, { retries: 3, initialDelayMs: 1000, timeoutMs: 60000 });

          const dim = getImageDimensions(buf);

          await uploadToR2({
            key: objectKey,
            body: buf,
            contentType,
          });

          this.metrics.pagesCompleted++;
          this.metrics.bytesUploaded += buf.length;
          pageRecords.push({
            pageNumber: p.pageNumber,
            objectKey,
            r2Url,
            width: dim.width || p.width || 800,
            height: dim.height || p.height || 2000,
          });
          uploaded = true;
          break;
        } catch (err) {
          this.metrics.retries++;
          if (attempt === this.retries) {
            console.error(`    ❌ Page ${p.pageNumber} in Ch ${chNum} failed: ${err.message}`);
            hasPageFailure = true;
          } else {
            await sleep(500 * attempt);
          }
        }
      }

      if (this.rateLimit > 0) await sleep(this.rateLimit);
    });

    if (hasPageFailure || pageRecords.length !== pageList.length) {
      console.error(`  ❌ Chapter ${chNum} aborted (only ${pageRecords.length}/${pageList.length} pages succeeded). Not publishing to DB.`);
      this.metrics.failures++;
      return;
    }

    // ── Batch Database Inserts ──
    try {
      // 1. Upsert Chapter
      const { error: chErr } = await supabase.from('chapters').upsert({
        id: chapterUuid,
        manga_id: mangaId,
        chapter_number: chNum,
        title: ch.title || `Bob ${chNum}`,
        pages_count: pageRecords.length,
        published_at: new Date().toISOString(),
      }, { onConflict: 'manga_id,chapter_number' });

      if (chErr) throw chErr;

      // 2. Batch Insert Chapter Pages in Chunks of 60
      const pageRows = pageRecords.map((pr) => ({
        id: deterministicUuid(`page:${chapterUuid}:${pr.pageNumber}`),
        chapter_id: chapterUuid,
        page_number: pr.pageNumber,
        image_url: pr.r2Url,
        width: pr.width,
        height: pr.height,
      }));

      const CHUNK_SIZE = 60;
      for (let i = 0; i < pageRows.length; i += CHUNK_SIZE) {
        const chunk = pageRows.slice(i, i + CHUNK_SIZE);
        const { error: pErr } = await supabase.from('chapter_pages').upsert(chunk, {
          onConflict: 'chapter_id,page_number',
        });
        if (pErr) throw pErr;
      }

      this.metrics.chaptersCompleted++;
      console.log(`  ✓ Chapter ${chNum} published (${pageRecords.length} pages written to DB + R2)`);
    } catch (dbErr) {
      console.error(`  ❌ Database error for Chapter ${chNum}: ${dbErr.message}`);
      this.metrics.failures++;
    }
  }
}

// ── CLI Runner ─────────────────────────────────────────────────────────────

export const ALL_GENUINE_SERIES = [
  { name: 'Nano Machine', slug: 'nano-mashina', sourceUrl: 'https://mangalab.uz/nano-mashina/', isMangaLab: true, sourceType: 'mangalab' },
  { name: 'Solo Leveling: Ragnarok', slug: 'solo-leveling-ragnarok', sourceUrl: 'https://mangabox.uz/manga/solo-leveling-ragnarok', isMangaLab: false, sourceType: 'mangabox' },
  { name: '10 000 yil keyingi dunyoda darajani oshirish', slug: '10-000-yil-keyingi-dunyoda-darajani-oshirish', sourceUrl: 'https://auth.topmanga.uz/api/manga/kelajakka-10-000-yillik-sayohat/', isMangaLab: false, sourceType: 'topmanga', topmangaSlug: 'kelajakka-10-000-yillik-sayohat' },
  { name: '4000 yildan so\'ng qaytib kelgan arximag', slug: '4000-yildan-song-qaytib-kelgan-arximag', sourceUrl: 'https://mangabox.uz/manga/4000-yildan-song-qaytib-kelgan-arximag', isMangaLab: false, sourceType: 'mangabox' },
  { name: '66 666 yildan so‘ng: Qora sehrgarning qaytishi', slug: '66-666-yildan-song-qora-sehrgarning-qaytishi', sourceUrl: 'https://mangabox.uz/manga/66-666-yildan-song-qora-sehrgarning-qaytishi', isMangaLab: false, sourceType: 'mangabox' },
  { name: 'Mening shogirdlarim — hammalari katta yovuzlar', slug: 'mening-shogirdlarim-hammalari-katta-yovuzlar', sourceUrl: 'https://mangabox.uz/manga/mening-shogirdlarim-hammalari-katta-yovuzlar', isMangaLab: false, sourceType: 'mangabox' },
  { name: '1HP klubi (qayta boshlanish)', slug: '1hp-klubi-qayta-boshlanish', sourceUrl: 'https://mangabox.uz/manga/1hp-klubi-qayta-boshlanish', isMangaLab: false, sourceType: 'mangabox' },
];

async function main() {
  const args = process.argv.slice(2);
  const targetManga = args.find((a) => a.startsWith('--manga='))?.slice(8);
  const chapterConc = parseInt(args.find((a) => a.startsWith('--chapter-concurrency='))?.slice(22) || '3', 10);
  const pageConc = parseInt(args.find((a) => a.startsWith('--page-concurrency='))?.slice(19) || '5', 10);
  const limitCh = args.find((a) => a.startsWith('--limit-chapters=')) ? parseInt(args.find((a) => a.startsWith('--limit-chapters=')).slice(17), 10) : null;
  const isAll = args.includes('--all');

  const importer = new FastBulkImporter({
    chapterConcurrency: chapterConc,
    pageConcurrency: pageConc,
    rateLimit: 100,
    limitChapters: limitCh,
  });

  const targets = targetManga
    ? ALL_GENUINE_SERIES.filter((s) => s.slug === targetManga || s.slug.includes(targetManga))
    : isAll
    ? ALL_GENUINE_SERIES
    : [ALL_GENUINE_SERIES[0]];

  console.log(`Starting Fast Bulk Import for ${targets.length} series...`);
  for (const s of targets) {
    await importer.importSeries(s);
  }
}

if (process.argv[1]?.endsWith('bulkImporter.js')) {
  main().catch(console.error);
}
