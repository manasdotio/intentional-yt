import Link from 'next/link'
import { getAllPosts } from '@/src/utils/blog'
import GuideCards from './GuideCards'
export default function Guides() {
  const posts = getAllPosts().filter(post => ['block-youtube-channels-from-search-results', 'set-youtube-daily-time-limit'].includes(post.slug))
  return <section className="visual-guides compact-guides" aria-labelledby="guides-title"><div className="visual-section-heading"><h2 id="guides-title" className="section-title">Need a hand setting up?</h2><Link href="/blog" className="visual-text-link">All guides ↗</Link></div><GuideCards posts={posts} /><p id="comparison" className="comparison-shortcut">Still choosing an extension? <Link href="/blog/intentional-yt-vs-unhook-vs-untrap">Compare Intentional YT, Unhook, and UnTrap.</Link></p></section>
}
