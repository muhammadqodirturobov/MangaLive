/**
 * MangaLive.uz — Production Manga Fallback Data
 *
 * Contains strictly verified, authorized manga records that match Supabase and Cloudflare R2.
 * All fake/demo placeholder titles have been completely removed.
 */

export const MANGA_LIST = [
  {
    id: 'mening-shogirdlarim-hammalari-katta-yovuzlar',
    uuid: '22222222-0001-0000-0000-000000000006',
    slug: 'mening-shogirdlarim-hammalari-katta-yovuzlar',
    coverImage: '/api/r2/manga/mening-shogirdlarim-hammalari-katta-yovuzlar/cover.jpg',
    title: 'Mening shogirdlarim — hammalari katta yovuzlar',
    titleEn: 'All My Disciples Are Big Villains',
    author: 'Mangabox',
    type: 'manhua',
    status: 'davom etmoqda',
    rating: 4.9,
    ratingCount: 120,
    chapters: 5,
    views: 1540,
    genres: ['jangovar', 'fantaziya', 'sarguzasht', 'isekai', 'sirli'],
    coverColor: ['#1a0533', '#5b21b6'],
    coverAccent: '#a78bfa',
    synopsis:
      "Lu Zhou uyg'onib, eng qudratli va eng qadimiy demonga aylangan. Uning dunyoni qo'rqitib turgan to'qqiz yovuz shogirdi bor: Bo'shliq sektasi sardori minglab demonlarni boshqaradi, ikkinchi shogird esa qilich demoni bo'lib, yoqtirmasa odamni o'ldiradi. Bunday yovuzlarni kultivatsiyasiz qanday boshqarish mumkin?",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: "5 ta bob tayyor!",
  },
  {
    id: '10-000-yil-keyingi-dunyoda-darajani-oshirish',
    uuid: 'e79e5112-f7ef-462d-a4d8-b3a398329c92',
    slug: '10-000-yil-keyingi-dunyoda-darajani-oshirish',
    coverImage: '/api/r2/manga/10-000-yil-keyingi-dunyoda-darajani-oshirish/cover.jpg',
    title: '10 000 yil keyingi dunyoda darajani oshirish',
    titleEn: 'Logging 10,000 Years into the Future',
    author: 'Changpan Warrior',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 4.8,
    ratingCount: 85,
    chapters: 170,
    views: 2100,
    genres: ['harakatli', 'fantaziya', 'jangovar', 'ilmiy-fantastika'],
    coverColor: ['#0f172a', '#1e293b'],
    coverAccent: '#38bdf8',
    synopsis:
      "Jang dao davrining boshida noma'lum yirtqichlar dunyoga bostirib keldi va insoniyat mudofaaga chekindi. Lu Sheng 10,000 yil keyingi kelajak xotiralariga ega bo'lib, o'tmish xatolarini tuzatishga kirishadi.",
    lastChapter: 170,
    lastUpdated: '2026-10-25',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '170 ta bob tayyor!',
  },
  {
    id: '4000-yildan-song-qaytib-kelgan-arximag',
    uuid: '5d993a38-d886-4d40-b318-279e1c30aaef',
    slug: '4000-yildan-song-qaytib-kelgan-arximag',
    coverImage: '/api/r2/manga/4000-yildan-song-qaytib-kelgan-arximag/cover.jpg',
    title: "4000 yildan so'ng qaytib kelgan arximag",
    titleEn: 'The Archmage Returns After 4000 Years',
    author: 'Barnicle, Nakhasan, Redice Studio',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 4.8,
    ratingCount: 95,
    chapters: 5,
    views: 1850,
    genres: ['harakatli', 'fantaziya', 'sehr', 'sarguzasht'],
    coverColor: ['#1e1b4b', '#312e81'],
    coverAccent: '#818cf8',
    synopsis:
      "West Road akademiyasining eng iqtidorsiz talabasi Frey Bleyk tanasida buyuk arximag Lukas Trowman 4000 yildan so'ng qayta uyg'onadi va qasos olishga kirishadi.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '5 ta bob tayyor!',
  },
  {
    id: '1hp-klubi-qayta-boshlanish',
    uuid: 'faad8f08-6934-48f5-ab63-d5207412d4a6',
    slug: '1hp-klubi-qayta-boshlanish',
    coverImage: '/api/r2/manga/1hp-klubi-qayta-boshlanish/cover.jpg',
    title: '1HP klubi (qayta boshlanish)',
    titleEn: '1HP Club',
    author: 'elfboi',
    type: 'manga',
    status: 'pauza',
    rating: 4.7,
    ratingCount: 60,
    chapters: 5,
    views: 1200,
    genres: ['komediya', 'fantaziya', 'sarguzasht'],
    coverColor: ['#14532d', '#166534'],
    coverAccent: '#4ade80',
    synopsis:
      "Do'stlar guruhi stol roli o'yini Dungeon & Dragons o'ynab, maroqli vaqt o'tkazishadi. 1HP bilan tirik qolgan qahramonlarning kulgili va hayajonli sarguzashtlari.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: false,
    featuredTagline: '5 ta bob tayyor!',
  },
  {
    id: '66-666-yildan-song-qora-sehrgarning-qaytishi',
    uuid: '5ce34e83-217f-4318-96ed-7b927291edfa',
    slug: '66-666-yildan-song-qora-sehrgarning-qaytishi',
    coverImage: '/api/r2/manga/66-666-yildan-song-qora-sehrgarning-qaytishi/cover.jpg',
    title: '66 666 yildan so‘ng: Qora sehrgarning qaytishi',
    titleEn: '66,666 Years: Advent of the Dark Mage',
    author: 'Hwabong, Taru',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 4.8,
    ratingCount: 78,
    chapters: 5,
    views: 1650,
    genres: ['harakatli', 'fantaziya', 'sehr', 'qasos'],
    coverColor: ['#3b0764', '#581c87'],
    coverAccent: '#c084fc',
    synopsis:
      "Qudratli qora sehrgar Diablo Volpir 12 mabudga qarshi jangda mag'lub etilib, muhrlab qo'yilgan edi. 66 666 yil o'tgach, u Jamie Welton ismli chaqaloq qiyofasida qayta tug'iladi.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '5 ta bob tayyor!',
  },
  {
    id: 'nano-mashina',
    uuid: '22e53399-3cce-43a6-a314-822ba0278b22',
    slug: 'nano-mashina',
    coverImage: '/api/r2/manga/nano-mashina/cover.jpg',
    title: 'Nano Mashina',
    titleEn: 'Nano Machine',
    author: 'Hanjoong Wolya / Hyun Jeolmu',
    type: 'manga',
    status: 'davom etmoqda',
    rating: 4.9,
    ratingCount: 150,
    chapters: 40,
    views: 3400,
    genres: ['harakatli', 'fantaziya', 'jangovar', 'ilmiy-fantastika', 'tarixiy'],
    coverColor: ['#0f172a', '#1e293b'],
    coverAccent: '#38bdf8',
    synopsis:
      "Murim dunyosida kamsitilgan Cheon Yeo-woon kelajakdan kelgan sirli avlodidan nano-mashinalar inyeksiyasini oladi va qadimiy jang san'atlarini yangi texnologiya bilan zabt etishga kirishadi.",
    lastChapter: 40,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '40 ta bob tayyor!',
  },
  {
    id: 'solo-leveling-ragnarok',
    uuid: 'c9bc134f-de26-4de7-8fa7-a53f19c51184',
    slug: 'solo-leveling-ragnarok',
    coverImage: '/api/r2/manga/solo-leveling-ragnarok/cover.jpg',
    title: "Yolg'izlikda daraja ko'tarish: Ragnarok",
    titleEn: 'Solo Leveling: Ragnarok',
    author: 'Redice Studio / Daul',
    type: 'manhwa',
    status: 'davom etmoqda',
    rating: 4.9,
    ratingCount: 95,
    chapters: 5,
    views: 2400,
    genres: ['harakatli', 'fantaziya', 'jangovar', 'sarguzasht'],
    coverColor: ['#0f172a', '#1e1b4b'],
    coverAccent: '#6366f1',
    synopsis:
      "Yer yuzida yangi xavf tug'iladi va Sung Jin-woo ning o'g'li Sung Su-ho o'zining yashirin kuchlarini uyg'otadi. Shadow Monarch vorisining yangi afsonaviy janglari boshlanadi.",
    lastChapter: 5,
    lastUpdated: '2026-10-24',
    isNew: true,
    isPopular: true,
    isFeatured: true,
    featuredTagline: '5 ta bob tayyor!',
  },
];

