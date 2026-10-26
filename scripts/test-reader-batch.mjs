const slugs = [
  'solo-leveling',
  'who-made-me-a-princess',
  'operation-true-love',
  'eleceed',
  'a-returners-magic-should-be-special'
];

async function checkUrl(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    return {
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type'),
      byteLength: Buffer.byteLength(text)
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function run() {
  console.log('Testing Reader & R2 Proxy verification:');
  for (const slug of slugs) {
    const readerRes = await checkUrl(`http://localhost:5173/manga/${slug}/chapter/1`);
    const imgRes = await checkUrl(`http://localhost:5173/api/r2/manga/${slug}/chapters/1/001.webp`);
    console.log(`- [${slug}]`);
    console.log(`    Reader UI: HTTP ${readerRes.status} (${readerRes.contentType})`);
    console.log(`    R2 Ch1 P1: HTTP ${imgRes.status} (${imgRes.contentType}, ${imgRes.byteLength} bytes)`);
  }
}

run();
