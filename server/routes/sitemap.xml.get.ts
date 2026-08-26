import pageManifest from '../../manifests/pages.json'

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  const baseUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const entries = (pageManifest.pages as Array<{ path: string; indexable: boolean }>)
    .filter(page => page.indexable)
    .flatMap(page => {
      const en = `${baseUrl}${page.path}`
      const es = `${baseUrl}${page.path === '/' ? '/es' : `/es${page.path}`}`
      const alternates = `<xhtml:link rel="alternate" hreflang="en" href="${xml(en)}"/><xhtml:link rel="alternate" hreflang="es" href="${xml(es)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${xml(en)}"/>`
      return [
        `<url><loc>${xml(en)}</loc>${alternates}<changefreq>weekly</changefreq><priority>${page.path === '/' ? '1.0' : '0.7'}</priority></url>`,
        `<url><loc>${xml(es)}</loc>${alternates}<changefreq>weekly</changefreq><priority>${page.path === '/' ? '0.9' : '0.6'}</priority></url>`
      ]
    })

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=3600')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`
})
