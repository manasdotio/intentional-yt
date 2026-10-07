// Store artwork built around real extension screenshots in an isolated profile.
// Playwright is external tooling; set IYT_PLAYWRIGHT_MODULE to its module folder.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'marketing/store-assets')
fs.mkdirSync(path.join(output, 'screenshots'), { recursive: true })
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'iyt-store-art-'))
const extension = path.join(temporary, 'extension')
fs.mkdirSync(extension)
for (const directory of ['content', 'utils', 'background', 'ui', 'styles', 'fonts', 'icons', '_locales']) {
  fs.cpSync(path.join(root, directory), path.join(extension, directory), { recursive: true })
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))
delete manifest.background.scripts
fs.writeFileSync(path.join(extension, 'manifest.json'), JSON.stringify(manifest))
const dataUri = (buffer, type = 'image/png') => 'data:' + type + ';base64,' + buffer.toString('base64')
const logo = dataUri(fs.readFileSync(path.join(root, 'icons/icon.svg')), 'image/svg+xml')
const font = weight => dataUri(fs.readFileSync(path.join(root, 'fonts/Inter-' + weight + '.woff2')), 'font/woff2')
const fontStyles = `@font-face{font-family:Inter;src:url("${font('Regular')}");font-weight:400}
@font-face{font-family:Inter;src:url("${font('SemiBold')}");font-weight:600}
@font-face{font-family:Inter;src:url("${font('Bold')}");font-weight:700}`
const shots = new Map()
const context = await chromium.launchPersistentContext(path.join(temporary, 'profile'), {
  channel: 'chromium', headless: true, viewport: { width: 540, height: 530 },
  deviceScaleFactor: 2, colorScheme: 'light',
  args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension]
})
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker')
  const id = worker.url().split('/')[2]
  const popup = await context.newPage()
  await popup.goto('chrome-extension://' + id + '/ui/popup.html')
  await popup.waitForFunction(() => document.getElementById('toggle-extensionEnabled')?.checked)
  if (await popup.locator('#btn-dismiss-welcome').isVisible()) await popup.locator('#btn-dismiss-welcome').click()
  const capture = async name => {
    await popup.evaluate(async () => { document.activeElement?.blur(); await document.fonts.ready })
    await popup.mouse.move(0, 0)
    await popup.locator('#iyt-toast').waitFor({ state: 'hidden' })
    await popup.waitForTimeout(400)
    shots.set(name, await popup.locator('#shell').screenshot())
    console.log('Captured actual extension:', name)
  }
  const scrollTo = async selector => {
    await popup.locator(selector).evaluate(element => element.scrollIntoView({ block: 'start' }))
  }
  await capture('overview')

  await popup.locator('#tab-btn-blocklists').click()
  await popup.locator('#input-channel-blocklist').fill('@examplecreator')
  await popup.locator('#btn-add-channel').click()
  await popup.locator('#input-keyword-blocklist').fill('spoiler')
  await popup.locator('#btn-add-keyword').click()
  await popup.waitForFunction(() => document.getElementById('keyword-blocklist-chips').textContent.includes('spoiler'))
  await capture('filters')

  await popup.locator('#tab-btn-focus').click()
  await popup.locator('#toggle-softReminder').check()
  await popup.locator('#select-softReminderInterval').selectOption('30')
  await popup.locator('#toggle-dailyLimit').check()
  await popup.locator('#select-dailyLimitMinutes').selectOption('45')
  await scrollTo('#card-focus-time')
  await capture('limits')

  await popup.evaluate(async () => {
    await StorageManager.updateNestedSetting('dailyLimit', 'enabled', false)
    await StorageManager.updateNestedSetting('softReminder', 'enabled', false)
  })
  await popup.locator('#toggle-scheduledBlockingEnabled').check()
  await popup.locator('#btn-add-schedule').click()
  await popup.locator('#schedule-input-label').fill('Study hours')
  await popup.locator('#schedule-input-start').fill('09:00')
  await popup.locator('#schedule-input-end').fill('12:00')
  await popup.locator('input[name="schedule-mode"][value="strict"]').check()
  await popup.locator('#btn-save-schedule').click()
  await popup.waitForFunction(() => document.getElementById('schedules-list').textContent.includes('Study hours'))
  await scrollTo('#card-focus-schedule')
  await capture('schedule')

  await popup.locator('#toggle-scheduledBlockingEnabled').uncheck()
  for (const card of ['time', 'schedule']) {
    const header = popup.locator('.focus-card-header[data-card="' + card + '"]')
    if (await header.getAttribute('aria-expanded') === 'true') await header.click()
  }
  // The switch intentionally stays off until its PIN setup dialog is completed.
  await popup.locator('#toggle-focusLockEnabled').click()
  await popup.locator('#input-setup-pin').fill('4826')
  await popup.locator('#input-setup-pin-confirm').fill('4826')
  await popup.locator('#btn-save-setup-pin').click()
  await popup.locator('#modal-pin-setup').waitFor({ state: 'hidden' })
  await popup.emulateMedia({ colorScheme: 'dark' })
  await scrollTo('#card-focus-lock')
  await capture('lock')
} finally {
  await context.close()
}

