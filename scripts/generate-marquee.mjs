// Layout and raster export for the store's 1400 x 560 marquee.
// Uses existing artwork and real extension captures; no runtime dependencies.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const asset = (filename, type) => 'data:' + type + ';base64,' + fs.readFileSync(path.join(root, filename)).toString('base64')
const logo = asset('icons/icon.svg', 'image/svg+xml')
const landscape = asset('public/screenshots/hero-calm-landscape.webp', 'image/webp')
const controls = asset('public/screenshots/hero-extension-light.webp', 'image/webp')
const regular = asset('fonts/Inter-Regular.woff2', 'font/woff2')
const bold = asset('fonts/Inter-Bold.woff2', 'font/woff2')
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 560 }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:Inter;src:url("${regular}");font-weight:400}
    @font-face{font-family:Inter;src:url("${bold}");font-weight:700}
    *{box-sizing:border-box}body{margin:0;background:#f7f9f8;font-family:Inter,Arial,sans-serif;color:#142137}
    main{position:relative;width:1400px;height:560px;overflow:hidden}
    .brand{position:absolute;left:64px;top:43px;display:flex;align-items:center;gap:12px;font-size:20px;font-weight:700;letter-spacing:-.5px}
    .brand img{width:43px;height:43px}
    .brand small{display:block;font-size:8px;letter-spacing:1.7px;color:#6c7a76;font-weight:400;margin-top:5px}
    .copy{position:absolute;top:147px;left:68px;z-index:2}
    h1{font-size:70px;letter-spacing:-3.9px;line-height:1.06;margin:0 0 25px}
    h1 em{font:italic 74px Georgia,serif;letter-spacing:-3.4px;color:#466953}
    .description{font-size:19px;line-height:1.75;color:#586b72;margin:0}
    .footer{position:absolute;bottom:49px;left:70px;display:flex;align-items:center;gap:10px;color:#466953;font-size:10px;letter-spacing:1px}
    .dot{width:6px;height:6px;border-radius:50%;background:#466953}
    .wash{position:absolute;width:760px;height:625px;left:703px;top:9px;border-radius:47% 42% 47% 39%;background:#e3ece5;transform:rotate(-12deg)}
    .orbit{position:absolute;left:727px;top:47px;width:652px;height:509px;border:1px solid #c9d8cd;border-radius:50%;transform:rotate(14deg)}
    .note{position:absolute;left:883px;top:56px;font:italic 22px Georgia,serif;color:#466953;transform:rotate(-5deg)}
    .note svg{width:75px;height:32px;display:block;margin-left:76px;stroke:#466953;stroke-width:1.3;fill:none;stroke-linecap:round;stroke-linejoin:round}
    .browser{position:absolute;left:703px;top:147px;width:479px;background:white;border:1px solid #d3ddd7;border-radius:14px;overflow:hidden;transform:rotate(-6deg);box-shadow:0 20px 43px -18px #233d3a50}
    .toolbar{height:33px;display:flex;align-items:center;gap:5px;padding:0 12px;background:#f1f4f3;border-bottom:1px solid #e1e7e3}
    .toolbar i{width:5px;height:5px;background:#ceb6a9;border-radius:50%}.toolbar i:nth-child(2){background:#d9c89e}.toolbar i:nth-child(3){background:#acc5ad}
    .address{background:white;border-radius:5px;width:256px;margin-left:41px;padding:4px;text-align:center;font-size:8px;color:#809189}
    .content{padding:12px}
    .yt{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;margin:1px 0 11px}
    .yt span{background:#e3483f;border-radius:4px;color:white;padding:1px 6px;font-size:9px}
    .video{position:relative;height:249px;overflow:hidden;border-radius:7px}.video img{width:100%;height:100%;object-fit:cover}
    .video em{position:absolute;top:29px;left:25px;font:italic 26px Georgia,serif;color:#fff9ed;text-shadow:0 1px 8px #304a3b50}
    .video:after{content:"";position:absolute;bottom:11px;left:12px;right:12px;height:2px;background:#ffffffe0}
    .video-title{font-size:10px;margin:10px 2px 1px;color:#54655d}
    .panel{position:absolute;left:1039px;top:160px;width:309px;background:white;border:1px solid #cddbd0;border-radius:13px;overflow:hidden;transform:rotate(4deg);box-shadow:0 23px 43px -15px #233d3a57}
    .panel-label{padding:9px 12px;background:#edf2ee;font-size:9px;color:#466953;display:flex;gap:6px;align-items:center}
    .panel-label span{height:5px;width:5px;background:#059669;border-radius:50%}
    .panel img{display:block;width:100%;height:auto}
    .tag{position:absolute;left:693px;top:407px;display:flex;align-items:center;gap:9px;padding:13px 17px;border-radius:11px;background:white;border:1px solid #dce5df;box-shadow:0 9px 24px #233d3a15;transform:rotate(-3deg);font-size:11px;color:#263e31}
    .tag span{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#e9f4ec;color:#34734c;font-size:12px}
    .caption{position:absolute;right:62px;bottom:20px;color:#72847a;font-size:8px}
  </style></head><body><main>
    <div class="wash"></div><div class="orbit"></div>
    <div class="brand"><img src="${logo}"><span>Intentional YT<small>A LITTLE MORE INTENTION</small></span></div>
    <div class="copy"><h1>Your YouTube.<br><em>A little calmer.</em></h1><p class="description">Hide Shorts and recommendations.<br>Set a daily watch limit. Keep your day.</p></div>
    <div class="footer"><span class="dot"></span>FREE & OPEN SOURCE &nbsp; · &nbsp; NO ACCOUNT. NO TRACKING.</div>
    <div class="note">Room for what matters.<svg viewBox="0 0 95 40"><path d="M4 4C35 1 27 31 82 29M74 22l10 7-9 7"/></svg></div>
    <div class="browser"><div class="toolbar"><i></i><i></i><i></i><span class="address">youtube.com</span></div><div class="content">
      <div class="yt"><span>▶</span>YouTube</div>
      <div class="video"><img src="${landscape}"><em>A moment for you</em></div>
      <div class="video-title">Just the video. Room to focus.</div>
    </div></div>
    <div class="tag"><span>✓</span>Shorts, out of sight.</div>
    <div class="panel"><div class="panel-label"><span></span>Your focus controls</div><img src="${controls}"></div>
    <div class="caption">Illustrated watch page · Actual extension interface</div>
  </main></body></html>`)
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())) })
  const png = await sharp(await page.screenshot()).flatten({ background: '#ffffff' }).removeAlpha().png({ palette: false, compressionLevel: 9 }).toBuffer()
  const metadata = await sharp(png).metadata()
  assert.equal(metadata.width, 1400)
  assert.equal(metadata.height, 560)
  assert.equal(metadata.channels, 3)
  assert.equal(metadata.hasAlpha, false)
  assert.equal(png[24], 8)
  assert.equal(png[25], 2)
  const output = path.join(root, 'marketing/store-assets/marquee-1400x560.png')
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, png)
  console.log('Saved and verified: 1400 x 560, 24-bit RGB PNG, no alpha:', output)
} finally { await browser.close() }
