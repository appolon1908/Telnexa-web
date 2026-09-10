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
      portalUrl: 'https://api.telnexa.co/dashboard',
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
    '/legal': { prerender: true },
    '/legal/**': { prerender: true },
    '/wholesale': { prerender: true },

    '/login': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/signup': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/portal': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/support': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/request-quote': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/schedule-demo': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/port-number': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/privacy-request': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/do-not-sell-or-share': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/cookie-settings': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/get-started': { prerender: true, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/get-started/**': { prerender: true, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },

    '/es/login': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/signup': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/portal': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/support': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/request-quote': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/schedule-demo': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/port-number': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/privacy-request': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/do-not-sell-or-share': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/cookie-settings': { headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/get-started': { prerender: true, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
    '/es/get-started/**': { prerender: true, headers: { 'x-robots-tag': 'noindex, nofollow, noarchive' } },
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
