import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const pages = JSON.parse(await readFile(new URL('../../manifests/pages.json', import.meta.url), 'utf8'))
const forms = JSON.parse(await readFile(new URL('../../manifests/forms.json', import.meta.url), 'utf8'))
const onboarding = JSON.parse(await readFile(new URL('../../manifests/onboarding-gates.json', import.meta.url), 'utf8'))

test('publishes the expanded route surface', () => {
  assert.equal(pages.pages.length, pages.baseRouteCount)
  assert.equal(pages.pages.filter(page => page.indexable).length, pages.indexableBaseRouteCount)
  assert.equal(new Set(pages.pages.map(page => page.path)).size, pages.baseRouteCount)
  assert.equal(pages.baseRouteCount, 113)
  assert.equal(pages.indexableBaseRouteCount, 78)
})

test('publishes twenty-one dedicated feature pages including AI voice', () => {
  const featureCategories = new Set(['voice', 'messaging', 'email', 'crm', 'automation', 'private-platform'])
  assert.equal(pages.pages.filter(page => featureCategories.has(page.category)).length, pages.featurePageCount)
  assert.equal(pages.featurePageCount, 21)
  assert.ok(pages.pages.some(page => page.path === '/voice/ai-voice' && page.indexable))
  assert.ok(pages.pages.some(page => page.path === '/wholesale' && page.indexable))
})

test('all page form references resolve to the expanded contract set', () => {
  assert.equal(forms.forms.length, 14)
  const knownForms = new Set(forms.forms.map(form => form.key))
  for (const page of pages.pages) {
    if (page.form) assert.ok(knownForms.has(page.form), `${page.path} references ${page.form}`)
  }
  assert.ok(knownForms.has('privacy-request'))
})

test('utility and compliance onboarding routes remain excluded from indexing', () => {
  const nonIndexable = new Set(pages.pages.filter(page => !page.indexable).map(page => page.path))
  for (const path of [
    '/login', '/signup', '/portal', '/support', '/port-number', '/request-quote', '/schedule-demo',
    '/privacy-request', '/do-not-sell-or-share', '/cookie-settings'
  ]) {
    assert.ok(nonIndexable.has(path), `${path} must be noindex`)
  }
  for (const step of onboarding.steps) {
    assert.ok(nonIndexable.has(step.path), `${step.path} must be noindex`)
  }
})

test('localized sitemap surface is exactly 156 URLs', () => {
  assert.equal(pages.pages.filter(page => page.indexable).length * 2, 156)
})
