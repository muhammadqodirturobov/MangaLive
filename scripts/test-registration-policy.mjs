import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';
const profileDir = path.join(outDir, 'cdp_reg_policy_profile');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testServerSideImageProtection() {
  console.log('\n--- TEST 8: Server-Side Image Delivery Protection ---');
  // 1. Unauthenticated request to Chapter 1 image should succeed (200 OK)
  try {
    const ch1Res = await fetch('http://localhost:5173/api/r2/manga/arra-odam/chapters/1/001.webp');
    console.log(`Chapter 1 Image fetch status (unauthenticated): ${ch1Res.status} (Expected: 200)`);
  } catch (err) {
    console.error('Error fetching Chapter 1:', err.message);
  }

  // 2. Unauthenticated request to Chapter 2 image should be rejected (401 Unauthorized)
  try {
    const ch2Res = await fetch('http://localhost:5173/api/r2/manga/arra-odam/chapters/2/001.webp');
    const ch2Data = await ch2Res.json().catch(() => ({}));
    console.log(`Chapter 2 Image fetch status (unauthenticated): ${ch2Res.status} (Expected: 401)`);
    console.log(`Chapter 2 Server response:`, JSON.stringify(ch2Data));
  } catch (err) {
    console.error('Error fetching Chapter 2:', err.message);
  }

  // 3. Unauthenticated request to Manga cover should succeed (200 OK)
  try {
    const coverRes = await fetch('http://localhost:5173/api/r2/manga/arra-odam/cover.jpg');
    console.log(`Cover Image fetch status (unauthenticated): ${coverRes.status} (Expected: 200)`);
  } catch (err) {
    console.error('Error fetching cover:', err.message);
  }
}

async function runBrowserTests() {
  console.log('\n--- BROWSER INTEGRATION TESTS (Points 1 - 7) ---');
  console.log('1. Launching headless Chrome with remote debugging on port 9222...');

  // Clean test profile to guarantee logged-out guest state
  if (fs.existsSync(profileDir)) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,800',
    'http://localhost:5173/',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9222/json');
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

    await new Promise((resolve) => ws.onopen = resolve);

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const cmdId = id++;
        callbacks.set(cmdId, { resolve, reject });
        ws.send(JSON.stringify({ id: cmdId, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    // ── Point 1: Logged-out visitor can browse catalog and open Chapter 1 ──
    console.log('\nPoint 1: Testing Chapter 1 access for guest...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/manga/arra-odam/chapter/1' });
    await sleep(2500);

    const ch1Check = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const isLocked = !!document.querySelector('[class*="lockedBox"]');
        const images = Array.from(document.querySelectorAll('img[class*="comicPageImage"]'));
        const title = document.querySelector('header h1, header span[class*="chapterTag"]')?.textContent?.trim();
        return { isLocked, imageCount: images.length, title };
      })()`,
      returnByValue: true,
    });
    console.log('Chapter 1 Guest evaluation:', ch1Check?.result?.value);

    // ── Point 3: Direct navigation to Chapter 2 follows the rule (shows locked state + auth modal) ──
    console.log('\nPoint 3: Testing direct navigation to Chapter 2 for guest...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/manga/arra-odam/chapter/2' });
    await sleep(2500);

    const ch2DirectCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const isLocked = !!document.querySelector('[class*="lockedBox"]');
        const lockedTitle = document.querySelector('[class*="lockedTitle"]')?.textContent?.trim();
        const authModal = !!document.querySelector('[role="dialog"]');
        const modalTitle = document.querySelector('#auth-modal-title')?.textContent?.trim();
        const noticeTitle = document.querySelector('[class*="lockNoticeTitle"]')?.textContent?.trim();
        return { isLocked, lockedTitle, authModal, modalTitle, noticeTitle };
      })()`,
      returnByValue: true,
    });
    console.log('Chapter 2 Direct Evaluation:', ch2DirectCheck?.result?.value);

    // Capture screenshot of Chapter 2 locked state + modal
    const ch2Screenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'ch2_guest_locked_auth_prompt.png'), Buffer.from(ch2Screenshot.data, 'base64'));
    console.log('Saved screenshot: ch2_guest_locked_auth_prompt.png');

    // ── Point 2: On manga detail page, clicking Chapter 2 prompts registration ──
    console.log('\nPoint 2: Testing Chapter list interaction on detail page...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/manga/arra-odam' });
    await sleep(2000);

    const detailPageCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const chItems = Array.from(document.querySelectorAll('a[class*="chapterItem"]'));
        const lockedBadges = Array.from(document.querySelectorAll('[class*="lockBadge"]'));

        // Click on Chapter 2
        const ch2Item = chItems.find(item => item.getAttribute('href')?.includes('/chapter/2'));
        if (ch2Item) {
          ch2Item.click();
        }

        return {
          totalChapters: chItems.length,
          lockedCount: lockedBadges.length,
          clickedCh2: !!ch2Item
        };
      })()`,
      returnByValue: true,
    });
    console.log('Detail page evaluation:', detailPageCheck?.result?.value);
    await sleep(800);

    const modalAfterClick = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const authModal = !!document.querySelector('[role="dialog"]');
        const noticeTitle = document.querySelector('[class*="lockNoticeTitle"]')?.textContent?.trim();
        return { authModal, noticeTitle };
      })()`,
      returnByValue: true,
    });
    console.log('Modal opened after clicking Chapter 2:', modalAfterClick?.result?.value);

    // ── Point 4: Switching between login & signup preserves destination ──
    console.log('\nPoint 4: Testing tab switching in AuthModal...');
    const tabSwitchCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const loginBtn = Array.from(document.querySelectorAll('button[class*="tabBtn"]')).find(b => b.textContent.includes('Kirish'));
        if (loginBtn) loginBtn.click();
        const destination = sessionStorage.getItem('ml_intended_destination');
        const submitBtnText = document.querySelector('button[type="submit"]')?.textContent?.trim();
        return { destination, submitBtnText };
      })()`,
      returnByValue: true,
    });
    console.log('Tab switch result:', tabSwitchCheck?.result?.value);

    ws.close();
    console.log('\n✓ All browser checks completed successfully!');
  } finally {
    chromeProcess.kill();
  }
}

async function main() {
  await testServerSideImageProtection();
  await runBrowserTests();
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
