import { importMangaboxSeries } from './import-mangabox-series.js';

async function run() {
  console.log('===========================================================');
  console.log('Starting Full Expansion of Authorized Chapters (Target >= 20)');
  console.log('===========================================================');

  // 1. Who Made Me a Princess: all 20 unlocked chapters
  console.log('\n[1/4] Expanding "who-made-me-a-princess" to all 20 available chapters...');
  await importMangaboxSeries({
    targetSlug: 'who-made-me-a-princess',
    sourceSlug: 'bir-kuni-men-malika-bolib-qoldim',
    maxChapters: 20,
    startFrom: 1,
  });

  // 2. Operation: True Love: all 20 unlocked chapters
  console.log('\n[2/4] Expanding "operation-true-love" to all 20 available chapters...');
  await importMangaboxSeries({
    targetSlug: 'operation-true-love',
    sourceSlug: 'operatsiya-haqiqiy-muhabbat',
    maxChapters: 20,
    startFrom: 1,
  });

  // 3. Eleceed: 25 chapters (aiming for 20-30+)
  console.log('\n[3/4] Expanding "eleceed" to 25 chapters...');
  await importMangaboxSeries({
    targetSlug: 'eleceed',
    sourceSlug: 'eleceed',
    maxChapters: 25,
    startFrom: 1,
  });

  // 4. A Returner's Magic Should Be Special: 25 chapters (aiming for 20-30+)
  console.log('\n[4/4] Expanding "a-returners-magic-should-be-special" to 25 chapters...');
  await importMangaboxSeries({
    targetSlug: 'a-returners-magic-should-be-special',
    sourceSlug: 'qayta-tugilganlarning-sehri-boshqacha-bolishi-kerak',
    maxChapters: 25,
    startFrom: 1,
  });

  console.log('\n===========================================================');
  console.log('Full Authorized Expansion Complete!');
  console.log('===========================================================');
}

run().catch((err) => {
  console.error('Expansion failed:', err);
  process.exit(1);
});
