import fs from 'fs';
import path from 'path';

const characters = [
  // Male (8)
  { id: 'naruto', name: 'Naruto Uzumaki', displayName: 'Naruto Uzumaki', anime: 'Naruto', gender: 'male' },
  { id: 'luffy', name: 'Monkey D. Luffy', displayName: 'Monkey D. Luffy', anime: 'One Piece', gender: 'male' },
  { id: 'goku', name: 'Goku', displayName: 'Son Goku', anime: 'Dragon Ball', gender: 'male' },
  { id: 'levi', name: 'Levi', displayName: 'Levi Ackerman', anime: 'Attack on Titan', gender: 'male' },
  { id: 'gojo', name: 'Satoru Gojo', displayName: 'Satoru Gojo', anime: 'Jujutsu Kaisen', gender: 'male' },
  { id: 'ichigo', name: 'Ichigo Kurosaki', displayName: 'Ichigo Kurosaki', anime: 'Bleach', gender: 'male' },
  { id: 'tanjiro', name: 'Tanjirou Kamado', displayName: 'Tanjiro Kamado', anime: 'Demon Slayer', gender: 'male' },
  { id: 'jinwoo', name: 'Jin-Woo Sung', displayName: 'Sung Jin-woo', anime: 'Solo Leveling', gender: 'male' },

  // Female (8)
  { id: 'mikasa', name: 'Mikasa Ackerman', displayName: 'Mikasa Ackerman', anime: 'Attack on Titan', gender: 'female' },
  { id: 'nezuko', name: 'Nezuko Kamado', displayName: 'Nezuko Kamado', anime: 'Demon Slayer', gender: 'female' },
  { id: 'nami', name: 'Nami', displayName: 'Nami', anime: 'One Piece', gender: 'female' },
  { id: 'sakura', name: 'Sakura Haruno', displayName: 'Sakura Haruno', anime: 'Naruto', gender: 'female' },
  { id: 'marin', name: 'Marin Kitagawa', displayName: 'Marin Kitagawa', anime: 'My Dress-Up Darling', gender: 'female' },
  { id: 'yor', name: 'Yor Forger', displayName: 'Yor Forger', anime: 'Spy x Family', gender: 'female' },
  { id: 'frieren', name: 'Frieren', displayName: 'Frieren', anime: 'Frieren', gender: 'female' },
  { id: 'nobara', name: 'Nobara Kugisaki', displayName: 'Nobara Kugisaki', anime: 'Jujutsu Kaisen', gender: 'female' },
];

const outDir = path.resolve('public/avatars');

async function fetchCharacterImage(searchName) {
  const query = `
    query ($name: String) {
      Character(search: $name) {
        id
        name {
          full
        }
        image {
          large
        }
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { name: searchName } }),
  });

  const json = await res.json();
  return json?.data?.Character;
}

async function run() {
  const manifest = [];

  for (const char of characters) {
    console.log(`Searching for ${char.name}...`);
    try {
      const data = await fetchCharacterImage(char.name);
      if (!data || !data.image?.large) {
        console.error(`Failed to find ${char.name}`);
        continue;
      }

      console.log(`Found: ${data.name.full} -> ${data.image.large}`);
      const imgRes = await fetch(data.image.large);
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      // Determine extension from url
      const ext = data.image.large.endsWith('.png') ? 'png' : 'jpg';
      const filename = `${char.id}.${ext}`;
      const destPath = path.join(outDir, filename);

      fs.writeFileSync(destPath, buffer);
      console.log(`Saved ${filename} (${buffer.length} bytes)`);

      manifest.push({
        id: char.id,
        name: char.displayName || data.name.full,
        anime: char.anime,
        gender: char.gender,
        avatarUrl: `/avatars/${filename}`,
      });

      // AniList rate limit kindness
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`Error processing ${char.name}:`, err.message);
    }
  }

  console.log('\nDownloaded avatars summary:');
  console.log(JSON.stringify(manifest, null, 2));

  fs.writeFileSync(path.resolve('src/data/avatars.js'), `/**
 * MangaLive.uz — Curated Anime/Manga Character Avatars
 * 16 Iconic anime/manga character portraits (8 male, 8 female).
 * Hosted locally in /avatars/ for 100% reliable, zero-latency loading.
 */

export const AVATAR_PRESETS = ${JSON.stringify(manifest, null, 2)};

export const DEFAULT_AVATAR = AVATAR_PRESETS[0].avatarUrl;

export function getAvatarById(id) {
  return AVATAR_PRESETS.find((a) => a.id === id) || AVATAR_PRESETS[0];
}

export function getAvatarByUrl(url) {
  return AVATAR_PRESETS.find((a) => a.avatarUrl === url) || null;
}
`);
}

run();
