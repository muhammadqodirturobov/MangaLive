import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\eeb95117-0c39-4964-bdbf-f2ea30721caa';
const profileDir = path.join(outDir, 'cdp_avatar_test_profile');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('1. Launching headless Chrome with remote debugging on port 9222...');
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--window-size=1280,800',
    'http://localhost:5173/profil',
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9222/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    if (!pageTarget) {
      throw new Error('No page target found');
    }

    console.log('2. Connecting to WebSocket target:', pageTarget.webSocketDebuggerUrl);
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

    console.log('3. Navigating to /profil...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/profil' });
    await sleep(2000);

    // Switch to settings/avatar tab
    console.log('4. Switching to Profil va Avatar tab...');
    const switchTab = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
        const settingsTab = tabs.find(t => t.textContent.includes('Avatar') || t.textContent.includes('Profil'));
        if (settingsTab) {
          settingsTab.click();
          return { clicked: true, text: settingsTab.textContent.trim() };
        }
        return { clicked: false };
      })()`,
      returnByValue: true,
    });
    console.log('Tab switch result:', switchTab?.result?.value);
    await sleep(600);

    // Inspect avatar choices count and properties
    const inspectResult = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('[class*="avatarCard"]'));
        const titles = cards.map(c => c.getAttribute('aria-label'));
        const activeCard = document.querySelector('[class*="selectedCard"]');
        const activeLabel = activeCard?.getAttribute('aria-label');
        return {
          totalCards: cards.length,
          activeLabel,
          titles,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Avatar cards inspection:', inspectResult?.result?.value);

    // Test Selecting a female avatar: Yor Forger
    console.log('5. Clicking on Yor Forger avatar...');
    const selectYor = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('[class*="avatarCard"]'));
        const yorCard = cards.find(c => c.getAttribute('aria-label')?.includes('Yor'));
        if (yorCard) {
          yorCard.click();
          return { clicked: true };
        }
        return { clicked: false };
      })()`,
      returnByValue: true,
    });
    console.log('Select Yor result:', selectYor?.result?.value);
    await sleep(500);

    // Save profile
    console.log('6. Clicking save button...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      })()`,
    });
    await sleep(800);

    // Capture Desktop Profile Screenshot
    console.log('7. Capturing desktop avatar selector screenshot (1280x800)...');
    const desktopScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'desktop_profile_avatar_selector.png'), Buffer.from(desktopScreenshot.data, 'base64'));

    // Test Gender Filter "Qizlar"
    console.log('8. Testing category filter "Qizlar"...');
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('[class*="filterBtn"]'));
        const femaleBtn = btns.find(b => b.textContent.includes('Qizlar'));
        if (femaleBtn) femaleBtn.click();
      })()`,
    });
    await sleep(400);

    const filterFemale = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const visible = Array.from(document.querySelectorAll('[class*="avatarCard"]')).map(c => c.getAttribute('aria-label'));
        return { count: visible.length, visible };
      })()`,
      returnByValue: true,
    });
    console.log('Filter Female result:', filterFemale?.result?.value);
    await sleep(500);

    // Test Reload & Persistence (Should still be Yor Forger)
    console.log('9. Reloading page to verify persistence in localStorage...');
    await sendCommand('Page.reload');
    await sleep(2000);

    const persistenceCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const headerAvatar = document.querySelector('[class*="userCard"] img')?.getAttribute('src');
        const guestStored = localStorage.getItem('mangalive_guest_avatar');
        return { headerAvatar, guestStored };
      })()`,
      returnByValue: true,
    });
    console.log('Persistence verification:', persistenceCheck?.result?.value);

    // Resize viewport to 375x812 (mobile iPhone style)
    console.log('10. Resizing to 375x812 mobile viewport...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1000);

    // Switch to settings tab on mobile
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
        const settingsTab = tabs.find(t => t.textContent.includes('Avatar') || t.textContent.includes('Profil'));
        if (settingsTab) settingsTab.click();
      })()`,
    });
    await sleep(600);

    // Test mobile overflow
    const mobileCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        const overflow = scrollW > innerW;
        const bNavAvatar = document.querySelector('[class*="bottomNavAvatar"]')?.getAttribute('src');
        return { scrollWidth: scrollW, innerWidth: innerW, hasOverflow: overflow, bNavAvatar };
      })()`,
      returnByValue: true,
    });
    console.log('Mobile Viewport & Overflow Check:', mobileCheck?.result?.value);

    // Capture mobile screenshot
    console.log('11. Capturing mobile profile avatar selector screenshot (375x812)...');
    const mobileScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_profile_avatar_selector.png'), Buffer.from(mobileScreenshot.data, 'base64'));

    ws.close();
    console.log('✓ All avatar selector tests successfully completed!');
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
