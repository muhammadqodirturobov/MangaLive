/**
 * MangaLive.uz — Curated Anime/Manga Character Avatars
 * 16 Iconic anime/manga character portraits (8 male, 8 female).
 * Hosted locally in /avatars/ for 100% reliable, zero-latency loading.
 */

export const AVATAR_PRESETS = [
  {
    "id": "naruto",
    "name": "Naruto Uzumaki",
    "anime": "Naruto",
    "gender": "male",
    "avatarUrl": "/avatars/naruto.png"
  },
  {
    "id": "luffy",
    "name": "Monkey D. Luffy",
    "anime": "One Piece",
    "gender": "male",
    "avatarUrl": "/avatars/luffy.png"
  },
  {
    "id": "goku",
    "name": "Son Goku",
    "anime": "Dragon Ball",
    "gender": "male",
    "avatarUrl": "/avatars/goku.png"
  },
  {
    "id": "levi",
    "name": "Levi Ackerman",
    "anime": "Attack on Titan",
    "gender": "male",
    "avatarUrl": "/avatars/levi.png"
  },
  {
    "id": "gojo",
    "name": "Satoru Gojo",
    "anime": "Jujutsu Kaisen",
    "gender": "male",
    "avatarUrl": "/avatars/gojo.png"
  },
  {
    "id": "ichigo",
    "name": "Ichigo Kurosaki",
    "anime": "Bleach",
    "gender": "male",
    "avatarUrl": "/avatars/ichigo.png"
  },
  {
    "id": "tanjiro",
    "name": "Tanjiro Kamado",
    "anime": "Demon Slayer",
    "gender": "male",
    "avatarUrl": "/avatars/tanjiro.png"
  },
  {
    "id": "jinwoo",
    "name": "Sung Jin-woo",
    "anime": "Solo Leveling",
    "gender": "male",
    "avatarUrl": "/avatars/jinwoo.png"
  },
  {
    "id": "mikasa",
    "name": "Mikasa Ackerman",
    "anime": "Attack on Titan",
    "gender": "female",
    "avatarUrl": "/avatars/mikasa.png"
  },
  {
    "id": "nezuko",
    "name": "Nezuko Kamado",
    "anime": "Demon Slayer",
    "gender": "female",
    "avatarUrl": "/avatars/nezuko.png"
  },
  {
    "id": "nami",
    "name": "Nami",
    "anime": "One Piece",
    "gender": "female",
    "avatarUrl": "/avatars/nami.png"
  },
  {
    "id": "sakura",
    "name": "Sakura Haruno",
    "anime": "Naruto",
    "gender": "female",
    "avatarUrl": "/avatars/sakura.png"
  },
  {
    "id": "marin",
    "name": "Marin Kitagawa",
    "anime": "My Dress-Up Darling",
    "gender": "female",
    "avatarUrl": "/avatars/marin.png"
  },
  {
    "id": "yor",
    "name": "Yor Forger",
    "anime": "Spy x Family",
    "gender": "female",
    "avatarUrl": "/avatars/yor.png"
  },
  {
    "id": "frieren",
    "name": "Frieren",
    "anime": "Frieren",
    "gender": "female",
    "avatarUrl": "/avatars/frieren.png"
  },
  {
    "id": "nobara",
    "name": "Nobara Kugisaki",
    "anime": "Jujutsu Kaisen",
    "gender": "female",
    "avatarUrl": "/avatars/nobara.png"
  }
];

export const DEFAULT_AVATAR = AVATAR_PRESETS[0].avatarUrl;

/**
 * Resolves avatar URL. Replaces null/empty or legacy dicebear robot avatars
 * with the default anime avatar (/avatars/naruto.png).
 * @param {string} [avatarUrl]
 * @returns {string}
 */
export function resolveAvatar(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') return DEFAULT_AVATAR;
  const trimmed = avatarUrl.trim();
  if (
    trimmed.includes('dicebear.com') ||
    trimmed.includes('bottts') ||
    trimmed.includes('api.dicebear')
  ) {
    return DEFAULT_AVATAR;
  }
  return trimmed;
}

export function getAvatarById(id) {
  return AVATAR_PRESETS.find((a) => a.id === id) || AVATAR_PRESETS[0];
}

export function getAvatarByUrl(url) {
  return AVATAR_PRESETS.find((a) => a.avatarUrl === url) || null;
}
