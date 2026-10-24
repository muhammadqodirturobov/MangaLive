/**
 * MangaLive.uz — Frontend Cloudflare R2 Storage Service
 *
 * Interacts with the secure server-side R2 upload & streaming endpoints.
 * Never exposes R2 access keys or secrets to browser bundles.
 */

let r2StatusCache = null;
let r2StatusPromise = null;

/**
 * Check if server-side R2 integration is configured and available.
 * @returns {Promise<{ configured: boolean, bucketName: string|null, hasPublicDeliveryUrl: boolean }>}
 */
export async function getR2Status() {
  if (r2StatusCache !== null) return r2StatusCache;
  if (r2StatusPromise) return r2StatusPromise;

  r2StatusPromise = (async () => {
    try {
      const res = await fetch('/api/r2/status');
      if (!res.ok) {
        r2StatusCache = { configured: false, bucketName: null, hasPublicDeliveryUrl: false };
      } else {
        r2StatusCache = await res.json();
      }
    } catch {
      r2StatusCache = { configured: false, bucketName: null, hasPublicDeliveryUrl: false };
    } finally {
      r2StatusPromise = null;
    }
    return r2StatusCache;
  })();

  return r2StatusPromise;
}

/**
 * Upload an asset directly to Cloudflare R2 via secure server endpoint.
 * @param {object} params
 * @param {string} params.key - Object key (e.g. manga/slug/chapters/1/001.webp)
 * @param {Blob|File} params.fileOrBlob - Asset data
 * @param {string} [params.contentType='image/webp']
 * @returns {Promise<{ success: boolean, key: string, publicUrl: string }>}
 */
export async function uploadAssetToR2({ key, fileOrBlob, contentType = 'image/webp' }) {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Convert binary to base64 safely
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const res = await fetch('/api/r2/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      base64,
      contentType,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `R2 upload failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Upload a single chapter page image to Cloudflare R2.
 * @param {object} params
 * @param {string} params.mangaSlug
 * @param {number} params.chapterNumber
 * @param {number} params.pageNumber
 * @param {Blob} params.blob
 * @param {string} [params.filename]
 * @returns {Promise<string>} Public / delivery image URL
 */
export async function uploadChapterPageToR2({
  mangaSlug,
  chapterNumber,
  pageNumber,
  blob,
  filename = 'page.webp',
}) {
  const cleanSlug = mangaSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const paddedNum = String(pageNumber).padStart(3, '0');
  const ext = filename.split('.').pop()?.toLowerCase() || 'webp';
  const key = `manga/${cleanSlug}/chapters/${chapterNumber}/${paddedNum}.${ext}`;

  const result = await uploadAssetToR2({
    key,
    fileOrBlob: blob,
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });

  return result.publicUrl;
}

/**
 * Upload a manga cover image to Cloudflare R2.
 * @param {object} params
 * @param {string} params.mangaSlug
 * @param {File|Blob} params.file
 * @returns {Promise<string>} Public / delivery cover image URL
 */
export async function uploadMangaCoverToR2({ mangaSlug, file }) {
  const cleanSlug = mangaSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const ext = file.name?.split('.').pop()?.toLowerCase() || 'webp';
  const key = `manga/${cleanSlug}/covers/cover_${Date.now()}.${ext}`;

  const result = await uploadAssetToR2({
    key,
    fileOrBlob: file,
    contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });

  return result.publicUrl;
}
