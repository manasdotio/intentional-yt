import { getAllPosts } from '@/src/utils/blog'
import { SITE_URL } from '@/src/config/seo'

export default function sitemap() {
  // Builds are not content updates. Only use actual editorial dates.
  return [
    { url: SITE_URL + '/' },
    { url: SITE_URL + '/blog' },
    ...getAllPosts().map(post => ({
      url: SITE_URL + '/blog/' + post.slug,
      ...(post.modified || post.date ? { lastModified: post.modified || post.date } : {})
    })),
    { url: SITE_URL + '/privacy' }
  ]
}
