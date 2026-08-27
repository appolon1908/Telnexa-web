import { readFile } from 'node:fs/promises'
import process from 'node:process'

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const pages = JSON.parse(await readFile(new URL('../manifests/pages.json', import.meta.url), 'utf8'))
const forms = JSON.parse(await readFile(new URL('../manifests/forms.json', import.meta.url), 'utf8'))
const onboarding = JSON.parse(await readFile(new URL('../manifests/onboarding-gates.json', import.meta.url), 'utf8'))
const legal = JSON.parse(await readFile(new URL('../manifests/legal-documents.json', import.meta.url), 'utf8'))

async function expectOk(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' })
  if (!response.ok) throw new Error(`${path} returned ${response.status}`)
  return response
}

await expectOk('/healthz')
await expectOk('/version')

const routeChecks = pages.pages.flatMap(page => [
  { path: page.path, indexable: page.indexable },
  { path: page.path === '/' ? '/es' : `/es${page.path}`, indexable: page.indexable }
])
for (const route of routeChecks) {
  const response = await expectOk(route.path)
  const html = await response.text()
  if (route.indexable && !html.includes('Telnexa')) {
    throw new Error(`${route.path} did not render Telnexa content`)
  }
  if (!route.indexable) {
    const robotsHeader = response.headers.get('x-robots-tag') || ''
    const robotsMeta = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)
    if (!robotsHeader.toLowerCase().includes('noindex') && !robotsMeta) {
      throw new Error(`${route.path} is a utility route without noindex`)
    }
  }
}

const sitemapResponse = await expectOk('/sitemap.xml')
const sitemap = await sitemapResponse.text()
const sitemapCount = (sitemap.match(/<url>/g) || []).length
const expectedSitemapCount = pages.pages.filter(page => page.indexable).length * 2
if (sitemapCount !== expectedSitemapCount) {
  throw new Error(`Expected ${expectedSitemapCount} sitemap URLs, found ${sitemapCount}`)
}

const examples = {
  name: 'Contract Test',
  email: 'contract-test@example.com',
  company: 'Telnexa Test Company',
  message: 'Isolated contract smoke test',
  products: 'Voice, SMS, and CRM',
  employees: '11–50',
  partnerType: 'Technology partner',
  useCase: 'Integrate customer notifications',
  workflow: 'Route qualified website leads',
  requirements: 'Private multi-tenant communications workspace',
  systems: 'Odoo and n8n',
  numberCount: '1–10',
  subject: 'Contract smoke test',
  requestType: 'Access',
  jurisdiction: 'Dominican Republic',
  details: 'Please provide the data associated with this test identity.'
}

for (const form of forms.forms) {
  const body = Object.fromEntries(form.required.map(field => [field, examples[field] || `Test ${field}`]))
  body.sourcePage = '/contract-smoke'
  body.locale = 'en'
  body.consent = { privacyAccepted: true, marketingAccepted: false }

  const id = crypto.randomUUID()
  const response = await fetch(`${baseUrl}${form.endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': id,
      'X-Request-ID': id
    },
    body: JSON.stringify(body)
  })

  if (response.status !== 202) {
    throw new Error(`${form.key} returned ${response.status}: ${await response.text()}`)
  }
  const result = await response.json()
  if (!result.accepted || !result.requestId) throw new Error(`${form.key} returned an invalid acceptance envelope`)
}

const selectedServices = onboarding.services.map(service => service.key)
const applicableSteps = onboarding.steps.filter(step =>
  step.requiredFor.includes('all') ||
  step.requiredFor.some(service => selectedServices.includes(service))
)
const answers = {}
const acknowledgments = {}
for (const step of applicableSteps) {
  for (const field of step.fields || []) {
    if (field.key === 'services') answers[field.key] = selectedServices
    else if (field.type === 'multiselect') answers[field.key] = [field.options?.[0]?.value || 'test']
    else if (field.type === 'select') answers[field.key] = field.options?.[0]?.value || 'test'
    else if (field.type === 'email') answers[field.key] = 'compliance-test@example.com'
    else if (field.type === 'url') answers[field.key] = 'https://example.com/evidence'
    else if (field.type === 'tel') answers[field.key] = '+15555550100'
    else if (field.type === 'number') answers[field.key] = 100
    else answers[field.key] = `Contract test ${field.key}`
  }
  for (const item of step.acknowledgments || []) acknowledgments[item.key] = true
}

const requiredDocumentKeys = new Set(['terms', 'privacy', 'acceptable-use'])
for (const service of onboarding.services) {
  for (const key of service.requiredDocuments) requiredDocumentKeys.add(key)
}
const policyAcceptances = [...requiredDocumentKeys].map(key => {
  const document = legal.documents.find(item => item.key === key)
  if (!document) throw new Error(`Missing legal document ${key}`)
  return {
    key,
    version: document.version,
    statusAtAcceptance: document.status,
    accepted: true,
    acceptedAt: new Date().toISOString()
  }
})

const onboardingId = crypto.randomUUID()
const onboardingResponse = await fetch(`${baseUrl}${onboarding.submissionEndpoint}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': onboardingId,
    'X-Request-ID': onboardingId
  },
  body: JSON.stringify({
    schemaVersion: '1.0',
    selectedServices,
    answers,
    acknowledgments,
    policyAcceptances,
    completedSteps: applicableSteps.filter(step => !['overview', 'submitted'].includes(step.kind)).map(step => step.key),
    locale: 'en',
    sourcePage: '/contract-smoke',
    activationRequested: false
  })
})
if (onboardingResponse.status !== 202) {
  throw new Error(`compliance onboarding returned ${onboardingResponse.status}: ${await onboardingResponse.text()}`)
}
const onboardingResult = await onboardingResponse.json()
if (!onboardingResult.accepted || !onboardingResult.requestId || onboardingResult.activationAllowed !== false) {
  throw new Error('Compliance onboarding returned an unsafe or invalid acceptance envelope')
}

console.log(JSON.stringify({
  status: 'pass',
  routeChecks: routeChecks.length,
  sitemapUrls: sitemapCount,
  formChecks: forms.forms.length,
  onboardingChecks: 1,
  liveActivationAllowed: false
}, null, 2))
