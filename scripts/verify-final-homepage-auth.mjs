import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';
const profileDir = path.join(outDir, 'cdp_final_test_profile');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runVerification() {
  if (fs.existsSync(profileDir)) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9227',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,900',
    'http://localhost:5173/',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9227/json');
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
    await sleep(2500);

    const desktopResults = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        // 1. Feature strip check
        const strip = document.querySelector('[class*="ValuePropositionStrip_stripSection"], [class*="_stripSection_"]');

        // 2. Hero height & card checks
        const heroSection = document.querySelector('section[aria-label="Tavsiya etilgan asarlar karuseli"]');
        const heroRect = heroSection ? heroSection.getBoundingClientRect() : null;
        const stageCard = heroSection?.querySelector('[class*="_stageCard_"]');
        const stageCardRect = stageCard ? stageCard.getBoundingClientRect() : null;
        const artwork = stageCard?.querySelector('[class*="_artworkFrame_"]');
        const artworkRect = artwork ? artwork.getBoundingClientRect() : null;

        // 3. Carousel items count (indicators)
        const indicators = Array.from(heroSection?.querySelectorAll('button[class*="_indicatorPill_"]') || []);

        return {
          featureStripPresent: !!strip,
          heroSectionHeight: heroRect ? Math.round(heroRect.height) : null,
          stageCardHeight: stageCardRect ? Math.round(stageCardRect.height) : null,
          artworkWidth: artworkRect ? Math.round(artworkRect.width) : null,
          artworkHeight: artworkRect ? Math.round(artworkRect.height) : null,
          featuredCount: indicators.length,
          indicatorPills: indicators.map(b => b.textContent.trim().slice(0, 25)),
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Desktop Results:', JSON.stringify(desktopResults.result.value, null, 2));

    const shotDesktop = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'final_desktop_compact_hero.png'), Buffer.from(shotDesktop.data, 'base64'));
    console.log('Saved final_desktop_compact_hero.png');

    // ── 2. TEST MOBILE (375px - iPhone SE) ────────────────────────
    console.log('\n=== TEST 2: Mobile Viewport (375px) ===');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    const mobile375Results = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const heroSection = document.querySelector('section[aria-label="Tavsiya etilgan asarlar karuseli"]');
        const heroRect = heroSection ? heroSection.getBoundingClientRect() : null;
        const stageCard = heroSection?.querySelector('[class*="_stageCard_"]');
        const stageCardRect = stageCard ? stageCard.getBoundingClientRect() : null;

        // Where is the next section relative to top of viewport?
        const container = document.querySelector('[class*="HomePage_container"], [class*="_container_"]');
        const containerRect = container ? container.getBoundingClientRect() : null;

        return {
          heroHeight: heroRect ? Math.round(heroRect.height) : null,
          stageCardHeight: stageCardRect ? Math.round(stageCardRect.height) : null,
          nextSectionTop: containerRect ? Math.round(containerRect.top) : null,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile (375px) Results:', JSON.stringify(mobile375Results.result.value, null, 2));

    const shotMobile375 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'final_mobile_375_compact_hero.png'), Buffer.from(shotMobile375.data, 'base64'));
    console.log('Saved final_mobile_375_compact_hero.png');

    // ── 3. TEST MOBILE (390px - iPhone 13/14) ────────────────────
    console.log('\n=== TEST 3: Mobile Viewport (390px) ===');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const mobile390Overflow = await sendCommand('Runtime.evaluate', {
      expression: 'document.documentElement.scrollWidth > window.innerWidth',
      returnByValue: true
    });
    console.log('Mobile 390px has horizontal overflow:', mobile390Overflow.result.value);

    // ── 4. TEST AUTH MODAL & GOOGLE SIGN-IN ────────────────────────
    console.log('\n=== TEST 4: AuthModal & Google Sign-In Button ===');
    // Open auth modal by clicking the header "Kirish" button or evaluating
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const kirishBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.trim() === 'Kirish');
        if (kirishBtn) kirishBtn.click();
      })()`
    });
    await sleep(1000);

    const modalChecks = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('[role="dialog"]');
        const googleBtn = modal?.querySelector('button[class*="_googleBtn_"]');
        const googleBtnText = googleBtn?.textContent?.trim();
        const googleIcon = googleBtn?.querySelector('svg');
        const divider = modal?.querySelector('div[class*="_divider_"]')?.textContent?.trim();

        return {
          modalOpen: !!modal,
          hasGoogleBtn: !!googleBtn,
          googleBtnText,
          hasGoogleIcon: !!googleIcon,
          dividerText: divider
        };
      })()`,
      returnByValue: true
    });
    console.log('AuthModal in Login tab:', JSON.stringify(modalChecks.result.value, null, 2));

    // Switch to registration (Ro'yxatdan o'tish) tab
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const regTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === "Ro'yxatdan o'tish");
        if (regTab) regTab.click();
      })()`
    });
    await sleep(500);

    const regChecks = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const googleBtn = document.querySelector('button[class*="_googleBtn_"]');
        return { googleBtnText: googleBtn?.textContent?.trim() };
      })()`,
      returnByValue: true
    });
    console.log('AuthModal in Registration tab:', JSON.stringify(regChecks.result.value, null, 2));

    const shotAuth = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'final_auth_modal_google_signin.png'), Buffer.from(shotAuth.data, 'base64'));
    console.log('Saved final_auth_modal_google_signin.png');

    // Test clicking Google button to test error handling
    console.log('\nTesting Google button click (OAuth provider response)...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const googleBtn = document.querySelector('button[class*="_googleBtn_"]');
        if (googleBtn) googleBtn.click();
      })()`
    });
    await sleep(1500);

    const clickResult = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const alertError = document.querySelector('[class*="_alertError_"]')?.textContent?.trim();
        return { alertError };
      })()`,
      returnByValue: true
    });
    console.log('Google click result:', JSON.stringify(clickResult.result.value, null, 2));

    ws.close();
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
    } catch {}
  }
}

runVerification().catch(console.error);
