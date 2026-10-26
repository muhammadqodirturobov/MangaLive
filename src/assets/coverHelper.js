/**
 * MangaLive.uz — Artwork & Cover Asset Helper
 *
 * Professional, authentic manga cover art and placeholder strategy:
 * - Pure book cover design matching real manga/webtoon platforms (MangaDex, MangaLab, Kakao, Shonen Jump).
 * - Real manga compositions: thematic depth, subtle manga screentone / half-tone atmosphere,
 *   geometric linework / chapter frames, Japanese series seal (連載), and intentional typography.
 * - Distinct, recognizable color identity and thematic artwork for every title.
 * - No fake silhouette stick figures or cartoon triangles.
 * - High-definition 300x420 portrait aspect ratio (1 : 1.4).
 */

const MANGA_METADATA = {
  'arra-odam': {
    kanji: '電鋸',
    subtitle: 'CHAINSAW MAN',
    palette: ['#1c0a00', '#451a03', '#7c2d12'],
    accent: '#f97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    tag: 'DARK ACTION',
    iconType: 'blade',
  },
  'shimoliy-qilich-afsonasi': {
    kanji: '北剣',
    subtitle: 'LEGEND OF THE NORTHERN BLADE',
    palette: ['#0f051d', '#2e1065', '#3b0764'],
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    tag: 'MARTIAL ARTS',
    iconType: 'blade',
  },
  'meni-olib-ket-cheksiz-gacha': {
    kanji: '無限',
    subtitle: 'PICK ME UP: INFINITE GACHA',
    palette: ['#18041c', '#3b0764', '#500724'],
    accent: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.4)',
    tag: 'FANTASY GACHA',
    iconType: 'crown',
  },
  'nano-mashina': {
    kanji: '武神',
    subtitle: 'NANO MACHINE',
    palette: ['#041019', '#082f49', '#0c4a6e'],
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    tag: 'MARTIAL SCI-FI',
    iconType: 'blade',
  },
  'dandadan': {
    kanji: '霊異',
    subtitle: 'DANDADAN',
    palette: ['#021a12', '#064e3b', '#065f46'],
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    tag: 'SUPERNATURAL ACTION',
    iconType: 'wind',
  },
  'yollanma-askarning-maktabga-qaytishi': {
    kanji: '傭兵',
    subtitle: 'MERCENARY ENROLLMENT',
    palette: ['#05131e', '#0c2340', '#164e63'],
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    tag: 'MILITARY ACTION',
    iconType: 'shield',
  },
  'lookism': {
    kanji: '外貌',
    subtitle: 'LOOKISM',
    palette: ['#1c040d', '#4c0519', '#881337'],
    accent: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    tag: 'WEBTOON DRAMA',
    iconType: 'star',
  },
  'solo-leveling-ragnarok': {
    kanji: '新王',
    subtitle: 'SOLO LEVELING: RAGNAROK',
    palette: ['#0b0f19', '#1e1b4b', '#312e81'],
    accent: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.4)',
    tag: 'RAGNAROK HUNTER',
    iconType: 'blade',
  },
  'solo-leveling': {
    kanji: '影王',
    subtitle: 'SOLO LEVELING',
    palette: ['#09090b', '#18181b', '#27272a'],
    accent: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.4)',
    tag: 'SHADOW MONARCH',
    iconType: 'blade',
  },
  '4000-yildan-song-qaytib-kelgan-arximag': {
    kanji: '大魔',
    subtitle: 'THE ARCHMAGE RETURNS',
    palette: ['#0d0c1d', '#1e1b4b', '#312e81'],
    accent: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.4)',
    tag: 'HIGH FANTASY',
    iconType: 'shield',
  },
  '10-000-yil-keyingi-dunyoda-darajani-oshirish': {
    kanji: '武道',
    subtitle: 'LOGGING 10,000 YEARS',
    palette: ['#07111a', '#0f172a', '#1e293b'],
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    tag: 'FUTURE MARTIAL',
    iconType: 'star',
  },
  'qilich-qiroli': {
    kanji: '剣王',
    subtitle: 'SURVIVAL OF A SWORD KING',
    palette: ['#171203', '#422006', '#713f12'],
    accent: '#eab308',
    glow: 'rgba(234, 179, 8, 0.4)',
    tag: 'ISEKAI ACTION',
    iconType: 'blade',
  },
  'yakkaxon-maksimal-darajadagi-yangi-boshlovchi': {
    kanji: '初心者',
    subtitle: 'SOLO MAX-LEVEL NEWBIE',
    palette: ['#04141c', '#0e3a4e', '#155e75'],
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    tag: 'TOWER SYSTEM',
    iconType: 'crown',
  },
  'yengilmas-iljin-loyihasi': {
    kanji: '番長',
    subtitle: 'THE BULLY IN-CHARGE',
    palette: ['#190505', '#450a0a', '#7f1d1d'],
    accent: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    tag: 'ACTION SCHOOL',
    iconType: 'shield',
  },
  '66-666-yildan-song-qora-sehrgarning-qaytishi': {
    kanji: '黒魔',
    subtitle: 'DARK MAGICIAN 66,666',
    palette: ['#170424', '#3b0764', '#581c87'],
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.4)',
    tag: 'DARK REVENGE',
    iconType: 'wind',
  },
  'haddan-tashqari-jihozlangan': {
    kanji: '装備',
    subtitle: 'OVERGEARED',
    palette: ['#1c1303', '#451a03', '#78350f'],
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    tag: 'VRMMO FANTASY',
    iconType: 'crown',
  },
  'mening-shogirdlarim-hammalari-katta-yovuzlar': {
    kanji: '魔尊',
    subtitle: 'ALL MY DISCIPLES ARE VILLAINS',
    palette: ['#120421', '#2e1065', '#4c1d95'],
    accent: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.4)',
    tag: 'CULTIVATION ACTION',
    iconType: 'crown',
  },
  '1hp-klubi-qayta-boshlanish': {
    kanji: '冒険',
    subtitle: '1HP CLUB',
    palette: ['#03170c', '#064e3b', '#14532d'],
    accent: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.4)',
    tag: 'FANTASY COMEDY',
    iconType: 'flower',
  },
};

