import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createClient } from '@supabase/supabase-js';
import { uploadToR2, checkR2ObjectExists, loadEnv } from '../server/r2Storage.js';

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const PDF_DIR = 'D:\\Downloads\\Telegram Desktop';
const PROGRESS_FILE = 'data/solo-leveling-import-progress.json';
const MANGA_SLUG = 'solo-leveling';

export async function extractPagesFromPdf(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  const numPages = doc.numPages;
  const pages = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await doc.getPage(p);
    const opList = await page.getOperatorList();
    let imgData = null;

    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const imgId = opList.argsArray[i][0];
        const obj = await new Promise((resolve) => {
          page.objs.get(imgId, (data) => resolve(data));
        });
        if (obj && obj.data && obj.width && obj.height) {
          imgData = obj;
          break;
        }
      }
    }

    if (!imgData) {
      throw new Error(`Page ${p} in ${path.basename(pdfPath)} did not contain an image XObject.`);
    }

    const channels = imgData.kind === 1 ? 1 : imgData.kind === 2 ? 3 : 4;
    const rawBuf = Buffer.from(imgData.data.buffer, imgData.data.byteOffset, imgData.data.byteLength);

    const webpBuf = await sharp(rawBuf, {
      raw: {
        width: imgData.width,
        height: imgData.height,
        channels: channels,
      }
    })
    .webp({ quality: 85 })
    .toBuffer();

    pages.push({
      pageNumber: p,
      width: imgData.width,
      height: imgData.height,
      buffer: webpBuf,
      sizeBytes: webpBuf.length,
    });
  }

  await doc.cleanup();
  return pages;
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {}
  }
  return { chapters: {}, lastUpdated: null };
}

function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

