import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
const legal = await readJson('../../manifests/legal-documents.json')
const entity = await readJson('../../manifests/legal-entity.json')
const sources = await readJson('../../manifests/compliance-sources.json')
const versions = await readJson('../../manifests/legal-versions.json')

test('legal center contains substantive bilingual policy families', () => {
  assert.ok(legal.documents.length >= 23)
  const keys = new Set(legal.documents.map(document => document.key))
  for (const key of [
    'terms', 'privacy', 'cookies', 'acceptable-use', 'messaging-policy', 'anti-spam',
    'voice-services', 'ai-voice', 'emergency-services', 'call-recording',
    'number-porting', 'wholesale-reseller', 'data-processing-addendum',
    'subprocessors', 'security-disclosure', 'accessibility', 'regulatory-fees'
  ]) {
    assert.ok(keys.has(key), `${key} is required`)
  }

  for (const document of legal.documents) {
    assert.ok(document.title.en && document.title.es)
    assert.ok(document.summary.en && document.summary.es)
    assert.ok(document.sections.length >= 2)
    for (const section of document.sections) {
      assert.ok(section.paragraphs.en.length)
      assert.ok(section.paragraphs.es.length)
    }
  }
})

test('all regulatory source references resolve', () => {
  const sourceKeys = new Set(sources.sources.map(source => source.key))
  for (const document of legal.documents) {
    for (const key of document.sourceRefs) assert.ok(sourceKeys.has(key), `${document.key} -> ${key}`)
  }
})

test('production publication gate is intentionally fail closed until legal approval', () => {
  assert.equal(entity.status, 'draft')
  assert.match(entity.legalName, /_REQUIRED$/)
  assert.equal(versions.versions.length, 0)

  const result = spawnSync(process.execPath, ['scripts/validate-compliance.mjs', '--production'], {
    cwd: new URL('../../', import.meta.url),
    encoding: 'utf8'
  })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /PRODUCTION_COMPLIANCE_GATE=BLOCKED/)
})

test('structural compliance validation succeeds before publication approval', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-compliance.mjs'], {
    cwd: new URL('../../', import.meta.url),
    encoding: 'utf8'
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  assert.match(result.stdout, /"status": "pass"/)
})
