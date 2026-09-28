export default function robots() {
  return {
    rules: {
      userAgent: '*',
      // Crawlers must fetch /uninstall to see its noindex directive.
      allow: '/'
    },
    sitemap: 'https://www.intentionalyt.me/sitemap.xml'
  }
}
