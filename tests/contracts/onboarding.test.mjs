import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const onboarding = JSON.parse(await readFile(new URL('../../manifests/onboarding-gates.json', import.meta.url), 'utf8'))
const legal = JSON.parse(await readFile(new URL('../../manifests/legal-documents.json', import.meta.url), 'utf8'))

test('onboarding covers SMS, business VoIP, AI voice, and wholesale', () => {
  assert.deepEqual(
    onboarding.services.map(service => service.key),
    ['sms', 'business-voip', 'ai-voice', 'wholesale']
  )
  assert.equal(onboarding.steps.length, 25)
})

test('each service has all required pages and policy acceptances', () => {
  const steps = new Set(onboarding.steps.map(step => step.key))
  const documents = new Map(legal.documents.map(document => [document.key, document]))

  const serviceSteps = {
    sms: ['sms-overview', 'sms-use-case', 'sms-consent', 'sms-sender-registration'],
    'business-voip': ['voice-overview', 'voice-use-case', 'voice-emergency-services', 'voice-caller-id', 'voice-call-recording'],
    'ai-voice': ['ai-voice-overview', 'ai-voice-use-case', 'ai-voice-disclosure', 'ai-voice-consent', 'voice-call-recording'],
    wholesale: ['wholesale-overview', 'wholesale-business', 'wholesale-downstream', 'wholesale-traffic', 'wholesale-robocall']
  }

  for (const [service, requiredSteps] of Object.entries(serviceSteps)) {
    for (const key of requiredSteps) assert.ok(steps.has(key), `${service} missing ${key}`)
    const config = onboarding.services.find(item => item.key === service)
    assert.ok(config.requiredDocuments.length >= 4)
    for (const key of config.requiredDocuments) {
      assert.equal(documents.get(key)?.acceptanceRequired, true, `${service} policy ${key} must require acceptance`)
    }
  }
})

test('shared gates require business verification, privacy, agreements, review, and manual submission', () => {
  const keys = new Set(onboarding.steps.map(step => step.key))
  for (const key of ['business-verification', 'service-selection', 'privacy-data', 'agreements', 'review', 'submitted']) {
    assert.ok(keys.has(key))
  }
  assert.equal(onboarding.activationGate.manualReviewRequired, true)
  assert.equal(onboarding.activationGate.activationAllowedOnSubmission, false)
  assert.equal(onboarding.activationGate.approvedDoesNotAutoProvision, true)
})

test('every live capability remains false', () => {
  for (const [key, value] of Object.entries(onboarding.activationGate.capabilityFlags)) {
    assert.equal(value, false, key)
  }
})
