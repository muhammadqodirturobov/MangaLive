import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { MangaboxPublicConnector } from '../server/sourceAdapters/MangaboxPublicConnector.js';
import { uploadToR2, checkR2ObjectExists, loadEnv } from '../server/r2Storage.js';

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Concurrency helper
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

export async function importMangaboxSeries({
  targetSlug,
  sourceSlug,
  maxChapters = 3,
  startFrom = 1,
}) {
  console.log(`\n======================================================`);
  console.log(`Importing "${targetSlug}" from Mangabox source "${sourceSlug}"`);
  console.log(`======================================================`);

  // 1. Fetch target manga from Supabase
  const { data: manga, error: mErr } = await supabase
    .from('mangas')
    .select('id, title, slug, chapters_count')
    .eq('slug', targetSlug)
    .single();

  if (mErr || !manga) {
    throw new Error(`Target manga "${targetSlug}" not found in Supabase: ${mErr?.message}`);
  }

  console.log(`Found target manga: "${manga.title}" (ID: ${manga.id})`);

  // 2. Discover unlocked chapters from Mangabox
  const connector = new MangaboxPublicConnector();
  const allUnlocked = await connector.discoverChapters(sourceSlug);
  console.log(`Discovered ${allUnlocked.length} total unlocked chapters on Mangabox.`);

  const chaptersToProcess = allUnlocked
    .filter(c => c.chapterNumber >= startFrom)
    .slice(0, maxChapters);

  console.log(`Selected ${chaptersToProcess.length} chapters to import (Chapters: ${chaptersToProcess.map(c => c.chapterNumber).join(', ')})`);

  // 3. Load existing chapters in DB
  const { data: existingChapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, pages_count')
    .eq('manga_id', manga.id);

  const existingChapterMap = new Map();
  (existingChapters || []).forEach(c => existingChapterMap.set(c.chapter_number, c));

  let processedCount = 0;
  let totalPagesImported = 0;

  for (const ch of chaptersToProcess) {
    const chNum = ch.chapterNumber;
    const existingDbChapter = existingChapterMap.get(chNum);

    console.log(`\n--- [${targetSlug}] Chapter ${chNum} (${ch.title}) ---`);

    if (existingDbChapter && existingDbChapter.pages_count > 0) {
      console.log(`  ✓ Chapter ${chNum} already exists in DB with ${existingDbChapter.pages_count} pages. Skipping.`);
      processedCount++;
      totalPagesImported += existingDbChapter.pages_count;
      continue;
    }

    // Fetch pages from Mangabox
    console.log(`  -> Fetching chapter pages from Mangabox (${ch.chapterRef?.folder})...`);
    let pages = null;
    try {
      pages = await connector.fetchChapterPages({
        mangaSlug: sourceSlug,
        chapterNumber: chNum,
        chapterRef: ch.chapterRef,
      });
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('LOGIN_REQUIRED')) {
        console.warn(
          `  🔒 [PAYWALL / LOGIN_REQUIRED] Chapter ${chNum} is gated behind login on ${sourceSlug}. Halting series ingestion to comply with authorization & paywall rules.`
        );
        break;
      }
      throw err;
    }

    if (!pages || pages.length === 0) {
      console.warn(`  ⚠ Warning: Chapter ${chNum} returned 0 pages from source. Skipping.`);
      continue;
    }

    console.log(`  -> Fetched ${pages.length} pages. Uploading to Cloudflare R2...`);

    // Upload to R2 in parallel
    const pageRecords = await runConcurrent(pages, 4, async (page) => {
      const pad = String(page.pageNumber).padStart(3, '0');
      const r2Key = `manga/${targetSlug}/chapters/${chNum}/${pad}.webp`;
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

      // Extract width & height
      let width = null;
      let height = null;
      try {
        const meta = await sharp(page.buffer).metadata();
        width = meta.width;
        height = meta.height;
      } catch {}

      return {
        page_number: page.pageNumber,
        image_url: expectedUrl,
        width,
        height,
      };
    });

    // Upsert chapter in Supabase
    let chapterId = existingDbChapter?.id;
    const titleText = `${chNum}-bob`;

    if (!chapterId) {
      const { data: newCh, error: cErr } = await supabase
        .from('chapters')
        .insert({
          manga_id: manga.id,
          chapter_number: chNum,
          title: titleText,
          pages_count: pages.length,
          published_at: new Date().toISOString(),
          views_count: 0,
        })
        .select()
        .single();

      if (cErr) throw new Error(`Insert chapter error: ${cErr.message}`);
      chapterId = newCh.id;
      console.log(`  -> Created chapter record in DB (ID: ${chapterId})`);
    } else {
      await supabase
        .from('chapters')
        .update({
          title: titleText,
          pages_count: pages.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chapterId);
      console.log(`  -> Reusing existing chapter record (ID: ${chapterId})`);
    }

    // Insert chapter_pages
    await supabase.from('chapter_pages').delete().eq('chapter_id', chapterId);
    const rows = pageRecords.map(p => ({
      chapter_id: chapterId,
      page_number: p.page_number,
      image_url: p.image_url,
      width: p.width,
      height: p.height,
    }));

    const { error: pErr } = await supabase.from('chapter_pages').insert(rows);
    if (pErr) throw new Error(`Insert pages error: ${pErr.message}`);

    console.log(`  -> Inserted ${rows.length} page records into DB.`);
    processedCount++;
    totalPagesImported += rows.length;
  }

  // Update Manga metadata in Supabase
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

  console.log(`✓ Completed import for "${targetSlug}": ${totalChaptersNow} chapters in DB, max chapter: ${maxChNum}`);

  return {
    targetSlug,
    totalChapters: totalChaptersNow,
    maxChapterNumber: maxChNum,
    totalPages: totalPagesImported,
  };
}