const pages = [
  { file: '01-calmer-youtube.png', shot: 'overview', tag: 'LESS DISTRACTION', title: 'A calmer<br><em>YouTube.</em>',
    description: 'Hide Shorts and recommendations.<br>Keep the videos you came for.',
    benefits: ['Keep search and subscriptions', 'Choose what stays on screen', 'Make room for your day'], accent: '#466953' },
  { file: '02-channel-keyword-filters.png', shot: 'filters', tag: 'CHANNEL & KEYWORD FILTERS', title: 'Your feed.<br><em>Your rules.</em>',
    description: 'Hide video cards by channel name,<br>handle, or title keyword.',
    benefits: ['Add channels to your blocklist', 'Filter words in video titles', 'Manage your lists in one place'], accent: '#3464bc' },
  { file: '03-daily-watch-limit.png', shot: 'limits', tag: 'DAILY WATCH LIMITS', title: 'A little less<br><em>“one more.”</em>',
    description: 'Choose a daily playback budget.<br>Get a nudge when it is time for a break.',
    benefits: ['Set your own daily limit', 'Pause playback at your threshold', 'Add gentle break reminders'], accent: '#716095' },
  { file: '04-scheduled-focus.png', shot: 'schedule', tag: 'SCHEDULED BLOCKING', title: 'Make focus<br><em>a habit.</em>',
    description: 'Set aside time for work or study.<br>Let your blocking schedule take over.',
    benefits: ['Pick your days and hours', 'Apply Strict Focus on a schedule', 'Or block YouTube entirely'], accent: '#466953' },
  { file: '05-focus-lock.png', shot: 'lock', tag: 'FOCUS LOCK', title: 'A moment<br><em>to reconsider.</em>',
    description: 'Add a PIN and a cooldown before<br>changing protected settings.',
    benefits: ['Set a four-digit PIN', 'Choose your cooldown delay', 'Give your intention time to stick'], accent: '#b6cdbd', dark: true }
]
const sharedCss = `${fontStyles}
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif}
.art{position:relative;width:1280px;height:800px;overflow:hidden;background:#f8f9fb;color:#162237;--muted:#5d687b;--line:#dbe3e3;--wash:#e7ede8}
.art.dark{background:#101719;color:#f0f5f3;--muted:#a1b4b3;--line:#354844;--wash:#203a32}
.wash{position:absolute;width:780px;height:780px;right:-135px;top:55px;border-radius:45% 48% 41% 46%;background:var(--wash);transform:rotate(-12deg)}
.orbit{position:absolute;width:655px;height:685px;right:-45px;top:73px;border:1px solid var(--line);border-radius:50%;transform:rotate(15deg)}
.brand{position:absolute;top:43px;left:58px;display:flex;align-items:center;gap:12px;font-weight:700;font-size:20px;letter-spacing:-.5px}
.brand img{width:39px;height:39px}.brand small{display:block;font-size:9px;color:var(--muted);font-weight:600;letter-spacing:1.6px;margin-top:3px}
.page-number{position:absolute;right:62px;top:54px;letter-spacing:2px;font-size:11px;color:var(--muted)}
.copy{position:absolute;left:64px;top:174px;width:470px}
.eyebrow{font-size:10px;letter-spacing:2px;font-weight:600;color:var(--accent);display:flex;align-items:center;gap:9px}
.eyebrow:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent)}
h1{font-size:64px;line-height:1.07;letter-spacing:-3px;margin:23px 0 24px;font-weight:700}
em{font-family:Georgia,serif;font-style:italic;font-weight:400;color:var(--accent);letter-spacing:-2.3px}
.description{font-size:18px;line-height:1.75;color:var(--muted);margin:0}
ul{padding:0;margin:32px 0 0;list-style:none;font-size:13px;line-height:2.7}
li{display:flex;align-items:center;gap:11px}li:before{content:"✓";display:grid;place-items:center;width:19px;height:19px;background:var(--wash);color:var(--accent);border-radius:50%;font-size:10px}
.capture{position:absolute;left:585px;top:118px;width:630px;border-radius:17px;border:1px solid var(--line);overflow:hidden;background:white;box-shadow:0 25px 60px -24px #14273b4d}
.capture img{width:100%;height:auto;display:block}
.footer{position:absolute;left:64px;bottom:34px;font-size:10px;color:var(--muted);letter-spacing:.3px}
.footer b{font-weight:600;color:inherit}.proof{position:absolute;right:68px;bottom:30px;color:var(--muted);font-size:9px;letter-spacing:.25px}
`

