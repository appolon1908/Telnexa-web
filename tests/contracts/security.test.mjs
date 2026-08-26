import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const formBoundary = await readFile(new URL('../../server/utils/websiteForms.ts', import.meta.url), 'utf8')
const formComponent = await readFile(new URL('../../app/components/LeadForm.vue', import.meta.url), 'utf8')
const config = await readFile(new URL('../../nuxt.config.ts', import.meta.url), 'utf8')

test('browser submissions use same-origin website APIs', () => {
  assert.match(formComponent, /contract\.value\.endpoint/)
  assert.doesNotMatch(formComponent, /odoo|n8n|jasmin|postal/i)
})

test('server form boundary requires idempotency and fails closed', () => {
  assert.match(formBoundary, /Idempotency-Key/)
  assert.match(formBoundary, /X-Request-ID/)
  assert.match(formBoundary, /statusCode: 503/)
  assert.match(formBoundary, /environment !== 'production'/)
})

test('live provider capabilities are not present in public runtime config', () => {
  assert.doesNotMatch(config, /LIVE_SMS_DELIVERY\s*:\s*true/)
  assert.doesNotMatch(config, /LIVE_EMAIL_DELIVERY\s*:\s*true/)
  assert.doesNotMatch(config, /LIVE_PSTN_DIALING\s*:\s*true/)
})
