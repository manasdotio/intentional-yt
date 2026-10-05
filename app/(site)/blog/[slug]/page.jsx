import { getAllPosts, getPostBySlug } from '@/src/utils/blog'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { APP_CONFIG } from '@/src/config/constants'
import { serializeJsonLd } from '@/src/config/seo'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) {
    return { title: 'Post Not Found' }
  }

  const ogImage = post.image.startsWith('http')
    ? post.image
    : `https://www.intentionalyt.me${post.image.startsWith('/') ? '' : '/'}${post.image}`
  const titleIncludesBrand = post.title.includes('Intentional YT')
  const socialTitle = titleIncludesBrand ? post.title : `${post.title} — Intentional YT`

  return {
    title: titleIncludesBrand ? { absolute: post.title } : post.title,
    description: post.description,
    alternates: {
      canonical: `https://www.intentionalyt.me/blog/${post.slug}`
    },
    openGraph: {
      type: 'article',
      url: `https://www.intentionalyt.me/blog/${post.slug}`,
      title: socialTitle,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.modified || post.date,
      siteName: 'Intentional YT',
      authors: [post.author],
      images: [
        {
          url: ogImage,
          alt: post.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: post.description,
      images: [ogImage]
    }
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.modified || post.date,
    author: {
      '@type': 'Person',
      name: post.author,
      url: 'https://github.com/manasdotio'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Intentional YT',
      url: 'https://www.intentionalyt.me'
    },
    image: post.image.startsWith('http')
      ? post.image
      : `https://www.intentionalyt.me${post.image.startsWith('/') ? '' : '/'}${post.image}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.intentionalyt.me/blog/${post.slug}`
    }
  }

  return (
    <article className="blog-article-wrap" style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 16px 80px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([articleSchema, {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.intentionalyt.me/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.intentionalyt.me/blog' },
            { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.intentionalyt.me/blog/${post.slug}` }
          ]
        }]) }}
      />

      {/* Navigation Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <Link 
          href="/blog" 
          className="btn btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 14px' }}
        >
          <span>← All Articles</span>
        </Link>
        <Link 
          href="/" 
          style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          Home
        </Link>
        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>/</span>
        <Link 
          href="/blog" 
          style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          Blog
        </Link>
        <span aria-current="page" style={{ fontSize: '13px' }}>{post.title}</span>
      </nav>

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
          {post.modified && <time dateTime={post.modified} style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Updated {post.modified}</time>}
        </div>
      </header>

      {/* Rendered Markdown Body */}
      <div 
        className="blog-prose"
        dangerouslySetInnerHTML={{ __html: post.htmlContent }} 
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
          Set a daily watch limit, hide distracting feeds, or use Focus Lock to add a cooldown before changing your settings. Your settings and watch-time counters stay in your browser, with no extension telemetry.
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
        </div>
      </div>
    </article>
  )
}
