// Run after npm run build and npm run start -- --port 3105.
// Uses external Playwright tooling, as described in tests/README.md.
const { chromium } = require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const origin = process.env.IYT_SITE_URL || 'http://localhost:3105';
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/#demo');
    const demo=page.locator('#simulator');await demo.waitFor();
    assert.equal(await page.locator('#demo').evaluate(e=>e.open),true);
    assert.equal(await demo.getByLabel('Demo preset').inputValue(),'balanced');
    assert.equal(await demo.getByLabel('Daily limit',{exact:true}).isChecked(),false);
    assert.equal(await demo.getByLabel('Break reminder every 30 minutes').isChecked(),false);
    for(const label of ['Protections on','Daily limit','Break reminder every 30 minutes']) {
      assert.equal(await demo.getByLabel(label,{exact:true}).evaluate(el=>{
        const style=getComputedStyle(el), box=el.getBoundingClientRect();
        return style.opacity!=='0' && box.width>=16 && box.height>=16;
      }),true, label+' checkbox must be visible');
    }
    assert.equal(await demo.getByLabel('Hide home feed',{exact:true}).isChecked(),true);
    assert.equal(await demo.getByLabel('Hide recommended sidebar',{exact:true}).isChecked(),true);
    await demo.getByLabel('Demo preset').selectOption('zen');
    for(const label of ['Hide subscriptions feed','Hide comments','Hide thumbnails'])assert.equal(await demo.getByLabel(label,{exact:true}).isChecked(),true);
    await demo.getByLabel('Demo preset').selectOption('player');
    for(const label of ['Hide subscriptions feed','Hide thumbnails'])assert.equal(await demo.getByLabel(label,{exact:true}).isChecked(),false);
    assert.equal(await demo.getByLabel('Hide comments',{exact:true}).isChecked(),true);
    await demo.getByLabel('Demo preset').selectOption('balanced');
    await demo.getByLabel('Preview page').selectOption('search');
    await demo.getByLabel('Channel name or handle').fill('learning lab');
    await demo.getByLabel('Channel name or handle').press('Enter');
    assert.equal(await demo.locator('[data-video="lesson"]').count(),0);
    assert.equal(await demo.locator('[data-video="reaction"]').count(),1);
    await demo.getByRole('button',{name:'Remove channel learning lab'}).click();
    assert.equal(await demo.locator('[data-video="lesson"]').count(),1);
    await demo.getByLabel('Title keyword').fill('reaction');await demo.getByLabel('Title keyword').press('Enter');
    assert.equal(await demo.locator('[data-video="reaction"]').count(),0);
    await demo.getByLabel('Protections on').uncheck();
    assert.equal(await demo.locator('[data-video="reaction"]').count(),1);
    assert.equal(await demo.locator('[data-video="short"]').count(),1);
    await demo.getByLabel('Protections on').check();
    await demo.getByLabel('Daily limit',{exact:true}).check();await demo.getByLabel('Demo daily budget').selectOption('15');
    const advance=demo.getByRole('button',{name:'Simulate 5 minutes'});
    await advance.click();await advance.click();
    assert.match(await demo.innerText(),/Example warning: 5 minutes left/);
    await advance.click();assert.equal(await demo.getByText('Daily limit reached',{exact:true}).isVisible(),true);
    assert.equal(await advance.isDisabled(),true);
    await demo.getByLabel('Protections on').uncheck();await advance.click();
    assert.match(await demo.locator('.demo-counter').innerText(),/20 min/);
    await demo.getByRole('button',{name:'Reset sample time'}).click();assert.match(await demo.locator('.demo-counter').innerText(),/0 min/);
    await demo.getByLabel('Daily limit',{exact:true}).uncheck();await demo.getByLabel('Protections on').check();await demo.getByLabel('Break reminder every 30 minutes').check();
    for(let i=0;i<6;i++)await advance.click();
    assert.match(await demo.innerText(),/Example break reminder/);
    await page.locator('#demo > summary').click();
    await page.locator('.nav-links').getByRole('link',{name:'Demo',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#demo').open);
    await page.goto(origin+'/privacy');
    assert.match(await page.locator('main').innerText(),/Google Forms/);
    await page.locator('.nav-links').getByRole('link',{name:'Demo',exact:true}).click();await demo.waitFor();
    for(const width of [1440,320])for(const theme of ['light','dark']){
      await page.setViewportSize({width,height:900});
      await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      const overflow=await demo.evaluate(e=>[...e.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)}).map(el=>el.className));
      assert.deepEqual(overflow,[],width+' '+theme+' demo overflow');
      await demo.screenshot({path:require('node:path').join(require('node:os').tmpdir(),'iyt-demo-'+width+'-'+theme+'.png')});
    }
    await page.goto(origin+'/privacy');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.goto(origin+'/uninstall/index.html');await page.waitForURL(origin+'/uninstall');
    assert.match(await page.locator('main').innerText(),/Only sent when you press Send/);
    assert.deepEqual(errors,[]);
    console.log('PASS: demo navigation, presets, filters, limits, reminders, 320px/desktop themes, privacy and legacy redirect');
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';
    for (const [name, userAgent, expected, mobile] of [
      ['chrome', desktopUA, 'chromewebstore.google.com', false],
      ['edge', desktopUA + ' Edg/140.0.0.0', 'microsoftedge.microsoft.com', false],
      ['firefox', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0', 'addons.mozilla.org', false],
      ['safari', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', null, false],
      ['iphone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1', null, true],
      ['android', 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36', null, true],
    ]) {
      const context = await browser.newContext({userAgent, viewport:{width:mobile ? 320 : 1440,height:900}, isMobile:mobile, hasTouch:mobile});
      try {
        const installPage = await context.newPage();
        const installErrors = [];
        installPage.on('pageerror', e => installErrors.push(e.message));
        await installPage.goto(origin);
        const buttons = installPage.locator('[data-install-primary]');
        await installPage.waitForFunction(({expected,mobile}) => {
          const links = [...document.querySelectorAll('[data-install-primary]')];
          return links.length === 3 && links.every(a => expected ? a.href.includes(expected) : a.textContent.includes(mobile ? (a.closest('nav') ? 'Desktop setup' : 'Try the demo') : 'Choose browser'));
        }, {expected,mobile});
        assert.equal(await buttons.count(),3);
        if (expected) for (const link of await buttons.all()) {
          assert.equal(new URL(await link.getAttribute('href')).hostname, expected);
          assert.equal(await link.getAttribute('target'),'_blank');
        }
        assert.equal(await installPage.locator('#install-options .install-store-links a').count(),3);
        for (const width of [320,768,1024,1440]) for (const theme of ['light','dark']) {
          await installPage.setViewportSize({width,height:900});
          await installPage.evaluate(t=>document.documentElement.dataset.theme=t,theme);
          const overflow = await installPage.locator('[data-install-primary], .install-store-links a').evaluateAll(links => links.filter(a=>{const r=a.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth+1 || r.height < 44}).map(a=>a.textContent));
          assert.deepEqual(overflow,[],`${name} ${width} ${theme}: install controls fit and have 44px targets`);
          assert.equal(await installPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
          if (name === 'iphone' && width === 320 || name === 'firefox' && width === 1440) {
            await installPage.screenshot({animations:'disabled',path:require('node:path').join(require('node:os').tmpdir(),`iyt-install-${name}-${width}-${theme}.png`)});
          }
        }
        if (mobile) {
          await installPage.setViewportSize({width:320,height:900});
          await installPage.getByRole('button',{name:'Toggle navigation menu'}).click();
          const menu = installPage.getByRole('dialog',{name:'Mobile Navigation'});
          assert.equal(await menu.locator('.install-store-links a').count(),3);
          assert.match(await menu.innerText(),/open this site on your computer/);
          await installPage.keyboard.press('Escape');
          await menu.waitFor({state:'hidden'});
          assert.match(await installPage.locator('#install-options').innerText(),/open this site on your computer/);
          await installPage.locator('.hero [data-install-primary]').click();
          await installPage.waitForFunction(()=>document.querySelector('#demo').open);
        }
        assert.deepEqual(installErrors,[]);
      } finally { await context.close(); }
    }
    const noJS = await browser.newContext({javaScriptEnabled:false});
    try {
      const fallback = await noJS.newPage(); await fallback.goto(origin);
      assert.equal(await fallback.locator('#install-options .install-store-links a').count(),3);
      assert.equal(await fallback.locator('.hero [data-install-primary]').getAttribute('href'),'/#install-options');
    } finally { await noJS.close(); }
    console.log('PASS: matching install stores, unsupported/mobile guidance, no-JS fallback and responsive install controls in both themes');
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
