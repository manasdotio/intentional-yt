// Run with node tests/popup-discovery.cjs. Uses an isolated unpacked extension.
const { chromium } = require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'iyt-discovery-'));
const extension = path.join(temporary, 'extension');
fs.mkdirSync(extension);
for (const dir of ['content','utils','background','ui','styles','fonts','icons','_locales']) {
  fs.cpSync(path.join(root, dir), path.join(extension, dir), { recursive: true });
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
delete manifest.background.scripts;
fs.writeFileSync(path.join(extension, 'manifest.json'), JSON.stringify(manifest));

(async () => {
  const context = await chromium.launchPersistentContext(path.join(temporary, 'profile'), {
    channel: 'chromium', headless: true, viewport: { width: 540, height: 530 },
    args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension]
  });
  context.setDefaultTimeout(10000);
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const popup = await context.newPage();
    const errors = [];
    popup.on('pageerror', error => errors.push(error.message));
    await popup.goto('chrome-extension://' + worker.url().split('/')[2] + '/ui/popup.html');
    await popup.waitForFunction(() => document.getElementById('toggle-extensionEnabled')?.checked);
    await popup.locator('#btn-dismiss-welcome').click();
    await popup.locator('#btn-mode-advanced').click();
    const before = await popup.evaluate(() => StorageManager.getSettings());
    const destinations = [
      ['daily limit', 'toggle-dailyLimit'], ['block channel', 'input-channel-blocklist'],
      ['keyword', 'input-keyword-blocklist'], ['quick block', 'toggle-enableQuickBlock'],
      ['break reminder', 'toggle-softReminder'], ['focus lock', 'toggle-focusLockEnabled'],
      ['schedule', 'toggle-scheduledBlockingEnabled'], ['study', 'btn-end-focus-session']
    ];
    for (const [query, target] of destinations) {
      await popup.locator('#tab-btn-block').click();
      // Search must reveal controls even when their destination card is collapsed.
      await popup.evaluate(() => {
        document.querySelectorAll('.focus-card-header').forEach(header => {
          header.closest('.focus-section-card').classList.add('collapsed');
          header.setAttribute('aria-expanded', 'false');
        });
      });
      await popup.locator('#input-toggle-search').fill(query);
      assert.equal(await popup.locator('#search-no-results').isVisible(), false);
      await popup.locator('.setting-search-shortcut[data-target="' + target + '"]').press('Enter');
      const expected = target === 'btn-end-focus-session' ? '[data-focus-minutes="25"]' : '#' + target;
      assert.equal(await popup.locator(expected).isVisible(), true, query);
      assert.equal(await popup.locator(expected).evaluate(el => el === document.activeElement), true, query);
    }
    assert.deepEqual(await popup.evaluate(() => StorageManager.getSettings()), before, 'search never changes protection settings');

    await popup.locator('#tab-btn-block').click();
    for (const query of ['limit', 'channel']) {
      await popup.locator('#input-toggle-search').fill(query);
      const matchingControls = popup.locator('#setting-controls .row input.chk:visible, #setting-controls .row select:visible');
      assert.ok(await matchingControls.count() > 0, query + ' has Block matches');
      assert.ok(await popup.locator('.setting-search-shortcut:visible').count() > 0, query + ' has cross-tab matches');
      assert.equal(await matchingControls.evaluateAll(controls => {
        const shortcuts = document.getElementById('setting-search-shortcuts');
        return controls.every(control =>
          Boolean(control.compareDocumentPosition(shortcuts) & Node.DOCUMENT_POSITION_FOLLOWING)
          && control.getBoundingClientRect().bottom <= shortcuts.getBoundingClientRect().top);
      }), true, query + ': Block matches precede cross-tab shortcuts visually and in tab order');
      await popup.locator('#input-toggle-search').press('ArrowDown');
      assert.equal(await matchingControls.first().evaluate(el => el === document.activeElement), true,
        query + ': Arrow Down focuses the first Block match');
    }
    await popup.locator('#input-toggle-search').fill('daily limit');
    await popup.locator('#input-toggle-search').press('ArrowDown');
    assert.equal(await popup.locator('[data-target="toggle-dailyLimit"]').evaluate(el => el === document.activeElement), true);
    await popup.evaluate(async () => renderAll(await StorageManager.getSettings()));
    assert.equal(await popup.locator('[data-target="toggle-dailyLimit"]').evaluate(el => el === document.activeElement), true, 'storage refresh preserves keyboard focus');
    await popup.locator('#input-toggle-search').focus();
    await popup.locator('#input-toggle-search').press('Escape');
    assert.equal(await popup.locator('#setting-search-shortcuts').isVisible(), false);
    assert.equal(await popup.locator('#select-homeFeed').isVisible(), true);
    console.log('PASS cross-tab search, keyboard navigation, collapsed controls and unchanged settings');

    await popup.locator('#tab-btn-blocklists').click();
    const channelInput = popup.locator('#input-channel-blocklist');
    const settingsBeforeInvalid = await popup.evaluate(() => StorageManager.getSettings());
    for (const [index, value] of ['https://www.youtube.com/watch?v=123', 'https://youtu.be/123', 'https://youtube.com/playlist?list=123', 'https://example.com/@Creator'].entries()) {
      await channelInput.fill(value);
      if (index % 2) await popup.locator('#btn-add-channel').click();
      else await channelInput.press('Enter');
      assert.equal(await popup.locator('#channel-input-error').isVisible(), true);
      assert.equal(await channelInput.getAttribute('aria-invalid'), 'true');
      assert.equal(await channelInput.inputValue(), value, 'invalid input remains available to correct');
      assert.equal(await channelInput.evaluate(el => el === document.activeElement), true);
      assert.deepEqual(await popup.evaluate(() => StorageManager.getSettings()), settingsBeforeInvalid);
    }
    await channelInput.fill('https://www.youtube.com/@Study.Channel/videos');
    assert.equal(await popup.locator('#channel-input-error').isVisible(), false);
    assert.equal(await channelInput.getAttribute('aria-invalid'), null);
    await channelInput.press('Enter');
    await popup.waitForFunction(async () => (await StorageManager.getSettings()).channelBlocklist.includes('@study.channel'));
    await channelInput.fill('@Study.Channel');
    await channelInput.press('Enter');
    await popup.waitForFunction(() => document.getElementById('toast-message').textContent.includes('already'));
    assert.equal(await popup.evaluate(async () => (await StorageManager.getSettings()).channelBlocklist.filter(entry => entry === '@study.channel').length), 1);
    await popup.locator('#tab-btn-block').click();
    console.log('PASS invalid channel links never save; correction, valid channel links and duplicate handling work');

    // Discoverable for free users; the start control opens the paid-feature explanation.
    const videoBaseline=await popup.evaluate(() => StorageManager.getSettings());
    await popup.locator('#tab-btn-focus').click();
    await popup.evaluate(() => {
      const card=document.getElementById('btn-video-session-start').closest('.focus-section-card');
      card.classList.remove('collapsed');card.querySelector('.focus-card-header')?.setAttribute('aria-expanded','true');
    });
    await popup.locator('#btn-video-session-start').press('Enter');
    await popup.locator('#modal-pro-license').waitFor({state:'visible'});
    await popup.locator('#input-license-key').press('Escape');
    await popup.locator('#modal-pro-license').waitFor({state:'hidden'});
    assert.deepEqual(await popup.evaluate(() => StorageManager.getSettings()),videoBaseline,'free discovery never changes protections');
    for (const [reason,patch] of [
      ['off',{extensionEnabled:false}], ['snooze',{snoozeUntil:Date.now()+60000}],
      ['budget',{dailyLimit:{enabled:true,limitMinutes:1},stats:{...videoBaseline.stats,todayWatchSeconds:60}}],
      ['schedule',{scheduledBlocking:{enabled:true,schedules:[{id:'test',label:'Test',enabled:true,days:[new Date().getDay()],startTime:'00:00',endTime:'00:00',mode:'full'}]}}]
    ]) {
      await popup.evaluate(({baseline,patch})=>renderAll({...baseline,...patch}),{baseline:videoBaseline,patch});
      assert.equal(await popup.locator('#video-session-status').textContent(),await popup.evaluate(reason=>videoSessionReason(reason),reason));
    }
    await popup.evaluate(baseline=>{
      window.videoTestQuery=browser.tabs.query;window.videoTestSend=browser.tabs.sendMessage;
      browser.tabs.query=async()=>[{id:999,url:'https://www.youtube.com/watch?v=abcdefghijk',status:'complete'}];
      browser.tabs.sendMessage=async(_id,msg)=>msg.type==='IYT_VIDEO_INFO'?{eligible:true,videoId:'abcdefghijk',title:'Test lesson'}:null;
      renderAll(baseline);
    },videoBaseline);
    await popup.evaluate(()=>refreshVideoInfo());
    assert.equal(await popup.locator('#video-session-title').textContent(),'Test lesson');
    assert.equal(await popup.locator('#video-session-status').textContent(),await popup.evaluate(()=>t('video_session_ready')));
    const startedAt=Date.now();
    const displayedSession={token:'display-only',ownerEpoch:'display-only',phase:'watching',videoId:'abcdefghijk',title:'Test lesson',ownerTabId:999,startedAt,sessionDeadline:startedAt+86400000,completedAt:null,breakUntil:null};
    await popup.evaluate(({baseline,session})=>renderAll({...baseline,videoSession:session}),{baseline:videoBaseline,session:displayedSession});
    assert.equal(await popup.locator('#btn-video-session-start').isVisible(),false);
    assert.equal(await popup.locator('#btn-video-session-finish').isVisible(),true);
    assert.equal(await popup.locator('[data-focus-minutes="25"]').isDisabled(),true);
    displayedSession.phase='break';displayedSession.completedAt=startedAt;displayedSession.breakUntil=startedAt+300000;
    await popup.evaluate(({baseline,session})=>renderAll({...baseline,videoSession:session}),{baseline:videoBaseline,session:displayedSession});
    assert.equal(await popup.locator('#btn-video-session-finish').isVisible(),false,'no finish/skip button during break');
    await popup.evaluate(baseline=>{browser.tabs.query=videoTestQuery;browser.tabs.sendMessage=videoTestSend;renderAll(baseline);},videoBaseline);
    await popup.locator('#tab-btn-stats').click();
    assert.equal(await popup.locator('[data-i18n="stats_learning_share"]').first().textContent(),'Learning share');
    assert.equal(await popup.locator('[data-i18n="stats_busiest_hours"]').textContent(),'Busiest viewing hours');
    assert.equal(await popup.locator('#btn-heatmap-schedule').isDisabled(),true,'no invented window without data');
    const options=await context.newPage();
    await options.goto('chrome-extension://'+worker.url().split('/')[2]+'/ui/options.html');
    await options.waitForFunction(()=>typeof _s!=='undefined' && _s);
    assert.equal(await options.locator('#video-session-description').textContent(),await popup.locator('#video-session-description').textContent(),'popup/options explanation matches');
    await options.evaluate(()=>refreshVideoInfo());
    assert.equal(await options.locator('#video-session-status').textContent(),await options.evaluate(()=>videoSessionReason('options')));
    await options.close();
    await popup.locator('#tab-btn-block').click();
    console.log('PASS one-video free discovery, unavailable reasons, session/break presentation, truthful labels and options parity');

    await context.route('https://www.youtube.com/**', route => route.fulfill({
      contentType: 'text/html', body: '<html><body><ytd-app><h1>Test lesson</h1></ytd-app></body></html>'
    }));
    const youtube = await context.newPage();
    await youtube.goto('https://www.youtube.com/watch?v=fixture');
    await youtube.waitForFunction(() => document.documentElement.hasAttribute('data-iyt-ready'));
    const tab = await popup.evaluate(async () => (await browser.tabs.query({ url: 'https://www.youtube.com/*' }))[0]);
    assert.equal(await popup.evaluate(async id => (await browser.tabs.sendMessage(id, { type: 'IYT_CONNECTION_CHECK' })).ready, tab.id), true);

    // Simulate the pre-install/stale-tab condition while retaining real browser messaging elsewhere.
    await popup.evaluate(tab => {
      window.originalTabQuery = browser.tabs.query.bind(browser.tabs);
      window.originalTabSend = browser.tabs.sendMessage.bind(browser.tabs);
      browser.tabs.query = query => query.active ? Promise.resolve([tab]) : originalTabQuery(query);
      browser.tabs.sendMessage = (id, message) => message.type === 'IYT_CONNECTION_CHECK'
        ? Promise.reject(new Error('Receiving end does not exist')) : originalTabSend(id, message);
    }, tab);
    await popup.evaluate(() => checkYouTubeConnection());
    assert.equal(await popup.locator('#youtube-connection-notice').isVisible(), true);
    await popup.evaluate(() => { browser.tabs.sendMessage = originalTabSend; });
    await youtube.bringToFront();
    await youtube.reload();
    await youtube.waitForFunction(() => document.documentElement.hasAttribute('data-iyt-ready'));
    await popup.locator('#youtube-connection-notice').waitFor({ state: 'hidden' });
    await popup.evaluate(() => { browser.tabs.query = originalTabQuery; });
    console.log('PASS real content-script acknowledgement, missing receiver notice and automatic recovery on reload');

    for (const lang of ['en','ar']) for (const theme of ['light','dark']) {
      await popup.setViewportSize({ width: 320, height: 600 });
      await popup.evaluate(async ({ lang, theme }) => {
        await I18N.setLanguage(lang); localizeDOM(); applyTheme(theme);
        document.getElementById('youtube-connection-notice').hidden = false;
      }, { lang, theme });
      const query = await popup.evaluate(() => t('toggle_daily_limit'));
      await popup.locator('#input-toggle-search').fill(query);
      assert.equal(await popup.locator('[data-target="toggle-dailyLimit"]').isVisible(), true);
      assert.equal(await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await popup.locator('#tab-btn-blocklists').click();
      await channelInput.fill('https://youtu.be/123');
      await channelInput.press('Enter');
      assert.equal(await popup.locator('#channel-input-error').isVisible(), true);
      assert.equal(await popup.locator('#channel-input-error').textContent(), await popup.evaluate(() => t('channel_input_invalid')));
      assert.equal(await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await popup.locator('#tab-btn-focus').click();
      await popup.evaluate(()=>{
        const card=document.getElementById('btn-video-session-start').closest('.focus-section-card');
        card.classList.remove('collapsed');card.querySelector('.focus-card-header')?.setAttribute('aria-expanded','true');
      });
      assert.equal(await popup.locator('#btn-video-session-start').isVisible(),true);
      assert.equal(await popup.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'one-video card fits 320px in both directions/themes');
      await popup.locator('#tab-btn-block').click();
    }
    assert.deepEqual(errors, []);
    console.log('PASS localized search and reload notice at 320px in English/Arabic, light/dark');
  } finally { await context.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
