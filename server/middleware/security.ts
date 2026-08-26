export default defineEventHandler(event => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'X-Frame-Options', 'DENY')
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
  setHeader(event, 'X-Permitted-Cross-Domain-Policies', 'none')

  if (event.path.startsWith('/api/') || event.path === '/healthz' || event.path === '/readyz' || event.path === '/version') {
    setHeader(event, 'Cache-Control', 'no-store')
  }
})