// Concurrency helper for R2 uploads
async function runConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function runBulkImport({ maxChapters = 60, startFrom = 1 } = {}) {
  console.log(`=== Starting Resumable Idempotent Bulk Import for "${MANGA_SLUG}" ===`);

  // 1. Fetch Manga ID from Supabase
  const { data: manga, error: mErr } = await supabase
    .from('mangas')
    .select('id, title, slug, chapters_count')
    .eq('slug', MANGA_SLUG)
    .single();

  if (mErr || !manga) {
    throw new Error(`Manga with slug "${MANGA_SLUG}" not found in Supabase: ${mErr?.message}`);
  }

  console.log(`Found manga in Supabase: "${manga.title}" (ID: ${manga.id})`);

  // 2. Discover chapter PDFs (Chapters 1 to 60)
  const files = fs.readdirSync(PDF_DIR);
  const chapterPlan = [];

  // Chapter 1: Combine Prologue (BOB 0) + BOB 01 so full prologue and ch 1 are intact
  const bob0File = files.find(f => f.includes("Yolg'izlikda") && f.includes('BOB 0 -') && f.toLowerCase().endsWith('.pdf'));
  const bob1File = files.find(f => f.includes("Yolg'izlikda") && (f.includes('BOB 01 -') || f.includes('BOB 1 -')) && f.toLowerCase().endsWith('.pdf'));
  
  if (bob1File) {
    chapterPlan.push({
      chapterNumber: 1,
      title: 'Prolog va 1-bob: D-darajali zindon',
      sourcePdfs: [
        ...(bob0File ? [path.join(PDF_DIR, bob0File)] : []),
        path.join(PDF_DIR, bob1File),
      ],
      label: `BOB 0 (${bob0File ? 'mavjud' : 'yoq'}) + BOB 01`,
    });
  }

  // Chapters 2 to 60
  for (let ch = 2; ch <= 60; ch++) {
    const pad = String(ch).padStart(2, '0');
    const f = files.find(file => {
      const isPdf = file.toLowerCase().endsWith('.pdf');
      const isSolo = file.includes("Yolg'izlikda daraja ko'tarish");
      const match = file.match(/BOB\s*(\d+)/i);
      return isPdf && isSolo && match && parseInt(match[1], 10) === ch;
    });

    if (f) {
      chapterPlan.push({
        chapterNumber: ch,
        title: `${ch}-bob`,
        sourcePdfs: [path.join(PDF_DIR, f)],
        label: f,
      });
    } else {
      console.warn(`Warning: Could not find PDF for chapter ${ch}`);
    }
  }

  console.log(`Planned ${chapterPlan.length} chapters to import (1 to 60).`);

  // 3. Load progress & existing DB chapters
  const progress = loadProgress();
  const { data: existingChapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, pages_count')
    .eq('manga_id', manga.id);

  const existingChapterMap = new Map();
  (existingChapters || []).forEach(c => existingChapterMap.set(c.chapter_number, c));

  let processedCount = 0;
  let totalPagesImported = 0;

  for (const item of chapterPlan) {
    const chNum = item.chapterNumber;
    if (chNum < startFrom) continue;
    if (processedCount >= maxChapters) break;

    const progressEntry = progress.chapters[chNum];
    const existingDbChapter = existingChapterMap.get(chNum);

    console.log(`\n--- Processing Chapter ${chNum} (${item.title}) ---`);

    // Check if already completed and verified
    if (progressEntry && progressEntry.status === 'COMPLETED' && existingDbChapter && existingDbChapter.pages_count === progressEntry.pagesCount) {
      console.log(`  ✓ Chapter ${chNum} already completed in progress log and DB (pages: ${existingDbChapter.pages_count}). Skipping.`);
      processedCount++;
      totalPagesImported += existingDbChapter.pages_count;
      continue;
    }

    // Extract pages from all source PDFs for this chapter
    const combinedPages = [];
    let pageCounter = 1;
    for (const srcPdf of item.sourcePdfs) {
      console.log(`  -> Extracting from: ${path.basename(srcPdf)}`);
      const pages = await extractPagesFromPdf(srcPdf);
      for (const p of pages) {
        combinedPages.push({
          pageNumber: pageCounter++,
          width: p.width,
          height: p.height,
          buffer: p.buffer,
          sizeBytes: p.sizeBytes,
        });
      }
    }
    console.log(`  -> Extracted ${combinedPages.length} total pages for Chapter ${chNum}.`);

    // Upload pages to R2 in parallel (concurrency 4)
    console.log(`  -> Uploading ${combinedPages.length} pages to Cloudflare R2 (concurrency: 4)...`);
    const pageRecords = await runConcurrent(combinedPages, 4, async (page) => {
      const pad = String(page.pageNumber).padStart(3, '0');
      const r2Key = `manga/${MANGA_SLUG}/chapters/${chNum}/${pad}.webp`;
      const expectedUrl = `/api/r2/${r2Key}`;

      let alreadyInR2 = false;
      try {
        alreadyInR2 = await checkR2ObjectExists(r2Key);
      } catch {}

      if (!alreadyInR2) {
        await uploadToR2({
          key: r2Key,
          body: page.buffer,
          contentType: 'image/webp',
        });
      }

      return {
        page_number: page.pageNumber,
        image_url: expectedUrl,
        width: page.width,
        height: page.height,
      };
    });

    // Upsert Chapter in Supabase
    let chapterId = existingDbChapter?.id;

    if (!chapterId) {
      const { data: newChapter, error: cErr } = await supabase
        .from('chapters')
        .insert({
          manga_id: manga.id,
          chapter_number: chNum,
          title: item.title,
          pages_count: combinedPages.length,
          published_at: new Date().toISOString(),
          views_count: 0,
        })
        .select()
        .single();

      if (cErr) {
        throw new Error(`Failed to insert chapter ${chNum}: ${cErr.message}`);
      }
      chapterId = newChapter.id;
      console.log(`  -> Created Supabase chapter record (ID: ${chapterId})`);
    } else {
      await supabase
        .from('chapters')
        .update({
          title: item.title,
          pages_count: combinedPages.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);
      console.log(`  -> Reusing and updating existing Supabase chapter record (ID: ${chapterId})`);
    }

    // Upsert Chapter Pages
    await supabase.from('chapter_pages').delete().eq('chapter_id', chapterId);

    const rowsToInsert = pageRecords.map(p => ({
      chapter_id: chapterId,
      page_number: p.page_number,
      image_url: p.image_url,
      width: p.width,
      height: p.height,
    }));

    const { error: pErr } = await supabase.from('chapter_pages').insert(rowsToInsert);
    if (pErr) {
      throw new Error(`Failed to insert chapter pages for chapter ${chNum}: ${pErr.message}`);
    }
    console.log(`  -> Successfully inserted ${rowsToInsert.length} page records in Supabase.`);

    // Record progress
    progress.chapters[chNum] = {
      status: 'COMPLETED',
      chapterId,
      pagesCount: combinedPages.length,
      uploadedAt: new Date().toISOString(),
    };
    saveProgress(progress);

    processedCount++;
    totalPagesImported += combinedPages.length;
  }

  // 4. Update Manga Aggregates in Supabase
  const { data: allFinalChapters } = await supabase
    .from('chapters')
    .select('chapter_number')
    .eq('manga_id', manga.id);

  const totalChaptersNow = allFinalChapters ? allFinalChapters.length : 0;
  const maxChNum = allFinalChapters ? Math.max(...allFinalChapters.map(c => c.chapter_number), 0) : 0;

  await supabase
    .from('mangas')
    .update({
      chapters_count: totalChaptersNow,
      last_chapter_number: maxChNum,
      last_updated_at: new Date().toISOString(),
    })
    .eq('id', manga.id);

  console.log(`\n=== Bulk Import Batch Complete! ===`);
  console.log(`Total chapters processed: ${processedCount}`);
  console.log(`Total pages: ${totalPagesImported}`);
  console.log(`Supabase manga record updated: chapters_count=${totalChaptersNow}, last_chapter_number=${maxChNum}`);

  return {
    mangaSlug: MANGA_SLUG,
    totalChapters: totalChaptersNow,
    maxChapterNumber: maxChNum,
    totalPages: totalPagesImported,
  };
}

if (process.argv[1]?.endsWith('bulk-import-solo-leveling.js')) {
  const maxChaptersArg = process.argv[2] ? parseInt(process.argv[2], 10) : 60;
  const startFromArg = process.argv[3] ? parseInt(process.argv[3], 10) : 1;

  runBulkImport({ maxChapters: maxChaptersArg, startFrom: startFromArg })
    .then(res => console.log('Result:', res))
    .catch(err => {
      console.error('Fatal error during import:', err);
      process.exit(1);
    });
}
