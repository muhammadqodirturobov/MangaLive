import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

// Load environment from .env.local or process.env safely
function loadEnv() {
  const env = { ...process.env };
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const text = fs.readFileSync(fullPath, 'utf8');
      text.split('\n').forEach((line) => {
        const parts = line.trim().split('=');
        if (parts.length >= 2 && !parts[0].startsWith('#')) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          if (!env[key]) env[key] = val;
        }
      });
    }
  }
  return env;
}

const env = loadEnv();

// Support both R_ENDPOINT and R2_ENDPOINT
const endpoint = env.R2_ENDPOINT || env.R_ENDPOINT;
const accessKeyId = env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
const bucketName = env.R2_BUCKET_NAME || 'mangalive';
const publicUrl = env.R2_PUBLIC_URL || '';

let s3Client = null;

export function isR2Configured() {
  return Boolean(endpoint && accessKeyId && secretAccessKey && bucketName);
}

export function getR2Client() {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not fully configured in server environment');
  }
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

export function getR2ConfigSummary() {
  return {
    configured: isR2Configured(),
    bucketName: bucketName || null,
    hasEndpoint: Boolean(endpoint),
    hasAccessKey: Boolean(accessKeyId),
    hasSecretKey: Boolean(secretAccessKey),
    hasPublicDeliveryUrl: Boolean(publicUrl),
    publicDeliveryDomain: publicUrl ? publicUrl.replace(/\/+$/, '') : null,
  };
}

/**
 * Resolve the public or serving delivery URL for an R2 object key.
 * If R2_PUBLIC_URL is configured, returns the public CDN URL.
 * Otherwise, returns the local API proxy URL `/api/r2/${key}`.
 * @param {string} objectKey
 * @returns {string}
 */
export function getR2DeliveryUrl(objectKey) {
  const cleanKey = objectKey.replace(/^\/+/, '');
  if (publicUrl) {
    return `${publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }
  return `/api/r2/${cleanKey}`;
}

/**
 * Upload an asset buffer/stream to Cloudflare R2 with retry support.
 * @param {object} params
 * @param {string} params.key - Object key (e.g. manga/slug/chapters/1/001.webp)
 * @param {Buffer|Uint8Array} params.body - File contents
 * @param {string} [params.contentType='image/webp']
 * @param {string} [params.cacheControl='public, max-age=31536000, immutable']
 * @param {number} [params.maxRetries=3]
 * @returns {Promise<{ key: string, publicUrl: string, etag: string, size: number }>}
 */
export async function uploadToR2({
  key,
  body,
  contentType = 'image/webp',
  cacheControl = 'public, max-age=31536000, immutable',
  maxRetries = 3,
}) {
  const s3 = getR2Client();
  const cleanKey = key.replace(/^\/+/, '');
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
      });

      const result = await s3.send(command);
      const deliveryUrl = getR2DeliveryUrl(cleanKey);

      return {
        key: cleanKey,
        publicUrl: deliveryUrl,
        etag: result.ETag || '',
        size: buffer.length,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[R2] Upload attempt ${attempt}/${maxRetries} failed for "${cleanKey}":`, err.message);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw new Error(`R2 upload failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Fetch an object directly from R2 to stream via /api/r2.
 * @param {string} key
 * @returns {Promise<{ bodyStream: any, contentType: string, contentLength: number, etag: string, lastModified: Date }>}
 */
export async function getR2Object(key) {
  const s3 = getR2Client();
  const cleanKey = key.replace(/^\/+/, '');

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
  });

  const response = await s3.send(command);

  return {
    bodyStream: response.Body,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength || 0,
    etag: response.ETag || '',
    lastModified: response.LastModified || new Date(),
  };
}

/**
 * Check if an object exists in R2 without downloading body.
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function checkR2ObjectExists(key) {
  const s3 = getR2Client();
  const cleanKey = key.replace(/^\/+/, '');

  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      })
    );
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}
