export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  const baseUrl = String(config.public.siteUrl).replace(/\/$/, '')
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=3600')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /login',
    'Disallow: /signup',
    'Disallow: /portal',
    'Disallow: /support',
    'Disallow: /port-number',
    'Disallow: /request-quote',
    'Disallow: /schedule-demo',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join('\n')
})
