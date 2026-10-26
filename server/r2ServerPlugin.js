import {
  isR2Configured,
  getR2ConfigSummary,
  uploadToR2,
  getR2Object,
  checkR2ObjectExists,
  getR2DeliveryUrl,
} from './r2Storage.js';
import { MangaboxPublicConnector } from './sourceAdapters/MangaboxPublicConnector.js';

/**
 * Vite plugin that adds server-side R2 upload & image streaming middleware.
 * Keeps R2 credentials strictly on the server and provides both
 * secure asset upload and local/fallback asset streaming.
 */
export function r2VitePlugin() {
  return {
    name: 'r2-storage-middleware',
    configureServer(server) {
      server.middlewares.use(createR2Middleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createR2Middleware());
    },
  };
}

/**
 * Standard Connect / Express compatible middleware for R2 operations.
 */
export function createR2Middleware() {
  return async function r2Middleware(req, res, next) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // 0. Connector Manga Metadata Preview (GET /api/connector/preview?slug=...)
    if (pathname === '/api/connector/preview' && req.method === 'GET') {
      const slug = url.searchParams.get('slug');
      if (!slug) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing slug query parameter' }));
        return;
      }

      try {
        const connector = new MangaboxPublicConnector();
        const preview = await connector.previewMetadata(slug);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, preview }));
      } catch (err) {
        console.error('[Connector API] Preview error:', err.message);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // 0.1 Connector Manga Sync & Cover Upload (POST /api/connector/sync-manga)
    if (pathname === '/api/connector/sync-manga' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', async () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
          const slug = body.slug;
          if (!slug) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing manga slug in body' }));
            return;
          }

          const connector = new MangaboxPublicConnector();
          const details = await connector.fetchMangaDetails(slug);
          let coverUpload = null;

          if (body.uploadCover !== false && details.coverUrl) {
            try {
              const coverAsset = await connector.fetchCoverAsset(details.coverUrl);
              // Quality guard: never replace with empty/low-res image
              if (coverAsset.width >= 300 && coverAsset.size > 10000) {
                const ext = coverAsset.format === 'jpeg' ? 'jpg' : coverAsset.format;
                const objectKey = `manga/${slug}/cover.${ext}`;
                const uploadRes = await uploadToR2({
                  key: objectKey,
                  body: coverAsset.buffer,
                  contentType: coverAsset.contentType,
                });
                coverUpload = {
                  key: uploadRes.key,
                  publicUrl: uploadRes.publicUrl,
                  dimensions: `${coverAsset.width}x${coverAsset.height}`,
                  size: coverAsset.size,
                };
                details.coverUrl = uploadRes.publicUrl;
              }
            } catch (coverErr) {
              console.warn('[Connector API] Cover upload warning:', coverErr.message);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, manga: details, coverUpload }));
        } catch (err) {
          console.error('[Connector API] Sync error:', err);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 1. Health & Config status (never exposes credentials)
    if (pathname === '/api/r2/status' && req.method === 'GET') {
      const summary = getR2ConfigSummary();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(summary));
      return;
    }

    // 2. Upload asset to R2
    if (pathname === '/api/r2/upload' && req.method === 'POST') {
      if (!isR2Configured()) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 503;
        res.end(JSON.stringify({ error: 'Cloudflare R2 is not configured on server' }));
        return;
      }

      try {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const rawBody = Buffer.concat(chunks);
            let key = '';
            let contentType = 'image/webp';
            let fileBuffer = null;

            // Check Content-Type header
            const reqContentType = req.headers['content-type'] || '';

            if (reqContentType.includes('application/json')) {
              const parsed = JSON.parse(rawBody.toString('utf8'));
              key = parsed.key;
              contentType = parsed.contentType || 'image/webp';
              fileBuffer = Buffer.from(parsed.base64, 'base64');
            } else {
              // Raw binary upload with headers
              key = decodeURIComponent(req.headers['x-r2-key'] || '');
              contentType = req.headers['x-r2-content-type'] || reqContentType || 'image/webp';
              fileBuffer = rawBody;
            }

            if (!key || !fileBuffer || fileBuffer.length === 0) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing object key or empty file body' }));
              return;
            }

            const uploadResult = await uploadToR2({
              key,
              body: fileBuffer,
              contentType,
            });

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                key: uploadResult.key,
                publicUrl: uploadResult.publicUrl,
                size: uploadResult.size,
                etag: uploadResult.etag,
              })
            );
          } catch (uploadErr) {
            console.error('[R2 Middleware] Upload processing error:', uploadErr);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: uploadErr.message }));
          }
        });
      } catch (err) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // 3. Stream object directly from R2 (/api/r2/<object-key>)
    if (pathname.startsWith('/api/r2/')) {
      const objectKey = pathname.replace(/^\/api\/r2\//, '');

      if (!objectKey) {
        next();
        return;
      }

      if (req.method === 'HEAD') {
        try {
          const exists = await checkR2ObjectExists(objectKey);
          if (!exists) {
            res.statusCode = 404;
            res.end();
            return;
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.statusCode = 200;
          res.end();
          return;
        } catch {
          res.statusCode = 500;
          res.end();
          return;
        }
      }

      if (req.method === 'GET') {
        try {
          const { bodyStream, contentType, contentLength, etag } = await getR2Object(objectKey);

          res.setHeader('Content-Type', contentType);
          if (contentLength > 0) res.setHeader('Content-Length', contentLength);
          if (etag) res.setHeader('ETag', etag);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.setHeader('Access-Control-Allow-Origin', '*');

          bodyStream.on('error', (err) => {
            // Client closed or socket aborted, avoid unhandled error crash
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end();
            }
          });
          res.on('close', () => {
            if (typeof bodyStream.destroy === 'function') {
              bodyStream.destroy();
            }
          });

          bodyStream.pipe(res);
          return;
        } catch (streamErr) {
          if (streamErr.name === 'NoSuchKey' || streamErr.$metadata?.httpStatusCode === 404) {
            res.statusCode = 404;
            res.end('Object not found in R2');
            return;
          }
          console.error('[R2 Middleware] Stream error for', objectKey, streamErr.message);
          res.statusCode = 500;
          res.end('Error retrieving object from R2');
          return;
        }
      }
    }

    next();
  };
}
