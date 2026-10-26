import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: mangas } = await supabase
    .from('mangas')
    .select('id, title, slug, chapters_count, last_chapter_number')
    .in('slug', ['who-made-me-a-princess', 'operation-true-love', 'eleceed', 'a-returners-magic-should-be-special']);

  for (const m of mangas) {
    const { data: chs } = await supabase
      .from('chapters')
      .select('id, chapter_number, pages_count')
      .eq('manga_id', m.id)
      .order('chapter_number');

    console.log(
      `${m.slug}: "${m.title}" -> db_chapters_count: ${m.chapters_count}, last_ch: ${m.last_chapter_number}, chapters in db:`,
      chs.map(c => `Ch ${c.chapter_number} (${c.pages_count}p)`).join(', ')
    );
  }
}

check();
