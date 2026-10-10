import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false
})

marked.use({
  renderer: {
    image(token) {
      const href = (typeof token === 'object' && token.href) ? token.href : (token || '')
      const title = (typeof token === 'object' && token.title) ? token.title : ''
      const text = (typeof token === 'object' && token.text) ? token.text : ''
      const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const dimensions = ['/screenshots/focus-lock-cooldown.webp', '/screenshots/scheduled-blocking-setup.webp'].includes(href)
        ? ' width="1280" height="800"'
        : ['/screenshots/channel-keyword-filters.webp', '/screenshots/product-overview.webp', '/screenshots/product-limits.webp'].includes(href) ? ' width="1080" height="1060"' : ''
      const captionHtml = title ? `<figcaption class="blog-caption">${escape(title)}</figcaption>` : ''
      return `<figure class="blog-figure"><img src="${escape(href)}" alt="${escape(text)}"${dimensions} loading="lazy" decoding="async" class="blog-post-img" />${captionHtml}</figure>`
    },
    table(token) {
      const header = token.header ? token.header.map(cell => `<th>${this.parser.parseInline(cell.tokens)}</th>`).join('') : ''
      const rows = token.rows ? token.rows.map(row => `<tr>${row.map(cell => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`).join('') : ''
      return `<div class="blog-table-container"><table class="comp-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`
    }
  }
})

const POSTS_DIR = path.join(process.cwd(), 'src', 'posts')

/**
 * Returns all blog posts parsed from markdown, sorted newest first
 */
export function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'))

  const posts = files.map(filename => {
    const filePath = path.join(POSTS_DIR, filename)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContent)

    const fileSlug = filename.replace(/\.md$/, '')
    const slug = data.slug || fileSlug
    const title = data.title || fileSlug.replace(/-/g, ' ')
    const date = data.date || ''
    const modified = data.modified || ''
    const author = data.author || 'Manas'
    const description = data.description || ''
    const image = data.image || '/screenshots/og-intentional-yt-vs-unhook-vs-untrap.png'

    // Clean body if "Meta description:" line exists at top of content
    const cleanContent = content.replace(/^\s*Meta description:\s*[^\r\n]+[\r\n]*/i, '').trim()

    const words = cleanContent.split(/\s+/).filter(Boolean).length
    const readTime = data.readTime || `${Math.max(1, Math.ceil(words / 200))} min read`

    return {
      slug,
      title,
      date,
      modified,
      author,
      description,
      readTime,
      image,
      wordCount: words,
      content: cleanContent
    }
  })

  return posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

/**
 * Returns a single post by slug, including parsed HTML
 */
export function getPostBySlug(slug) {
  const posts = getAllPosts()
  const post = posts.find(p => p.slug === slug)
  if (!post) return null

  const htmlContent = marked.parse(post.content)
  return {
    ...post,
    htmlContent
  }
}
