/**
 * MangaLive.uz — Chapter & Reader Page Data
 *
 * Provides structured chapter data and authentic webtoon/manga comic panel
 * sample pages for testing vertical continuous-scroll reading.
 * Each page is clearly labeled as sample content with comic panel outlines,
 * speech bubbles, and reading indicators without pretending to be copyrighted art.
 */

/**
 * Generate a list of chapters for a manga.
 * @param {string} mangaId
 * @param {number} total — total chapter count
 * @returns {object[]}
 */
export function getChapters(mangaId, total) {
  if (mangaId === 'peppercarrot' || mangaId === '8f8e051f-d046-4894-b73a-789032a93063') {
    const pcChapters = [
      { chNum: 1, id: '2c58d0a0-5b79-4587-b404-4bd44e6503d7', title: 'Parvoz damlamasi (The Potion of Flight)', pages: 5 },
      { chNum: 2, id: 'e5734914-21e5-4832-9b1c-820bb96d8f69', title: 'Kamalak damlamalari (Rainbow Potions)', pages: 7 },
      { chNum: 3, id: '7af8af19-370c-4d54-be5b-36c1f688d913', title: 'Maxfiy tarkib (The Secret Ingredients)', pages: 9 },
      { chNum: 4, id: '64c3ac9a-4fb7-4e1d-a5a6-c0fafe81ac7d', title: 'Dahoona fikr (Stroke of Genius)', pages: 8 },
      { chNum: 5, id: '9d147951-3538-4e30-acd7-a4bbe950a153', title: 'Bayram maxsus bobi (Special Holiday Episode)', pages: 6 },
      { chNum: 6, id: 'dfb9f52e-5bca-4a05-b93e-733bf9b87729', title: 'Damlamalar musobaqasi (The Potion Contest)', pages: 11 },
      { chNum: 7, id: '5bf28ac4-2ced-4acf-9ab6-d35965cd1d71', title: 'Tilak (The Wish)', pages: 7 },
      { chNum: 8, id: '12e77230-d360-4880-9327-84cd30ec8239', title: "Tug'ilgan kun ziyofati (Pepper's Birthday Party)", pages: 8 },
      { chNum: 9, id: '29c9525e-f92a-4d68-8ae3-39456d29c39b', title: 'Davo (The Remedy)', pages: 9 },
      { chNum: 10, id: 'b92324f6-6255-4937-9aa9-5322a8993f8d', title: 'Yozgi maxsus bob (Summer Special)', pages: 7 },
    ];
    return pcChapters.map((c) => ({
      id: c.id,
      mangaId: '8f8e051f-d046-4894-b73a-789032a93063',
      number: c.chNum,
      title: c.title,
      pageCount: c.pages,
      pagesCount: c.pages,
      publishedAt: '2026-10-24',
      isNew: c.chNum >= 8,
    })).reverse();
  }

  const chapters = [];
  // Sample window of chapters (up to 15 chapters)
  const count = Math.min(15, total);
  const start = Math.max(1, total - count + 1);

  for (let i = total; i >= start; i--) {
    const daysAgo = (total - i) * 2;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    chapters.push({
      id: `${mangaId}-ch-${i}`,
      mangaId,
      number: i,
      title: i % 10 === 0 ? `${i}-bob: Maxsus qism` : `${i}-bob`,
      pageCount: 8, // 8 continuous vertical pages per test chapter
      publishedAt: date.toISOString().split('T')[0],
      isNew: daysAgo <= 2,
    });
  }
  return chapters;
}

/**
 * Build a structured sample manga/webtoon comic strip page SVG data URI.
 * Renders authentic manga-style panel layouts (gutters, dialog bubbles, speedlines, action boxes)
 * with a dark/monochrome aesthetic typical of manga reading platforms.
 *
 * @param {object} params
 * @param {string} params.mangaTitle
 * @param {number} params.chapterNumber
 * @param {number} params.pageIndex 1-based
 * @param {number} params.totalPages
 * @returns {string} SVG Data URI
 */
