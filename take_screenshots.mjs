import { execSync } from 'child_process';
import path from 'path';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';

const targets = [
  { url: 'http://localhost:5173', name: 'home_desktop.png', width: 1440, height: 1100 },
  { url: 'http://localhost:5173', name: 'home_mobile.png', width: 390, height: 844 },
  { url: 'http://localhost:5173', name: 'home_mobile_360.png', width: 360, height: 780 },
  { url: 'http://localhost:5173/katalog', name: 'catalogue_desktop.png', width: 1440, height: 1100 },
  { url: 'http://localhost:5173/katalog', name: 'catalogue_mobile.png', width: 390, height: 844 },
  { url: 'http://localhost:5173/manga/tun-va-tong', name: 'detail_desktop.png', width: 1440, height: 1100 },
  { url: 'http://localhost:5173/manga/tun-va-tong', name: 'detail_mobile.png', width: 390, height: 844 },
  { url: 'http://localhost:5173/manga/tun-va-tong/chapter/87', name: 'reader_desktop.png', width: 1440, height: 1100 },
  { url: 'http://localhost:5173/manga/tun-va-tong/chapter/87', name: 'reader_mobile.png', width: 390, height: 844 },
  { url: 'http://localhost:5173/manga/tun-va-tong/chapter/87', name: 'reader_mobile_360.png', width: 360, height: 780 },
];

for (const t of targets) {
  const filePath = path.join(outDir, t.name);
  console.log(`Capturing ${t.name}...`);
  execSync(`"${chrome}" --headless --disable-gpu --virtual-time-budget=3000 --window-size=${t.width},${t.height} --screenshot="${filePath}" "${t.url}"`);
}
console.log('All screenshots captured successfully.');