async function saveRgb(page, destination, width, height) {
  const buffer = await sharp(await page.screenshot()).flatten({ background: '#ffffff' }).removeAlpha().png({ palette: false, compressionLevel: 9 }).toBuffer()
  const info = await sharp(buffer).metadata()
  assert.equal(info.width, width)
  assert.equal(info.height, height)
  assert.equal(info.channels, 3)
  assert.equal(info.hasAlpha, false)
  assert.equal(buffer[24], 8, 'PNG must use 8 bits per channel')
  assert.equal(buffer[25], 2, 'PNG must be RGB truecolor')
  fs.writeFileSync(destination, buffer)
  console.log('Validated 24-bit RGB PNG:', path.relative(root, destination), width, height)
}

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
  for (const [index, item] of pages.entries()) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${sharedCss}</style></head><body>
      <main class="art ${item.dark ? 'dark' : ''}" style="--accent:${item.accent}">
        <div class="wash"></div><div class="orbit"></div>
        <div class="brand"><img src="${logo}"><span>Intentional YT<small>A LITTLE MORE INTENTION</small></span></div>
        <span class="page-number">0${index + 1} / 05</span>
        <div class="copy"><div class="eyebrow">${item.tag}</div><h1>${item.title}</h1><p class="description">${item.description}</p><ul>${item.benefits.map(text => '<li>' + text + '</li>').join('')}</ul></div>
        <div class="capture"><img src="${dataUri(shots.get(item.shot))}"></div>
        <div class="footer"><b>Free & open source</b> &nbsp;·&nbsp; No account &nbsp;·&nbsp; Settings stay in your browser</div>
        <div class="proof">Actual extension interface · Example settings</div>
      </main></body></html>`)
    await page.evaluate(() => document.fonts.ready)
    await saveRgb(page, path.join(output, 'screenshots', item.file), 1280, 800)
  }
  await page.setViewportSize({ width: 440, height: 280 })
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontStyles}
    *{box-sizing:border-box}body{margin:0;background:#f6f8f7;color:#142137;font-family:Inter,Arial,sans-serif}
    main{position:relative;width:440px;height:280px;overflow:hidden}
    .wash{position:absolute;left:238px;top:51px;width:320px;height:320px;background:#dfeae2;border-radius:50%}
    .brand{position:absolute;top:21px;left:22px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700}.brand img{width:29px;height:29px}
    h1{position:absolute;top:76px;left:24px;margin:0;font-size:30px;line-height:1.12;letter-spacing:-1.5px;z-index:2}
    h1 em{font:italic 31px Georgia,serif;letter-spacing:-1.3px;color:#456653}
    .description{position:absolute;top:155px;left:25px;font-size:11px;line-height:1.7;margin:0;color:#526273;z-index:2}
    .capture{position:absolute;width:222px;left:255px;top:83px;transform:rotate(-7deg);border:1px solid #d0dad5;border-radius:10px;box-shadow:0 12px 28px #223d372b;overflow:hidden}
    .capture img{width:100%;display:block}
    .footer{position:absolute;bottom:24px;left:25px;font-size:8px;letter-spacing:.6px;font-weight:600;color:#456653}
    </style></head><body><main><div class="wash"></div><div class="brand"><img src="${logo}"><span>Intentional YT</span></div>
    <h1>Your YouTube.<br><em>A little calmer.</em></h1><p class="description">Hide distractions.<br>Set your daily watch limit.</p>
    <div class="capture"><img src="${dataUri(shots.get('overview'))}"></div><div class="footer">FREE · PRIVATE · OPEN SOURCE</div>
    </main></body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await saveRgb(page, path.join(output, 'promo-tile-440x280.png'), 440, 280)
} finally { await browser.close() }
