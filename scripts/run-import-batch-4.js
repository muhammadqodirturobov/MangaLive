import { importMangaboxSeries } from './import-mangabox-series.js';

async function run() {
  console.log('--- Starting Ingestion of Authorized Permitted Feeds ---');

  // 1. Who Made Me a Princess (Romance #9)
  await importMangaboxSeries({
    targetSlug: 'who-made-me-a-princess',
    sourceSlug: 'bir-kuni-men-malika-bolib-qoldim',
    maxChapters: 3,
    startFrom: 1,
  });

  // 2. Operation: True Love (Romance #1)
  await importMangaboxSeries({
    targetSlug: 'operation-true-love',
    sourceSlug: 'operatsiya-haqiqiy-muhabbat',
    maxChapters: 3,
    startFrom: 1,
  });

  // 3. Eleceed (Popular #9)
  await importMangaboxSeries({
    targetSlug: 'eleceed',
    sourceSlug: 'eleceed',
    maxChapters: 3,
    startFrom: 1,
  });

  // 4. A Returner's Magic Should Be Special (Popular #4)
  await importMangaboxSeries({
    targetSlug: 'a-returners-magic-should-be-special',
    sourceSlug: 'qayta-tugilganlarning-sehri-boshqacha-bolishi-kerak',
    maxChapters: 3,
    startFrom: 1,
  });

  console.log('\n--- Batch Ingestion Complete! ---');
}

run().catch(console.error);
