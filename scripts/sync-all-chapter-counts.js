import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const supa = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function syncCounts() {
  const { data: mangas } = await supa.from('mangas').select('id, slug, title');
  for (const m of mangas) {
    const { data: chs, count } = await supa
      .from('chapters')
      .select('chapter_number', { count: 'exact' })
      .eq('manga_id', m.id)
      .order('chapter_number', { ascending: true });

    const total = count || (chs ? chs.length : 0);
    const maxCh = chs && chs.length > 0 ? chs[chs.length - 1].chapter_number : 0;

    await supa.from('mangas').update({
      chapters_count: total,
      last_chapter_number: maxCh,
      last_updated_at: new Date().toISOString(),
    }).eq('id', m.id);

    console.log(`Synced ${m.slug}: ${total} chapters (Max: Ch ${maxCh})`);
  }
}

syncCounts().catch(console.error);
