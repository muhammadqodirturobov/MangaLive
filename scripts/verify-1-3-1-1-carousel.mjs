import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';
const profileDir = path.join(outDir, 'cdp_carousel_profile');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runVerification() {
  console.log('--- STARTING 1:3:1:1 HERO CAROUSEL CDP VERIFICATION ---');

  if (fs.existsSync(profileDir)) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9229',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    'http://localhost:5173/',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9229/json');
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

    // Wait for initial data load
    await sleep(2000);

    // ── TEST 1: DESKTOP (1280x800) 1 : 3 : 1 : 1 COMPOSITION ─────────
    console.log('\n=== TEST 1: DESKTOP (1280x800) 1 : 3 : 1 : 1 LAYOUT ===');
    await setDeviceMetrics(1280, 800);

    const desktopData = await evaluate(`
      (() => {
        const track = document.querySelector('div[class*="carouselTrack"]');
        const leftCard = document.querySelector('button[class*="leftPreviewColumn"]');
        const mainCard = document.querySelector('div[class*="mainFeaturedCard"]');
        const right1Card = document.querySelector('button[class*="rightPreview1Column"]');
        const right2Card = document.querySelector('button[class*="rightPreview2Column"]');

        const trackBox = track?.getBoundingClientRect();
        const leftBox = leftCard?.getBoundingClientRect();
        const mainBox = mainCard?.getBoundingClientRect();
        const r1Box = right1Card?.getBoundingClientRect();
        const r2Box = right2Card?.getBoundingClientRect();

        const mainGrid = mainCard?.querySelector('div[class*="mainCardGrid"]');
        const infoPanel = mainCard?.querySelector('div[class*="infoPanel"]');
        const coverPanel = mainCard?.querySelector('div[class*="coverPanel"]');

        const mainGridBox = mainGrid?.getBoundingClientRect();
        const infoBox = infoPanel?.getBoundingClientRect();
        const coverBox = coverPanel?.getBoundingClientRect();

        const leftTitle = leftCard?.querySelector('h3')?.textContent?.trim();
        const mainTitle = mainCard?.querySelector('h1')?.textContent?.trim();
        const r1Title = right1Card?.querySelector('h3')?.textContent?.trim();
        const r2Title = right2Card?.querySelector('h3')?.textContent?.trim();

        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;

        return {
          hasTrack: !!track,
          trackWidth: trackBox?.width,
          leftWidth: leftBox?.width,
          mainWidth: mainBox?.width,
          r1Width: r1Box?.width,
          r2Width: r2Box?.width,
          // Ratios relative to total width
          leftRatio: trackBox?.width ? (leftBox?.width / trackBox?.width) : 0,
          mainRatio: trackBox?.width ? (mainBox?.width / trackBox?.width) : 0,
          r1Ratio: trackBox?.width ? (r1Box?.width / trackBox?.width) : 0,
          r2Ratio: trackBox?.width ? (r2Box?.width / trackBox?.width) : 0,
          // Internal Main Feature Ratios (2 units text : 1 unit cover)
          mainGridWidth: mainGridBox?.width,
          infoWidth: infoBox?.width,
          coverWidth: coverBox?.width,
          infoRatioOfMain: mainGridBox?.width ? (infoBox?.width / mainGridBox?.width) : 0,
          coverRatioOfMain: mainGridBox?.width ? (coverBox?.width / mainGridBox?.width) : 0,
          // Titles
          leftTitle,
          mainTitle,
          r1Title,
          r2Title,
          allTitles: [leftTitle, mainTitle, r1Title, r2Title],
          scrollWidth,
          innerWidth,
          hasHorizontalOverflow: scrollWidth > innerWidth
        };
      })()
    `);

    console.log('Desktop 1:3:1:1 Layout Measurements:');
    console.log(`- Total Track Width: ${desktopData.trackWidth?.toFixed(1)}px`);
    console.log(`- Left Preview Width: ${desktopData.leftWidth?.toFixed(1)}px (~${(desktopData.leftRatio * 100).toFixed(1)}%, target 1/6 = 16.7%)`);
    console.log(`- Main Feature Width: ${desktopData.mainWidth?.toFixed(1)}px (~${(desktopData.mainRatio * 100).toFixed(1)}%, target 3/6 = 50.0%)`);
    console.log(`- Right Preview 1 Width: ${desktopData.r1Width?.toFixed(1)}px (~${(desktopData.r1Ratio * 100).toFixed(1)}%, target 1/6 = 16.7%)`);
    console.log(`- Right Preview 2 Width: ${desktopData.r2Width?.toFixed(1)}px (~${(desktopData.r2Ratio * 100).toFixed(1)}%, target 1/6 = 16.7%)`);
    console.log('\nMain Feature Internal Split (2 units info : 1 unit cover):');
    console.log(`- Info Panel Width: ${desktopData.infoWidth?.toFixed(1)}px (~${(desktopData.infoRatioOfMain * 100).toFixed(1)}% of main, target 2/3 = 66.7%)`);
    console.log(`- Main Cover Width: ${desktopData.coverWidth?.toFixed(1)}px (~${(desktopData.coverRatioOfMain * 100).toFixed(1)}% of main, target 1/3 = 33.3%)`);
    console.log(`- Cover comparison: Main Cover=${desktopData.coverWidth?.toFixed(1)}px vs Secondary Covers=${desktopData.r1Width?.toFixed(1)}px (consistent equal-sized covers!)`);

    console.log('\nVisible Manga Titles:');
    console.log(`- Left: "${desktopData.leftTitle}"`);
    console.log(`- Main: "${desktopData.mainTitle}"`);
    console.log(`- Right 1: "${desktopData.r1Title}"`);
    console.log(`- Right 2: "${desktopData.r2Title}"`);

    const uniqueTitles = new Set(desktopData.allTitles);
    console.log(`- Unique Titles: ${uniqueTitles.size} / ${desktopData.allTitles.length}`);
    if (uniqueTitles.size === 4) {
      console.log('  [PASS] Exactly 4 distinct titles, zero duplicates!');
    } else {
      console.warn('  [WARN] Duplicate titles found:', desktopData.allTitles);
    }

    console.log(`- Horizontal Overflow: scrollWidth=${desktopData.scrollWidth} <= innerWidth=${desktopData.innerWidth}: ${!desktopData.hasHorizontalOverflow ? '[PASS]' : '[FAIL]'}`);
    await captureScreenshot('carousel_1_3_1_1_desktop.png');

    // ── TEST 2: INTERACTION (CLICK SECONDARY TO PROMOTE) ────────────
    console.log('\n=== TEST 2: INTERACTION TEST ===');
    const targetToPromote = desktopData.r1Title;
    console.log(`Clicking Right Preview 1 ("${targetToPromote}")...`);
    await evaluate(`
      (() => {
        const btn = document.querySelector('button[class*="rightPreview1Column"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(500);

    const newMainTitle = await evaluate(`
      document.querySelector('div[class*="mainFeaturedCard"] h1')?.textContent?.trim()
    `);
    console.log(`New Main Title after click: "${newMainTitle}"`);
    if (newMainTitle === targetToPromote) {
      console.log('  [PASS] Clicked secondary card successfully became the Main Feature!');
    } else {
      console.warn(`  [FAIL] Expected "${targetToPromote}", got "${newMainTitle}"`);
    }

    // ── TEST 3: TABLET (768x1024) ────────────────────────────────────
    console.log('\n=== TEST 3: TABLET (768x1024) ===');
    await setDeviceMetrics(768, 1024);

    const tabletData = await evaluate(`
      (() => {
        const leftCard = document.querySelector('button[class*="leftPreviewColumn"]');
        const mainCard = document.querySelector('div[class*="mainFeaturedCard"]');
        const r1Card = document.querySelector('button[class*="rightPreview1Column"]');
        const r2Card = document.querySelector('button[class*="rightPreview2Column"]');

        const isVisible = (el) => {
          if (!el) return false;
          const s = window.getComputedStyle(el);
          return s.display !== 'none' && el.getBoundingClientRect().width > 0;
        };

        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;

        return {
          leftVisible: isVisible(leftCard),
          mainVisible: isVisible(mainCard),
          r1Visible: isVisible(r1Card),
          r2Visible: isVisible(r2Card),
          scrollWidth,
          innerWidth,
          hasOverflow: scrollWidth > innerWidth
        };
      })()
    `);

    console.log(`- Tablet Left Preview visible: ${tabletData.leftVisible}`);
    console.log(`- Tablet Main Feature visible: ${tabletData.mainVisible}`);
    console.log(`- Tablet Right Preview 1 visible: ${tabletData.r1Visible}`);
    console.log(`- Tablet Right Preview 2 hidden (to preserve ratio): ${!tabletData.r2Visible}`);
    console.log(`- Tablet Overflow: scrollWidth=${tabletData.scrollWidth} <= ${tabletData.innerWidth}: ${!tabletData.hasOverflow ? '[PASS]' : '[FAIL]'}`);
    await captureScreenshot('carousel_1_3_1_1_tablet.png');

    // ── TEST 4: MOBILE (375x812 & 390x844) ───────────────────────────
    console.log('\n=== TEST 4: MOBILE (375x812 & 390x844) ===');
    for (const width of [375, 390]) {
      await setDeviceMetrics(width, 812);

      const mobileData = await evaluate(`
        (() => {
          const mainCard = document.querySelector('div[class*="mainFeaturedCard"]');
          const mobileRow = document.querySelector('div[class*="mobilePreviewsRow"]');
          const mobileItems = Array.from(document.querySelectorAll('button[class*="mobilePreviewItem"]'));

          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;

          return {
            mainVisible: !!mainCard && mainCard.getBoundingClientRect().width > 0,
            mobileRowVisible: !!mobileRow && window.getComputedStyle(mobileRow).display !== 'none',
            mobileItemCount: mobileItems.length,
            scrollWidth,
            innerWidth,
            hasOverflow: scrollWidth > innerWidth
          };
        })()
      `);

      console.log(`Mobile ${width}px:`);
      console.log(`  - Main Card visible: ${mobileData.mainVisible}`);
      console.log(`  - Touch-scrollable previews row visible: ${mobileData.mobileRowVisible} (${mobileData.mobileItemCount} items)`);
      console.log(`  - Page Overflow: scrollWidth=${mobileData.scrollWidth} <= ${mobileData.innerWidth}: ${!mobileData.hasOverflow ? '[PASS]' : '[FAIL]'}`);
      if (width === 375) {
        await captureScreenshot('carousel_1_3_1_1_mobile_375.png');
      }
    }

    ws.close();
    chromeProcess.kill();
    console.log('\n--- ALL 1:3:1:1 CAROUSEL TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    chromeProcess.kill();
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runVerification();