function buildSampleMangaPageSvg({ mangaTitle, chapterNumber, pageIndex, totalPages }) {
  const width = 800;
  const height = 1200;

  // Alternate layouts for variety across continuous scroll
  const layout = pageIndex % 3;

  let panelContent = '';

  if (layout === 1) {
    // 3 panels vertical stack
    panelContent = `
      <!-- Panel 1: Establishing Shot -->
      <g transform="translate(40, 50)">
        <rect width="720" height="320" rx="4" fill="#181a26" stroke="#2e334d" stroke-width="2"/>
        <path d="M 50 250 L 200 120 L 350 200 L 500 80 L 680 270" stroke="#3d4466" stroke-width="3" fill="none" opacity="0.6"/>
        <circle cx="580" cy="90" r="45" fill="#252a3d" opacity="0.8"/>
        <!-- Dialogue bubble -->
        <path d="M 120 70 Q 120 40 180 40 L 320 40 Q 380 40 380 70 L 380 110 Q 380 140 320 140 L 200 140 L 160 170 L 170 140 L 180 140 Q 120 140 120 110 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="250" y="85" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="600" fill="#0f172a" text-anchor="middle">"Bu joy... qadimiy xarobalarmi?"</text>
        <text x="250" y="110" font-family="'Segoe UI', sans-serif" font-size="12" fill="#64748b" text-anchor="middle">(1-sahna: Qorong'u vodiyga kirish)</text>
      </g>

      <!-- Panel 2: Character Action -->
      <g transform="translate(40, 400)">
        <rect width="720" height="420" rx="4" fill="#141724" stroke="#2e334d" stroke-width="2"/>
        <!-- Speedlines background -->
        <line x1="60" y1="30" x2="660" y2="390" stroke="#252a3d" stroke-width="1.5" stroke-dasharray="12,12"/>
        <line x1="660" y1="30" x2="60" y2="390" stroke="#252a3d" stroke-width="1.5" stroke-dasharray="12,12"/>
        <!-- Silhouette -->
        <circle cx="360" cy="180" r="45" fill="#7c3aed" opacity="0.8"/>
        <path d="M 315 260 C 315 220 405 220 405 260 L 415 360 L 305 360 Z" fill="#6d28d9" opacity="0.7"/>
        <!-- Action bubble -->
        <polygon points="450,110 590,70 560,130 640,140 550,170 580,220 490,180 460,230 470,160 410,140" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <text x="515" y="155" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle">SHIRRQT!</text>
      </g>

      <!-- Panel 3: Reaction Shot -->
      <g transform="translate(40, 850)">
        <rect width="720" height="300" rx="4" fill="#181a26" stroke="#2e334d" stroke-width="2"/>
        <!-- Left eye frame -->
        <rect x="30" y="40" width="300" height="220" rx="3" fill="#1e2235" stroke="#3b4263" stroke-width="1.5"/>
        <circle cx="180" cy="140" r="30" fill="#a78bfa" opacity="0.6"/>
        <circle cx="180" cy="140" r="12" fill="#ffffff"/>
        <!-- Right speech bubble -->
        <path d="M 400 90 Q 400 60 460 60 L 620 60 Q 680 60 680 90 L 680 150 Q 680 180 620 180 L 480 180 L 440 210 L 450 180 Q 400 180 400 150 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="540" y="110" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">"Ular allaqachon yetib kelishdi!"</text>
        <text x="540" y="140" font-family="'Segoe UI', sans-serif" font-size="13" fill="#64748b" text-anchor="middle">"Tayyorlan, ortga yo'l yo'q!"</text>
      </g>
    `;
  } else if (layout === 2) {
    // 2 large dramatic panels
    panelContent = `
      <!-- Panel 1: Vertical split -->
      <g transform="translate(40, 50)">
        <rect width="345" height="520" rx="4" fill="#141724" stroke="#2e334d" stroke-width="2"/>
        <rect x="25" y="40" width="295" height="380" rx="3" fill="#1e2235" opacity="0.5"/>
        <text x="172" y="240" font-family="'Segoe UI', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">«Kutilmagan uchrashuv»</text>
        <!-- Dialogue -->
        <path d="M 50 420 Q 50 395 100 395 L 240 395 Q 290 395 290 420 L 290 460 Q 290 485 240 485 L 120 485 L 90 505 L 95 485 Q 50 485 50 460 Z" fill="#ffffff"/>
        <text x="170" y="445" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">"Sen kimsan o'zi...?"</text>
      </g>
      <g transform="translate(415, 50)">
        <rect width="345" height="520" rx="4" fill="#181a26" stroke="#2e334d" stroke-width="2"/>
        <circle cx="172" cy="200" r="70" fill="#581c87" opacity="0.5"/>
        <circle cx="172" cy="200" r="40" fill="#7c3aed" opacity="0.8"/>
        <!-- Dialogue -->
        <path d="M 70 380 Q 70 350 120 350 L 250 350 Q 300 350 300 380 L 300 420 Q 300 450 250 450 L 140 450 L 110 475 L 115 450 Q 70 450 70 420 Z" fill="#ffffff"/>
        <text x="185" y="405" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">"Mening ismim — Soya."</text>
      </g>

      <!-- Panel 2: Wide cinematic bottom panel -->
      <g transform="translate(40, 600)">
        <rect width="720" height="550" rx="4" fill="#111420" stroke="#2e334d" stroke-width="2"/>
        <path d="M 40 450 L 200 320 L 360 400 L 520 280 L 680 480" stroke="#7c3aed" stroke-width="3" fill="none" opacity="0.7"/>
        <text x="360" y="220" font-family="'Segoe UI', sans-serif" font-size="22" font-weight="800" fill="#e2e8f0" text-anchor="middle" letter-spacing="4">BOB ${chapterNumber} · KULMINATSIYA</text>
        <text x="360" y="260" font-family="'Segoe UI', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Kuchlar to'qnashuvi yaqinlashmoqda</text>
        <!-- Large shout bubble -->
        <polygon points="300,320 420,290 400,340 470,350 390,380 410,420 350,390 320,430 330,370 280,350" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
        <text x="375" y="365" font-family="'Segoe UI', sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">GURS-S-S!</text>
      </g>
    `;
  } else {
    // Webtoon full-bleed vertical scrolling panel
    panelContent = `
      <g transform="translate(40, 50)">
        <rect width="720" height="1100" rx="4" fill="#131625" stroke="#2e334d" stroke-width="2"/>
        <line x1="40" y1="550" x2="680" y2="550" stroke="#1f2438" stroke-width="2"/>
        <!-- Cosmic / Magic aura -->
        <circle cx="360" cy="400" r="160" fill="#4c1d95" opacity="0.3"/>
        <circle cx="360" cy="400" r="100" fill="#6d28d9" opacity="0.4"/>
        <circle cx="360" cy="400" r="50" fill="#a78bfa" opacity="0.6"/>
        <!-- Dialogue top -->
        <path d="M 160 120 Q 160 80 260 80 L 460 80 Q 560 80 560 120 L 560 180 Q 560 220 460 220 L 320 220 L 260 260 L 280 220 Q 160 220 160 180 Z" fill="#ffffff"/>
        <text x="360" y="140" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">"Muhr sindi... Endi hech kim"</text>
        <text x="360" y="175" font-family="'Segoe UI', sans-serif" font-size="16" font-weight="bold" fill="#7c3aed" text-anchor="middle">uni to'xtata olmaydi!"</text>
        <!-- Dialogue bottom -->
        <path d="M 180 820 Q 180 780 270 780 L 450 780 Q 540 780 540 820 L 540 880 Q 540 920 450 920 L 310 920 L 270 955 L 280 920 Q 180 920 180 880 Z" fill="#ffffff"/>
        <text x="360" y="840" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="600" fill="#0f172a" text-anchor="middle">"Biz oxirigacha kurashamiz!"</text>
        <text x="360" y="875" font-family="'Segoe UI', sans-serif" font-size="13" fill="#64748b" text-anchor="middle">O'zbekcha tarjima: MangaLive.uz jamoasi</text>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#0b0d17"/>

    <!-- Watermark / MangaLive header on page strip -->
    <rect x="0" y="0" width="${width}" height="32" fill="#090a12"/>
    <text x="24" y="21" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#64748b" letter-spacing="1">MANGALIVE.UZ · ${mangaTitle?.toUpperCase() ?? 'MANGA'} · ${chapterNumber}-BOB</text>
    <text x="${width - 24}" y="21" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#a78bfa" text-anchor="end">${pageIndex} / ${totalPages}</text>

    ${panelContent}

    <!-- Bottom strip footer watermark -->
    <rect x="0" y="${height - 24}" width="${width}" height="24" fill="#090a12"/>
    <text x="${width / 2}" y="${height - 8}" font-family="'Segoe UI', sans-serif" font-size="10" fill="#475569" text-anchor="middle">Namuna o'qish sahifasi — ${pageIndex}-bet (vertikal skroll sinovi)</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Get ordered chapter pages for vertical reader.
 * Returns an array of clean page objects containing id, pageNumber, src, alt.
 *
 * @param {string} mangaId
 * @param {number} chapterNumber
 * @param {string} mangaTitle
 * @param {number} pageCount
 * @returns {object[]}
 */
export function getChapterPages(mangaId, chapterNumber, mangaTitle = '', pageCount = 8) {
  if (mangaId === 'peppercarrot' || mangaId === '8f8e051f-d046-4894-b73a-789032a93063') {
    const pcPages = [5, 7, 9, 8, 6, 11, 7, 8, 9, 7];
    const count = pcPages[chapterNumber - 1] || pageCount || 5;
    return Array.from({ length: count }, (_, idx) => {
      const pageNum = idx + 1;
      const pad = String(pageNum).padStart(3, '0');
      return {
        id: `pc-${chapterNumber}-${pageNum}`,
        pageNumber: pageNum,
        src: `/api/r2/manga/peppercarrot/chapters/${chapterNumber}/${pad}.jpg`,
        imageUrl: `/api/r2/manga/peppercarrot/chapters/${chapterNumber}/${pad}.jpg`,
        alt: `Pepper & Carrot — ${chapterNumber}-bob, ${pageNum}-sahifa`,
        width: 1200,
        height: 1660,
      };
    });
  }

  const count = pageCount || 8;
  const pages = [];

  for (let i = 1; i <= count; i++) {
    pages.push({
      id: `${mangaId}-ch${chapterNumber}-p${i}`,
      pageNumber: i,
      src: buildSampleMangaPageSvg({
        mangaTitle: mangaTitle || mangaId,
        chapterNumber,
        pageIndex: i,
        totalPages: count,
      }),
      alt: `${mangaTitle || mangaId} — ${chapterNumber}-bob, ${i}-sahifa`,
    });
  }

  return pages;
}

// Keep backward-compatibility alias for older imports
export const getReaderPages = (mangaId, chapterNumber, pageCount) =>
  getChapterPages(mangaId, chapterNumber, '', pageCount);
