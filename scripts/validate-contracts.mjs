import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'
import process from 'node:process'

const root = fileURLToPath(new URL('../', import.meta.url))
const pages = JSON.parse(await readFile(join(root, 'manifests/pages.json'), 'utf8'))
const forms = JSON.parse(await readFile(join(root, 'manifests/forms.json'), 'utf8'))
const onboarding = JSON.parse(await readFile(join(root, 'manifests/onboarding-gates.json'), 'utf8'))
const errors = []

function check(condition, message) {
  if (!condition) errors.push(message)
}

const featureCategories = new Set(['voice', 'messaging', 'email', 'crm', 'automation', 'private-platform'])
const indexablePages = pages.pages.filter(page => page.indexable)
const featurePages = pages.pages.filter(page => featureCategories.has(page.category))

check(pages.pages.length === pages.baseRouteCount, `Manifest baseRouteCount=${pages.baseRouteCount}, actual=${pages.pages.length}`)
check(indexablePages.length === pages.indexableBaseRouteCount, `Manifest indexableBaseRouteCount=${pages.indexableBaseRouteCount}, actual=${indexablePages.length}`)
check(featurePages.length === pages.featurePageCount, `Manifest featurePageCount=${pages.featurePageCount}, actual=${featurePages.length}`)
check(forms.forms.length >= 14, `Expected at least 14 forms, found ${forms.forms.length}`)
check(indexablePages.length * 2 === 156, `Expected 156 localized indexable URLs, found ${indexablePages.length * 2}`)

const routeSet = new Set()
for (const page of pages.pages) {
  check(typeof page.path === 'string' && page.path.startsWith('/'), `Invalid route path: ${page.path}`)
  check(!routeSet.has(page.path), `Duplicate route: ${page.path}`)
  routeSet.add(page.path)
  check(Boolean(page.title), `Missing title: ${page.path}`)
}

const formSet = new Set(forms.forms.map(form => form.key))
check(formSet.size === forms.forms.length, 'Form keys must be unique')
for (const page of pages.pages) {
  if (page.form) check(formSet.has(page.form), `Page ${page.path} references unknown form ${page.form}`)
}
for (const form of forms.forms) {
  check(form.endpoint.startsWith('/api/v1/website/'), `Form ${form.key} has invalid endpoint`)
  check(Array.isArray(form.required) && form.required.includes('email'), `Form ${form.key} must require email`)
}

const expectedUtilityRoutes = [
  '/login', '/signup', '/portal', '/support', '/port-number', '/request-quote', '/schedule-demo',
  '/privacy-request', '/do-not-sell-or-share', '/cookie-settings'
]
for (const path of expectedUtilityRoutes) {
  check(pages.pages.some(page => page.path === path && page.indexable === false), `Utility route ${path} must be noindex`)
}
for (const step of onboarding.steps) {
  check(pages.pages.some(page => page.path === step.path && page.indexable === false), `Onboarding route ${step.path} must be noindex`)
}
check(pages.pages.some(page => page.path === '/voice/ai-voice' && page.indexable), 'AI voice product page is required')
check(pages.pages.some(page => page.path === '/wholesale' && page.indexable), 'Wholesale product page is required')

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(full))
    else if (/\.(vue|ts|mjs|json|md|yml|yaml)$/.test(entry.name)) files.push(full)
  }
  return files
}

const files = [
  ...await sourceFiles(join(root, 'app')),
  ...await sourceFiles(join(root, 'server'))
]
for (const file of files) {
  const content = await readFile(file, 'utf8')
  const name = relative(root, file)
  check(!/href=["']#["']/.test(content), `${name} contains a dead # link`)
  check(!/javascript:/i.test(content), `${name} contains a javascript URL`)
  check(!/https?:\/\/(?:[^/]*\.)?(?:odoo|n8n)\./i.test(content), `${name} exposes a direct Odoo or n8n browser URL`)
}

const formBoundary = await readFile(join(root, 'server/utils/websiteForms.ts'), 'utf8')
check(formBoundary.includes('statusCode: 503'), 'Form boundary must fail closed when delivery is unavailable')
check(formBoundary.includes('Idempotency-Key'), 'Form boundary must propagate idempotency')
check(formBoundary.includes('X-Request-ID'), 'Form boundary must propagate request identity')
check(formBoundary.includes('readRawBody'), 'Form boundary must measure the actual request body')
check(formBoundary.includes('Buffer.byteLength'), 'Form boundary must enforce an actual byte limit')
check(
  !formBoundary.includes('simulation: true') || formBoundary.includes("environment !== 'production'"),
  'Simulation sink must be impossible in production'
)

const onboardingBoundary = await readFile(join(root, 'server/utils/complianceOnboarding.ts'), 'utf8')
check(onboardingBoundary.includes('activationAllowed: false'), 'Onboarding must never activate service')
check(onboardingBoundary.includes('manualReviewRequired: true'), 'Onboarding must require manual review')
check(onboardingBoundary.includes('readRawBody'), 'Onboarding must enforce an actual request-body limit')
check(onboardingBoundary.includes('policyAcceptances'), 'Onboarding must verify policy versions')
check(onboardingBoundary.includes('completedSteps'), 'Onboarding must verify required pages')
check(onboardingBoundary.includes('retry: 0'), 'Onboarding delivery must not hide duplicate retries')

if (errors.length) {
  console.error(`Contract validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'pass',
  routes: pages.pages.length,
  indexableBaseRoutes: indexablePages.length,
  localizedIndexableUrls: indexablePages.length * 2,
  featurePages: featurePages.length,
  forms: forms.forms.length,
  onboardingSteps: onboarding.steps.length
}, null, 2))
