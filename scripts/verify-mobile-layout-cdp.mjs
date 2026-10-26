import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';
const profileDir = path.join(outDir, 'cdp_mobile_test_profile');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runMobileVerification() {
  if (fs.existsSync(profileDir)) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9224',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    'http://localhost:5173/',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9224/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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

    // ── 1. TEST DESKTOP (1280px) ──────────────────────────────────
    console.log('=== TEST 1: Desktop Viewport (1280px) ===');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const desktopChecks = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const spotlightGrid = document.querySelector('[class*="SpotlightRecommendations_grid"]');
        const spotlightStyle = spotlightGrid ? window.getComputedStyle(spotlightGrid) : null;
        const latestGrid = document.querySelector('[class*="LatestUpdatesGrid_grid"]');
        const latestStyle = latestGrid ? window.getComputedStyle(latestGrid) : null;
        const rankingList = document.querySelector('[class*="WeeklyRanking_list"]');
        const rankingStyle = rankingList ? window.getComputedStyle(rankingList) : null;
        const splitLayout = document.querySelector('[class*="HomePage_splitLayout"]');
        const splitStyle = splitLayout ? window.getComputedStyle(splitLayout) : null;

        return {
          spotlightDisplay: spotlightStyle?.display,
          spotlightColumns: spotlightStyle?.gridTemplateColumns,
          latestDisplay: latestStyle?.display,
          latestColumns: latestStyle?.gridTemplateColumns,
          rankingDisplay: rankingStyle?.display,
          rankingFlexDirection: rankingStyle?.flexDirection,
          splitColumns: splitStyle?.gridTemplateColumns,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Desktop Layout Check:', JSON.stringify(desktopChecks.result.value, null, 2));

    const shotDesktop = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_verification_desktop_1280.png'), Buffer.from(shotDesktop.data, 'base64'));
    console.log('Saved mobile_verification_desktop_1280.png');

    // ── 2. TEST MOBILE (375px - iPhone SE) ────────────────────────
    console.log('\n=== TEST 2: Mobile Viewport (375px - iPhone SE) ===');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    const mobile375Checks = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        // Page width & overflow check
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasHorizontalOverflow = scrollWidth > innerWidth;

        // Spotlight Recommendations
        const spotlightGrid = document.querySelector('[class*="SpotlightRecommendations_grid"]');
        const spotlightCards = Array.from(document.querySelectorAll('[class*="SpotlightRecommendations_card"]'));
        const firstCard = spotlightCards[0];
        const firstCardRect = firstCard ? firstCard.getBoundingClientRect() : null;
        const firstCover = firstCard ? firstCard.querySelector('[class*="coverWrap"]') : null;
        const firstCoverRect = firstCover ? firstCover.getBoundingClientRect() : null;
        const firstReadBtn = firstCard ? firstCard.querySelector('[class*="readBtn"]') : null;
        const firstRating = firstCard ? firstCard.querySelector('[class*="ratingScore"]') : null;
        const firstChBadge = firstCard ? firstCard.querySelector('[class*="chapterBadge"]') : null;

        // Latest Updates
        const latestGrid = document.querySelector('[class*="LatestUpdatesGrid_grid"]');
        const latestEntries = Array.from(document.querySelectorAll('[class*="LatestUpdatesGrid_entry"]'));
        const firstEntry = latestEntries[0];
        const firstEntryRect = firstEntry ? firstEntry.getBoundingClientRect() : null;
        const firstEntryChLinks = firstEntry ? Array.from(firstEntry.querySelectorAll('[class*="chapterLink"]')).map(a => a.textContent.trim()) : [];

        // Weekly Ranking
        const rankingList = document.querySelector('[class*="WeeklyRanking_list"]');
        const rankingItems = Array.from(document.querySelectorAll('[class*="WeeklyRanking_item"]'));
        const firstRanking = rankingItems[0];
        const firstRankingRect = firstRanking ? firstRanking.getBoundingClientRect() : null;
        const rankingTitle = document.querySelector('[class*="WeeklyRanking_title"]')?.textContent?.trim();

        // Bottom Nav
        const bottomNav = document.querySelector('[class*="BottomNav_bottomNav"]');
        const bottomNavVisible = bottomNav ? window.getComputedStyle(bottomNav).display !== 'none' : false;

        // Check if any individual element is wider than innerWidth
        const overflowingElements = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > innerWidth + 1 && !el.classList.toString().includes('track') && !el.classList.toString().includes('grid') && !el.classList.toString().includes('list')) {
            overflowingElements.push({
              tag: el.tagName,
              class: el.className,
              width: rect.width
            });
          }
        });

        return {
          scrollWidth,
          innerWidth,
          hasHorizontalOverflow,
          overflowingElements: overflowingElements.slice(0, 5),
          spotlight: {
            cardCount: spotlightCards.length,
            cardWidth: firstCardRect ? Math.round(firstCardRect.width) : null,
            cardHeight: firstCardRect ? Math.round(firstCardRect.height) : null,
            coverWidth: firstCoverRect ? Math.round(firstCoverRect.width) : null,
            hasRating: !!firstRating,
            ratingText: firstRating ? firstRating.textContent.trim() : null,
            hasChapterBadge: !!firstChBadge,
            chapterText: firstChBadge ? firstChBadge.textContent.trim() : null,
            hasReadBtn: !!firstReadBtn,
            readBtnText: firstReadBtn ? firstReadBtn.textContent.trim() : null
          },
          latestUpdates: {
            entryCount: latestEntries.length,
            entryHeight: firstEntryRect ? Math.round(firstEntryRect.height) : null,
            recentChapterLinks: firstEntryChLinks
          },
          ranking: {
            itemCount: rankingItems.length,
            itemWidth: firstRankingRect ? Math.round(firstRankingRect.width) : null,
            itemHeight: firstRankingRect ? Math.round(firstRankingRect.height) : null,
            rankingTitle
          },
          bottomNavVisible
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile (375px) Checks:', JSON.stringify(mobile375Checks.result.value, null, 2));

    const shot375 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_verification_375px.png'), Buffer.from(shot375.data, 'base64'));
    console.log('Saved mobile_verification_375px.png');

    // ── 3. TEST MOBILE (390px - iPhone 12/13/14) ──────────────────
    console.log('\n=== TEST 3: Mobile Viewport (390px - iPhone 13/14) ===');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const mobile390Checks = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile (390px) Checks:', JSON.stringify(mobile390Checks.result.value, null, 2));

    const shot390 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_verification_390px.png'), Buffer.from(shot390.data, 'base64'));
    console.log('Saved mobile_verification_390px.png');

    // Full page scroll screenshot at 375px to see the entire homepage structure
    console.log('\nCapturing lower page screenshot at 375px (scroll down to spotlight & updates)...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand('Runtime.evaluate', { expression: 'window.scrollTo(0, 500)' });
    await sleep(1000);
    const shotScroll1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_verification_375px_spotlight.png'), Buffer.from(shotScroll1.data, 'base64'));

    await sendCommand('Runtime.evaluate', { expression: 'window.scrollTo(0, 1100)' });
    await sleep(1000);
    const shotScroll2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_verification_375px_updates_ranking.png'), Buffer.from(shotScroll2.data, 'base64'));
    console.log('Saved scroll screenshots: mobile_verification_375px_spotlight.png & mobile_verification_375px_updates_ranking.png');

    ws.close();
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch {}
  }
}

runMobileVerification().catch(console.error);
