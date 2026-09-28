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
    await context.route('https://www.youtube.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><ytd-app><ytd-browse page-subtype="home"><ytd-rich-grid-renderer><div id="contents"><ytd-rich-item-renderer><h3><a id="video-title">A useful video</a></h3><ytd-channel-name><a href="/@ScienceDaily">ScienceDaily</a></ytd-channel-name></ytd-rich-item-renderer></div></ytd-rich-grid-renderer></ytd-browse><div id="movie_player"><video class="html5-main-video"></video></div><div id="comments">Comments</div></ytd-app></body></html>`}));
    const page=await context.newPage();await page.goto('https://www.youtube.com/');
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-iyt-ready'));
    assert.equal(await page.locator('ytd-rich-grid-renderer').isVisible(),false);
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

    await popup.evaluate(()=>StorageManager.updateSetting('scheduledBlocking',{enabled:true,schedules:[{id:'work',label:'Work',enabled:true,days:[new Date().getDay()],startTime:'00:00',endTime:'00:00',mode:'strict'}]}));
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
    assert.equal(await popup.locator('#protection-status').isVisible(),true);
    await popup.waitForFunction(()=>document.getElementById('protection-status-session').textContent.includes('Strict Focus until'));
    await page.waitForFunction(()=>document.documentElement.classList.contains('iyt-no-comments'));
    assert.equal(await popup.locator('[data-focus-minutes="45"]').isDisabled(),true);
    const deadline = await worker.evaluate(async()=>({until:(await StorageManager.getSettings()).focusSessionUntil,alarm:(await browser.alarms.get('iyt-deadline')).scheduledTime}));
    assert.equal(deadline.until,deadline.alarm);
    await popup.locator('#btn-end-focus-session').click();
    await page.waitForFunction(()=>!document.documentElement.classList.contains('iyt-no-comments'));
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
    popup=await context.newPage();
    const mobilePopupSession = await context.newCDPSession(popup);
    await mobilePopupSession.send('Emulation.setDeviceMetricsOverride', { width:320,height:640,screenWidth:320,screenHeight:640,deviceScaleFactor:1,mobile:true });
    await mobilePopupSession.send('Emulation.setTouchEmulationEnabled', { enabled:true });
    await popup.goto(`chrome-extension://${id}/ui/popup.html`);
    await popup.waitForFunction(()=>document.getElementById('toggle-extensionEnabled')?.checked);
    for (const userLanguage of ['en','ar']) for (const themeMode of ['light','dark']) {
      await popup.evaluate(settings=>StorageManager.updateSettings(settings),{userLanguage,themeMode});
      await popup.waitForFunction(language=>document.documentElement.dir===(language==='ar'?'rtl':'ltr'),'en'===userLanguage?'en':'ar');
      await popup.waitForTimeout(250);
      for (const tab of ['block','blocklists','focus','stats','settings']) {
        await popup.locator('#tab-btn-'+tab).click();
        const size=await popup.evaluate(()=>{const el=document.getElementById('scroll');return {viewport:innerWidth,body:document.body.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth};});
        const visible = await popup.evaluate(() => ({ bodyOverflow: document.documentElement.scrollWidth > innerWidth, scrollOverflow: getComputedStyle(document.getElementById('scroll')).overflowX }));
        assert.ok(size.body<=320 && !visible.bodyOverflow && visible.scrollOverflow==='hidden',`${userLanguage}/${themeMode}/${tab}: ${JSON.stringify({size,visible})}`);
        if (userLanguage === 'en' && tab === 'focus') {
          fs.mkdirSync(path.join(root,'.system_generated'),{recursive:true});
          const screenshot = await mobilePopupSession.send('Page.captureScreenshot', { format:'png' });
          fs.writeFileSync(path.join(root,'.system_generated',`focus-features-320-${themeMode}.png`),Buffer.from(screenshot.data,'base64'));
        }
      }
    }
    console.log('PASS: all popup tabs at 320px in light/dark and English/Arabic');
    await worker.evaluate(async()=>{await browser.storage.local.clear();await reconcile();});
    await context.route('https://m.youtube.com/**',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><ytm-app><ytm-browse><ytm-item-section-renderer><div class="lazy-list">${Array.from({length:18},(_,i)=>`<ytm-video-with-context-renderer><h3 class="media-item-headline">Video ${i}</h3><a class="media-item-byline" href="/@Mobile${i}">Mobile ${i}</a></ytm-video-with-context-renderer>`).join('')}</div></ytm-item-section-renderer></ytm-browse></ytm-app></body></html>`}));
    const mobile=await context.newPage();await mobile.setViewportSize({width:320,height:640});await mobile.goto('https://m.youtube.com/');
    await mobile.waitForFunction(()=>document.documentElement.hasAttribute('data-iyt-ready'));
    assert.equal(await mobile.locator('ytm-browse').isVisible(),false);
    await popup.evaluate(()=>StorageManager.updateSettings({blockHomeFeed:false,limitHomeFeed:true}));
    await mobile.waitForFunction(()=>document.documentElement.classList.contains('iyt-limit-home-feed'));
    assert.equal(await mobile.locator('ytm-video-with-context-renderer').nth(14).isVisible(),true);
    assert.equal(await mobile.locator('ytm-video-with-context-renderer').nth(15).isVisible(),false);
    console.log('PASS: mobile-origin document-start blocking and consistent 15-card limit');
    assert.deepEqual(errors,[]);
    console.log('PASS: no page JavaScript errors');
  } finally { await context.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
