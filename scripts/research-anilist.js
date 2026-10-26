import fs from 'fs';

const titles = [
  // POPULAR COLLECTION
  { id: 1, name: 'Reincarnation of the Suicidal Battle God', slug: 'reincarnation-of-the-suicidal-battle-god', query: 'Doom Breaker', collection: 'popular' },
  { id: 2, name: 'Omniscient Reader’s Viewpoint', slug: 'omniscient-readers-viewpoint', query: "Omniscient Reader's Viewpoint", collection: 'popular' },
  { id: 3, name: 'Leveling with the Gods', slug: 'leveling-with-the-gods', query: 'Leveling with the Gods', collection: 'popular' },
  { id: 4, name: 'A Returner’s Magic Should Be Special', slug: 'a-returners-magic-should-be-special', query: "A Returner's Magic Should Be Special", collection: 'popular' },
  { id: 5, name: 'Solo Leveling', slug: 'solo-leveling', query: 'Solo Leveling', collection: 'popular' },
  { id: 6, name: 'The Greatest Estate Developer', slug: 'the-greatest-estate-developer', query: 'The Greatest Estate Developer', collection: 'popular' },
  { id: 7, name: 'SSS-Class Revival Hunter', slug: 'sss-class-revival-hunter', query: 'SSS-Class Suicide Hunter', collection: 'popular' },
  { id: 8, name: 'Bastard', slug: 'bastard', query: 'Bastard', collection: 'popular' },
  { id: 9, name: 'Eleceed', slug: 'eleceed', query: 'Eleceed', collection: 'popular' },
  { id: 10, name: 'Doom breaker', slug: 'doom-breaker', query: 'Doom Breaker', collection: 'popular' },

  // ROMANCE COLLECTION
  { id: 11, name: 'Operation: True Love', slug: 'operation-true-love', query: 'Operation: True Love', collection: 'romance' },
  { id: 12, name: 'Maybe Meant to Be', slug: 'maybe-meant-to-be', query: 'Maybe Meant to Be', collection: 'romance' },
  { id: 13, name: "The Reason Why Raeliana Ended Up at the Duke's Mansion", slug: 'the-reason-why-raeliana-ended-up-at-the-dukes-mansion', query: "The Reason Why Raeliana Ended Up at the Duke's Mansion", collection: 'romance' },
  { id: 14, name: 'Seasons of Blossom', slug: 'seasons-of-blossom', query: 'Seasons of Blossom', collection: 'romance' },
  { id: 15, name: 'A Business Proposal', slug: 'a-business-proposal', query: 'A Business Proposal', collection: 'romance' },
  { id: 16, name: 'I Shall Master This Family', slug: 'i-shall-master-this-family', query: 'I Shall Master This Family', collection: 'romance' },
  { id: 17, name: 'The Remarried Empress', slug: 'the-remarried-empress', query: 'The Remarried Empress', collection: 'romance' },
  { id: 18, name: 'First Frost', slug: 'first-frost', query: 'First Frost', collection: 'romance' },
  { id: 19, name: 'Who Made Me a Princess', slug: 'who-made-me-a-princess', query: 'Who Made Me a Princess', collection: 'romance' },
  { id: 20, name: 'Villains Are Destined to Die', slug: 'villains-are-destined-to-die', query: 'Villains Are Destined to Die', collection: 'romance' },
];

const GQL_QUERY = `
query ($search: String) {
  Media(search: $search, type: MANGA) {
    id
    idMal
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
      large
    }
    averageScore
    meanScore
    popularity
    status
    format
    countryOfOrigin
    genres
    description(asHtml: false)
    staff {
      edges {
        role
        node {
          name {
            full
          }
        }
      }
    }
  }
}
`;

async function main() {
  console.log('Querying AniList for 20 titles...');
  const results = [];

  for (const t of titles) {
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'MangaLive-Catalog-Research/1.0',
        },
        body: JSON.stringify({
          query: GQL_QUERY,
          variables: { search: t.query },
        }),
      });

      if (!res.ok) {
        console.warn(`[HTTP ${res.status}] ${t.name}`);
        results.push({ ...t, success: false, status: res.status });
        await new Promise(r => setTimeout(r, 600));
        continue;
      }

      const json = await res.json();
      const media = json.data?.Media;
      if (media) {
        const authorEdge = media.staff?.edges?.find(e => /story|original|author/i.test(e.role)) || media.staff?.edges?.[0];
        const artistEdge = media.staff?.edges?.find(e => /art|illustrat/i.test(e.role));
        const authorName = authorEdge?.node?.name?.full || '';
        const artistName = artistEdge?.node?.name?.full || '';
        const author = [authorName, artistName].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');

        const score10 = media.averageScore ? (media.averageScore / 10).toFixed(2) : (media.meanScore ? (media.meanScore / 10).toFixed(2) : '8.00');

        console.log(`[✓ ${t.id}/20] "${t.name}" -> ${media.title.english || media.title.romaji} (Score: ${score10}/10, Pop: ${media.popularity}, Author: ${author})`);

        results.push({
          ...t,
          success: true,
          aniListId: media.id,
          idMal: media.idMal,
          titleRomaji: media.title.romaji,
          titleEnglish: media.title.english,
          titleNative: media.title.native,
          score: parseFloat(score10),
          popularity: media.popularity,
          coverUrl: media.coverImage?.extraLarge || media.coverImage?.large,
          status: media.status,
          countryOfOrigin: media.countryOfOrigin,
          format: media.format,
          genres: media.genres,
          description: media.description,
          author: author || 'MangaLive Studio',
        });
      } else {
        console.warn(`[No match] ${t.name}`);
        results.push({ ...t, success: false });
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`[Error] ${t.name}:`, e.message);
      results.push({ ...t, success: false, error: e.message });
      await new Promise(r => setTimeout(r, 600));
    }
  }

  fs.writeFileSync('data/anilist-20-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to data/anilist-20-results.json');
}

main();
