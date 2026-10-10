// Run after npm run build. Validate actual prerendered output, not JSX source.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const output = '.next/server/app'
const origin = 'https://www.intentionalyt.me'
const sitemap = fs.readFileSync(`${output}/sitemap.xml.body`, 'utf8')
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]))
const titles = new Set()
const descriptions = new Set()
const htmlPath = pathname => path.join(output, pathname === '/' ? 'index.html' : `${pathname.slice(1)}.html`)
const normalized = value => new URL(value).href.replace(/\/$/, '')

for (const url of urls) {
  assert.equal(url.origin, origin, `Noncanonical sitemap URL: ${url}`)
  const html = fs.readFileSync(htmlPath(url.pathname), 'utf8')
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] || ''
  const title = head.match(/<title>(.*?)<\/title>/)?.[1]
  const description = head.match(/<meta name="description" content="([^"]+)"/)?.[1]
  assert.ok(title && description, `Missing metadata: ${url}`)
  assert.ok(!titles.has(title), `Duplicate title: ${title}`)
  assert.ok(!descriptions.has(description), `Duplicate description: ${url}`)
  titles.add(title)
  descriptions.add(description)
  assert.equal((title.match(/Intentional YT/g) || []).length <= 2, true)
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `Expected one H1: ${url}`)
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(head), `Indexable page has noindex: ${url}`)
  const canonical = [...head.matchAll(/<link rel="canonical" href="([^"]+)"/g)]
  assert.equal(canonical.length, 1, `Expected one canonical: ${url}`)
  assert.equal(normalized(canonical[0][1]), normalized(url), `Incorrect canonical: ${url}`)
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    assert.ok(head.includes(`property="${property}"`), `Missing ${property}: ${url}`)
  }
  assert.equal(normalized(head.match(/<meta property="og:url" content="([^"]+)"/)[1]), normalized(url))
  assert.ok(head.includes('name="twitter:image"'), `Missing Twitter image: ${url}`)
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(json)
  }
  for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"?#]+)[^"]*"/g)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    assert.ok(fs.existsSync(htmlPath(href)) || fs.existsSync(path.join('public', href)), `Broken local link ${href} on ${url}`)
  }
  for (const [, src] of html.matchAll(/<img\b[^>]*src="([^"]+)"/g)) {
    if (src.startsWith('/')) assert.ok(fs.existsSync(path.join('public', src)), `Missing image: ${src}`)
  }
  console.log(`PASS ${url.pathname}: title, description, canonical, H1, social tags, JSON-LD, local links and images`)
}
const home = fs.readFileSync(htmlPath('/'), 'utf8')
assert.equal((home.match(/<details class="faq-item"/g) || []).length, 5, 'FAQs must be present without JavaScript')
assert.ok(home.includes('No account needed'), 'Account requirements must be visible without JavaScript')
assert.ok(!/Intentional YT.*Intentional YT/.test(home.match(/<title>(.*?)<\/title>/)[1]), 'Homepage brand repeated')
const robots = fs.readFileSync(`${output}/robots.txt.body`, 'utf8')
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
assert.ok(!/Disallow:\s*\/uninstall/.test(robots), 'Allow crawlers to read uninstall noindex')
assert.ok(!urls.some(url => url.pathname.startsWith('/uninstall')))
assert.match(fs.readFileSync(htmlPath('/uninstall'), 'utf8'), /<meta name="robots" content="noindex/)
console.log(`SEO audit passed for ${urls.length} indexable pages; uninstall stays noindex.`)
