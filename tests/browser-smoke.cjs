// Optional browser integration checks. Playwright is tooling only, never shipped.
// IYT_PLAYWRIGHT_MODULE may point at an installation outside this repository.
const { chromium } = require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'iyt-smoke-'));
const extension = path.join(temp,'extension');fs.mkdirSync(extension);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
delete manifest.background.scripts;
for(const dir of ['content','utils','background','ui','styles','fonts','icons','_locales']) fs.cpSync(path.join(root,dir),path.join(extension,dir),{recursive:true});
fs.writeFileSync(path.join(extension,'manifest.json'),JSON.stringify(manifest));

(async()=>{
  const context=await chromium.launchPersistentContext(path.join(temp,'profile'),{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
  context.setDefaultTimeout(10000);
  const errors=[];context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  try {
    const worker=context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const id=worker.url().split('/')[2];
    for (let attempt=0; attempt<3; attempt++) {
      try { await worker.evaluate(() => browser.action.openPopup()); break; }
      catch (error) { if (attempt===2 || !error.message.includes('Service worker restarted')) throw error; }
    }
    const browserSession = await context.browser().newBrowserCDPSession();
    const { targetInfos } = await browserSession.send('Target.getTargets');
    const toolbarTarget = targetInfos.find(target => target.url === `chrome-extension://${id}/ui/popup.html`);
    assert.ok(toolbarTarget, 'toolbar popup target exists');
    const { sessionId } = await browserSession.send('Target.attachToTarget', { targetId: toolbarTarget.targetId, flatten: false });
    const toolbarResult = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Toolbar measurement timed out')), 10000);
      browserSession.on('Target.receivedMessageFromTarget', event => {
        if (event.sessionId !== sessionId) return;
        const message = JSON.parse(event.message);
        if (message.id === 1) { clearTimeout(timeout); resolve(message.result); }
      });
    });
    await browserSession.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
      expression: `new Promise(resolve => setTimeout(() => { const shell = document.getElementById('shell').getBoundingClientRect(); const footer = document.getElementById('watch-bar').getBoundingClientRect(); resolve({ width: innerWidth, height: innerHeight, shellWidth: shell.width, shellHeight: shell.height, footerBottom: footer.bottom }); }, 500))`,
      awaitPromise: true, returnByValue: true
    } }) });
    const toolbarDimensions = (await toolbarResult).result.value;
    assert.ok(toolbarDimensions.width >= 540, 'toolbar must negotiate its full intrinsic width: ' + JSON.stringify(toolbarDimensions));
    assert.equal(toolbarDimensions.shellWidth, 540);
    assert.ok(toolbarDimensions.shellHeight <= toolbarDimensions.height, 'toolbar shell must fit the available height');
    assert.ok(toolbarDimensions.footerBottom <= toolbarDimensions.height, 'toolbar footer must be visible');
    console.log('PASS: actual toolbar popup width and available-height fit', toolbarDimensions);
    await browserSession.send('Target.closeTarget', { targetId: toolbarTarget.targetId });
    await browserSession.detach();
    let popup=await context.newPage();await popup.goto(`chrome-extension://${id}/ui/popup.html`);
    await popup.waitForFunction(()=>document.getElementById('toggle-extensionEnabled')?.checked);
    assert.equal(await popup.evaluate(async()=>{await document.fonts.ready;return document.fonts.check('14px Inter');}),true);
    console.log('PASS: real MV3 worker, popup initialization, local fonts');
    assert.equal(await popup.locator('.popup-overview').count(),0,'no summary card above settings');
    assert.deepEqual(await popup.locator('.accordion-section .sh-label').allTextContents(),
      ['Home & browsing','Watching a video','Navigation & appearance']);
    assert.deepEqual(await popup.evaluate(()=>Object.fromEntries(ACCORDION_SECTIONS.map(name=>[name,
      [...document.querySelectorAll(`#sec-${name} input.chk`)].map(input=>input.id.replace('toggle-',''))]))),
      await popup.evaluate(()=>SECTION_TOGGLES),'every moved control belongs to the matching section and count');
    const controls = await popup.locator('#setting-controls input.chk, #setting-controls select').evaluateAll(nodes=>nodes.map(node=>node.id));
    assert.equal(new Set(controls).size,controls.length,'controls are not duplicated across page groups');
    await popup.evaluate(()=>restoreAccordionState({feed:true,video:true,social:false,interface:true,appearance:false}));
    assert.equal(await popup.locator('#sec-video .sh-btn').getAttribute('aria-expanded'),'true','old comments group opens the video group');
    assert.equal(await popup.locator('#sec-interface .sh-btn').getAttribute('aria-expanded'),'true','old appearance group opens navigation and appearance');
    await popup.evaluate(()=>restoreAccordionState(null));
    await popup.locator('#btn-toggle-all-accordions').click();
    assert.equal(await popup.locator('.accordion-section.collapsed').count(),0);
    await popup.locator('#btn-toggle-all-accordions').click();
    assert.equal(await popup.locator('.accordion-section.collapsed').count(),3);
    for (const [query, section] of [['comments','video'],['thumbnails','interface'],['mix playlists','feed']]) {
      await popup.locator('#input-toggle-search').fill(query);
      assert.equal(await popup.locator(`#sec-${section}`).isVisible(),true,'search finds moved controls');
      assert.equal(await popup.locator(`#sec-${section} .sh-btn`).getAttribute('aria-expanded'),'true');
    }
    await popup.locator('#input-toggle-search').fill('');
    console.log('PASS: three page-based groups, unique controls, correct count mapping, legacy expansion migration and search');
    assert.equal(await popup.locator('#hd #btn-snooze').isVisible(),true,'pause is in the persistent top bar');
    assert.equal(await popup.locator('#input-toggle-search').isVisible(),true,'search is available without opening another section');
    assert.equal(await popup.locator('#select-preset').isVisible(),true,'presets are directly accessible');
    for (const selector of ['#toggle-blockShorts','#select-homeFeed','#toggle-blockRecommended']) {
      assert.equal(await popup.locator(selector).isVisible(),true,selector+' is visible without opening a section');
      assert.equal(await popup.locator(selector).count(),1,'one control per setting');
    }
    const shortsHelp = popup.locator('[data-help="help-toggle-blockShorts"]');
    const helpTooltip = popup.locator('#setting-help-tooltip');
    const settingsBeforeHelp = await popup.evaluate(()=>StorageManager.getSettings());
    assert.equal(await popup.locator('#help-toggle-blockShorts').isVisible(),false,'description is hidden until requested');
    await shortsHelp.hover();
    await helpTooltip.waitFor({state:'visible'});
    assert.match(await helpTooltip.innerText(),/supported feeds/);
    await helpTooltip.hover();
    await popup.waitForTimeout(200);
    assert.equal(await helpTooltip.isVisible(),true,'tooltip stays open while reading its text');
    await popup.keyboard.press('Escape');
    assert.equal(await helpTooltip.isVisible(),false);
    await shortsHelp.focus();
    assert.equal(await helpTooltip.isVisible(),true,'keyboard focus opens help');
    await popup.keyboard.press('Escape');
    await shortsHelp.press('Enter');
    assert.equal(await helpTooltip.isVisible(),true,'keyboard activation opens help');
    await shortsHelp.press('Enter');
    assert.equal(await helpTooltip.isVisible(),false,'second activation closes help');
    await shortsHelp.click();
    await popup.locator('#input-toggle-search').click();
    assert.equal(await helpTooltip.isVisible(),false,'outside click dismisses help');
    assert.deepEqual(await popup.evaluate(()=>StorageManager.getSettings()),settingsBeforeHelp,'help never changes preferences');
    await popup.locator('#input-toggle-search').fill('supported feeds');
    assert.equal(await popup.locator('#toggle-blockShorts').isVisible(),true,'search includes hidden descriptions');
    console.log('PASS: compact setting help supports hover, keyboard, dismissal and search without changing preferences');
    await popup.locator('#input-toggle-search').fill('shorts');
    assert.equal(await popup.locator('#toggle-blockShorts').isVisible(),true);
    assert.equal(await popup.locator('#search-no-results').isVisible(),false);
    await popup.locator('#input-toggle-search').fill('no-such-setting');
    assert.equal(await popup.locator('#search-no-results').isVisible(),true);
    await popup.locator('#input-toggle-search').fill('');
    assert.equal(await popup.locator('#select-homeFeed').isVisible(),true,'clearing search restores common controls');
    assert.equal(await popup.locator('#sec-feed').evaluate(el=>el.classList.contains('collapsed')),true);
    await context.route('https://www.youtube.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><ytd-app><ytd-browse page-subtype="home"><ytd-rich-grid-renderer><div id="contents"><ytd-rich-item-renderer><h3><a id="video-title">A useful video</a></h3><ytd-channel-name><a href="/@ScienceDaily">ScienceDaily</a></ytd-channel-name></ytd-rich-item-renderer></div></ytd-rich-grid-renderer></ytd-browse><div id="movie_player"><video class="html5-main-video"></video></div><div id="comments">Comments</div></ytd-app></body></html>`}));
    const page=await context.newPage();await page.goto('https://www.youtube.com/');
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-iyt-ready'));
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),false,'new installations hide the home feed before setup');
    await popup.waitForSelector('#welcome-card', { state: 'visible' });
    for (const selector of ['#setup-hide-shorts','#setup-hide-home','#setup-hide-recommended']) {
      assert.equal(await popup.locator(selector).isChecked(),true,selector);
    }
    assert.equal(await popup.locator('#setup-daily-limit').inputValue(),'0');
    await popup.locator('#btn-skip-setup').click();
    await popup.waitForSelector('#welcome-card', { state: 'hidden' });
    assert.deepEqual(await popup.evaluate(async()=>Object.entries(await StorageManager.getSettings()).filter(([,value])=>value===true).map(([key])=>key)),['extensionEnabled','blockHomeFeed','blockRecommended','blockShorts','enableQuickBlock'],'skipping setup preserves the core protections');

    await popup.evaluate(()=>browser.storage.local.set({welcomeDismissed:false}));
    await popup.reload();
    await popup.waitForSelector('#welcome-card', { state: 'visible' });
    await popup.locator('#setup-hide-shorts').check();
    await popup.locator('#setup-hide-recommended').check();
    await popup.locator('#setup-hide-home').uncheck();
    await popup.locator('#setup-daily-limit').selectOption('45');
    await popup.locator('#btn-save-setup').click();
    await popup.waitForSelector('#welcome-card', { state: 'hidden' });
    let setupSettings=await popup.evaluate(()=>StorageManager.getSettings());
    assert.deepEqual(Object.entries(setupSettings).filter(([,value])=>value===true).map(([key])=>key).sort(),['blockRecommended','blockShorts','enableQuickBlock','extensionEnabled']);
    assert.equal(setupSettings.dailyLimit.enabled,true);
    assert.equal(setupSettings.dailyLimit.limitMinutes,45);
    await page.waitForFunction(()=>document.documentElement.classList.contains('iyt-no-shorts') && document.documentElement.classList.contains('iyt-no-recommended'));
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),true,'unselected home blocking stays off');
    await popup.reload();
    await popup.waitForFunction(()=>document.getElementById('toggle-blockShorts')?.checked);
    assert.equal(await popup.locator('#welcome-card').isVisible(),false,'saved setup stays dismissed after reopening');

    // Existing users may have customized advanced controls before finishing setup.
    await popup.evaluate(async()=>{
      await StorageManager.updateSetting('blockLiveChat',true);
      await browser.storage.local.set({welcomeDismissed:false});
    });
    await popup.reload();
    await popup.waitForSelector('#welcome-card', { state: 'visible' });
    await popup.locator('#setup-hide-shorts').uncheck();
    await popup.locator('#setup-hide-recommended').uncheck();
    await popup.locator('#setup-daily-limit').selectOption('0');
    await popup.locator('#btn-save-setup').click();
    await popup.waitForSelector('#welcome-card', { state: 'hidden' });
    setupSettings=await popup.evaluate(()=>StorageManager.getSettings());
    assert.equal(setupSettings.blockShorts,false);
    assert.equal(setupSettings.blockRecommended,false);
    assert.equal(setupSettings.dailyLimit.enabled,false);
    assert.equal(setupSettings.blockLiveChat,true,'setup preserves explicitly customized advanced controls');
    console.log('PASS: fresh setup, skip, selected restrictions only, persistence and existing customizations');

    await popup.locator('#toggle-blockShorts').check();
    await popup.waitForFunction(()=>document.getElementById('toggle-blockShorts').closest('.row').dataset.active==='true');
    assert.equal((await popup.evaluate(()=>StorageManager.getSettings())).blockLiveChat,true,'common controls preserve unrelated choices');
    await popup.locator('#toggle-blockShorts').uncheck();
    await popup.locator('#btn-snooze').click();
    await popup.locator('.snooze-opt-btn[data-minutes="15"]').click();
    await popup.waitForFunction(()=>document.getElementById('protection-status-main').textContent.includes('paused until'));
    assert.equal(await popup.locator('#btn-snooze-label').innerText(),'Resume Now');
    assert.equal(await popup.locator('#setting-controls .row[data-active="true"]').count(),0,'paused rows do not appear active');
    await popup.locator('#btn-snooze').click();
    await popup.waitForFunction(()=>!document.getElementById('protection-status-main').textContent.includes('paused until'));
    await popup.locator('#toggle-extensionEnabled').uncheck();
    await popup.waitForFunction(()=>document.getElementById('protection-status-main').textContent==='Protections are turned off.');
    await popup.locator('#btn-snooze').click();
    await popup.waitForFunction(()=>document.getElementById('toggle-extensionEnabled').checked);
    console.log('PASS: visible common controls, effective off/paused status and resume action');
    fs.mkdirSync(path.join(root,'.system_generated'), {recursive:true});
    await popup.locator('#scroll').evaluate(el => { el.scrollTop = 0; });
    await popup.locator('#shell').screenshot({path:path.join(root,'.system_generated','popup-overview-desktop.png')});

    await popup.locator('#select-preset').selectOption('balanced');
    await popup.waitForFunction(()=>document.getElementById('toggle-blockShorts').checked);
    assert.equal(await popup.locator('#toggle-blockShorts').evaluate(el=>el.closest('.row').dataset.active), 'true');
    await popup.locator('#scroll').evaluate(el=>{el.scrollTop=0;});
    await popup.locator('#shell').screenshot({path:path.join(root,'.system_generated','popup-compact-controls.png')});
    await popup.locator('#tab-btn-stats').click();
    await popup.locator('#btn-snooze').click();
    await popup.waitForSelector('#modal-snooze', {state:'visible'});
    await popup.locator('#btn-cancel-snooze').click();
    await popup.locator('#tab-btn-block').click();
    console.log('PASS: top-bar pause across tabs and effective row highlights without a summary card');
    await popup.evaluate(()=>StorageManager.updateSetting('themeMode','dark'));
    await popup.evaluate(()=>browser.storage.local.set({advancedExpanded:false}));
    await popup.reload();
    await popup.waitForFunction(()=>document.getElementById('toggle-blockShorts').checked);
    assert.equal(await popup.locator('#input-toggle-search').isVisible(),true,'old collapsed preference cannot hide the controls after reopening');
    const applied = await popup.evaluate(()=>StorageManager.getSettings());
    assert.equal(applied.blockShorts,true);
    assert.equal(applied.blockHomeFeed,true);
    assert.equal(applied.themeMode,'dark');
    assert.equal(await popup.locator('#preset-change').count(),0,'no preset undo or change-summary card');
    assert.equal(await popup.evaluate(async()=>(await browser.storage.local.get('presetUndo')).presetUndo),undefined);
    console.log('PASS: presets persist without an undo card or saved snapshot');

    // The remaining blocking checks deliberately exercise the Balanced preset.
    await popup.locator('#select-preset').selectOption('balanced');
    await page.waitForFunction(()=>document.documentElement.classList.contains('iyt-no-home-feed'));
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),false);
    // Exercise the actual popup controls, including switching from the limiter.
    await popup.locator('#sec-feed .sh-btn').click();
    await popup.locator('#select-homeFeed').selectOption('limit');
    await popup.waitForFunction(()=>document.getElementById('select-homeFeed').value==='limit');
    await page.waitForFunction(()=>document.documentElement.classList.contains('iyt-limit-home-feed'));
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),true);
    await popup.locator('#select-homeFeed').selectOption('show');
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-limit-home-feed') && !document.documentElement.classList.contains('iyt-no-home-feed'));
    assert.deepEqual(await popup.evaluate(async()=>{const s=await StorageManager.getSettings();return [s.blockHomeFeed,s.limitHomeFeed];}),[false,false]);
    await popup.locator('#select-homeFeed').selectOption('hide');
    await popup.waitForFunction(()=>document.getElementById('select-homeFeed').value==='hide');
    await popup.reload();
    await popup.waitForFunction(()=>document.getElementById('select-homeFeed').value==='hide');
    assert.deepEqual(await popup.evaluate(async()=>{const s=await StorageManager.getSettings();return [s.blockHomeFeed,s.limitHomeFeed];}),[true,false]);
    // Old imports can contain both flags. Match the content script's limit-first behavior without rewriting the import.
    await popup.evaluate(()=>StorageManager.updateSettings({blockHomeFeed:true,limitHomeFeed:true}));
    await popup.waitForFunction(()=>document.getElementById('select-homeFeed').value==='limit');
    assert.deepEqual(await popup.evaluate(async()=>{const s=await StorageManager.getSettings();return [s.blockHomeFeed,s.limitHomeFeed];}),[true,true]);
    await popup.locator('#input-toggle-search').fill('doomscroll');
    assert.equal(await popup.locator('#select-homeFeed').isVisible(),true,'search finds the unified home control by the old limiter term');
    await popup.locator('#select-homeFeed').selectOption('hide');
    await popup.locator('#input-toggle-search').fill('');
    await page.waitForFunction(()=>document.documentElement.classList.contains('iyt-no-home-feed'));
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),false);
    await popup.evaluate(()=>StorageManager.updateSettings({enableQuickBlock:false,disableAutoplay:false}));
    await page.evaluate(()=>{
      history.pushState({}, '', '/results?search_query=test');
      document.querySelector('ytd-browse').setAttribute('page-subtype','search');
      document.dispatchEvent(new Event('yt-navigate-finish'));
    });
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),true);
    await page.evaluate(()=>{
      history.pushState({}, '', '/');
      document.querySelector('ytd-browse').setAttribute('page-subtype','home');
      document.dispatchEvent(new Event('yt-navigate-finish'));
    });
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),false);
    await popup.evaluate(()=>StorageManager.updateSettings({enableQuickBlock:true,disableAutoplay:true}));
    console.log('PASS: Hide Home Feed via popup, switching from limiter, and returning Home');
    await popup.evaluate(()=>StorageManager.updateSettings({blockHomeFeed:false,channelBlocklist:['Science']}));
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-home-feed'));
    assert.equal(await page.locator('ytd-rich-item-renderer').isVisible(),true);
    await page.waitForSelector('.iyt-quick-block-btn');
    await page.locator('.iyt-quick-block-btn').focus();
    await page.locator('.iyt-quick-block-btn').click();
    await page.waitForFunction(()=>document.querySelector('ytd-rich-item-renderer').dataset.iytFiltered==='true');
    const list=await popup.evaluate(async()=>(await StorageManager.getSettings()).channelBlocklist);assert.ok(list.includes('@sciencedaily'));
    // Reuse the same card with a new owner; the observer must unhide/rebind it.
    await page.evaluate(()=>{const a=document.querySelector('ytd-channel-name a');a.href='/@Different';a.textContent='Different';});
    await page.waitForFunction(()=>!document.querySelector('ytd-rich-item-renderer').hasAttribute('data-iyt-filtered'));
    await page.waitForFunction(()=>document.querySelector('.iyt-quick-block-btn').dataset.channel==='@different');
    console.log('PASS: document-start CSS, exact channel filtering, Quick Block, reused cards');

    // Generic shelves are also used for long videos. Only Shorts evidence
    // should hide them, and reusing a card must immediately undo that hiding.
    await popup.evaluate(()=>StorageManager.updateSettings({blockRecommended:false,blockIrrelevantSearchResults:false}));
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-recommended'));
    await page.evaluate(()=>{
      const fixture=document.createElement('section');fixture.id='shorts-regression';
      fixture.innerHTML=`
        <ytd-rich-section-renderer id="ordinary-section"><grid-shelf-view-model id="ordinary-shelf"><a href="/watch?v=normal">Normal video</a></grid-shelf-view-model></ytd-rich-section-renderer>
        <ytd-watch-next-secondary-results-renderer><grid-shelf-view-model id="ordinary-related"><a href="/watch?v=related">Normal related video</a></grid-shelf-view-model></ytd-watch-next-secondary-results-renderer>
        <grid-shelf-view-model id="shorts-shelf"><a href="/shorts/example">Short</a></grid-shelf-view-model>
        <grid-shelf-view-model id="shorts-tag-shelf"><ytm-shorts-lockup-view-model-v2>Short without a link yet</ytm-shorts-lockup-view-model-v2></grid-shelf-view-model>
        <ytd-video-renderer id="reused-short"><a href="/shorts/example">Short card</a></ytd-video-renderer>
        <ytd-video-renderer id="badge-short"><span overlay-style="SHORTS">Short badge</span></ytd-video-renderer>
        <ytd-video-renderer id="page-hidden-short" style="display:none"><a href="/shorts/example">Hidden by page</a></ytd-video-renderer>`;
      document.body.append(fixture);
    });
    await page.waitForTimeout(300);
    for(const id of ['ordinary-section','ordinary-shelf','ordinary-related']) {
      assert.equal(await page.locator('#'+id).isVisible(),true,id+' must remain visible');
    }
    for(const id of ['shorts-shelf','shorts-tag-shelf','reused-short','badge-short']) {
      assert.equal(await page.locator('#'+id).isVisible(),false,id+' must be hidden');
    }
    const reusedVisible=await page.evaluate(()=>{
      for(const id of ['shorts-shelf','reused-short','page-hidden-short']) document.querySelector('#'+id+' a').href='/watch?v=ordinary';
      document.querySelector('#badge-short span').removeAttribute('overlay-style');
      // Read computed styles in the same task, before any delayed JS observer.
      return ['shorts-shelf','reused-short','badge-short'].every(id=>getComputedStyle(document.getElementById(id)).display!=='none');
    });
    assert.equal(reusedVisible,true,'Shorts-to-normal reuse must restore visibility immediately');
    assert.equal(await page.locator('#page-hidden-short').isVisible(),false,'preserve page-owned display style');
    await page.evaluate(()=>document.querySelector('#reused-short a').href='/shorts/another');
    assert.equal(await page.locator('#reused-short').isVisible(),false,'normal-to-Shorts reuse must hide');
    await popup.evaluate(()=>StorageManager.updateSetting('blockShorts',false));
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-shorts'));
    assert.equal(await page.locator('#reused-short').isVisible(),true,'turning off Shorts blocking restores cards');
    assert.equal(await page.locator('#shorts-tag-shelf').isVisible(),true,'turning off Shorts blocking restores shelves');
    assert.equal(await page.locator('#page-hidden-short').isVisible(),false,'toggling must preserve page-owned styles');
    await page.locator('#shorts-regression').evaluate(el=>el.remove());
    await popup.evaluate(()=>StorageManager.updateSettings({blockShorts:true,blockRecommended:true,blockIrrelevantSearchResults:true}));
    console.log('PASS: ordinary shelves, Shorts evidence, immediate card reuse and page-owned styles');

    await page.evaluate(()=>{
      const fixture=document.createElement('div');fixture.id='learning-tools';
      fixture.innerHTML=`<ytd-masthead id="masthead"><input id="learning-search" aria-label="Search" /></ytd-masthead>
        <div id="guide-inner-content"><ytd-guide-section-renderer>Home</ytd-guide-section-renderer><ytd-guide-section-renderer><ytd-guide-entry-renderer><a id="learning-premium" href="/premium">YouTube Premium</a></ytd-guide-entry-renderer></ytd-guide-section-renderer><ytd-guide-section-renderer><ytd-guide-entry-renderer><a id="learning-subscriptions" href="/feed/subscriptions">Subscriptions</a></ytd-guide-entry-renderer><ytd-guide-entry-renderer><a id="learning-saved" href="/playlist?list=WL">Watch Later</a></ytd-guide-entry-renderer></ytd-guide-section-renderer></div>
        <ytd-watch-grid><div id="secondary"><ytd-playlist-panel-renderer id="playlist">Course playlist</ytd-playlist-panel-renderer><ytd-live-chat-frame id="chat">Class chat</ytd-live-chat-frame><ytd-watch-next-secondary-results-renderer id="related">Recommendations</ytd-watch-next-secondary-results-renderer></div></ytd-watch-grid>
        <div id="info-contents">Video information</div><div id="owner">Channel and subscribe</div><div id="top-level-buttons-computed">Like and share</div><ytd-watch-metadata><div id="description"><a id="learning-resource" href="#resources">Lesson resources</a></div><ytd-menu-renderer class="ytd-watch-metadata"><button id="learning-save">Save lesson</button></ytd-menu-renderer></ytd-watch-metadata>`;
      document.querySelector('ytd-app').append(fixture);
    });
    await popup.locator('#sec-video .sh-btn').click();
    const beforeDisclosure = await popup.evaluate(()=>StorageManager.getSettings());
    await popup.locator('#below-video-controls > summary').focus();
    await popup.locator('#below-video-controls > summary').press('Enter');
    assert.deepEqual(await popup.evaluate(()=>StorageManager.getSettings()),beforeDisclosure,'opening the group changes no preferences');
    const individualControls = [
      ['blockVideoDescription','iyt-no-video-desc','#description'],
      ['blockChannelInfo','iyt-no-channel-info','#owner'],
      ['blockVideoButtons','iyt-no-video-buttons','#top-level-buttons-computed']
    ];
    for (const [key,cssClass,selector] of individualControls) {
      await popup.locator('#toggle-'+key).check();
      await page.waitForFunction(name=>document.documentElement.classList.contains(name),cssClass);
      assert.equal(await page.locator(selector).isVisible(),false);
      assert.equal(await popup.locator('#toggle-blockVideoInfo').isChecked(),false,'broader panel hiding remains off');
      assert.equal(await page.locator('#info-contents').isVisible(),true);
      for (const [otherKey,,otherSelector] of individualControls) if (otherKey!==key) assert.equal(await page.locator(otherSelector).isVisible(),true);
      await popup.locator('#toggle-'+key).uncheck();
      await page.waitForFunction(name=>!document.documentElement.classList.contains(name),cssClass);
      assert.equal(await page.locator(selector).isVisible(),true);
    }
    await popup.locator('#below-video-controls > summary').click();
    await popup.locator('#input-toggle-search').fill('description');
    assert.equal(await popup.locator('#toggle-blockVideoDescription').isVisible(),true,'search reveals a matching control inside the collapsed group');
    await popup.locator('#toggle-blockVideoDescription').check();
    await popup.waitForFunction(()=>document.getElementById('toggle-blockVideoDescription').checked);
    await popup.locator('#input-toggle-search').fill('');
    assert.equal(await popup.locator('#below-video-controls').evaluate(el=>el.open),false,'clearing search restores the disclosure state');
    await popup.reload();
    await popup.waitForFunction(()=>document.getElementById('toggle-blockVideoDescription').checked);
    assert.equal(await popup.locator('#toggle-blockVideoInfo').isChecked(),false,'individual preference survives reopening');
    await popup.locator('#below-video-controls > summary').click();
    await popup.locator('#toggle-blockVideoDescription').uncheck();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-video-desc'));
    await popup.locator('#below-video-controls > summary').scrollIntoViewIfNeeded();
    await popup.locator('#shell').screenshot({path:path.join(root,'.system_generated','popup-independent-controls.png')});
    console.log('PASS: independent below-video controls, keyboard disclosure, search and persistence');

    const assertLearningTools = async () => {
      for (const selector of ['#learning-search','#learning-subscriptions','#learning-saved','#playlist','#chat','#learning-resource','#learning-save']) {
        assert.equal(await page.locator(selector).isVisible(),true,`${selector} must remain available`);
      }
      assert.equal(await page.locator('#related').isVisible(),false,'recommendations remain hidden without hiding the shared side panel');
      assert.equal(await page.locator('#learning-premium').isVisible(),false,'promotional links remain hidden independently of section order');
    };
    for (const preset of ['player','balanced']) {
      await popup.locator('#select-preset').selectOption(preset);
      await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-sidebar') && !document.documentElement.classList.contains('iyt-no-live-chat'));
      await assertLearningTools();
    }
    await popup.locator('#select-preset').selectOption('zen');
    await page.waitForFunction(()=>document.documentElement.classList.contains('iyt-no-playlist'));
    assert.equal(await page.locator('#playlist').isVisible(),false,'Zen remains an explicit stronger choice');
    assert.equal(await page.locator('#chat').isVisible(),false);
    await popup.locator('#select-preset').selectOption('balanced');
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-playlist'));
    await assertLearningTools();
    console.log('PASS: standard presets preserve navigation and learning tools; Zen is opt-in; related-video blocking preserves chat and playlists');

    await popup.evaluate(()=>StorageManager.updateSetting('scheduledBlocking',{enabled:true,schedules:[{id:'work',label:'Work',enabled:true,days:[new Date().getDay()],startTime:'00:00',endTime:'00:00',mode:'strict'}]}));
    await popup.waitForFunction(()=>document.getElementById('protection-status-main').textContent.includes('Work'));
    assert.equal(await popup.locator('#schedule-override').isVisible(),true);
    assert.equal(await popup.locator('#select-homeFeed').isDisabled(),true);
    await page.waitForFunction(()=>document.documentElement.classList.contains('iyt-no-comments'));
    await page.evaluate(()=>document.dispatchEvent(new Event('yt-navigate-finish')));
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('iyt-no-comments')),true);
    await page.evaluate(()=>{const v=document.querySelector('video');v.muted=false;v.volume=0.4;v.currentTime=25;});
    await popup.evaluate(async()=>{const s=await StorageManager.getSettings();await StorageManager.saveSchedule({...s.scheduledBlocking.schedules[0],mode:'full'});});
    await page.waitForSelector('#iyt-scheduled-block-screen');
    assert.equal(await page.evaluate(()=>document.querySelector('ytd-app').inert),true);
    await popup.evaluate(()=>StorageManager.snooze(5));
    await page.waitForSelector('#iyt-scheduled-block-screen',{state:'detached'});
    assert.deepEqual(await page.evaluate(()=>{const v=document.querySelector('video');return [v.muted,v.volume,v.currentTime,document.querySelector('ytd-app').inert];}),[false,0.4,25,false]);
    console.log('PASS: strict survives route events; full block respects snooze and preserves media');

    await popup.evaluate(()=>StorageManager.updateSetting('scheduledBlocking',{enabled:false,schedules:[]}));
    await popup.evaluate(()=>StorageManager.updateSetting('dailyLimit',{enabled:false,limitMinutes:60,warningEnabled:true}));
    await popup.evaluate(()=>StorageManager.updateSetting('snoozeUntil',null));
    await popup.waitForFunction(()=>document.getElementById('protection-status').hidden);
    await popup.locator('#tab-btn-focus').click();
    await popup.locator('[data-focus-minutes="25"]').click();
    await popup.waitForFunction(()=>document.getElementById('protection-status-session').textContent.includes('Focus session until'));
    assert.equal(await popup.locator('#protection-status').isVisible(),true);
    await page.evaluate(()=>document.dispatchEvent(new Event('yt-navigate-finish')));
    await page.waitForTimeout(250);
    await assertLearningTools();
    assert.equal(await page.locator('#comments').isVisible(),true,'timed sessions preserve the selected comment setting');
    assert.equal(await popup.locator('[data-focus-minutes="45"]').isDisabled(),true);
    const deadline = await worker.evaluate(async()=>({until:(await StorageManager.getSettings()).focusSessionUntil,alarm:(await browser.alarms.get('iyt-deadline')).scheduledTime}));
    assert.equal(deadline.until,deadline.alarm);
    await popup.locator('#btn-end-focus-session').click();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-comments'));
    await assertLearningTools();
    await popup.locator('[data-focus-minutes="45"]').click();
    await popup.waitForFunction(()=>document.getElementById('btn-end-focus-session').hidden===false);
    await worker.evaluate(async()=>{await StorageManager.updateSetting('focusSessionUntil',Date.now()-1);await reconcile();});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-comments'));
    await popup.waitForFunction(()=>!document.getElementById('protection-status-session').textContent);
    console.log('PASS: focus buttons, clear status, durable alarm and preference restoration');

    await popup.evaluate(async()=>{
      await StorageManager.updateSetting('dailyLimit',{enabled:true,limitMinutes:30,warningEnabled:true});
      await StorageManager.recordWatch(1500,'warning-fixture',StorageManager.getTodayString());
    });
    await popup.waitForFunction(()=>document.getElementById('protection-status-budget').textContent.includes('5 min'));
    await page.goto('https://www.youtube.com/watch?v=warning');
    await page.bringToFront();
    await page.evaluate(async()=>{
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
      const ctx=canvas.getContext('2d');
      window.fixtureFrames=setInterval(()=>{ctx.fillStyle=`rgb(${Date.now()%255},0,0)`;ctx.fillRect(0,0,32,32);},100);
      const video=document.querySelector('video');video.muted=true;video.srcObject=canvas.captureStream(10);await video.play();
    });
    await page.waitForSelector('#iyt-toast[data-limit-warning="true"]');
    assert.match(await page.locator('#iyt-toast').innerText(),/Time left today: 5 min/);
    assert.equal(await page.evaluate(()=>document.querySelector('video').paused),false);
    assert.equal(await popup.evaluate(async()=>(await StorageManager.claimLimitWarning()).claimed),false);
    await page.locator('#iyt-toast .iyt-toast-close').click();
    await page.waitForSelector('#iyt-toast',{state:'detached'});
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('#iyt-toast').count(),0);
    await page.evaluate(()=>{document.querySelector('video').pause();clearInterval(window.fixtureFrames);});
    console.log('PASS: advance warning during real playback, no automatic pause or repeated warning');

    await popup.evaluate(async()=>{
      await StorageManager.updateSetting('scheduledBlocking',{enabled:false,schedules:[]});
      await StorageManager.updateSetting('dailyLimit',{enabled:true,limitMinutes:30});
      const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('1234'));
      const pin=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
      await StorageManager.updateSetting('focusLock',{enabled:true,pin,cooldownMinutes:1,lockedSettings:[],pendingUnlock:null});
    });
    await popup.locator('#tab-btn-block').click();
    await popup.locator('#select-preset').selectOption('zen');
    await popup.waitForFunction(()=>document.getElementById('toggle-blockPlaylist').checked);
    await popup.locator('#select-preset').selectOption('balanced');
    await popup.waitForSelector('#modal-pin-verify', {state:'visible'});
    assert.match(await popup.locator('#verify-target-wrap').innerText(), /Balanced/);
    await popup.locator('#input-verify-pin').fill('1234');
    await popup.waitForFunction(()=>document.getElementById('focus-lock-banner').style.display!=='none');
    assert.equal((await popup.evaluate(()=>StorageManager.getSettings())).blockPlaylist,true,'preset relaxation waits for cooldown');
    await worker.evaluate(async()=>{const data=await browser.storage.local.get('settings');data.settings.focusLock.pendingUnlock.unlocksAt=Date.now()-1;await browser.storage.local.set(data);await reconcile();});
    await popup.waitForFunction(()=>!document.getElementById('toggle-blockPlaylist').checked);
    console.log('PASS: preset relaxation still requires PIN and cooldown');
    await popup.locator('#select-homeFeed').selectOption('limit');
    await popup.waitForSelector('#modal-pin-verify', {state:'visible'});
    assert.match(await popup.locator('#verify-target-wrap').innerText(), /Home page videos/);
    assert.equal(await popup.locator('#select-homeFeed').inputValue(),'hide','locked choice stays on the saved mode');
    await popup.locator('#input-verify-pin').fill('1234');
    await popup.waitForFunction(()=>document.getElementById('focus-lock-banner').style.display!=='none');
    assert.match(await popup.locator('#focus-banner-setting').innerText(), /Home page videos/);
    assert.deepEqual(await popup.evaluate(async()=>{const s=await StorageManager.getSettings();return [s.blockHomeFeed,s.limitHomeFeed];}),[true,false]);
    await worker.evaluate(async()=>{const data=await browser.storage.local.get('settings');data.settings.focusLock.pendingUnlock.unlocksAt=Date.now()-1;await browser.storage.local.set(data);await reconcile();});
    await popup.waitForFunction(()=>document.getElementById('select-homeFeed').value==='limit');
    assert.deepEqual(await popup.evaluate(async()=>{const s=await StorageManager.getSettings();return [s.blockHomeFeed,s.limitHomeFeed];}),[false,true]);
    await popup.locator('#select-homeFeed').selectOption('show');
    await popup.waitForSelector('#modal-pin-verify', {state:'visible'});
    await popup.keyboard.press('Escape');
    await popup.waitForSelector('#modal-pin-verify', {state:'hidden'});
    assert.equal(await popup.locator('#select-homeFeed').inputValue(),'limit','canceling a relaxation keeps the previous mode');
    await popup.locator('#select-homeFeed').selectOption('hide');
    await popup.waitForFunction(()=>document.getElementById('select-homeFeed').value==='hide' && !document.getElementById('select-homeFeed').disabled);
    assert.deepEqual(await popup.evaluate(async()=>{const s=await StorageManager.getSettings();return [s.blockHomeFeed,s.limitHomeFeed];}),[true,false],'strengthening the mode needs no unlock');
    console.log('PASS: home-feed changes respect PIN, cancellation, cooldown and atomic mode updates');
    await popup.locator('#tab-btn-focus').click();
    await popup.evaluate(()=>{const select=document.getElementById('select-dailyLimitMinutes');select.value='60';select.dispatchEvent(new Event('change',{bubbles:true}));});
    await popup.waitForSelector('#modal-pin-verify',{state:'visible'});
    assert.equal(await popup.evaluate(()=>document.getElementById('hd').inert),true);
    await popup.locator('#input-verify-pin').fill('1234');
    await popup.waitForFunction(()=>document.getElementById('focus-lock-banner').style.display!=='none');
    await popup.close();
    // Bring the durable deadline forward; no popup is left to apply the action.
    await worker.evaluate(async()=>{const data=await browser.storage.local.get('settings');data.settings.focusLock.pendingUnlock.unlocksAt=Date.now()-1;await browser.storage.local.set(data);await reconcile();});
    assert.equal(await worker.evaluate(async()=>(await StorageManager.getSettings()).dailyLimit.limitMinutes),60);
    console.log('PASS: protected UI prompts for PIN, modal isolates background, closed-popup cooldown applies');
    await worker.evaluate(()=>browser.storage.local.set({welcomeDismissed:false}));
    popup=await context.newPage();
    const mobilePopupSession = await context.newCDPSession(popup);
    await mobilePopupSession.send('Emulation.setDeviceMetricsOverride', { width:320,height:640,screenWidth:320,screenHeight:640,deviceScaleFactor:1,mobile:true });
    await mobilePopupSession.send('Emulation.setTouchEmulationEnabled', { enabled:true });
    async function tapMobile(locator) {
      await locator.scrollIntoViewIfNeeded();
      const rect = await locator.boundingBox();
      await mobilePopupSession.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}] });
      await mobilePopupSession.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    }
    await popup.goto(`chrome-extension://${id}/ui/popup.html`);
    await popup.waitForFunction(()=>document.getElementById('toggle-extensionEnabled')?.checked);
    await popup.locator('#tab-btn-block').click();
    await popup.waitForSelector('#welcome-card', { state: 'visible' });
    for (const userLanguage of ['en','ar']) for (const themeMode of ['light','dark']) {
      await popup.evaluate(settings=>StorageManager.updateSettings(settings),{userLanguage,themeMode});
      await popup.waitForFunction(language=>document.documentElement.dir===(language==='ar'?'rtl':'ltr'),'en'===userLanguage?'en':'ar');
      await popup.waitForTimeout(250);
      for (const tab of ['block','blocklists','focus','stats','settings']) {
        await popup.locator('#tab-btn-'+tab).click();
        const size=await popup.evaluate(()=>{const el=document.getElementById('scroll');return {viewport:innerWidth,body:document.body.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth};});
        const visible = await popup.evaluate(() => ({ bodyOverflow: document.documentElement.scrollWidth > innerWidth, scrollOverflow: getComputedStyle(document.getElementById('scroll')).overflowX }));
        assert.ok(size.body<=320 && !visible.bodyOverflow && visible.scrollOverflow==='hidden',`${userLanguage}/${themeMode}/${tab}: ${JSON.stringify({size,visible})}`);
        if (userLanguage === 'en' && ['focus','block'].includes(tab)) {
          fs.mkdirSync(path.join(root,'.system_generated'),{recursive:true});
          const screenshot = await mobilePopupSession.send('Page.captureScreenshot', { format:'png' });
          fs.writeFileSync(path.join(root,'.system_generated',`${tab}-features-320-${themeMode}.png`),Buffer.from(screenshot.data,'base64'));
        }
        if (tab === 'block') {
          const homeHelp = popup.locator('[data-help="home-feed-description"]');
          const mobileHelpTooltip = popup.locator('#setting-help-tooltip');
          await tapMobile(homeHelp);
          await mobileHelpTooltip.waitFor({state:'visible'});
          const bounds = await mobileHelpTooltip.boundingBox();
          assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 320 && bounds.y >= 0 && bounds.y + bounds.height <= 640,
            `${userLanguage}/${themeMode}: help fits the mobile viewport`);
          assert.equal(await mobileHelpTooltip.textContent(),await popup.locator('#home-feed-description').textContent(),'help uses the current language');
          if (themeMode === 'light') {
            const screenshot = await mobilePopupSession.send('Page.captureScreenshot', { format:'png' });
            fs.writeFileSync(path.join(root,'.system_generated',`setting-help-320-${userLanguage}.png`),Buffer.from(screenshot.data,'base64'));
          }
          await tapMobile(homeHelp);
          assert.equal(await mobileHelpTooltip.isVisible(),false,'tap toggles help closed');
        }
      }
    }
    console.log('PASS: all popup tabs at 320px in light/dark and English/Arabic');
    await worker.evaluate(async()=>{await browser.storage.local.clear();await reconcile();await StorageManager.updateSetting('blockHomeFeed',true);});
    await context.route('https://m.youtube.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><ytm-app><ytm-browse><ytm-item-section-renderer><div class="lazy-list">${Array.from({length:18},(_,i)=>`<ytm-video-with-context-renderer><h3 class="media-item-headline">Video ${i}</h3><a class="media-item-byline" href="/@Mobile${i}">Mobile ${i}</a></ytm-video-with-context-renderer>`).join('')}</div></ytm-item-section-renderer></ytm-browse></ytm-app></body></html>`}));
    const mobile=await context.newPage();await mobile.setViewportSize({width:320,height:640});await mobile.goto('https://m.youtube.com/');
    await mobile.waitForFunction(()=>document.documentElement.hasAttribute('data-iyt-ready'));
    assert.equal(await mobile.locator('ytm-browse').isVisible(),false);
    await popup.evaluate(()=>StorageManager.updateSettings({blockHomeFeed:false,limitHomeFeed:true}));
    await mobile.waitForFunction(()=>document.documentElement.classList.contains('iyt-limit-home-feed'));
    assert.equal(await mobile.locator('ytm-video-with-context-renderer').nth(14).isVisible(),true);
    assert.equal(await mobile.locator('ytm-video-with-context-renderer').nth(15).isVisible(),false);
    console.log('PASS: mobile-origin document-start blocking and consistent 15-card limit');
    await popup.reload();
    await popup.waitForFunction(()=>document.getElementById('link-review-prompt')?.hasAttribute('href'));
    assert.equal(await popup.locator('#review-card').isVisible(),false,'review prompt is hidden before seven days');
    await popup.evaluate(()=>browser.storage.local.set({reviewEligibleAt:Date.now()-1}));
    await popup.reload();
    await popup.waitForSelector('#review-card',{state:'visible'});
    assert.equal(await popup.locator('#link-review-prompt').getAttribute('href'),await popup.locator('#link-rate-store').getAttribute('href'));
    assert.equal(await popup.evaluate(async()=>(await browser.storage.local.get('reviewPromptShown')).reviewPromptShown),true);
    for (const theme of ['light','dark']) {
      await popup.evaluate(theme=>StorageManager.updateSetting('themeMode',theme),theme);
      await popup.setViewportSize({width:320,height:640});
      assert.equal(await popup.evaluate(()=>document.documentElement.scrollWidth<=320),true,'review card fits at 320px');
    }
    await popup.reload();
    await popup.waitForFunction(()=>document.getElementById('link-review-prompt')?.hasAttribute('href'));
    assert.equal(await popup.locator('#review-card').isVisible(),false,'closing without clicking never repeats the prompt');
    // Exercise dismissal with a fresh eligible state.
    await popup.evaluate(()=>browser.storage.local.set({reviewPromptShown:false}));
    await popup.reload();
    await popup.waitForSelector('#review-card',{state:'visible'});
    await popup.locator('#btn-dismiss-review').click();
    assert.equal(await popup.locator('#review-card').isVisible(),false);
    await popup.reload();
    await popup.waitForFunction(()=>document.getElementById('link-review-prompt')?.hasAttribute('href'));
    assert.equal(await popup.locator('#review-card').isVisible(),false,'dismissal never repeats the prompt');
    console.log('PASS: delayed review card, store link, local once-only flag, dismissal and narrow layout');
    assert.deepEqual(errors,[]);
    console.log('PASS: no page JavaScript errors');
  } finally { await context.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
