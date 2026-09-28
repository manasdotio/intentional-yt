import Link from 'next/link'
import { getAllPosts } from '@/src/utils/blog'

export default function Guides() {
  return (
    <section className="faq-section" aria-labelledby="guides-title">
      <div className="section-head">
        <h2 id="guides-title" className="section-title">Set up distraction-free YouTube</h2>
        <p className="section-desc">Choose the controls that fit your study or work routine.</p>
      </div>
      <div className="faq-grid">
        {getAllPosts().map(post => (
          <article className="table-card blog-card" key={post.slug}>
            <h3><Link href={'/blog/' + post.slug}>{post.title}</Link></h3>
            <p>{post.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
