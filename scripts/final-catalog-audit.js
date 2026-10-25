import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data: mangas, error } = await supa.from('mangas').select('id, slug, title, chapters_count').order('title');
  if (error) {
    console.error('Error fetching mangas:', error);
    return;
  }

  console.log('=== FINAL SUPABASE AUDIT ACROSS ALL 7 MANGA ===');
  let totalChs = 0;
  let totalPgs = 0;

  for (const m of mangas) {
    const { data: chs, count: chCount } = await supa
      .from('chapters')
      .select('id, chapter_number', { count: 'exact' })
      .eq('manga_id', m.id);

    let pageCount = 0;
    if (chs && chs.length > 0) {
      const { count } = await supa
        .from('chapter_pages')
        .select('id', { count: 'exact' })
        .in('chapter_id', chs.map((c) => c.id));
      pageCount = count || 0;
    }

    totalChs += chCount || 0;
    totalPgs += pageCount;

    const chNums = (chs || []).map((c) => c.chapter_number).sort((a, b) => a - b);
    const minCh = chNums[0];
    const maxCh = chNums[chNums.length - 1];

    console.log(`- ${m.title} (${m.slug}):`);
    console.log(`    Published Chapters: ${chCount} (Range: Ch ${minCh} - ${maxCh})`);
    console.log(`    Published Pages: ${pageCount}`);
    console.log(`    mangas.chapters_count: ${m.chapters_count}`);
  }

  console.log('--------------------------------------------------');
  console.log(`TOTAL CHAPTERS PUBLISHED: ${totalChs}`);
  console.log(`TOTAL PAGES IN DATABASE: ${totalPgs}`);
}

main().catch(console.error);
