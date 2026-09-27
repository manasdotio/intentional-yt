import { marked } from 'marked'

/**
 * Configure marked for clean GFM parsing with lazy loading images and responsive tables
 */
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
      const captionHtml = title ? `<figcaption class="blog-caption">${title}</figcaption>` : ''
      return `<figure class="blog-figure"><img src="${href}" alt="${text}" loading="lazy" decoding="async" class="blog-post-img" />${captionHtml}</figure>`
    },
    table(token) {
      const header = token.header ? token.header.map(cell => `<th>${this.parser.parseInline(cell.tokens)}</th>`).join('') : ''
      const rows = token.rows ? token.rows.map(row => `<tr>${row.map(cell => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`).join('') : ''
      return `<div class="blog-table-container"><table class="comp-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`
    }
  }
})

/**
 * Parse frontmatter and content from raw markdown string
 */
export function parseMarkdown(rawContent) {
  let frontmatter = {}
  let content = rawContent || ''

  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3)
    if (end !== -1) {
      const yaml = content.slice(3, end).trim()
      content = content.slice(end + 3).trim()
      yaml.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':')
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim()
          let val = line.slice(colonIdx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          frontmatter[key] = val
        }
      })
    }
  }

  // If there's a standalone "Meta description: ..." line at the top of the body, extract it if needed and remove from body
  const metaDescMatch = content.match(/^Meta description:\s*([^\n]+)\n*/i)
  if (metaDescMatch) {
    if (!frontmatter.description) {
      frontmatter.description = metaDescMatch[1].trim()
    }
    content = content.replace(/^Meta description:\s*[^\n]+\n*/i, '').trim()
  }

  return { frontmatter, content }
}

/**
 * Load all posts dynamically from src/posts/*.md
 */
export function getAllPosts() {
  const postFiles = import.meta.glob('../posts/*.md', { query: '?raw', eager: true })

  const posts = Object.entries(postFiles).map(([filepath, mod]) => {
    const raw = typeof mod === 'string' ? mod : (mod?.default || '')
    const { frontmatter, content } = parseMarkdown(raw)

    const fileSlug = filepath.split('/').pop().replace(/\.md$/, '')
    const slug = frontmatter.slug || fileSlug
    const title = frontmatter.title || fileSlug.replace(/-/g, ' ')
    const date = frontmatter.date || ''
    const author = frontmatter.author || 'Manas'
    const description = frontmatter.description || ''
    const image = frontmatter.image || '/screenshots/og-intentional-yt-vs-unhook-vs-untrap.png'

    // Calculate reading time if not explicitly provided
    const words = content.split(/\s+/).filter(Boolean).length
    const readTime = frontmatter.readTime || `${Math.max(1, Math.ceil(words / 200))} min read`

    return {
      slug,
      title,
      date,
      author,
      description,
      readTime,
      image,
      wordCount: words,
      content,
      raw
    }
  })

  // Sort newest first
  return posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug) {
  const posts = getAllPosts()
  return posts.find(p => p.slug === slug) || null
}

/**
 * Render markdown string to HTML
 */
export function renderMarkdown(markdownText) {
  return marked.parse(markdownText || '')
}
