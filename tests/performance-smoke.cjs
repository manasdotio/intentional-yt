// Local Chromium fixture: no live YouTube traffic or personal browser profile.
const { chromium } = require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fixture.test/**', route => route.fulfill({ contentType: 'text/html', body:
      '<html><body><ytd-rich-grid-renderer><div id="contents"><ytd-rich-item-renderer></ytd-rich-item-renderer></div></ytd-rich-grid-renderer></body></html>' }));
    await page.goto('https://fixture.test/');
    await page.evaluate(() => {
      globalThis.browser = { i18n: { getMessage: () => '' }, storage: { onChanged: { addListener() {} } }, runtime: { onMessage: { addListener() {} } } };
      window.resizeCount = 0;
      window.addEventListener('resize', () => resizeCount++);
    });
    for (const file of ['utils/storage.js', 'utils/policy.js', 'utils/i18n.js']) await page.addScriptTag({ path: path.join(root, file) });
    await page.evaluate(() => {
      window.testSettings = { ...StorageManager.getDefaultSettings(), limitHomeFeed: true, blockHomeFeed: false, enableQuickBlock: false };
      StorageManager.getSettings = async () => testSettings;
    });
    await page.addScriptTag({ path: path.join(root, 'content/blocker.js') });
    await page.waitForTimeout(1200);
    const before = await page.evaluate(() => resizeCount);
    await page.waitForTimeout(2000);
    assert.equal(await page.evaluate(() => resizeCount), before, 'Short feed must become idle');
    assert.ok(before <= 2, 'Loading nudges are bounded');
    await page.evaluate(() => document.querySelector('#contents').append(document.createElement('ytd-rich-item-renderer')));
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => resizeCount), before + 2, 'Slow feed progress permits another bounded retry');
    await page.evaluate(() => { document.querySelector('#contents').innerHTML = '<ytd-rich-item-renderer></ytd-rich-item-renderer>'.repeat(16); });
    await page.waitForTimeout(600);
    assert.equal(await page.locator('[data-iyt-feed-hidden]').count(), 1, 'New cards still receive the 15-card limit');
    console.log('PASS: idle resize events in two seconds = 0; slow loading and 15-card enforcement preserved');

    await page.evaluate(() => {
      window.scanCount = 0;
      const original = scanAllCards;
      scanAllCards = (...args) => { scanCount++; return original(...args); };
      for (let i = 0; i < 10; i++) {
        document.dispatchEvent(new Event('yt-navigate-finish'));
        document.dispatchEvent(new Event('yt-page-data-updated'));
        window.__iytBlocker.applyAllSettings();
      }
    });
    await page.waitForTimeout(1300);
    assert.equal(await page.evaluate(() => scanCount), 2);
    console.log('PASS: 30 overlapping navigation/settings refresh requests produce two scans');

    for (const [patch, mode] of [
      [{ limitHomeFeed: false, disableAutoplay: false }, 'off'],
      [{ keywordBlocklist: ['blocked'] }, 'cards'],
      [{ extensionEnabled: false }, 'off'],
      [{ extensionEnabled: true }, 'cards'],
      [{ keywordBlocklist: [], disableAutoplay: true }, 'structure']
    ]) {
      await page.evaluate(async patch => { Object.assign(testSettings, patch); await window.__iytBlocker.applyAllSettings(); }, patch);
      assert.equal(await page.evaluate('_domObserverMode'), mode);
    }
    // Exercise retained DOM references through repeated SPA-style replacements.
    const cdp = await page.context().newCDPSession(page);
    await page.evaluate(async () => {
      Object.assign(testSettings, { enableQuickBlock: true, disableAutoplay: false });
      await window.__iytBlocker.applyAllSettings();
    });
    async function churn() {
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
          document.querySelector('#contents').innerHTML = '<ytd-rich-item-renderer><h3><a id="video-title">Test</a></h3><ytd-channel-name><a href="/@Test">Test</a></ytd-channel-name></ytd-rich-item-renderer>'.repeat(100);
          document.dispatchEvent(new Event('yt-navigate-finish'));
        });
        await page.waitForTimeout(350);
      }
      await page.waitForTimeout(1300);
      await cdp.send('HeapProfiler.collectGarbage');
      return (await cdp.send('Runtime.getHeapUsage')).usedSize;
    }
    const warmHeap = await churn();
    const finalHeap = await churn();
    assert.ok(finalHeap - warmHeap < 2 * 1024 * 1024, 'Repeated replacements must not retain large page trees');
    console.log(`PASS: blocker fixture heap after GC: ${Math.round(warmHeap / 1024)} KB after 10 replacements; ${Math.round(finalHeap / 1024)} KB after 20`);
    assert.deepEqual(errors, []);
    console.log('PASS: observer reconfigures immediately for settings changes, without page errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
