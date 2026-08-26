import { readFile } from 'node:fs/promises'
import process from 'node:process'

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const pages = JSON.parse(await readFile(new URL('../manifests/pages.json', import.meta.url), 'utf8'))
const forms = JSON.parse(await readFile(new URL('../manifests/forms.json', import.meta.url), 'utf8'))

async function expectOk(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' })
  if (!response.ok) throw new Error(`${path} returned ${response.status}`)
  return response
}

await expectOk('/healthz')
await expectOk('/version')

const routeChecks = [
  ...pages.pages.map(page => page.path),
  ...pages.pages.filter(page => page.indexable).map(page => page.path === '/' ? '/es' : `/es${page.path}`)
]
for (const path of routeChecks) {
  const response = await expectOk(path)
  const html = await response.text()
  if (!html.includes('Telnexa')) throw new Error(`${path} did not render Telnexa content`)
}

const sitemapResponse = await expectOk('/sitemap.xml')
const sitemap = await sitemapResponse.text()
const sitemapCount = (sitemap.match(/<url>/g) || []).length
if (sitemapCount !== 122) throw new Error(`Expected 122 sitemap URLs, found ${sitemapCount}`)

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
  subject: 'Contract smoke test'
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

console.log(JSON.stringify({
  status: 'pass',
  routeChecks: routeChecks.length,
  sitemapUrls: sitemapCount,
  formChecks: forms.forms.length
}, null, 2))
