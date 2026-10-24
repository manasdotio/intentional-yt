// Capture the real popup in an isolated browser profile for the setup guides.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'iyt-blog-capture-'))
const extension = path.join(temporary, 'extension')
fs.mkdirSync(extension)
for (const directory of ['content', 'utils', 'background', 'ui', 'styles', 'fonts', 'icons', '_locales']) {
  fs.cpSync(path.join(root, directory), path.join(extension, directory), { recursive: true })
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))
delete manifest.background.scripts
fs.writeFileSync(path.join(extension, 'manifest.json'), JSON.stringify(manifest))

const context = await chromium.launchPersistentContext(path.join(temporary, 'profile'), {
  channel: 'chromium', headless: true,
  viewport: { width: 540, height: 530 }, deviceScaleFactor: 2, colorScheme: 'light',
  args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension]
})
try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker')
  const popup = await context.newPage()
  await popup.goto('chrome-extension://' + worker.url().split('/')[2] + '/ui/popup.html')
  await popup.waitForFunction(() => document.getElementById('toggle-extensionEnabled')?.checked)
  if (await popup.locator('#btn-dismiss-welcome').isVisible()) {
    await popup.locator('#btn-dismiss-welcome').click()
  }
  assert.equal(await popup.locator('#toggle-blockShorts').isChecked(), true)
  assert.equal(await popup.locator('#select-homeFeed').inputValue(), 'hide')
  assert.equal(await popup.locator('#toggle-blockRecommended').isChecked(), true)
  assert.equal(await popup.locator('#toggle-blockSubscriptionsFeed').isChecked(), false)
  assert.equal(await popup.locator('#toggle-blockPlaylist').isChecked(), false)
  await popup.evaluate(async () => { document.activeElement?.blur(); await document.fonts.ready })
  await popup.mouse.move(0, 0)
  await popup.locator('#iyt-toast').waitFor({ state: 'hidden' })
  await popup.waitForTimeout(400)
  const capture = await popup.locator('#shell').screenshot({ animations: 'disabled' })
  const metadata = await sharp(capture).metadata()
  assert.equal(metadata.width, 1080)
  assert.equal(metadata.height, 1060)
  const output = path.join(root, 'public/screenshots/product-overview.webp')
  await sharp(capture).webp({ lossless: true }).toFile(output)
  console.log('Captured current popup: ' + output)
} finally {
  await context.close()
}
