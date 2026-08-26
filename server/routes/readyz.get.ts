export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  const production = String(config.public.environment) === 'production'
  const formsReady = Boolean(config.middlewareBaseUrl)

  if (production && !formsReady) {
    setResponseStatus(event, 503)
  }

  return {
    status: production && !formsReady ? 'not_ready' : 'ready',
    service: 'telnexa-web',
    checks: {
      application: true,
      forms: formsReady
    }
  }
})
