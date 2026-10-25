import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

function loadEnv() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      fs.readFileSync(p, 'utf8').split('\n').forEach((l) => {
        const parts = l.trim().split('=');
        if (parts.length >= 2 && !parts[0].startsWith('#')) {
          env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      });
    }
  }
  return env;
}

const env = loadEnv();

async function asyncPool(limit, items, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchImageBenchmark(url, timeoutMs = 15000) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.length;
}

async function runBenchmarkConfig(name, imageUrls, concurrency) {
  const memBefore = process.memoryUsage().heapUsed;
  const t0 = performance.now();
  let completed = 0;
  let errors = 0;
  let totalBytes = 0;

  await asyncPool(concurrency, imageUrls, async (url) => {
    try {
      const bytes = await fetchImageBenchmark(url, 15000);
      totalBytes += bytes;
      completed++;
    } catch (e) {
      errors++;
    }
  });

  const durationSec = (performance.now() - t0) / 1000;
  const memAfter = process.memoryUsage().heapUsed;
  const ppm = ((completed / durationSec) * 60).toFixed(1);
  const kbps = (totalBytes / durationSec / 1024).toFixed(1);
  const memDeltaMb = ((memAfter - memBefore) / 1024 / 1024).toFixed(2);

  return {
    name,
    concurrency,
    completed,
    errors,
    durationSec: durationSec.toFixed(2),
    ppm,
    kbps,
    memDeltaMb,
  };
}

async function main() {
  console.log('Fetching sample chapter image URLs from TopManga...');
  const res = await fetch('https://auth.topmanga.uz/api/manga/dandadan/chapters/');
  const chs = await res.json();
  const sampleUrls = [];
  for (const c of chs.slice(0, 3)) {
    for (const img of c.images || []) {
      sampleUrls.push(img.url);
      if (sampleUrls.length >= 30) break;
    }
    if (sampleUrls.length >= 30) break;
  }

  console.log(`Prepared test set of ${sampleUrls.length} actual production images.\n`);

  const results = [];
  // Config 1: Baseline (concurrency 4)
  console.log('Testing Config 1: Page Concurrency 4 (Current Baseline)...');
  const r1 = await runBenchmarkConfig('Baseline (Concurrency 4)', sampleUrls, 4);
  results.push(r1);
  console.log(`  -> ${r1.ppm} pgs/min, ${r1.kbps} KB/s, Errors: ${r1.errors}, Duration: ${r1.durationSec}s, Heap Delta: ${r1.memDeltaMb}MB`);

  // Config 2: Candidate A (concurrency 8)
  console.log('\nTesting Config 2: Page Concurrency 8 (Candidate A)...');
  const r2 = await runBenchmarkConfig('Candidate A (Concurrency 8)', sampleUrls, 8);
  results.push(r2);
  console.log(`  -> ${r2.ppm} pgs/min, ${r2.kbps} KB/s, Errors: ${r2.errors}, Duration: ${r2.durationSec}s, Heap Delta: ${r2.memDeltaMb}MB`);

  // Config 3: Candidate B (concurrency 10)
  console.log('\nTesting Config 3: Page Concurrency 10 (Candidate B)...');
  const r3 = await runBenchmarkConfig('Candidate B (Concurrency 10)', sampleUrls, 10);
  results.push(r3);
  console.log(`  -> ${r3.ppm} pgs/min, ${r3.kbps} KB/s, Errors: ${r3.errors}, Duration: ${r3.durationSec}s, Heap Delta: ${r3.memDeltaMb}MB`);

  console.log('\n================ BENCHMARK COMPARISON ================');
  console.table(results);
}

main().catch(console.error);
