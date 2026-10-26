import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  uploadToR2,
  checkR2ObjectExists,
  getR2DeliveryUrl,
} from '../server/r2Storage.js';
import { getImageDimensions } from '../server/sourceAdapters/MangaboxPublicConnector.js';

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

async function fetchWithRetry(url, fetchOpts = {}, { retries = 3, initialDelayMs = 1000, timeoutMs = 35000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 401 || res.status === 403) {
        const err = new Error(`HTTP ${res.status} Unauthorized / Locked`);
        err.statusCode = res.status;
        throw err;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (err.statusCode === 401 || err.statusCode === 403) throw err;
      if (attempt < retries) {
        await sleep(initialDelayMs * attempt + Math.random() * 300);
      }
    }
  }
  throw lastErr;
}

async function fetchBufferWithRetry(url, fetchOpts = {}, { retries = 3, initialDelayMs = 1000, timeoutMs = 45000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 401 || res.status === 403) {
        const err = new Error(`HTTP ${res.status} Unauthorized / Locked`);
        err.statusCode = res.status;
        throw err;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return { buffer: buf, contentType: res.headers.get('content-type') || 'image/webp' };
    } catch (err) {
      lastErr = err;
      if (err.statusCode === 401 || err.statusCode === 403) throw err;
      if (attempt < retries) {
        await sleep(initialDelayMs * attempt + Math.random() * 400);
      }
    }
  }
  throw lastErr;
}

// ── Mangabox Connector Helpers ────────────────────────────────────────────────
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
  }).filter((c) => c.number > 0 && !c.isLocked).sort((a, b) => a.number - b.number);
}

async function fetchMangaboxChapterPages(slug, folder) {
  const session = await getMangaboxSession();
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
  return (json.pages || []).map((url, idx) => ({ pageNumber: idx + 1, url }));
}

// ── TopManga Connector Helpers ────────────────────────────────────────────────
function parseTopmangaChapterNumber(rawTitle, index) {
  const t = String(rawTitle || '').trim();
  const dashMatch = t.match(/[-–—]\s*(\d+(?:\.\d+)?)/);
  if (dashMatch) {
    const n = Math.round(parseFloat(dashMatch[1]));
    if (n > 0) return n;
  }
  const singleMatch = t.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const n = Math.round(parseFloat(singleMatch[1]));
    if (n > 0) return n;
  }
  return index + 1;
}

