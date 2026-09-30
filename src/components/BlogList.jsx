import React, { useEffect } from 'react'
import { getAllPosts } from '../utils/posts'
import { updateMetaTags } from '../utils/seo'

export default function BlogList({ onNavigate }) {
  const posts = getAllPosts()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    updateMetaTags({
      title: 'Blog',
      description: 'Articles, candid tool comparisons, and developer notes on building distraction-free YouTube focus tools.',
      url: 'https://www.intentionalyt.me/blog'
    })
  }, [])

  const handlePostClick = (e, slug) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(`/blog/${slug}`)
    } else {
      window.history.pushState({}, '', `/blog/${slug}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  const handleHomeClick = (e) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate('/')
    } else {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <div className="blog-page" style={{ maxWidth: '880px', margin: '0 auto', padding: '40px 0 80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <a 
          href="/" 
          onClick={handleHomeClick}
          className="btn btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 14px' }}
        >
          <span>← Back to Home</span>
        </a>
      </div>

      <div className="section-head" style={{ textAlign: 'left', marginBottom: '40px' }}>
        <div className="section-eyebrow">Blog &amp; Essays</div>
        <h1 className="section-title" style={{ fontSize: '36px', marginBottom: '12px' }}>
          Writing &amp; Comparisons
        </h1>
        <p className="section-desc" style={{ maxWidth: '100%', fontSize: '16px' }}>
          Guides to managing YouTube watch time, comparisons of browser extensions, and notes on building Intentional YT.
        </p>
      </div>

      <div className="blog-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {posts.length === 0 ? (
          <div className="table-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No posts found yet. Check back soon!
          </div>
        ) : (
          posts.map((post) => (
            <article 
              key={post.slug}
              className="table-card blog-card" 
              style={{ 
                padding: '32px', 
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={(e) => handlePostClick(e, post.slug)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span className="brand-badge" style={{ fontSize: '12px' }}>
                  {post.readTime}
                </span>
                {post.date && (
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
                {post.author && (
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    • By {post.author}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                <a 
                  href={`/blog/${post.slug}`} 
                  onClick={(e) => handlePostClick(e, post.slug)}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {post.title}
                </a>
              </h2>

              {post.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.65', marginBottom: '18px' }}>
                  {post.description}
                </p>
              )}

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--accent-blue)' }}>
                <span>Read article</span>
                <span>→</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
