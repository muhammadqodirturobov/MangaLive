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
  console.log('Testing Reader & R2 Proxy verification for Chapters 1 & 5:');
  for (const slug of slugs) {
    const ch1Reader = await checkUrl(`http://localhost:5173/manga/${slug}/chapter/1`);
    const ch1Img = await checkUrl(`http://localhost:5173/api/r2/manga/${slug}/chapters/1/001.webp`);
    
    const ch5Reader = await checkUrl(`http://localhost:5173/manga/${slug}/chapter/5`);
    const ch5Img = await checkUrl(`http://localhost:5173/api/r2/manga/${slug}/chapters/5/001.webp`);

    console.log(`\n- [${slug}]`);
    console.log(`    Ch 1 Reader UI: HTTP ${ch1Reader.status} (${ch1Reader.contentType})`);
    console.log(`    Ch 1 R2 P1:     HTTP ${ch1Img.status} (${ch1Img.contentType}, ${ch1Img.byteLength} bytes)`);
    console.log(`    Ch 5 Reader UI: HTTP ${ch5Reader.status} (${ch5Reader.contentType})`);
    console.log(`    Ch 5 R2 P1 (Guest): HTTP ${ch5Img.status} (Access gated: 401 expected for guest)`);
  }
}

run();