export function getMangaThematicProfile(slugOrId = '') {
  if (!slugOrId) {
    return {
      kanji: '漫画',
      subtitle: 'MANGALIVE',
      palette: ['#0b0d19', '#14182e', '#1c2240'],
      accent: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.4)',
      tag: 'FEATURED STORY',
      iconType: 'blade',
    };
  }
  const clean = String(slugOrId).toLowerCase().trim();
  return MANGA_METADATA[clean] || {
    kanji: '連載',
    subtitle: 'MANGALIVE',
    palette: ['#0b0d19', '#14182e', '#1c2240'],
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    tag: 'POPULAR MANGA',
    iconType: 'blade',
  };
}

/**
 * Render thematic manga cover insignia / emblem
 */
function renderEmblem(iconType, accent) {
  switch (iconType) {
    case 'blade':
      return `
        <!-- Crossed Blades / Crest -->
        <g transform="translate(150, 160)">
          <circle cx="0" cy="0" r="48" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
          <line x1="-32" y1="32" x2="32" y2="-32" stroke="#ffffff" stroke-width="2.5"/>
          <line x1="-32" y1="-32" x2="32" y2="32" stroke="#ffffff" stroke-width="2.5"/>
          <line x1="-32" y1="32" x2="32" y2="-32" stroke="${accent}" stroke-width="1"/>
          <line x1="-32" y1="-32" x2="32" y2="32" stroke="${accent}" stroke-width="1"/>
          <circle cx="0" cy="0" r="8" fill="${accent}"/>
          <circle cx="0" cy="0" r="4" fill="#ffffff"/>
        </g>
      `;

    case 'flower':
      return `
        <!-- Floral Academy Crest -->
        <g transform="translate(150, 160)">
          <circle cx="0" cy="0" r="46" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.5"/>
          <path d="M 0,-30 C 15,-15 15,15 0,30 C -15,15 -15,-15 0,-30 Z" fill="${accent}" opacity="0.6"/>
          <path d="M -30,0 C -15,15 15,15 30,0 C 15,-15 -15,-15 -30,0 Z" fill="${accent}" opacity="0.6"/>
          <circle cx="0" cy="0" r="6" fill="#ffffff"/>
        </g>
      `;

    case 'star':
      return `
        <!-- Celestial Astrolabe / Orbit -->
        <g transform="translate(150, 160)">
          <ellipse cx="0" cy="0" rx="46" ry="16" fill="none" stroke="${accent}" stroke-width="1.5" transform="rotate(-25)"/>
          <ellipse cx="0" cy="0" rx="46" ry="16" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4,4" transform="rotate(35)"/>
          <circle cx="0" cy="0" r="14" fill="${accent}" opacity="0.5"/>
          <polygon points="0,-20 5,-5 20,0 5,5 0,20 -5,5 -20,0 -5,-5" fill="#ffffff"/>
        </g>
      `;

    case 'crown':
      return `
        <!-- Monarch Crown / Rune Portal -->
        <g transform="translate(150, 160)">
          <circle cx="0" cy="0" r="48" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="8,4" opacity="0.7"/>
          <polygon points="0,-42 36,20 -36,20" fill="none" stroke="${accent}" stroke-width="1" opacity="0.4"/>
          <polygon points="0,42 36,-20 -36,-20" fill="none" stroke="${accent}" stroke-width="1" opacity="0.4"/>
          <path d="M -22,12 L -26,-12 L -10,-4 L 0,-18 L 10,-4 L 26,-12 L 22,12 Z" fill="${accent}"/>
          <circle cx="0" cy="2" r="3" fill="#ffffff"/>
        </g>
      `;

    case 'mountain':
      return `
        <!-- Glacier Peak Insignia -->
        <g transform="translate(150, 160)">
          <polygon points="0,-36 38,24 -38,24" fill="none" stroke="${accent}" stroke-width="2"/>
          <polygon points="0,-36 14,-10 0,-16 -14,-10" fill="${accent}" opacity="0.9"/>
          <line x1="-45" y1="24" x2="45" y2="24" stroke="#ffffff" stroke-width="1.5"/>
          <circle cx="0" cy="-44" r="3" fill="#ffffff"/>
        </g>
      `;

    case 'wind':
      return `
        <!-- Gale Vortex / Shuriken Crest -->
        <g transform="translate(150, 160)">
          <circle cx="0" cy="0" r="46" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>
          <path d="M 0,-28 Q 12,0 32,-4 Q 0,12 -4,32 Q -12,0 -32,4 Q 0,-12 4,-32 Z" fill="${accent}"/>
          <circle cx="0" cy="0" r="5" fill="#ffffff"/>
        </g>
      `;

    case 'dual':
      return `
        <!-- Flame & Ice Yin-Yang Arc -->
        <g transform="translate(150, 160)">
          <circle cx="0" cy="0" r="46" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3"/>
          <path d="M 0,-34 A 34 34 0 0 1 0,34 A 17 17 0 0 1 0,0 A 17 17 0 0 0 0,-34 Z" fill="#ef4444" opacity="0.8"/>
          <path d="M 0,34 A 34 34 0 0 1 0,-34 A 17 17 0 0 1 0,0 A 17 17 0 0 0 0,34 Z" fill="#38bdf8" opacity="0.8"/>
          <circle cx="0" cy="-17" r="5" fill="#ffffff"/>
          <circle cx="0" cy="17" r="5" fill="#ffffff"/>
        </g>
      `;

    case 'mirror':
      return `
        <!-- Mystic Hexagon Mirror -->
        <g transform="translate(150, 160)">
          <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="none" stroke="${accent}" stroke-width="2"/>
          <polygon points="0,-32 28,-16 28,16 0,32 -28,16 -28,-16" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="4,4"/>
          <circle cx="0" cy="0" r="8" fill="${accent}"/>
          <circle cx="0" cy="0" r="4" fill="#ffffff"/>
        </g>
      `;

    case 'gate':
      return `
        <!-- Torii / Celestial Arch -->
        <g transform="translate(150, 160)">
          <circle cx="0" cy="0" r="48" fill="none" stroke="${accent}" stroke-width="1" opacity="0.4"/>
          <line x1="-36" y1="-20" x2="36" y2="-20" stroke="#ffffff" stroke-width="3"/>
          <line x1="-32" y1="-14" x2="32" y2="-14" stroke="${accent}" stroke-width="2"/>
          <line x1="-20" y1="-14" x2="-20" y2="28" stroke="#ffffff" stroke-width="3"/>
          <line x1="20" y1="-14" x2="20" y2="28" stroke="#ffffff" stroke-width="3"/>
          <circle cx="0" cy="-32" r="6" fill="${accent}"/>
        </g>
      `;

    case 'shield':
      return `
        <!-- Fortress Shield -->
        <g transform="translate(150, 160)">
          <path d="M 0,-36 L 28,-22 L 28,6 C 28,24 0,38 0,38 C 0,38 -28,24 -28,6 L -28,-22 Z" fill="none" stroke="${accent}" stroke-width="2"/>
          <circle cx="0" cy="0" r="8" fill="${accent}" opacity="0.7"/>
          <circle cx="0" cy="0" r="4" fill="#ffffff"/>
        </g>
      `;

    default:
      // Nocturne / Moon (Generic Celestial)
      return `
        <!-- Nocturne Radiant Moon & Eclipse Ring -->
        <g transform="translate(150, 160)">
          <circle cx="0" cy="0" r="48" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>
          <circle cx="0" cy="0" r="32" fill="${accent}" opacity="0.3"/>
          <circle cx="-6" cy="-6" r="24" fill="#ffffff" opacity="0.85"/>
          <circle cx="4" cy="0" r="20" fill="#0f0728"/>
          <!-- Star twinkles -->
          <circle cx="34" cy="-28" r="2" fill="#ffffff"/>
          <circle cx="-28" cy="30" r="1.5" fill="#ffffff"/>
        </g>
      `;
  }
}

