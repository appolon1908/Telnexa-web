import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../../', import.meta.url))
const source = path => readFileSync(join(root, path), 'utf8')

test('website virtual hosts and DNS checks cannot take ownership of the SMS API', () => {
  const caddy = source('deployment/Caddyfile.telnexa')
  const hosts = [...caddy.matchAll(/^([a-z0-9.-]+)\s*\{/gm)].map(match => match[1])
  assert.deepEqual(hosts, ['www.telnexa.co', 'telnexa.co'])
  assert.match(caddy, /@api path \/api\/\*/)
  for (const name of ['nuxt.config.ts', '.env.example', '.github/workflows/deploy-production.yml']) {
    assert.ok(source(name).includes('https://api.telnexa.co/dashboard'))
    assert.ok(!source(name).includes('https://app.telnexa.co'))
  }
  for (const name of ['preflight', 'smoke']) {
    const script = source(`deployment/scripts/${name}.sh`)
    const dnsHosts = script.match(/for host in ([^;]+); do/)[1].split(' ')
    assert.deepEqual(dnsHosts, ['telnexa.co', 'www.telnexa.co'])
    assert.match(script, /bash "\$SCRIPT_DIR\/provider-health\.sh"/)
  }
})

function runProviderCheck(mode) {
  const directory = mkdtempSync(join(tmpdir(), 'telnexa-provider-'))
  try {
    const log = join(directory, 'calls.jsonl')
    writeFileSync(join(directory, 'curl'), `#!${process.execPath}\n` + `
      const fs = require('node:fs');
      fs.appendFileSync(process.env.CALL_LOG, JSON.stringify(process.argv.slice(2))+'\\n');
      if (process.env.PROBE_MODE === 'tls-failure') process.exit(60);
      const ready = process.argv.at(-1).endsWith('/ready');
      const mode = process.env.PROBE_MODE;
      const body = ready ? (mode === 'malformed' ? 'not-json' : JSON.stringify({status:mode==='unready'?'not-ready':'ready'})) : '{}';
      process.stdout.write(body+'\\n'+(mode==='redirect'?'302':mode==='server-error'?'503':'200'));
    `, { mode: 0o755 })
    const result = spawnSync('bash', [join(root, 'deployment/scripts/provider-health.sh')], {
      encoding: 'utf8', env: { ...process.env, PATH: directory + ':' + process.env.PATH, PROBE_MODE: mode, CALL_LOG: log }
    })
    const calls = readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse)
    return { ...result, calls }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}

test('provider check uses only bounded TLS-verified GETs and validates readiness', () => {
  const result = runProviderCheck('healthy')
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /PROVIDER_HEALTH=PASS/)
  assert.deepEqual(result.calls.map(args => args.at(-1)), ['https://api.telnexa.co/health', 'https://api.telnexa.co/ready'])
  for (const args of result.calls) {
    for (const forbidden of ['-k', '--insecure', '-L', '--location', '-X', '--data', '-d']) assert.ok(!args.includes(forbidden))
    assert.ok(args.includes('--max-time'))
    assert.ok(args.includes('--max-filesize'))
    assert.equal(args[args.indexOf('--proto') + 1], '=https')
  }
})

for (const mode of ['tls-failure', 'redirect', 'server-error', 'unready', 'malformed']) {
  test(`provider check blocks rollout on ${mode}`, () => {
    const result = runProviderCheck(mode)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /PROVIDER_HEALTH=FAIL/)
    assert.doesNotMatch(result.stdout, /PROVIDER_HEALTH=PASS/)
  })
}
