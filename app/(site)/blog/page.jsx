import { getAllPosts } from '@/src/utils/blog'
import Link from 'next/link'

export const metadata = {
  title: 'Blog & Essays',
  description: 'Articles, candid tool comparisons, and developer notes on building distraction-free YouTube focus tools.',
  alternates: {
    canonical: 'https://intentionalyt.me/blog'
  },
  openGraph: {
    type: 'website',
    url: 'https://intentionalyt.me/blog',
    title: 'Blog & Essays — Intentional YT',
    description: 'Articles, candid tool comparisons, and developer notes on building distraction-free YouTube focus tools.'
  }
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="blog-page" style={{ maxWidth: '880px', margin: '0 auto', padding: '40px 16px 80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link 
          href="/" 
          className="btn btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 14px' }}
        >
          <span>← Back to Home</span>
        </Link>
      </div>

      <div className="section-head" style={{ textAlign: 'left', marginBottom: '40px' }}>
        <div className="section-eyebrow">Blog &amp; Essays</div>
        <h1 className="section-title" style={{ fontSize: '36px', marginBottom: '12px' }}>
          Writing &amp; Comparisons
        </h1>
        <p className="section-desc" style={{ maxWidth: '100%', fontSize: '16px' }}>
          Unvarnished notes on digital habits, algorithmic friction, and open-source browser tools.
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
                <Link 
                  href={`/blog/${post.slug}`} 
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {post.title}
                </Link>
              </h2>

              {post.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.65', marginBottom: '18px' }}>
                  {post.description}
                </p>
              )}

              <div>
                <Link 
                  href={`/blog/${post.slug}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--accent-blue)', textDecoration: 'none' }}
                >
                  <span>Read article</span>
                  <span>→</span>
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
