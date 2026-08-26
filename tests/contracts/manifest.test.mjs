import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const pages = JSON.parse(await readFile(new URL('../../manifests/pages.json', import.meta.url), 'utf8'))
const forms = JSON.parse(await readFile(new URL('../../manifests/forms.json', import.meta.url), 'utf8'))

test('publishes the approved route surface', () => {
  assert.equal(pages.pages.length, 68)
  assert.equal(pages.pages.filter(page => page.indexable).length, 61)
  assert.equal(new Set(pages.pages.map(page => page.path)).size, 68)
})

test('publishes exactly twenty dedicated feature pages', () => {
  const featureCategories = new Set(['voice', 'messaging', 'email', 'crm', 'automation', 'private-platform'])
  assert.equal(pages.pages.filter(page => featureCategories.has(page.category)).length, 20)
})

test('all page form references resolve to one of thirteen contracts', () => {
  assert.equal(forms.forms.length, 13)
  const knownForms = new Set(forms.forms.map(form => form.key))
  for (const page of pages.pages) {
    if (page.form) assert.ok(knownForms.has(page.form), `${page.path} references ${page.form}`)
  }
})

test('utility routes remain excluded from search indexing', () => {
  const expected = new Set(['/login', '/signup', '/portal', '/support', '/port-number', '/request-quote', '/schedule-demo'])
  const actual = new Set(pages.pages.filter(page => !page.indexable).map(page => page.path))
  assert.deepEqual(actual, expected)
})
