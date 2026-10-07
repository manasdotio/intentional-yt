import { pageMetadata } from '@/src/config/seo'
import { getAllPosts } from '@/src/utils/blog'
import GuideCards from '@/src/components/GuideCards'
import Link from 'next/link'
export const metadata = pageMetadata({ title: 'YouTube Focus Guides & Extension Comparisons', description: 'Learn how to hide YouTube Shorts, remove recommendations, and set daily watch limits. Practical setup guides and browser extension comparisons.', path: '/blog' })
export default function BlogIndexPage() {
  return <div className="visual-blog-page"><Link href="/" className="visual-text-link">← Back to home</Link><div className="section-head"><h1 className="section-title">Make YouTube work for you.</h1><p className="section-desc">Help with hiding distractions, setting watch limits, and choosing an extension.</p></div><GuideCards posts={getAllPosts()} /></div>
}
