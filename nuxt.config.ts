export default defineNuxtConfig({
  compatibilityDate: '2026-08-26',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'theme-color', content: '#07111f' },
        { name: 'color-scheme', content: 'light dark' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/favicon.svg' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },
  runtimeConfig: {
    middlewareBaseUrl: '',
    middlewareServiceToken: '',
    devFormSinkEnabled: false,
    public: {
      siteUrl: 'https://telnexa.co',
      apiBase: '/api',
      portalUrl: 'https://app.telnexa.co',
      statusUrl: 'https://status.telnexa.co',
      gtmId: '',
      environment: 'development',
      releaseSha: 'development'
    }
  },
  routeRules: {
    '/': { prerender: true },
    '/es': { prerender: true },
    '/voice/**': { prerender: true },
    '/messaging/**': { prerender: true },
    '/email/**': { prerender: true },
    '/crm/**': { prerender: true },
    '/automation/**': { prerender: true },
    '/platform/**': { prerender: true },
    '/solutions/**': { prerender: true },
    '/developers/**': { prerender: true },
    '/integrations/**': { prerender: true },
    '/resources/**': { swr: 300 },
    '/legal/**': { prerender: true },
    '/login': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/signup': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/portal': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/support': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/request-quote': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/schedule-demo': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/port-number': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/es/**': { prerender: true }
  },
  nitro: {
    preset: 'node-server',
    compressPublicAssets: true,
    minify: true
  },
  typescript: {
    strict: true,
    typeCheck: false
  }
})
