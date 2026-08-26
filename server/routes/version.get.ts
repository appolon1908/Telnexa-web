export default defineEventHandler(event => {
  const config = useRuntimeConfig(event)
  return {
    service: 'telnexa-web',
    version: '1.0.0',
    releaseSha: String(config.public.releaseSha),
    environment: String(config.public.environment)
  }
})
