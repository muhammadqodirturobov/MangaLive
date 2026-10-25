const TITLES_MAP = [
  { slug: 'lookism', search: 'Lookism' },
  { slug: 'dandadan', search: 'Dandadan' },
  { slug: 'arra-odam', search: 'Chainsaw Man' },
  { slug: 'yollanma-askarning-maktabga-qaytishi', search: 'Mercenary Enrollment' },
  { slug: 'qilich-qiroli', search: 'Survival Story of a Sword King in a Fantasy World' },
  { slug: 'shimoliy-qilich-afsonasi', search: 'Legend of the Northern Blade' },
  { slug: 'haddan-tashqari-jihozlangan', search: 'Overgeared' },
  { slug: 'meni-olib-ket-cheksiz-gacha', search: 'Pick Me Up, Infinite Gacha' },
  { slug: 'yakkaxon-maksimal-darajadagi-yangi-boshlovchi', search: "Solo Max-Level Newbie" },
  { slug: 'yengilmas-iljin-loyihasi', search: 'Designated Bully' },
  { slug: '10-000-yil-keyingi-dunyoda-darajani-oshirish', search: 'Apex Future Martial Arts' },
  { slug: 'nano-mashina', search: 'Nano Machine' },
  { slug: 'solo-leveling-ragnarok', search: 'Solo Leveling: Ragnarok' },
  { slug: '4000-yildan-song-qaytib-kelgan-arximag', search: 'The Great Mage Returns After 4000 Years' },
  { slug: '66-666-yildan-song-qora-sehrgarning-qaytishi', search: '66,666 Years: Advent of the Dark Mage' },
  { slug: 'mening-shogirdlarim-hammalari-katta-yovuzlar', search: 'My Disciples Are All Big Villains' },
  { slug: '1hp-klubi-qayta-boshlanish', search: '1HP Club' },
];

async function fetchAniListRating(search) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: MANGA) {
        id
        title {
          english
          romaji
        }
        averageScore
        popularity
        siteUrl
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables: { search } }),
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data?.Media;
}

async function run() {
  const ratings = {};
  for (const item of TITLES_MAP) {
    try {
      const media = await fetchAniListRating(item.search);
      if (media && media.averageScore) {
        const scoreOutOf10 = (media.averageScore / 10).toFixed(1);
        ratings[item.slug] = {
          source: 'AniList',
          externalId: media.id,
          title: media.title.english || media.title.romaji,
          score: parseFloat(scoreOutOf10),
          scale: 10.0,
          members: media.popularity,
          url: media.siteUrl,
          syncedAt: new Date().toISOString()
        };
        console.log(`✓ [${item.slug}] AniList Score: ${scoreOutOf10}/10 (${media.popularity.toLocaleString()} members) -> ${media.title.english || media.title.romaji}`);
      } else {
        console.log(`- [${item.slug}] No rating / Not rated on AniList`);
        ratings[item.slug] = null;
      }
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`❌ [${item.slug}] Error: ${e.message}`);
      ratings[item.slug] = null;
    }
  }

  const fs = await import('fs');
  fs.writeFileSync('src/data/externalRatings.json', JSON.stringify(ratings, null, 2), 'utf8');
  console.log('\nSuccessfully saved src/data/externalRatings.json!');
}

run().catch(console.error);
