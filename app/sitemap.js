import { getAllPosts } from '@/src/utils/blog'
import { SITE_URL } from '@/src/config/seo'

export default function sitemap() {
  const posts = getAllPosts()
  const latestPostDate = posts
    .map(post => post.modified || post.date)
    .filter(Boolean)
    .sort()
    .at(-1)
  // Builds are not content updates. Only use actual editorial dates.
  return [
    { url: SITE_URL + '/' },
    {
      url: SITE_URL + '/blog',
      ...(latestPostDate ? { lastModified: latestPostDate } : {})
    },
    ...posts.map(post => ({
      url: SITE_URL + '/blog/' + post.slug,
      ...(post.modified || post.date ? { lastModified: post.modified || post.date } : {})
    })),
    { url: SITE_URL + '/privacy' }
  ]
}
