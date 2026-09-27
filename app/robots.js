export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/uninstall']
    },
    sitemap: 'https://intentionalyt.me/sitemap.xml'
  }
}
