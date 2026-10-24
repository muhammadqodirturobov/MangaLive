/**
 * MangaLive.uz — PDF Chapter Processing Service
 *
 * Renders PDF chapter pages to high-quality WebP blobs in the browser
 * using Mozilla pdfjs-dist and HTML5 Canvas.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Vite browser bundling using standard ES URL
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;
  } catch (err) {
    console.warn('[pdfChapterService] Failed to set workerSrc with import.meta.url:', err);
  }
}

export const PDF_LIMITS = {
  MAX_PAGES_PER_CHAPTER: 200,
  TARGET_RENDER_WIDTH: 1600, // Crisp high-definition resolution for modern displays
  WEBP_QUALITY: 0.90,
};

/**
 * Convert a PDF source (Blob, File, ArrayBuffer, or Uint8Array) into an array of WebP images.
 *
 * @param {Blob | File | ArrayBuffer | Uint8Array} pdfSource
 * @param {object} [options]
 * @param {number} [options.maxPages=200]
 * @param {number} [options.targetWidth=1400]
 * @param {function} [options.onProgress] (current, total) => void
 * @returns {Promise<Array<{ filename: string, blob: Blob, size: number, pageNumber: number }>>}
 */
export async function convertPdfToChapterPages(
  pdfSource,
  {
    maxPages = PDF_LIMITS.MAX_PAGES_PER_CHAPTER,
    targetWidth = PDF_LIMITS.TARGET_RENDER_WIDTH,
    onProgress = () => {},
  } = {}
) {
  if (typeof window === 'undefined') {
    throw new Error('PDF renderlash faqat brauzer muhitida qo\'llab-quvvatlanadi.');
  }

  let data;
  if (pdfSource instanceof Blob) {
    data = new Uint8Array(await pdfSource.arrayBuffer());
  } else if (pdfSource instanceof ArrayBuffer) {
    data = new Uint8Array(pdfSource);
  } else if (pdfSource instanceof Uint8Array) {
    data = pdfSource;
  } else {
    throw new Error('Noto\'g\'ri PDF ma\'lumot formati taqdim etildi.');
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    await pdfDoc.destroy();
    throw new Error('PDF hujjati bo\'sh (sahifalar mavjud emas).');
  }

  if (numPages > maxPages) {
    await pdfDoc.destroy();
    throw new Error(
      `PDF sahifalari soni ruxsat etilgan limitdan oshib ketdi (${numPages} ta > ruxsat: ${maxPages} ta).`
    );
  }

  const pages = [];

  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1.0 });

      // Scale to target resolution (minimum 1600px width) for ultra-sharp reading
      const scale = unscaledViewport.width > 0
        ? Math.min(4.0, Math.max(1.5, targetWidth / unscaledViewport.width))
        : 2.0;

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Canvas 2D kontekstini yaratib bo\'lmadi.');
      }

      // Fill white background before rendering
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to WebP blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              // Fallback to JPEG if WebP fails
              canvas.toBlob(
                (jpg) => {
                  if (jpg) resolve(jpg);
                  else reject(new Error(`Sahifa ${pageNum} ni rasmga aylantirishda xatolik.`));
                },
                'image/jpeg',
                0.85
              );
            }
          },
          'image/webp',
          PDF_LIMITS.WEBP_QUALITY
        );
      });

      // Cleanup page and canvas memory immediately
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      const paddedNum = String(pageNum).padStart(3, '0');
      const isWebp = (blob.type || '').includes('webp');
      const filename = `${paddedNum}.${isWebp ? 'webp' : 'jpg'}`;

      pages.push({
        filename,
        blob,
        size: blob.size,
        pageNumber: pageNum,
      });

      onProgress(pageNum, numPages);
    }
  } finally {
    try {
      await pdfDoc.destroy();
    } catch (e) {
      console.warn('[pdfChapterService] pdfDoc.destroy warning:', e);
    }
  }

  return pages;
}