/**
 * Get a manga by its id slug.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getMangaById(id) {
  if (!id) return undefined;
  const clean = String(id).toLowerCase().trim();
  return MANGA_LIST.find((m) => m.id === clean || m.slug === clean || m.uuid === clean);
}

/**
 * Get the featured manga (used for hero banner).
 * @returns {object|undefined}
 */
export function getFeaturedManga() {
  return MANGA_LIST.find((m) => m.isFeatured) ?? MANGA_LIST[0];
}

/**
 * Get rotating list of recommended featured mangas for hero banner carousel.
 * @param {number} limit
 * @returns {object[]}
 */
export function getFeaturedMangas(limit = 4) {
  const featured = MANGA_LIST.filter((m) => m.isFeatured);
  const remaining = MANGA_LIST.filter((m) => !m.isFeatured && m.rating >= 4.7);
  return [...featured, ...remaining].slice(0, limit);
}

/**
 * Get popular manga, sorted by views descending.
 * @param {number} limit
 * @returns {object[]}
 */
export function getPopularManga(limit = 8) {
  return [...MANGA_LIST]
    .filter((m) => m.isPopular)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/**
 * Get latest-updated manga.
 * @param {number} limit
 * @returns {object[]}
 */
export function getLatestManga(limit = 10) {
  return [...MANGA_LIST]
    .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
    .slice(0, limit);
}

/**
 * Filter manga by genre slug.
 * @param {string} genre
 * @returns {object[]}
 */
export function getMangaByGenre(genre) {
  if (!genre || genre === 'barchasi') return MANGA_LIST;
  return MANGA_LIST.filter((m) => m.genres.includes(genre));
}

/**
 * Search manga by query (case-insensitive).
 * @param {string} query
 * @returns {object[]}
 */
export function searchManga(query) {
  if (!query || !query.trim()) return MANGA_LIST;
  const q = query.toLowerCase().trim();
  return MANGA_LIST.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      (m.titleEn && m.titleEn.toLowerCase().includes(q)) ||
      m.author.toLowerCase().includes(q) ||
      m.genres.some((g) => g.toLowerCase().includes(q))
  );
}
