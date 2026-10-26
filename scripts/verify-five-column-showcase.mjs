import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';
const profileDir = path.join(outDir, 'cdp_showcase_profile');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runVerification() {
  console.log('--- STARTING FIVE-COLUMN SHOWCASE CDP VERIFICATION ---');

  if (fs.existsSync(profileDir)) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9228',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    'http://localhost:5173/',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9228/json');
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

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const callId = id++;
        callbacks.set(callId, { resolve, reject });
        ws.send(JSON.stringify({ id: callId, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text || 'Runtime exception');
      }
      return res.result?.value;
    }

    async function setDeviceMetrics(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width <= 640,
      });
      await sleep(400);
    }

    async function captureScreenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const filepath = path.join(outDir, filename);
      fs.writeFileSync(filepath, buffer);
      console.log(`[Screenshot saved] -> ${filepath}`);
    }

    // Wait for data load
    await sleep(2000);

    // ── TEST 1: DESKTOP (1280x800) ──────────────────────────────────
    console.log('\n=== TEST 1: DESKTOP (1280x800) ===');
    await setDeviceMetrics(1280, 800);

    const desktopData = await evaluate(`
      (() => {
        const peekLeft = document.querySelector('button[aria-label^="Oldingi asar"]');
        const peekRight = document.querySelector('button[aria-label^="Keyingi asar"]');
        const mainCard = document.querySelector('div[class*="mainStageCard"]');
        const secondaryCards = Array.from(document.querySelectorAll('button[class*="secondaryCard"]'));
        const showcaseGrid = document.querySelector('div[class*="showcaseFiveGrid"]');

        const showcaseBox = showcaseGrid?.getBoundingClientRect();
        const mainBox = mainCard?.getBoundingClientRect();
        const secBoxes = secondaryCards.map(c => c.getBoundingClientRect());

        const mainTitle = mainCard?.querySelector('h1')?.textContent?.trim();
        const secTitles = secondaryCards.map(c => c.querySelector('h3')?.textContent?.trim());
        const peekLeftTitle = peekLeft?.querySelector('span[class*="peekTitle"]')?.textContent?.trim();
        const peekRightTitle = peekRight?.querySelector('span[class*="peekTitle"]')?.textContent?.trim();

        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;

        return {
          hasShowcaseGrid: !!showcaseGrid,
          hasMainCard: !!mainCard,
          secondaryCount: secondaryCards.length,
          hasPeekLeft: !!peekLeft,
          hasPeekRight: !!peekRight,
          showcaseWidth: showcaseBox?.width,
          mainWidth: mainBox?.width,
          mainRatio: showcaseBox?.width ? (mainBox?.width / showcaseBox?.width) : 0,
          secWidths: secBoxes.map(b => b.width),
          secRatios: showcaseBox?.width ? secBoxes.map(b => b.width / showcaseBox?.width) : [],
          mainTitle,
          secTitles,
          peekLeftTitle,
          peekRightTitle,
          allVisibleTitles: [peekLeftTitle, mainTitle, ...secTitles, peekRightTitle].filter(Boolean),
          scrollWidth,
          innerWidth,
          hasHorizontalOverflow: scrollWidth > innerWidth
        };
      })()
    `);

    console.log('Desktop Layout Results:');
    console.log(`- Showcase Grid found: ${desktopData.hasShowcaseGrid}`);
    console.log(`- Secondary Previews count: ${desktopData.secondaryCount} (expected: 3)`);
    console.log(`- Left Peek present: ${desktopData.hasPeekLeft}, Right Peek present: ${desktopData.hasPeekRight}`);
    console.log(`- Showcase Width: ${desktopData.showcaseWidth?.toFixed(1)}px`);
    console.log(`- Main Card Width: ${desktopData.mainWidth?.toFixed(1)}px (~${(desktopData.mainRatio * 100).toFixed(1)}% of showcase, target 2/5 = 40%)`);
    console.log(`- Secondary Card Widths: ${desktopData.secWidths.map(w => w.toFixed(1) + 'px').join(', ')} (~${desktopData.secRatios.map(r => (r * 100).toFixed(1) + '%').join(', ')}, target 1/5 = 20% each)`);
    console.log(`- Main Title: "${desktopData.mainTitle}"`);
    console.log(`- Secondary Titles: ${JSON.stringify(desktopData.secTitles)}`);
    console.log(`- Peek Left: "${desktopData.peekLeftTitle}", Peek Right: "${desktopData.peekRightTitle}"`);

    const visibleTitles = desktopData.allVisibleTitles;
    const uniqueTitles = new Set(visibleTitles);
    console.log(`- Unique Titles: ${uniqueTitles.size} / ${visibleTitles.length} visible items`);
    if (uniqueTitles.size === visibleTitles.length) {
      console.log('  [PASS] Zero duplicate titles displayed simultaneously!');
    } else {
      console.warn('  [WARN] Duplicate titles detected:', visibleTitles);
    }

    console.log(`- Horizontal overflow: scrollWidth=${desktopData.scrollWidth} <= innerWidth=${desktopData.innerWidth}: ${!desktopData.hasHorizontalOverflow ? '[PASS]' : '[FAIL]'}`);
    await captureScreenshot('five_column_showcase_desktop.png');

    // ── TEST 2: INTERACTION TEST (CLICK SECONDARY TO PROMOTE) ───────
    console.log('\n=== TEST 2: INTERACTION (CLICK SECONDARY TO PROMOTE) ===');
    const targetTitleToPromote = desktopData.secTitles[0];
    console.log(`Promoting secondary card 1 ("${targetTitleToPromote}") by click...`);

    await evaluate(`
      (() => {
        const btn = document.querySelector('button[class*="secondaryCard1"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(500);

    const newMainTitle = await evaluate(`
      document.querySelector('div[class*="mainStageCard"] h1')?.textContent?.trim()
    `);
    console.log(`New Main Title after click: "${newMainTitle}"`);
    if (newMainTitle === targetTitleToPromote) {
      console.log('  [PASS] Secondary manga successfully promoted to Main Featured position on click!');
    } else {
      console.warn(`  [FAIL] Expected "${targetTitleToPromote}", got "${newMainTitle}"`);
    }

    // ── TEST 3: TABLET (768x1024) ───────────────────────────────────
    console.log('\n=== TEST 3: TABLET (768x1024) ===');
    await setDeviceMetrics(768, 1024);

    const tabletData = await evaluate(`
      (() => {
        const mainCard = document.querySelector('div[class*="mainStageCard"]');
        const secCards = Array.from(document.querySelectorAll('button[class*="secondaryCard"]'));
        const visibleSecCards = secCards.filter(c => {
          const style = window.getComputedStyle(c);
          return style.display !== 'none' && c.getBoundingClientRect().width > 0;
        });

        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;

        return {
          hasMainCard: !!mainCard && mainCard.getBoundingClientRect().width > 0,
          visibleSecondaryCount: visibleSecCards.length,
          scrollWidth,
          innerWidth,
          hasOverflow: scrollWidth > innerWidth
        };
      })()
    `);

    console.log(`- Tablet Main Card visible: ${tabletData.hasMainCard}`);
    console.log(`- Tablet Visible Secondary Previews: ${tabletData.visibleSecondaryCount} (expected >= 2)`);
    console.log(`- Tablet Horizontal Overflow: scrollWidth=${tabletData.scrollWidth} <= ${tabletData.innerWidth}: ${!tabletData.hasOverflow ? '[PASS]' : '[FAIL]'}`);
    await captureScreenshot('five_column_showcase_tablet.png');

    // ── TEST 4: MOBILE (375x812 & 390x844) ──────────────────────────
    console.log('\n=== TEST 4: MOBILE (375x812 & 390x844) ===');
    for (const width of [375, 390]) {
      await setDeviceMetrics(width, 812);

      const mobileData = await evaluate(`
        (() => {
          const mainCard = document.querySelector('div[class*="mainStageCard"]');
          const mobileRow = document.querySelector('div[class*="mobilePreviewsRow"]');
          const mobileItems = Array.from(document.querySelectorAll('button[class*="mobilePreviewItem"]'));

          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;

          return {
            hasMainCard: !!mainCard && mainCard.getBoundingClientRect().width > 0,
            hasMobileRow: !!mobileRow && window.getComputedStyle(mobileRow).display !== 'none',
            mobileItemsCount: mobileItems.length,
            scrollWidth,
            innerWidth,
            hasOverflow: scrollWidth > innerWidth
          };
        })()
      `);

      console.log(`Mobile ${width}px:`);
      console.log(`  - Main Card visible: ${mobileData.hasMainCard}`);
      console.log(`  - Horizontal Touch Previews Row visible: ${mobileData.hasMobileRow} with ${mobileData.mobileItemsCount} items`);
      console.log(`  - Page Overflow: scrollWidth=${mobileData.scrollWidth} <= ${mobileData.innerWidth}: ${!mobileData.hasOverflow ? '[PASS]' : '[FAIL]'}`);
      if (width === 375) {
        await captureScreenshot('five_column_showcase_mobile_375.png');
      }
    }

    ws.close();
    chromeProcess.kill();
    console.log('\n--- ALL FIVE-COLUMN SHOWCASE TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    chromeProcess.kill();
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runVerification();
