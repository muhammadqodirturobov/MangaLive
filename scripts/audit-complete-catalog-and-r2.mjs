import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { checkR2ObjectExists } from '../server/r2Storage.js';

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

async function run() {
  console.log('╔════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║               MangaLive.uz — Complete Catalog & R2 Storage Audit                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════════════╝\n');

  const { data: mangas, error: mErr } = await supabase
    .from('mangas')
    .select('id, slug, title, title_en, author, type, status, rating, chapters_count, cover_url')
    .order('title', { ascending: true });

  if (mErr) {
    console.error('Error fetching mangas:', mErr);
    return;
  }

  console.log(`Found ${mangas.length} mangas in Supabase.\n`);

  // Parallel audit across all mangas
  const report = await Promise.all(mangas.map(async (manga) => {
    const { data: chapters, error: chErr } = await supabase
      .from('chapters')
      .select('id, chapter_number, pages_count')
      .eq('manga_id', manga.id)
      .order('chapter_number', { ascending: true });

    if (chErr) {
      return {
        slug: manga.slug,
        title: manga.title,
        readableChapterCount: 0,
        error: chErr.message,
      };
    }

    const readable = (chapters || []).filter(c => c.pages_count > 0);
    const nums = readable.map(c => c.chapter_number);
    const minCh = nums.length > 0 ? Math.min(...nums) : 0;
    const maxCh = nums.length > 0 ? Math.max(...nums) : 0;

    // Check 1 sample page from chapter 1 in R2
    let r2Status = 'No Chs';
    if (readable.length > 0) {
      const { data: page } = await supabase
        .from('chapter_pages')
        .select('image_url')
        .eq('chapter_id', readable[0].id)
        .limit(1)
        .maybeSingle();

      if (page?.image_url) {
        const key = page.image_url.replace(/^\/api\/r2\//, '');
        try {
          const exists = await checkR2ObjectExists(key);
          r2Status = exists ? 'Verified' : 'Missing';
        } catch (e) {
          r2Status = 'Error';
        }
      }
    }

    return {
      id: manga.id,
      slug: manga.slug,
      title: manga.title,
      type: manga.type,
      rating: manga.rating,
      readableChapterCount: readable.length,
      chapterRange: readable.length > 0 ? `${minCh}–${maxCh}` : 'None',
      r2Status,
      chapters: nums,
    };
  }));

  // Sort by readable chapter count ascending, then rating descending
  report.sort((a, b) => a.readableChapterCount - b.readableChapterCount || b.rating - a.rating);

  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log('| Slug                                     | Readable Chs | Range     | R2 Sample | Rating | Title');
  console.log('------------------------------------------------------------------------------------------------------------------------');
  for (const r of report) {
    const sCol = r.slug.padEnd(40, ' ');
    const chCol = String(r.readableChapterCount).padStart(12, ' ');
    const rCol = r.chapterRange.padEnd(9, ' ');
    const r2Col = r.r2Status.padEnd(9, ' ');
    const ratCol = String(r.rating || 0).padEnd(6, ' ');
    console.log(`| ${sCol} | ${chCol} | ${rCol} | ${r2Col} | ${ratCol} | ${r.title}`);
  }
  console.log('------------------------------------------------------------------------------------------------------------------------\n');

  const under10 = report.filter(r => r.readableChapterCount < 10);
  const tenTo19 = report.filter(r => r.readableChapterCount >= 10 && r.readableChapterCount < 20);
  const twentyTo29 = report.filter(r => r.readableChapterCount >= 20 && r.readableChapterCount < 30);
  const thirtyPlus = report.filter(r => r.readableChapterCount >= 30);

  console.log(`Summary of Catalog State:`);
  console.log(`- Titles with < 10 readable chapters:   ${under10.length} titles`);
  console.log(`- Titles with 10–19 readable chapters:  ${tenTo19.length} titles`);
  console.log(`- Titles with 20–29 readable chapters:  ${twentyTo29.length} titles`);
  console.log(`- Titles with 30+ readable chapters:    ${thirtyPlus.length} titles\n`);

  const outFile = process.argv[2] || 'catalog-audit-after.json';
  fs.writeFileSync(
    path.resolve(process.cwd(), 'data', outFile),
    JSON.stringify(report, null, 2)
  );
  console.log(`✓ Full audit saved to data/${outFile}`);
}

run().catch(console.error);
