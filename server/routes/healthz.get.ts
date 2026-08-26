export default defineEventHandler(() => ({
  status: 'ok',
  service: 'telnexa-web',
  timestamp: new Date().toISOString()
}))
