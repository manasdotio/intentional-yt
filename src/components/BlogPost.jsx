import React, { useEffect } from 'react'
import { getPostBySlug, renderMarkdown } from '../utils/posts'
import { updateMetaTags, resetMetaTags } from '../utils/seo'
import { APP_CONFIG } from '../config/constants'

export default function BlogPost({ slug, onNavigate }) {
  const post = getPostBySlug(slug)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (post) {
      const imageUrl = post.image 
        ? (post.image.startsWith('http') ? post.image : `https://www.intentionalyt.me${post.image.startsWith('/') ? '' : '/'}${post.image}`)
        : undefined

      updateMetaTags({
        title: post.title,
        description: post.description,
        url: `https://www.intentionalyt.me/blog/${post.slug}`,
        image: imageUrl
      })
    } else {
      updateMetaTags({
        title: 'Post Not Found',
        description: 'The requested article could not be found.'
      })
    }

    return () => {
      resetMetaTags()
    }
  }, [post, slug])

  const handleBlogClick = (e) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate('/blog')
    } else {
      window.history.pushState({}, '', '/blog')
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

  if (!post) {
    return (
      <div className="blog-page" style={{ maxWidth: '820px', margin: '0 auto', padding: '60px 0 100px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--text-primary)' }}>Article Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
          The article you are looking for does not exist or has been moved.
        </p>
        <a 
          href="/blog" 
          onClick={handleBlogClick}
          className="btn btn-primary"
        >
          <span>Return to Blog</span>
        </a>
      </div>
    )
  }

  const htmlContent = renderMarkdown(post.content)

  return (
    <article className="blog-article-wrap" style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <a 
          href="/blog" 
          onClick={handleBlogClick}
          className="btn btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 14px' }}
        >
          <span>← All Articles</span>
        </a>
        <a 
          href="/" 
          onClick={handleHomeClick}
          style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          Home
        </a>
        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>/</span>
        <a 
          href="/blog" 
          onClick={handleBlogClick}
          style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          Blog
        </a>
      </div>

      <header style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span className="brand-badge">
            {post.readTime}
          </span>
          {post.date && (
            <span style={{ fontSize: '13.5px', color: 'var(--text-tertiary)' }}>
              Published {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
          {post.author && (
            <span style={{ fontSize: '13.5px', color: 'var(--text-tertiary)' }}>
              • Written by {post.author}
            </span>
          )}
        </div>
      </header>

      {/* Rendered Markdown Body */}
      <div 
        className="blog-prose"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />

      {/* Author & Product CTA Box */}
      <div 
        className="table-card" 
        style={{ 
          marginTop: '60px', 
          padding: '36px', 
          borderLeft: '4px solid var(--accent-blue)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/icons/icon.svg" width="28" height="28" alt="Intentional YT Logo" />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Try Intentional YT
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.65', margin: 0 }}>
          Set a daily watch limit, hide distracting feeds, or use Focus Lock to add a cooldown before changing your settings. Intentional YT is free and open source under the MIT license, with no telemetry or paid features.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
          <a 
            href={APP_CONFIG.chromeWebStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: '13.5px', padding: '8px 16px' }}
          >
            <span>Chrome Web Store ↗</span>
          </a>
          <a 
            href={APP_CONFIG.edgeAddonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '13.5px', padding: '8px 16px' }}
          >
            <span>Edge Add-ons ↗</span>
          </a>
          <a 
            href={APP_CONFIG.firefoxAddonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '13.5px', padding: '8px 16px' }}
          >
            <span>Firefox Add-on ↗</span>
          </a>
          <a 
            href={APP_CONFIG.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '13.5px', padding: '8px 16px' }}
          >
            <span>View Source on GitHub ↗</span>
          </a>
        </div>
      </div>
    </article>
  )
}
