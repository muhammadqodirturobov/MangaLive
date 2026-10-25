import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

async function fetchWithRetry(url, fetchOpts = {}, { retries = 4, initialDelayMs = 1000, timeoutMs = 35000 } = {}) {
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
        const jitter = Math.random() * 400;
        const delay = initialDelayMs * Math.pow(1.5, attempt - 1) + jitter;
        await sleep(delay);
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
        const jitter = Math.random() * 500;
        const delay = initialDelayMs * Math.pow(1.5, attempt - 1) + jitter;
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

function parseChapterNumber(rawTitle, index) {
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

export const CANDIDATES_LIST = [
  { slug: 'lookism', sourceType: 'topmanga', targetChapters: 10, priority: 1 },
  { slug: 'dandadan', sourceType: 'topmanga', targetChapters: 10, priority: 2 },
  { slug: 'meni-olib-ket-cheksiz-gacha', sourceType: 'topmanga', targetChapters: 10, priority: 3 },
  { slug: 'qilich-qiroli', sourceType: 'topmanga', targetChapters: 10, priority: 4 },
  { slug: 'yollanma-askarning-maktabga-qaytishi', sourceType: 'topmanga', targetChapters: 10, priority: 5 },
  { slug: 'shimoliy-qilich-afsonasi', sourceType: 'topmanga', targetChapters: 10, priority: 6 },
  { slug: 'haddan-tashqari-jihozlangan', sourceType: 'topmanga', targetChapters: 10, priority: 7 },
  { slug: 'arra-odam', sourceType: 'topmanga', targetChapters: 10, priority: 8 },
  { slug: 'yakkaxon-maksimal-darajadagi-yangi-boshlovchi', sourceType: 'topmanga', targetChapters: 10, priority: 9 },
  { slug: 'yengilmas-iljin-loyihasi', sourceType: 'topmanga', targetChapters: 10, priority: 10 },
  { slug: 'minorada-yolgiz-fermerlik', sourceType: 'topmanga', targetChapters: 10, priority: 11 },
  { slug: 'samoviy-jozalovchi-qilich', sourceType: 'topmanga', targetChapters: 10, priority: 12 },
  { slug: 'yulduzli-qilich-ustasi', sourceType: 'topmanga', targetChapters: 10, priority: 13 },
];

export class ExpandCatalogImporter {
  constructor({
    chapterConcurrency = 2,
    pageConcurrency = 4,
    rateLimit = 50,
    retries = 3,
  } = {}) {
    this.chapterConcurrency = chapterConcurrency;
    this.pageConcurrency = pageConcurrency;
    this.rateLimit = rateLimit;
    this.retries = retries;

    this.activeTitle = '';
    this.activeChapter = 0;
    this.activePendingPages = 0;
    this.lastSuccessfulOp = 'Initialized';
    this.lastSuccessfulTime = new Date().toISOString();

    this.metrics = {
      startTime: null,
      chaptersCompleted: 0,
      pagesCompleted: 0,
      pagesSkipped: 0,
      bytesUploaded: 0,
      retries: 0,
      failures: 0,
    };
    this.ticker = null;
  }

  startTicker(seriesName, totalChapters) {
    this.stopTicker();
    this.activeTitle = seriesName;
    this.ticker = setInterval(() => {
      const elapsedSec = (Date.now() - (this.metrics.startTime || Date.now())) / 1000;
      const ppm = elapsedSec > 0 ? ((this.metrics.pagesCompleted / elapsedSec) * 60).toFixed(1) : '0.0';
      const kbps = elapsedSec > 0 ? (this.metrics.bytesUploaded / elapsedSec / 1024).toFixed(1) : '0.0';
      console.log(
        `[HEARTBEAT 30s] Series: "${this.activeTitle}" | Active Ch: ${this.activeChapter} | Queue Chs: ${this.metrics.chaptersCompleted}/${totalChapters} | Pages: ${this.metrics.pagesCompleted} done, ${this.activePendingPages} pending (${ppm} pg/min, ${kbps} KB/s) | Retries: ${this.metrics.retries} | Last Success: ${this.lastSuccessfulOp} at ${this.lastSuccessfulTime.slice(11, 19)} UTC`
      );
    }, 30000);
  }

  stopTicker() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  async ensureMangaMetadata(slug, candidateConfig) {
    const mangaUuid = deterministicUuid(`manga:${slug}`);
    const res = await fetchWithRetry(`https://auth.topmanga.uz/api/manga/${slug}/`);
    const remoteData = await res.json();

    const title = remoteData.title_uz || remoteData.title;
    const titleEn = remoteData.title_en || null;
    const synopsis = remoteData.description || 'Qiziqarli manga asari.';
    const authorName = remoteData.author?.name || (typeof remoteData.author === 'string' ? remoteData.author : 'TopManga');

    let coverUrl = `/api/r2/manga/${slug}/cover.jpg`;
    const coverKey = `manga/${slug}/cover.jpg`;
    const coverExists = await checkR2ObjectExists(coverKey);

    if (!coverExists && remoteData.cover) {
      try {
        const { buffer, contentType } = await fetchBufferWithRetry(remoteData.cover, {
          headers: { 'User-Agent': BROWSER_UA },
        });
        await uploadToR2({
          key: coverKey,
          body: buffer,
          contentType: contentType || 'image/jpeg',
        });
        console.log(`✓ Cover uploaded to Cloudflare R2: ${coverKey}`);
      } catch (covErr) {
        console.warn(`Cover upload warning for ${slug}: ${covErr.message}`);
      }
    }

    const { data: mangaRecord, error: mangaErr } = await supabase.from('mangas').upsert({
      id: mangaUuid,
      slug: slug,
      title: title,
      title_en: titleEn,
      author: authorName,
      type: 'manhwa',
      status: remoteData.status === 'completed' ? 'tugallangan' : 'davom etmoqda',
      rating: remoteData.rating && remoteData.rating > 0 ? remoteData.rating : 4.8,
      rating_count: 50,
      chapters_count: 0,
      views_count: 1200,
      cover_url: coverUrl,
      cover_color_start: '#0f172a',
      cover_color_end: '#1e293b',
      cover_accent: '#38bdf8',
      synopsis: synopsis,
      is_featured: false,
      is_popular: true,
      is_new: true,
      last_chapter_number: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' }).select().single();

    if (mangaErr) {
      throw new Error(`Failed to save manga record for ${slug}: ${mangaErr.message}`);
    }

    const { data: dbGenres } = await supabase.from('genres').select('id, slug, name');
    const genreMap = new Map((dbGenres || []).map(g => [g.slug.toLowerCase(), g.id]));

    const genreKeywords = {
      'senen': 'harakatli',
      'jangari': 'harakatli',
      'super kuch': 'jangovar',
      'jangovar': 'jangovar',
      "jang san'atlari": 'jangovar',
      'fantaziya': 'fantaziya',
      'sehr': 'fantaziya',
      'komediya': 'komediya',
      'drama': 'fojiaviy',
      'fojia': 'fojiaviy',
      'romantika': 'romantik',
      'maktab': 'maktab',
      'psixologiya': 'psixologik',
      'sarguzasht': 'sarguzasht',
      'ilmiy fantastika': 'ilmiy-fantastika',
      'mexa': 'ilmiy-fantastika',
      'mistika': 'sirli',
      'isekay': 'isekai',
      'isekai': 'isekai',
    };

    const targetGenreIds = new Set();
    if (genreMap.has('harakatli')) targetGenreIds.add(genreMap.get('harakatli'));

    if (Array.isArray(remoteData.genres)) {
      for (const g of remoteData.genres) {
        const gName = (g.name || g.title || g || '').toLowerCase();
        for (const [kw, mappedSlug] of Object.entries(genreKeywords)) {
          if (gName.includes(kw) && genreMap.has(mappedSlug)) {
            targetGenreIds.add(genreMap.get(mappedSlug));
          }
        }
      }
    }

    for (const gid of targetGenreIds) {
      await supabase.from('manga_genres').upsert({
        manga_id: mangaRecord.id,
        genre_id: gid,
      }, { onConflict: 'manga_id,genre_id' });
    }

    return mangaRecord;
  }

  async importTitle(candidate) {
    const { slug, targetChapters = 10 } = candidate;
    console.log(`\n======================================================================`);
    console.log(`📥 CHECKING/IMPORTING: ${slug} (Target: ${targetChapters} chapters)`);
    console.log(`======================================================================`);

    const dbManga = await this.ensureMangaMetadata(slug, candidate);
    const mangaId = dbManga.id;

    // Check existing chapters in DB
    const { data: existingDbChapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, pages_count')
      .eq('manga_id', mangaId);

    const existingMap = new Map();
    for (const c of existingDbChapters || []) {
      if (c.pages_count > 0) existingMap.set(c.chapter_number, c);
    }

    if (existingMap.size >= targetChapters) {
      console.log(`✅ ${slug} already has ${existingMap.size}/${targetChapters} chapters published in DB! Skipping.\n`);
      return {
        slug,
        title: dbManga.title,
        publishedChapters: existingMap.size,
        maxChapter: Math.max(...Array.from(existingMap.keys())),
        alreadyDone: true,
      };
    }

    // Fetch remote chapters
    const chRes = await fetchWithRetry(`https://auth.topmanga.uz/api/manga/${slug}/chapters/`);
    const rawChapters = await chRes.json();

    const seen = new Set();
    let autoInc = 1;
    const freeChapters = (rawChapters || []).map((ch, idx) => {
      let num = parseChapterNumber(ch.title, idx);
      if (num <= 0 || seen.has(num)) {
        num = autoInc;
      }
      while (seen.has(num)) {
        num++;
      }
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
    }).filter(c => c.number > 0 && !c.isLocked && c.pages.length > 0)
      .sort((a, b) => a.number - b.number);

    // Pick chapters up to targetChapters
    const targetSlice = freeChapters.slice(0, targetChapters);
    const queue = targetSlice.filter(ch => !existingMap.has(ch.number));

    console.log(`Target: ${targetSlice.length} chs | Already in DB: ${existingMap.size} | Missing to process: ${queue.length}`);

    if (queue.length > 0) {
      if (!this.metrics.startTime) this.metrics.startTime = Date.now();
      this.startTicker(slug, queue.length);

      await asyncPool(this.chapterConcurrency, queue, async (ch) => {
        this.activeChapter = ch.number;
        await this.processChapter(slug, mangaId, ch);
      });

      this.stopTicker();
    }

    // Update manga counts
    const { data: finalChs, count: finalChCount } = await supabase
      .from('chapters')
      .select('chapter_number', { count: 'exact' })
      .eq('manga_id', mangaId)
      .order('chapter_number', { ascending: true });

    const totalPub = finalChCount || (finalChs ? finalChs.length : 0);
    const maxCh = finalChs && finalChs.length > 0 ? finalChs[finalChs.length - 1].chapter_number : 0;

    await supabase.from('mangas').update({
      chapters_count: totalPub,
      last_chapter_number: maxCh,
      last_updated_at: new Date().toISOString(),
    }).eq('id', mangaId);

    console.log(`🎉 COMPLETED ${slug}: ${totalPub} chapters published (Max: Ch ${maxCh})`);
    return {
      slug,
      title: dbManga.title,
      publishedChapters: totalPub,
      maxChapter: maxCh,
    };
  }

  async processChapter(slug, mangaId, ch) {
    const chNum = ch.number;
    const chapterUuid = deterministicUuid(`chapter:${mangaId}:${chNum}`);
    const pageRecords = [];
    let hasPageFailure = false;
    this.activePendingPages = ch.pages.length;

    await asyncPool(this.pageConcurrency, ch.pages, async (p) => {
      const paddedPage = String(p.pageNumber).padStart(3, '0');
      const objectKey = `manga/${slug}/chapters/${chNum}/${paddedPage}.webp`;
      const r2Url = `/api/r2/${objectKey}`;

      const exists = await checkR2ObjectExists(objectKey);
      if (exists) {
        this.metrics.pagesSkipped++;
        this.activePendingPages--;
        pageRecords.push({
          pageNumber: p.pageNumber,
          objectKey,
          r2Url,
          width: 800,
          height: 1400,
        });
        return;
      }

      for (let attempt = 1; attempt <= this.retries; attempt++) {
        try {
          const { buffer: buf, contentType } = await fetchBufferWithRetry(p.url, {
            headers: {
              'User-Agent': BROWSER_UA,
              'Referer': 'https://topmanga.uz/',
              'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
            },
          }, { retries: 2, initialDelayMs: 1000, timeoutMs: 45000 });

          const dim = getImageDimensions(buf);

          await uploadToR2({
            key: objectKey,
            body: buf,
            contentType,
          });

          this.metrics.pagesCompleted++;
          this.activePendingPages--;
          this.metrics.bytesUploaded += buf.length;
          this.lastSuccessfulOp = `Uploaded ${slug} Ch ${chNum} P ${p.pageNumber}`;
          this.lastSuccessfulTime = new Date().toISOString();

          pageRecords.push({
            pageNumber: p.pageNumber,
            objectKey,
            r2Url,
            width: dim.width || 800,
            height: dim.height || 1400,
          });
          break;
        } catch (err) {
          this.metrics.retries++;
          if (attempt === this.retries) {
            console.error(`    ❌ Page ${p.pageNumber} in Ch ${chNum} failed after retries: ${err.message}`);
            hasPageFailure = true;
          } else {
            await sleep(600 * attempt);
          }
        }
      }

      if (this.rateLimit > 0) await sleep(this.rateLimit);
    });

    if (pageRecords.length < Math.max(1, Math.floor(ch.pages.length * 0.85))) {
      console.error(`  ❌ Chapter ${chNum} incomplete (${pageRecords.length}/${ch.pages.length} pages succeeded).`);
      this.metrics.failures++;
      return;
    }
    pageRecords.sort((a, b) => a.pageNumber - b.pageNumber);

    // Upsert Chapter
    const { error: chErr } = await supabase.from('chapters').upsert({
      id: chapterUuid,
      manga_id: mangaId,
      chapter_number: chNum,
      title: ch.title || `Bob ${chNum}`,
      pages_count: pageRecords.length,
      published_at: new Date().toISOString(),
    }, { onConflict: 'manga_id,chapter_number' });

    if (chErr) throw chErr;

    // Batch Insert Pages
    const pageRows = pageRecords.map((pr) => ({
      id: deterministicUuid(`page:${chapterUuid}:${pr.pageNumber}`),
      chapter_id: chapterUuid,
      page_number: pr.pageNumber,
      image_url: pr.r2Url,
      width: pr.width,
      height: pr.height,
    }));

    const CHUNK_SIZE = 50;
    for (let i = 0; i < pageRows.length; i += CHUNK_SIZE) {
      const chunk = pageRows.slice(i, i + CHUNK_SIZE);
      const { error: pErr } = await supabase.from('chapter_pages').upsert(chunk, {
        onConflict: 'chapter_id,page_number',
      });
      if (pErr) throw pErr;
    }

    this.metrics.chaptersCompleted++;
    this.lastSuccessfulOp = `Published Ch ${chNum} (${pageRecords.length} pgs)`;
    this.lastSuccessfulTime = new Date().toISOString();
    console.log(`  ✓ Chapter ${chNum} published (${pageRecords.length} pages written to DB + R2)`);
  }
}

async function run() {
  const args = process.argv.slice(2);
  const targetSlug = args.find(a => a.startsWith('--manga='))?.slice(8);
  const targetCount = parseInt(args.find(a => a.startsWith('--target='))?.slice(9) || '10', 10);

  const candidates = targetSlug 
    ? CANDIDATES_LIST.filter(c => c.slug === targetSlug)
    : CANDIDATES_LIST;

  const importer = new ExpandCatalogImporter({
    chapterConcurrency: 2,
    pageConcurrency: 4,
    rateLimit: 50,
    retries: 3,
  });

  console.log(`======================================================================`);
  console.log(`🚀 RECOVERING/OPTIMIZING CATALOG EXPANSION: ${candidates.length} CANDIDATES`);
  console.log(`Target Chapters per Title: ${targetCount}`);
  console.log(`Safe Concurrency: Chapter Conc = 2, Page Conc = 4 (Max 8 concurrent streams)`);
  console.log(`Stop Condition: Exactly 10 Distinct Titles with >= ${targetCount} Chapters`);
  console.log(`======================================================================\n`);

  const results = [];
  let successfulTitles = 0;

  for (const cand of candidates) {
    if (successfulTitles >= 10 && !targetSlug) {
      console.log(`\n🎯 SUCCESS TARGET REACHED: Exactly 10 distinct new titles with >= ${targetCount} chapters! Halting batch.`);
      break;
    }

    try {
      const res = await importer.importTitle({ ...cand, targetChapters: targetCount });
      results.push(res);
      if (res && res.publishedChapters >= targetCount) {
        successfulTitles++;
        console.log(`🏆 [${successfulTitles}/10 SUCCESSFUL TITLES] ${cand.slug} reached ${res.publishedChapters} chapters!`);
      }
    } catch (e) {
      console.error(`❌ Error importing ${cand.slug}:`, e.message);
      results.push({ slug: cand.slug, error: e.message });
    }
  }

  importer.stopTicker();

  console.log(`\n======================================================================`);
  console.log(`🏁 CATALOG EXPANSION COMPLETED!`);
  console.log(`Total Titles Qualified: ${successfulTitles}/10`);
  console.log(`======================================================================`);
  for (const r of results) {
    if (r.error) {
      console.log(`- ❌ ${r.slug}: FAILED (${r.error})`);
    } else {
      console.log(`- ✅ ${r.slug} ("${r.title}"): ${r.publishedChapters} chapters published`);
    }
  }
}

run().catch(console.error);
