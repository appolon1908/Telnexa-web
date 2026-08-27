import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const formBoundary = await readFile(new URL('../../server/utils/websiteForms.ts', import.meta.url), 'utf8')
const onboardingBoundary = await readFile(new URL('../../server/utils/complianceOnboarding.ts', import.meta.url), 'utf8')
const formComponent = await readFile(new URL('../../app/components/LeadForm.vue', import.meta.url), 'utf8')
const onboardingComponent = await readFile(new URL('../../app/components/ComplianceOnboarding.vue', import.meta.url), 'utf8')
const config = await readFile(new URL('../../nuxt.config.ts', import.meta.url), 'utf8')

test('browser submissions use same-origin website APIs', () => {
  assert.match(formComponent, /contract\.value\.endpoint/)
  assert.match(onboardingComponent, /\/api\/v1\/website\/onboarding\/compliance/)
  assert.doesNotMatch(formComponent, /https?:\/\/.*(?:odoo|n8n|jasmin|postal)/i)
  assert.doesNotMatch(onboardingComponent, /https?:\/\/.*(?:odoo|n8n|jasmin|postal)/i)
})

test('server form boundary requires idempotency, actual byte limits, and fail-closed delivery', () => {
  assert.match(formBoundary, /Idempotency-Key/)
  assert.match(formBoundary, /X-Request-ID/)
  assert.match(formBoundary, /statusCode: 503/)
  assert.match(formBoundary, /environment !== 'production'/)
  assert.match(formBoundary, /readRawBody/)
  assert.match(formBoundary, /Buffer\.byteLength/)
})

test('compliance onboarding cannot activate or automatically provision a service', () => {
  assert.match(onboardingBoundary, /activationAllowed: false/)
  assert.match(onboardingBoundary, /manualReviewRequired: true/)
  assert.match(onboardingBoundary, /activationRequested !== false/)
  assert.match(onboardingBoundary, /completedSteps/)
  assert.match(onboardingBoundary, /policyAcceptances/)
  assert.match(onboardingBoundary, /retry: 0/)
  assert.match(onboardingBoundary, /environment === 'production'/)
})

test('live provider capabilities are not present in public runtime config', () => {
  assert.doesNotMatch(config, /LIVE_SMS_DELIVERY\s*:\s*true/)
  assert.doesNotMatch(config, /LIVE_EMAIL_DELIVERY\s*:\s*true/)
  assert.doesNotMatch(config, /LIVE_PSTN_DIALING\s*:\s*true/)
  assert.doesNotMatch(config, /ENABLE_AUTOMATIC_PROVISIONING\s*:\s*true/)
})
