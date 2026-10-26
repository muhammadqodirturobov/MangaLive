import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';
const profileDir = path.join(outDir, 'cdp_rating_test_profile');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTest() {
  if (fs.existsSync(profileDir)) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    'http://localhost:5173/',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9223/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const cmdId = id++;
        callbacks.set(cmdId, { resolve, reject });
        ws.send(JSON.stringify({ id: cmdId, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    console.log('Testing Homepage ratings...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    const homepageRatings = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        // Hero rating
        const heroBadge = document.querySelector('[class*="FeaturedBanner_ratingBadge"], [class*="ratingBadge"]');
        const heroScore = document.querySelector('[class*="FeaturedBanner_ratingScore"], [class*="ratingScore"]')?.textContent?.trim();
        const heroScale = document.querySelector('[class*="FeaturedBanner_ratingScale"]');

        // MangaCards
        const cards = Array.from(document.querySelectorAll('[class*="MangaCard_card"], [class*="card_"]')).slice(0, 5).map(c => ({
          title: c.querySelector('h3, [class*="title"]')?.textContent?.trim(),
          score: c.querySelector('[class*="ratingText"]')?.textContent?.trim()
        }));

        // Weekly rankings
        const rankings = Array.from(document.querySelectorAll('[class*="WeeklyRanking_item"], [class*="item"]')).slice(0, 5).map(it => ({
          title: it.querySelector('[class*="name"]')?.textContent?.trim(),
          score: it.querySelector('[class*="scoreBadge"] strong')?.textContent?.trim(),
          hasScale: !!it.querySelector('[class*="WeeklyRanking_scale"]')
        }));

        // Spotlight
        const spotlight = Array.from(document.querySelectorAll('[class*="SpotlightRecommendations_card"], [class*="card_"]')).slice(0, 3).map(sp => ({
          title: sp.querySelector('h3')?.textContent?.trim(),
          score: sp.querySelector('[class*="ratingScore"]')?.textContent?.trim(),
          hasScale: !!sp.querySelector('[class*="ratingScale"]')
        }));

        return {
          hero: { score: heroScore, hasScale: !!heroScale, title: heroBadge?.getAttribute('title') },
          cards,
          rankings,
          spotlight
        };
      })()`,
      returnByValue: true
    });

    console.log('Homepage Evaluation:', JSON.stringify(homepageRatings.result.value, null, 2));

    // Desktop screenshot of homepage
    const homeShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'ratings_homepage_desktop.png'), Buffer.from(homeShot.data, 'base64'));
    console.log('Saved ratings_homepage_desktop.png');

    // Test Manga Detail Page for Chainsaw Man (arra-odam -> MyAnimeList)
    console.log('\nTesting MangaDetailPage for Chainsaw Man (arra-odam)...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/manga/arra-odam' });
    await sleep(2500);

    const bodyHtml = await sendCommand('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true
    });
    console.log('Body text at /manga/arra-odam:', bodyHtml.result.value?.slice(0, 300));

    const csmDetail = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const score = document.querySelector('[class*="MangaDetailPage_ratingScore"], [class*="ratingScore"]')?.textContent?.trim();
        const source = document.querySelector('[class*="MangaDetailPage_ratingSource"], [class*="ratingSource"]')?.textContent?.trim();
        const count = document.querySelector('[class*="MangaDetailPage_ratingCount"], [class*="ratingCount"]')?.textContent?.trim();
        const link = document.querySelector('[class*="MangaDetailPage_ratingLink"], [class*="ratingLink"]')?.textContent?.trim();
        return { score, source, count, link };
      })()`,
      returnByValue: true
    });
    console.log('Chainsaw Man Detail Page Evaluation:', JSON.stringify(csmDetail.result.value, null, 2));

    const csmShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'ratings_detail_chainsawman.png'), Buffer.from(csmShot.data, 'base64'));
    console.log('Saved ratings_detail_chainsawman.png');

    // Test Manga Detail Page for Overgeared (haddan-tashqari-jihozlangan -> AniList)
    console.log('\nTesting MangaDetailPage for Overgeared (haddan-tashqari-jihozlangan)...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/manga/haddan-tashqari-jihozlangan' });
    await sleep(2000);

    const overgearedDetail = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const score = document.querySelector('[class*="MangaDetailPage_ratingScore"], [class*="ratingScore"]')?.textContent?.trim();
        const source = document.querySelector('[class*="MangaDetailPage_ratingSource"], [class*="ratingSource"]')?.textContent?.trim();
        const count = document.querySelector('[class*="MangaDetailPage_ratingCount"], [class*="ratingCount"]')?.textContent?.trim();
        const link = document.querySelector('[class*="MangaDetailPage_ratingLink"], [class*="ratingLink"]')?.textContent?.trim();
        return { score, source, count, link };
      })()`,
      returnByValue: true
    });
    console.log('Overgeared Detail Page Evaluation:', JSON.stringify(overgearedDetail.result.value, null, 2));

    // Mobile Viewport test
    console.log('\nTesting Mobile Viewport (390x844)...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const mobileShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'ratings_homepage_mobile.png'), Buffer.from(mobileShot.data, 'base64'));
    console.log('Saved ratings_homepage_mobile.png');

    ws.close();
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch {}
  }
}

runTest().catch(console.error);
