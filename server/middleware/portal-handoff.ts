const PORTAL_HANDOFF_ROUTES = new Set([
  '/login',
  '/signup',
  '/portal',
  '/es/login',
  '/es/signup',
  '/es/portal'
])

export default defineEventHandler((event) => {
  const requestedPath = getRequestURL(event).pathname.replace(/\/+$/, '') || '/'
  if (!PORTAL_HANDOFF_ROUTES.has(requestedPath)) return

  const config = useRuntimeConfig(event)
  const portalUrl = String(config.public.portalUrl)
  if (!portalUrl.startsWith('https://')) {
    throw createError({ statusCode: 503, statusMessage: 'Client portal is not configured' })
  }

  return sendRedirect(event, portalUrl, 302)
})