/**
 * Build clean, intentional professional manga book cover vector SVG data URI.
 * Canvas: 300 x 420 (standard 1 : 1.4 portrait ratio).
 */
export function buildCoverDataUri(colors, accent, title, type, id = '') {
  const meta = MANGA_METADATA[id] || {
    kanji: '漫画',
    subtitle: (title || 'MANGA SERIES').toUpperCase(),
    palette: colors || ['#0a0818', '#14162b', '#1e2238'],
    accent: accent || '#8b5cf6',
    tag: (type || 'MANGA').toUpperCase(),
    iconType: 'moon',
  };

  const [c1, c2, c3 = '#070914'] = meta.palette;
  const glow = meta.accent;
  const emblem = renderEmblem(meta.iconType, glow);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="300" height="420">
    <defs>
      <!-- Book Spine Background Gradient -->
      <linearGradient id="coverGrad" x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="50%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient>

      <!-- Atmospheric Radial Glow -->
      <radialGradient id="centerGlow" cx="50%" cy="38%" r="55%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="${glow}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>

      <!-- Soft Bottom Scrim for Title Contrast -->
      <linearGradient id="bottomShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="transparent"/>
        <stop offset="65%" stop-color="rgba(7,9,18,0.7)"/>
        <stop offset="100%" stop-color="rgba(7,9,18,0.96)"/>
      </linearGradient>

      <!-- Subtle Manga Halftone Dot Screen -->
      <pattern id="halftone" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="0.75" fill="${glow}" opacity="0.12"/>
      </pattern>
    </defs>

    <!-- 1. Background Base -->
    <rect width="300" height="420" fill="url(#coverGrad)"/>
    <rect width="300" height="420" fill="url(#centerGlow)"/>
    <rect width="300" height="420" fill="url(#halftone)"/>

    <!-- 2. Clean Manga Frame Borders -->
    <rect x="12" y="12" width="276" height="396" rx="3" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="16" y="16" width="268" height="388" rx="2" fill="none" stroke="${glow}" stroke-width="0.8" opacity="0.3"/>

    <!-- 3. Top Header Bar (Serial Publication Seal) -->
    <g transform="translate(24, 28)">
      <!-- Official Publication Seal -->
      <rect width="40" height="18" rx="2" fill="rgba(255,255,255,0.06)" stroke="${glow}" stroke-width="0.8" opacity="0.8"/>
      <text x="20" y="13" font-family="'Segoe UI', -apple-system, sans-serif" font-size="9" font-weight="700" fill="${glow}" text-anchor="middle" letter-spacing="1">連載</text>

      <!-- Series Category Tag -->
      <text x="48" y="13" font-family="'Segoe UI', -apple-system, sans-serif" font-size="8" font-weight="600" fill="#94a3b8" letter-spacing="1.5">${meta.tag}</text>
    </g>

    <!-- 4. Top-Right Kanji Monogram Graphic -->
    <g transform="translate(254, 24)">
      <circle cx="10" cy="12" r="14" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <text x="10" y="17" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="900" fill="#e2e8f0" text-anchor="middle">${meta.kanji}</text>
    </g>

    <!-- 5. Central Thematic Manga Emblem -->
    ${emblem}

    <!-- 6. Geometry & Atmosphere Lines -->
    <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
      <line x1="24" y1="240" x2="276" y2="240"/>
      <line x1="150" y1="225" x2="150" y2="255" stroke="${glow}" stroke-width="2" opacity="0.5"/>
    </g>

    <!-- 7. Typography Layout (Sub-title in English/Latin) -->
    <g transform="translate(150, 275)">
      <text x="0" y="0" font-family="'Segoe UI', -apple-system, sans-serif" font-size="9" font-weight="700" fill="${glow}" text-anchor="middle" letter-spacing="3">${meta.subtitle}</text>
    </g>

    <!-- 8. Bottom Vignette Scrim (keeps HTML card badges completely clear) -->
    <rect y="220" width="300" height="200" fill="url(#bottomShadow)"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate a cinematic landscape artwork banner for the featured story.
 * Aspect: 1200 x 480 (clean, balanced landscape).
 */
export function buildFeaturedBannerArtwork(manga = null) {
  const width = 1200;
  const height = 480;

  const accent = manga?.coverAccent || '#c084fc';
  const c1 = manga?.coverColor?.[0] || '#070812';
  const c2 = manga?.coverColor?.[1] || '#1d1138';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#070812"/>
        <stop offset="45%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>

      <radialGradient id="portalGlow" cx="72%" cy="46%" r="44%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.8"/>
        <stop offset="35%" stop-color="${accent}" stop-opacity="0.45"/>
        <stop offset="70%" stop-color="#3b0764" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#070812" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#heroBg)"/>

    <!-- Nebula Stars -->
    <g fill="#ffffff" opacity="0.6">
      <circle cx="150" cy="60" r="1.5"/><circle cx="320" cy="110" r="2"/>
      <circle cx="500" cy="70" r="1"/><circle cx="680" cy="90" r="1.5"/>
      <circle cx="850" cy="50" r="2"/><circle cx="1020" cy="80" r="1.5"/>
      <circle cx="780" cy="180" r="1.5"/><circle cx="940" cy="210" r="2"/>
    </g>

    <!-- Giant Moon / Portal Core -->
    <rect width="${width}" height="${height}" fill="url(#portalGlow)"/>
    <circle cx="860" cy="220" r="110" fill="#ffffff" opacity="0.12"/>
    <circle cx="860" cy="220" r="85" fill="#ede9fe" opacity="0.22"/>
    <circle cx="860" cy="220" r="50" fill="#ffffff" opacity="0.4"/>

    <!-- Precision Rune Rings -->
    <g transform="translate(860, 220)" stroke="#c084fc" opacity="0.4" fill="none" stroke-width="1.5">
      <circle cx="0" cy="0" r="150" stroke-dasharray="10,6"/>
      <circle cx="0" cy="0" r="120" stroke-width="1"/>
      <circle cx="0" cy="0" r="85" stroke-dasharray="4,4"/>
      <line x1="-165" y1="0" x2="165" y2="0" stroke="#a855f7" stroke-width="1"/>
      <line x1="0" y1="-165" x2="0" y2="165" stroke="#a855f7" stroke-width="1"/>
    </g>

    <!-- Layered Mountains Silhouette -->
    <polygon points="360,480 560,280 760,480" fill="#0c0e1e" opacity="0.85"/>
    <polygon points="560,480 780,240 1000,480" fill="#12132e" opacity="0.9"/>
    <polygon points="800,480 1020,290 1200,480" fill="#17143a" opacity="0.95"/>

    <!-- Foreground Cliff & Fortress Silhouette -->
    <path d="M 620,480 L 740,330 L 900,350 L 1040,480 Z" fill="#05060d"/>
    <rect x="675" y="300" width="30" height="35" fill="#05060d"/>
    <polygon points="670,300 690,275 710,300" fill="#05060d"/>
    <rect x="686" y="310" width="8" height="12" rx="3" fill="#fbbf24" opacity="0.8"/>

    <!-- Anime Swordsman Hero on Cliff -->
    <g transform="translate(800, 255)">
      <!-- Katana Blade Glow -->
      <line x1="22" y1="-95" x2="22" y2="95" stroke="#38bdf8" stroke-width="3.5" opacity="0.9"/>
      <line x1="22" y1="-95" x2="22" y2="95" stroke="#ffffff" stroke-width="1.8"/>
      <line x1="10" y1="42" x2="34" y2="42" stroke="#fbbf24" stroke-width="3.5"/>
      <!-- Flowing Cape -->
      <path d="M -12,30 Q 50,45 105,75 Q 50,95 -5,85 Z" fill="#4c1d95" opacity="0.9"/>
      <!-- Hero Figure -->
      <circle cx="4" cy="5" r="13" fill="#04050a"/>
      <polygon points="1,-4 -8,-18 4,-7 14,-19 16,-3 23,-12 17,7" fill="#04050a"/>
      <path d="M -10,18 L 20,18 L 26,95 L -16,95 Z" fill="#04050a"/>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
