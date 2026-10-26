import fs from 'fs';
import path from 'path';

const dir = 'D:\\Downloads\\Telegram Desktop';

// Extract JPEGs from PDF buffer
export function extractJpegsFromPdfBuffer(buf) {
  const images = [];
  let pos = 0;
  while (pos < buf.length - 1) {
    if (buf[pos] === 0xFF && buf[pos + 1] === 0xD8) {
      const start = pos;
      let end = pos + 2;
      while (end < buf.length - 1) {
        if (buf[end] === 0xFF && buf[end + 1] === 0xD9) {
          end += 2;
          break;
        }
        end++;
      }
      if (end > start) {
        images.push(buf.subarray(start, end));
        pos = end;
        continue;
      }
    }
    pos++;
  }
  return images;
}

// Extract dimensions from JPEG SOF0 / SOF2 marker
export function getJpegDimensions(buf) {
  let pos = 2;
  while (pos < buf.length - 8) {
    if (buf[pos] === 0xFF) {
      const marker = buf[pos + 1];
      // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
      if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
        const height = buf.readUInt16BE(pos + 5);
        const width = buf.readUInt16BE(pos + 7);
        return { width, height };
      }
      const len = buf.readUInt16BE(pos + 2);
      pos += 2 + len;
    } else {
      pos++;
    }
  }
  return { width: null, height: null };
}

async function audit() {
  console.log('--- Auditing Solo Leveling Chapters in D:\\Downloads\\Telegram Desktop ---');
  const files = fs.readdirSync(dir);
  
  // Find all Bob files for Solo Leveling
  const soloPdfs = files.filter(f => f.toLowerCase().endsWith('.pdf') && f.includes("Yolg'izlikda daraja ko'tarish"));
  console.log(`Found ${soloPdfs.length} Solo Leveling PDFs.`);

  const chapterMap = new Map();

  for (const f of soloPdfs) {
    let chNum = null;
    const match = f.match(/BOB\s*(\d+)/i);
    if (match) {
      chNum = parseInt(match[1], 10);
    }
    if (chNum === null) {
      console.warn('Could not parse chapter number for:', f);
      continue;
    }

    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    const buf = fs.readFileSync(fullPath);
    const jpegs = extractJpegsFromPdfBuffer(buf);

    let allValid = true;
    const dimensions = [];
    for (let i = 0; i < jpegs.length; i++) {
      const img = jpegs[i];
      if (img.length < 500 || img[0] !== 0xFF || img[1] !== 0xD8 || img[img.length - 2] !== 0xFF || img[img.length - 1] !== 0xD9) {
        allValid = false;
      }
      dimensions.push(getJpegDimensions(img));
    }

    chapterMap.set(chNum, {
      chapterNumber: chNum,
      filename: f,
      fullPath,
      fileSize: stat.size,
      pageCount: jpegs.length,
      allValid,
      sampleDim: dimensions[0] || null,
    });
  }

  const sortedChapters = Array.from(chapterMap.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);
  console.log(`Audited ${sortedChapters.length} chapters.`);
  
  let totalPages = 0;
  sortedChapters.forEach(c => {
    totalPages += c.pageCount;
    if (c.chapterNumber <= 5 || c.chapterNumber >= 58 || !c.allValid || c.pageCount === 0) {
      console.log(`Chapter ${c.chapterNumber}: pages=${c.pageCount}, valid=${c.allValid}, dim=${c.sampleDim?.width}x${c.sampleDim?.height}, size=${(c.fileSize / 1024 / 1024).toFixed(2)} MB (${c.filename})`);
    }
  });

  console.log(`\nSummary:`);
  console.log(`- Chapter range: ${sortedChapters[0]?.chapterNumber} to ${sortedChapters[sortedChapters.length - 1]?.chapterNumber}`);
  console.log(`- Total chapters: ${sortedChapters.length}`);
  console.log(`- Total pages across all chapters: ${totalPages}`);
  console.log(`- All pages valid JPEGs? ${sortedChapters.every(c => c.allValid && c.pageCount > 0)}`);

  // Write audit json
  fs.writeFileSync('data/solo-leveling-audit.json', JSON.stringify(sortedChapters, null, 2), 'utf8');
  console.log('Saved audit report to data/solo-leveling-audit.json');
}

audit().catch(console.error);
