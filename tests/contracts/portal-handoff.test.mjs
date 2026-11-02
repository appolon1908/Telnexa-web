import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const header = await readFile(new URL('../../app/components/AppHeader.vue', import.meta.url), 'utf8')
const middleware = await readFile(new URL('../../server/middleware/portal-handoff.ts', import.meta.url), 'utf8')
const config = await readFile(new URL('../../nuxt.config.ts', import.meta.url), 'utf8')

test('public header links to the real external client portal', () => {
  assert.match(header, /telnexaDomains\.portal/)
  assert.doesNotMatch(header, />\s*(?:Sign in|Ingresar)\s*</i)
  assert.match(config, /portalUrl:\s*'https:\/\/app\.telnexa\.co'/)
})

test('legacy login, signup, and portal paths redirect to the portal authority', () => {
  for (const path of ['/login', '/signup', '/portal', '/es/login', '/es/signup', '/es/portal']) {
    assert.ok(middleware.includes(`'${path}'`), `${path} must be an explicit handoff route`)
  }
  assert.match(middleware, /sendRedirect\(event, portalUrl, 302\)/)
  assert.match(middleware, /portalUrl\.startsWith\('https:\/\/'\)/)
})
