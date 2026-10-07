import Link from 'next/link'
import ProductArt from './ProductArt'

function topic(slug) {
  if (slug.includes('channels')) return ['filters', 'CHANNEL FILTERS']
  if (slug.includes('time-limit')) return ['time', 'DAILY LIMITS']
  if (slug.includes('-vs-')) return ['compare', 'COMPARISON']
  return ['feed', 'SHORTS & RECOMMENDATIONS']
}
export default function GuideCards({ posts }) {
  return <div className="visual-guide-grid">{posts.map(post => {
    const [kind, label] = topic(post.slug)
    return <article className="visual-guide-card" key={post.slug}>
      <Link className="guide-cover-link" href={'/blog/' + post.slug} aria-label={post.title}><ProductArt kind={kind} /></Link>
      <div className="guide-card-copy"><span className="visual-eyebrow">{label}</span><h3><Link href={'/blog/' + post.slug}>{post.title}</Link></h3><div className="guide-card-footer"><span>{post.readTime}</span><Link href={'/blog/' + post.slug}>Read guide <span aria-hidden="true">↗</span></Link></div></div>
    </article>
  })}</div>
}
