import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    if (fs.existsSync(file)) {
      fs.readFileSync(file, 'utf8').split('\n').forEach((l) => {
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
const ratings = JSON.parse(fs.readFileSync('src/data/externalRatings.json', 'utf8'));

async function syncRatings() {
  console.log('Syncing real ratings to Supabase mangas table...');
  for (const [slug, r] of Object.entries(ratings)) {
    if (r && r.score) {
      // Scale out of 5 for mangas.rating (which has CHECK rating <= 5.0)
      // AniList score is out of 10, so divide by 2 for the 5-star column: e.g. 8.4/10 -> 4.2/5.0
      const score5 = Math.round((r.score / 2) * 10) / 10;
      const { error } = await supa
        .from('mangas')
        .update({
          rating: score5,
          rating_count: r.members || 100,
        })
        .eq('slug', slug);

      if (error) console.log(`Error updating ${slug}:`, error.message);
      else console.log(`✓ Updated ${slug}: ${score5}/5.0 (from ${r.score}/10, ${r.members} members)`);
    } else {
      const { error } = await supa
        .from('mangas')
        .update({
          rating: 0.0,
          rating_count: 0,
        })
        .eq('slug', slug);
      console.log(`- Cleared ${slug} to 0.0 (Unrated)`);
    }
  }
}

syncRatings().catch(console.error);