async function fetchTopmangaChapters(slug) {
  const res = await fetchWithRetry(`https://auth.topmanga.uz/api/manga/${slug}/chapters/`);
  const rawChapters = await res.json();

  const seen = new Set();
  let autoInc = 1;
  return (rawChapters || []).map((ch, idx) => {
    let num = parseTopmangaChapterNumber(ch.title, idx);
    if (num <= 0 || seen.has(num)) num = autoInc;
    while (seen.has(num)) num++;
    seen.add(num);
    autoInc = Math.max(autoInc, num + 1);

    const sortedImages = (ch.images || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    return {
      number: num,
      title: `Bob ${num}`,
      isLocked: !!ch.locked || ch.is_free === false || ch.access_type === 'paid',
      pages: sortedImages.map((img, pIdx) => ({
        pageNumber: pIdx + 1,
        url: img.url,
      })),
    };
  }).filter((c) => c.number > 0 && !c.isLocked && c.pages.length > 0)
    .sort((a, b) => a.number - b.number);
}

// ── Master Expansion Queue ────────────────────────────────────────────────────
// Priority 1: 5 titles with 5 chapters -> expand to 20 (or source max)
// Priority 2: Top popular titles with 10 chapters -> expand to 20, then 30+
// Priority 3: Other popular titles with 10 chapters -> expand to 20
export const EXPANSION_QUEUE = [
  // ── Priority 1: Titles with 5 chapters (MangaBox source) ──────────────────
  { slug: 'solo-leveling-ragnarok', source: 'mangabox', targetChapters: 20, priority: 1, label: 'Solo Leveling: Ragnarok' },
  { slug: '4000-yildan-song-qaytib-kelgan-arximag', source: 'mangabox', targetChapters: 20, priority: 1, label: '4000 yildan so\'ng qaytib kelgan arximag' },
  { slug: '66-666-yildan-song-qora-sehrgarning-qaytishi', source: 'mangabox', targetChapters: 20, priority: 1, label: '66 666 yildan so‘ng: Qora sehrgar' },
  { slug: 'mening-shogirdlarim-hammalari-katta-yovuzlar', source: 'mangabox', targetChapters: 20, priority: 1, label: 'Mening shogirdlarim katta yovuzlar' },
  { slug: '1hp-klubi-qayta-boshlanish', source: 'mangabox', targetChapters: 15, priority: 1, label: '1HP klubi (qayta boshlanish)' },

  // ── Priority 2: Highly Popular Titles -> Target 30+ chapters (TopManga source) ─
  { slug: 'arra-odam', source: 'topmanga', targetChapters: 30, priority: 2, label: 'Arra-odam (Chainsaw Man)' },
  { slug: 'shimoliy-qilich-afsonasi', source: 'topmanga', targetChapters: 30, priority: 2, label: 'Shimoliy qilich afsonasi' },
  { slug: 'meni-olib-ket-cheksiz-gacha', source: 'topmanga', targetChapters: 30, priority: 2, label: 'Meni olib ket: Cheksiz GACHA' },
  { slug: 'dandadan', source: 'topmanga', targetChapters: 30, priority: 2, label: 'Dandadan' },
  { slug: 'yollanma-askarning-maktabga-qaytishi', source: 'topmanga', targetChapters: 30, priority: 2, label: 'Yollanma askarning maktabga qaytishi' },

  // ── Priority 3: Other Popular Titles -> Target 20 chapters (TopManga source) ──
  { slug: 'lookism', source: 'topmanga', targetChapters: 20, priority: 3, label: 'Lookism' },
  { slug: 'yakkaxon-maksimal-darajadagi-yangi-boshlovchi', source: 'topmanga', targetChapters: 20, priority: 3, label: 'Yakkaxon Maksimal Yangi Boshlovchi' },
  { slug: 'qilich-qiroli', source: 'topmanga', targetChapters: 20, priority: 3, label: 'Latna Saga: Qilich qiroli' },
  { slug: 'yengilmas-iljin-loyihasi', source: 'topmanga', targetChapters: 20, priority: 3, label: 'Yengilmas «Iljin» loyihasi' },
  { slug: 'haddan-tashqari-jihozlangan', source: 'topmanga', targetChapters: 20, priority: 3, label: 'Haddan tashqari jihozlangan' },
];

export class CatalogExpansionRunner {
  constructor({ chapterConcurrency = 3, pageConcurrency = 5 } = {}) {
    this.chapterConcurrency = chapterConcurrency;
    this.pageConcurrency = pageConcurrency;
    this.metrics = {
      startTime: Date.now(),
      chaptersCompleted: 0,
      pagesCompleted: 0,
      pagesSkipped: 0,
      bytesUploaded: 0,
      errors: 0,
    };
    this.activeTitle = '';
    this.activeChapter = 0;
    this.ticker = null;
  }

  startTicker(seriesName, remainingCount) {
    this.stopTicker();
    this.activeTitle = seriesName;
    this.ticker = setInterval(() => {
      const elapsedSec = (Date.now() - this.metrics.startTime) / 1000;
      const ppm = elapsedSec > 0 ? ((this.metrics.pagesCompleted / elapsedSec) * 60).toFixed(1) : '0.0';
      const mb = (this.metrics.bytesUploaded / (1024 * 1024)).toFixed(1);
      console.log(
        `[HEARTBEAT] Series: "${this.activeTitle}" (Ch ${this.activeChapter}) | Queue completed: ${this.metrics.chaptersCompleted} chs (${this.metrics.pagesCompleted} pgs, ${this.metrics.pagesSkipped} skipped, ${mb} MB uploaded) | Speed: ${ppm} pgs/min`
      );
    }, 25000);
  }

  stopTicker() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  async runExpansion(targetFilter = null) {
    console.log('╔════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           MangaLive.uz — Automated Catalog Expansion Engine (20+ & 30+)                ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════╝\n');

    let queue = [...EXPANSION_QUEUE];
    if (targetFilter) {
      queue = queue.filter(q => q.slug === targetFilter || String(q.priority) === String(targetFilter));
    }

    console.log(`Queue contains ${queue.length} target series to expand.`);
    console.log(`Settings: Chapter concurrency = ${this.chapterConcurrency}, Page concurrency = ${this.pageConcurrency}\n`);

    const summaryResults = [];

    for (const item of queue) {
      try {
        const result = await this.expandSeries(item);
        summaryResults.push(result);
      } catch (err) {
        console.error(`❌ Fatal error expanding ${item.slug}:`, err.message);
        summaryResults.push({
          slug: item.slug,
          label: item.label,
          error: err.message,
        });
      }
    }

    this.stopTicker();
    return summaryResults;
  }

  async expandSeries(item) {
    const { slug, source, targetChapters, label } = item;
    console.log(`\n======================================================================`);
    console.log(`⚡ EXPANDING: [${slug}] "${label}"`);
    console.log(`   Source: ${source} | Target: ${targetChapters} readable chapters`);
    console.log(`======================================================================`);

    // 1. Get manga record from DB
    const { data: manga, error: mErr } = await supabase
      .from('mangas')
      .select('id, slug, title, chapters_count')
      .eq('slug', slug)
      .single();

    if (mErr || !manga) {
      throw new Error(`Manga ${slug} not found in database: ${mErr?.message}`);
    }

    // 2. Query existing readable chapters in DB
    const { data: dbChs } = await supabase
      .from('chapters')
      .select('id, chapter_number, pages_count')
      .eq('manga_id', manga.id);

    const existingMap = new Map();
    for (const c of dbChs || []) {
      if (c.pages_count > 0) existingMap.set(c.chapter_number, c);
    }

    const beforeCount = existingMap.size;
    console.log(`Current published in DB: ${beforeCount} chapters.`);

    if (beforeCount >= targetChapters) {
      console.log(`✓ Already at or above target ${targetChapters} chapters! Skipping to next.`);
      return {
        slug,
        label,
        beforeCount,
        afterCount: beforeCount,
        addedCount: 0,
        status: 'Already Satisfied',
      };
    }

    // 3. Fetch candidate chapters from source
    let availableSourceChapters = [];
    if (source === 'mangabox') {
      const mbChapters = await fetchMangaboxChapters(slug);
      availableSourceChapters = mbChapters.map(c => ({
        number: c.number,
        title: c.title,
        folder: c.folder,
        sourceType: 'mangabox',
      }));
    } else if (source === 'topmanga') {
      const tmChapters = await fetchTopmangaChapters(slug);
      availableSourceChapters = tmChapters.map(c => ({
        number: c.number,
        title: c.title,
        pages: c.pages,
        sourceType: 'topmanga',
      }));
    }

    // Sort by chapter number
    availableSourceChapters.sort((a, b) => a.number - b.number);

    // Pick chapters up to targetChapters
    const targetSlice = availableSourceChapters.slice(0, targetChapters);
    const needed = targetSlice.filter(c => !existingMap.has(c.number));

    console.log(`Source provides ${availableSourceChapters.length} free chapters. Chapters to import: ${needed.length}`);

    if (needed.length === 0) {
      console.log(`No additional chapters available from ${source} for ${slug}.`);
      return {
        slug,
        label,
        beforeCount,
        afterCount: beforeCount,
        addedCount: 0,
        status: `Source limit reached (${availableSourceChapters.length} max)`,
      };
    }

    // 4. Process chapters concurrently
    this.startTicker(label, needed.length);
    this.seriesAborted = false;

    await asyncPool(this.chapterConcurrency, needed, async (ch) => {
      if (this.seriesAborted) return;
      this.activeChapter = ch.number;
      try {
        await this.processSingleChapter(manga.id, slug, ch);
      } catch (err) {
        console.error(`  ❌ Error processing Ch ${ch.number} of ${slug}: ${err.message}`);
      }
    });

    this.stopTicker();

    // 5. Update manga record counts in DB
    const { data: finalChs, count: finalCount } = await supabase
      .from('chapters')
      .select('chapter_number', { count: 'exact' })
      .eq('manga_id', manga.id)
      .gt('pages_count', 0)
      .order('chapter_number', { ascending: true });

    const afterCount = finalCount || (finalChs ? finalChs.length : 0);
    const maxCh = finalChs && finalChs.length > 0 ? finalChs[finalChs.length - 1].chapter_number : 0;

    await supabase.from('mangas').update({
      chapters_count: afterCount,
      last_chapter_number: maxCh,
      last_updated_at: new Date().toISOString(),
    }).eq('id', manga.id);

    const added = afterCount - beforeCount;
    console.log(`\n🎉 FINISHED ${slug}: ${beforeCount} -> ${afterCount} chapters (+${added} chapters added, Max Ch ${maxCh})\n`);

    return {
      slug,
      label,
      beforeCount,
      afterCount,
      addedCount: added,
      maxChapter: maxCh,
      status: afterCount >= targetChapters ? 'Target Reached' : `Reached ${afterCount}`,
    };
  }

  async processSingleChapter(mangaId, slug, ch) {
    const chNum = ch.number;
    const chapterUuid = deterministicUuid(`chapter:${mangaId}:${chNum}`);

    // Get pages list
    let rawPages = [];
    if (ch.sourceType === 'mangabox') {
      try {
        rawPages = await fetchMangaboxChapterPages(slug, ch.folder);
      } catch (err) {
        if (err.statusCode === 401 || err.statusCode === 403 || String(err.message).includes('401') || String(err.message).includes('Unauthorized')) {
          console.warn(`  🔒 Chapter ${chNum} of ${slug} locked by source (requires PRO/paid account). Skipping remaining chapters.`);
          this.seriesAborted = true;
          return;
        }
        throw err;
      }
    } else if (ch.sourceType === 'topmanga') {
      rawPages = ch.pages || [];
    }

    if (!rawPages || rawPages.length === 0) {
      console.warn(`  ⚠️ Empty pages for ${slug} Ch ${chNum}, skipping.`);
      return;
    }

    const pageRecords = [];
    const referer = ch.sourceType === 'topmanga' ? 'https://topmanga.uz/' : 'https://mangabox.uz/';

    // Process page images
    await asyncPool(this.pageConcurrency, rawPages, async (p) => {
      const padded = String(p.pageNumber).padStart(3, '0');
      const objectKey = `manga/${slug}/chapters/${chNum}/${padded}.webp`;
      const r2Url = `/api/r2/${objectKey}`;

      // 1. Idempotency check: does image already exist in Cloudflare R2?
      let exists = false;
      try {
        exists = await checkR2ObjectExists(objectKey);
      } catch (err) {
        exists = false;
      }
      if (exists) {
        this.metrics.pagesSkipped++;
        pageRecords.push({
          pageNumber: p.pageNumber,
          objectKey,
          r2Url,
          width: 800,
          height: 1400,
        });
        return;
      }

      // 2. Fetch page image with retry
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { buffer, contentType } = await fetchBufferWithRetry(p.url, {
            headers: {
              'User-Agent': BROWSER_UA,
              'Referer': referer,
              'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
            },
          }, { retries: 3, initialDelayMs: 1200, timeoutMs: 55000 });

          const dim = getImageDimensions(buffer);

          // 3. Upload to Cloudflare R2
          await uploadToR2({
            key: objectKey,
            body: buffer,
            contentType,
          });

          this.metrics.pagesCompleted++;
          this.metrics.bytesUploaded += buffer.length;

          pageRecords.push({
            pageNumber: p.pageNumber,
            objectKey,
            r2Url,
            width: dim.width || 800,
            height: dim.height || 1400,
          });
          break;
        } catch (err) {
          if (attempt === 3) {
            console.error(`    ❌ Page ${p.pageNumber} in ${slug} Ch ${chNum} failed: ${err.message}`);
            this.metrics.errors++;
          } else {
            await sleep(500 * attempt);
          }
        }
      }
    });

    if (pageRecords.length < Math.max(1, Math.floor(rawPages.length * 0.8))) {
      console.error(`  ❌ Chapter ${chNum} incomplete (${pageRecords.length}/${rawPages.length} pages). Chapter skipped.`);
      return;
    }

    pageRecords.sort((a, b) => a.pageNumber - b.pageNumber);

    // 4. Upsert Chapter to Supabase
    const { error: chErr } = await supabase.from('chapters').upsert({
      id: chapterUuid,
      manga_id: mangaId,
      chapter_number: chNum,
      title: ch.title || `Bob ${chNum}`,
      pages_count: pageRecords.length,
      published_at: new Date().toISOString(),
    }, { onConflict: 'manga_id,chapter_number' });

    if (chErr) throw chErr;

    // 5. Batch insert page rows to Supabase
    const pageRows = pageRecords.map((pr) => ({
      id: deterministicUuid(`page:${chapterUuid}:${pr.pageNumber}`),
      chapter_id: chapterUuid,
      page_number: pr.pageNumber,
      image_url: pr.r2Url,
      width: pr.width,
      height: pr.height,
    }));

    const CHUNK = 50;
    for (let i = 0; i < pageRows.length; i += CHUNK) {
      const chunk = pageRows.slice(i, i + CHUNK);
      const { error: pErr } = await supabase.from('chapter_pages').upsert(chunk, {
        onConflict: 'chapter_id,page_number',
      });
      if (pErr) throw pErr;
    }

    this.metrics.chaptersCompleted++;
  }
}

// CLI entrypoint if run directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const targetArg = process.argv[2] || null;
  const runner = new CatalogExpansionRunner({
    chapterConcurrency: 3,
    pageConcurrency: 5,
  });

  runner.runExpansion(targetArg).then((results) => {
    console.log('\n╔════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                         EXPANSION RUN COMPLETE SUMMARY                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════════════════╝\n');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  }).catch((err) => {
    console.error('Runner failed:', err);
    process.exit(1);
  });
}
