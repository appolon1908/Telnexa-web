import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import process from 'node:process'

const root = new URL('../', import.meta.url)
const pages = JSON.parse(await readFile(new URL('../manifests/pages.json', import.meta.url), 'utf8'))
const forms = JSON.parse(await readFile(new URL('../manifests/forms.json', import.meta.url), 'utf8'))
const errors = []

function check(condition, message) {
  if (!condition) errors.push(message)
}

check(pages.pages.length === 68, `Expected 68 base routes, found ${pages.pages.length}`)
check(pages.pages.filter(page => page.indexable).length === 61, 'Expected 61 indexable base routes')
check(pages.pages.filter(page => ['voice', 'messaging', 'email', 'crm', 'automation', 'private-platform'].includes(page.category)).length === 20, 'Expected 20 feature pages')
check(forms.forms.length === 13, `Expected 13 forms, found ${forms.forms.length}`)

const routeSet = new Set()
for (const page of pages.pages) {
  check(typeof page.path === 'string' && page.path.startsWith('/'), `Invalid route path: ${page.path}`)
  check(!routeSet.has(page.path), `Duplicate route: ${page.path}`)
  routeSet.add(page.path)
  check(Boolean(page.title), `Missing title: ${page.path}`)
}

const formSet = new Set(forms.forms.map(form => form.key))
for (const page of pages.pages) {
  if (page.form) check(formSet.has(page.form), `Page ${page.path} references unknown form ${page.form}`)
}
for (const form of forms.forms) {
  check(form.endpoint.startsWith('/api/v1/website/'), `Form ${form.key} has invalid endpoint`)
  check(Array.isArray(form.required) && form.required.includes('email'), `Form ${form.key} must require email`)
}

const expectedUtilityRoutes = ['/login', '/signup', '/portal', '/support', '/port-number', '/request-quote', '/schedule-demo']
for (const path of expectedUtilityRoutes) {
  check(pages.pages.some(page => page.path === path && page.indexable === false), `Utility route ${path} must be noindex`)
}

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

const files = await sourceFiles(new URL('../app', import.meta.url))
files.push(...await sourceFiles(new URL('../server', import.meta.url)))
for (const file of files) {
  const content = await readFile(file, 'utf8')
  const name = relative(new URL('../', import.meta.url).pathname, file)
  check(!/href=["']#["']/.test(content), `${name} contains a dead # link`)
  check(!/javascript:/i.test(content), `${name} contains a javascript URL`)
  check(!/https?:\/\/(?:[^/]*\.)?(?:odoo|n8n)\./i.test(content), `${name} exposes a direct Odoo or n8n browser URL`)
}

const formBoundary = await readFile(new URL('../server/utils/websiteForms.ts', import.meta.url), 'utf8')
check(formBoundary.includes("statusCode: 503"), 'Form boundary must fail closed when delivery is unavailable')
check(formBoundary.includes('Idempotency-Key'), 'Form boundary must propagate idempotency')
check(formBoundary.includes('X-Request-ID'), 'Form boundary must propagate request identity')
check(!formBoundary.includes('accepted: true, requestId, simulation: true') || formBoundary.includes("environment !== 'production'"), 'Simulation sink must be impossible in production')

if (errors.length) {
  console.error(`Contract validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(JSON.stringify({
  status: 'pass',
  routes: pages.pages.length,
  indexableBaseRoutes: pages.pages.filter(page => page.indexable).length,
  localizedIndexableUrls: pages.pages.filter(page => page.indexable).length * 2,
  featurePages: pages.pages.filter(page => ['voice', 'messaging', 'email', 'crm', 'automation', 'private-platform'].includes(page.category)).length,
  forms: forms.forms.length
}, null, 2))
