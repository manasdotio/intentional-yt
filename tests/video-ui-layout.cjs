// Rendering-only fixture: real popup/options HTML and CSS, no extension privileges.
// This complements, but does not replace, extension-browser integration checks.
const { chromium } = require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const popupSource = read('ui/popup.js');
const renderSource = popupSource.slice(popupSource.indexOf('let _videoInfo = null;'), popupSource.indexOf('async function startVideoSession()'));
const types = { '.css':'text/css', '.woff2':'font/woff2', '.png':'image/png', '.svg':'image/svg+xml' };

(async () => {
  const browser = await chromium.launch({ channel:'chromium', headless:true });
  try {
    const page = await browser.newPage();
    await page.route('http://iyt-layout.test/**', async route => {
      const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
      const file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return route.abort();
      let body = fs.readFileSync(file);
      if (file.endsWith('.html')) body = body.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
      await route.fulfill({contentType:file.endsWith('.html')?'text/html':types[path.extname(file)] || 'application/octet-stream',body});
    });
    for (const file of ['popup','options']) for (const lang of ['en','ar']) for (const theme of ['light','dark']) for (const width of [320,540]) {
      await page.setViewportSize({width,height:720});
      await page.goto(`http://iyt-layout.test/ui/${file}.html`);
      const catalog = JSON.parse(read(`_locales/${lang}/messages.json`));
      await page.evaluate(({file,lang,theme,catalog}) => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dataset.theme = theme;
        document.body.classList.add('mode-advanced');
        if (file === 'options') document.body.classList.add('is-options-page');
        document.querySelectorAll('.tab-panel').forEach(el=>el.classList.toggle('active',el.id==='panel-focus'));
        document.querySelectorAll('[data-i18n]').forEach(el=>{
          const entry=catalog[el.dataset.i18n];
          if (entry && !entry.message.includes('$')) el.textContent=entry.message;
        });
        window.$ = id=>document.getElementById(id);
        window.t = (key,subs) => {
          const entry=catalog[key];
          let text=entry?.message || key;
          for(const [name,placeholder] of Object.entries(entry?.placeholders || {})) {
            const index=Number(placeholder.content.replace('$',''))-1;
            text=text.replace(new RegExp('\\$'+name+'\\$','gi'),subs?.[index] || '');
          }
          return text;
        };
        window._s={extensionEnabled:true,videoSession:null};
      },{file,lang,theme,catalog});
      await page.addScriptTag({content:read('utils/policy.js')});
      await page.addScriptTag({content:renderSource});
      for (const phase of ['watching','break']) {
        await page.evaluate(phase=>{
          const now=Date.now();
          _s.videoSession={phase,title:'A deliberately long lesson title '+ 'Learning '.repeat(30),startedAt:now,sessionDeadline:now+86400000,completedAt:phase==='break'?now:null,breakUntil:phase==='break'?now+300000:null};
          renderVideoSession();
        },phase);
        const layout=await page.evaluate(()=>{
          const card=$('video-session-description').closest('.focus-section-card');
          const bounds=card.getBoundingClientRect();
          const overflow=[...card.querySelectorAll('.video-session-controls *')].filter(el=>!el.hidden && el.getBoundingClientRect().width && el.scrollWidth>el.clientWidth+1).map(el=>el.id||el.tagName);
          return {body:document.documentElement.scrollWidth,viewport:innerWidth,left:bounds.left,right:bounds.right,overflow};
        });
        assert.ok(layout.body<=width && layout.left>=0 && layout.right<=width,`${file}/${lang}/${theme}/${width}/${phase}: ${JSON.stringify(layout)}`);
        assert.deepEqual(layout.overflow,[],`${file}/${lang}/${theme}/${width}/${phase}: text fits`);
        assert.equal(await page.locator('#btn-video-session-start').isVisible(),false);
        assert.equal(await page.locator('#btn-video-session-finish').isVisible(),phase==='watching');
      }
    }
    console.log('PASS: one-video card and long titles fit popup/options at 320/540px, English/Arabic and light/dark; break has no skip action');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
