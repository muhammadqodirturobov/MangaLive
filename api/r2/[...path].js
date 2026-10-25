/**
 * MangaLive.uz — Vercel Serverless Function for Cloudflare R2 Asset Proxy
 *
 * Serves manga covers, chapter page images, and diagnostic status.
 *
 * Supported Routes:
 * - GET  /api/r2/<objectKey>  (streams image binary with correct Content-Type)
 * - HEAD /api/r2/<objectKey>  (checks object existence without streaming body)
 * - GET  /api/r2/status       (returns configuration summary without secrets)
 * - GET  /api/r2/health       (uptime check)
 * - OPTIONS /api/r2/*         (CORS preflight)
 */

import path from 'node:path';
import {
  isR2Configured,
  getR2Config,
  getR2ConfigSummary,
  getR2Object,
  checkR2ObjectExists,
} from '../../server/r2Storage.js';

const MIME_TYPES = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.json': 'application/json',
};

function getMimeType(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function getMissingR2EnvVars() {
  const cfg = getR2Config();
  const missing = [];
  if (!cfg.endpoint) missing.push('R2_ENDPOINT (or R_ENDPOINT)');
  if (!cfg.accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!cfg.secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!cfg.bucketName) missing.push('R2_BUCKET_NAME');
  return missing;
}

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 2. Extract object key from query or URL
  let objectKey = '';
  if (Array.isArray(req.query?.path)) {
    objectKey = req.query.path.join('/');
  } else if (typeof req.query?.path === 'string') {
    objectKey = req.query.path;
  } else {
    const parsedUrl = new URL(req.url, 'http://localhost');
    objectKey = parsedUrl.pathname.replace(/^\/api\/r2\/?/, '');
  }

  // Sanitize path (strip leading slashes, decode URI)
  objectKey = decodeURIComponent(objectKey.replace(/^\/+/, '')).split('?')[0];

  // 3. Diagnostics & Health Endpoints
  if (!objectKey || objectKey === 'status' || objectKey === 'health') {
    const summary = getR2ConfigSummary();
    const missing = getMissingR2EnvVars();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.statusCode = summary.configured ? 200 : 503;
    res.end(
      JSON.stringify({
        service: 'MangaLive Cloudflare R2 Proxy',
        status: summary.configured ? 'online' : 'unconfigured',
        timestamp: new Date().toISOString(),
        summary,
        ...(missing.length > 0 ? { missingVariables: missing } : {}),
      })
    );
    return;
  }

  // 4. Guard against missing credentials
  if (!isR2Configured()) {
    console.error('[R2 API] Cloudflare R2 environment variables missing:', getMissingR2EnvVars());
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: 'Cloudflare R2 is not configured in server environment',
        missing: getMissingR2EnvVars(),
        hint: 'Configure R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in Vercel Project Settings.',
      })
    );
    return;
  }

  // 5. HEAD Request (Existence Check)
  if (req.method === 'HEAD') {
    try {
      const exists = await checkR2ObjectExists(objectKey);
      if (!exists) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader('Content-Type', getMimeType(objectKey));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.statusCode = 200;
      res.end();
      return;
    } catch (headErr) {
      console.error('[R2 API] HEAD error for', objectKey, headErr.message);
      res.statusCode = 500;
      res.end();
      return;
    }
  }

  // 6. GET Request (Stream Binary Image)
  if (req.method === 'GET') {
    try {
      const { bodyStream, contentType, contentLength, etag } = await getR2Object(objectKey);

      let finalContentType = contentType;
      const guessedMime = getMimeType(objectKey);
      if (!finalContentType || finalContentType === 'application/octet-stream') {
        finalContentType = guessedMime;
      }

      res.setHeader('Content-Type', finalContentType);
      if (contentLength > 0) {
        res.setHeader('Content-Length', contentLength);
      }
      if (etag) {
        res.setHeader('ETag', etag);
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      if (typeof bodyStream.pipe === 'function') {
        bodyStream.pipe(res);
      } else if (typeof bodyStream.transformToByteArray === 'function') {
        const bytes = await bodyStream.transformToByteArray();
        res.end(Buffer.from(bytes));
      } else {
        const { pipeline } = await import('node:stream/promises');
        await pipeline(bodyStream, res);
      }
      return;
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Object not found in R2 storage', key: objectKey }));
        return;
      }
      console.error('[R2 API] Streaming error for', objectKey, ':', err.message);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Error streaming asset from R2', details: err.message }));
      return;
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 405;
  res.end(JSON.stringify({ error: `Method ${req.method} not allowed` }));
}
