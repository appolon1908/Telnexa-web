import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import process from 'node:process'

const rootCandidates = [
  fileURLToPath(new URL('../', import.meta.url)),
  fileURLToPath(new URL('../../', import.meta.url))
]
const root = rootCandidates.find(candidate => existsSync(join(candidate, 'manifests/legal-documents.json')))
if (!root) {
  console.error('Compliance manifests could not be located')
  process.exit(1)
}
const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'))

const [pages, legal, entity, versions, onboarding, sources] = await Promise.all([
  readJson('manifests/pages.json'),
  readJson('manifests/legal-documents.json'),
  readJson('manifests/legal-entity.json'),
  readJson('manifests/legal-versions.json'),
  readJson('manifests/onboarding-gates.json'),
  readJson('manifests/compliance-sources.json')
])

const production = process.argv.includes('--production')
const errors = []
const warnings = []
const check = (condition, message) => { if (!condition) errors.push(message) }
const warn = (condition, message) => { if (!condition) warnings.push(message) }
const wordCount = value => String(value || '').trim().split(/\s+/).filter(Boolean).length

const pageMap = new Map(pages.pages.map(page => [page.path, page]))
const documentMap = new Map()
const sourceKeys = new Set(sources.sources.map(source => source.key))

check(Array.isArray(legal.documents) && legal.documents.length >= 20, 'At least twenty substantive legal and compliance documents are required')
check(legal.publicationGate?.requiredStatus === 'approved', 'Publication gate must require approved status')
check(legal.publicationGate?.requiresLegalEntity === true, 'Publication gate must require a legal entity')
check(legal.publicationGate?.requiresEffectiveDate === true, 'Publication gate must require effective dates')
check(legal.publicationGate?.requiresImmutableArchive === true, 'Publication gate must require immutable version archives')

for (const document of legal.documents) {
  check(!documentMap.has(document.key), `Duplicate legal document key: ${document.key}`)
  documentMap.set(document.key, document)

  check(Boolean(pageMap.get(document.path)), `Legal document ${document.key} has no page route: ${document.path}`)
  check(Boolean(document.title?.en && document.title?.es), `Legal document ${document.key} needs English and Spanish titles`)
  check(Boolean(document.summary?.en && document.summary?.es), `Legal document ${document.key} needs English and Spanish summaries`)
  check(Array.isArray(document.sections) && document.sections.length >= 2, `Legal document ${document.key} needs at least two sections`)

  for (const section of document.sections || []) {
    check(Boolean(section.heading?.en && section.heading?.es), `${document.key} section needs bilingual headings`)
    check(Array.isArray(section.paragraphs?.en) && section.paragraphs.en.length, `${document.key} section needs English paragraphs`)
    check(Array.isArray(section.paragraphs?.es) && section.paragraphs.es.length, `${document.key} section needs Spanish paragraphs`)
  }

  const englishWords = (document.sections || []).flatMap(section => [
    ...(section.paragraphs?.en || []),
    ...(section.bullets?.en || [])
  ]).reduce((total, value) => total + wordCount(value), 0)
  const spanishWords = (document.sections || []).flatMap(section => [
    ...(section.paragraphs?.es || []),
    ...(section.bullets?.es || [])
  ]).reduce((total, value) => total + wordCount(value), 0)
  check(englishWords >= 45, `Legal document ${document.key} is not substantive in English (${englishWords} words)`)
  check(spanishWords >= 45, `Legal document ${document.key} is not substantive in Spanish (${spanishWords} words)`)

  for (const source of document.sourceRefs || []) {
    check(sourceKeys.has(source), `Legal document ${document.key} references unknown source ${source}`)
  }

  const route = pageMap.get(document.path)
  if (document.indexable) check(route?.indexable === true, `${document.path} must remain indexable`)
  else check(route?.indexable === false, `${document.path} must remain noindex`)

  if (production && document.publicationRequired) {
    check(document.status === 'approved', `Production legal document ${document.key} is not approved`)
    check(Boolean(document.effectiveDate && !Number.isNaN(Date.parse(document.effectiveDate))), `Production legal document ${document.key} has no valid effective date`)
    check(!String(document.version).toLowerCase().includes('draft'), `Production legal document ${document.key} still uses a draft version`)
    const archive = versions.versions.find(item =>
      item.key === document.key &&
      item.version === document.version &&
      item.effectiveDate === document.effectiveDate &&
      /^[0-9a-f]{64}$/.test(item.sha256 || '')
    )
    check(Boolean(archive), `Production legal document ${document.key} has no immutable archived version`)
  } else if (document.publicationRequired) {
    warn(document.status === 'approved', `${document.key} remains ${document.status}`)
  }
}

const requiredDocumentKeys = [
  'terms', 'privacy', 'cookies', 'acceptable-use', 'service-level',
  'messaging-policy', 'anti-spam', 'voice-services', 'ai-voice',
  'emergency-services', 'call-recording', 'number-porting',
  'wholesale-reseller', 'data-processing-addendum', 'subprocessors',
  'security-disclosure', 'accessibility', 'regulatory-fees',
  'privacy-request', 'do-not-sell-or-share', 'cookie-settings'
]
for (const key of requiredDocumentKeys) {
  check(documentMap.has(key), `Required legal document missing: ${key}`)
}

check(pageMap.has('/voice/ai-voice'), 'AI voice marketing page is required')
check(pageMap.has('/wholesale'), 'Wholesale marketing page is required')
check(pageMap.get('/voice/ai-voice')?.indexable === true, 'AI voice page must be indexable')
check(pageMap.get('/wholesale')?.indexable === true, 'Wholesale page must be indexable')

const serviceMap = new Map()
for (const service of onboarding.services || []) {
  check(!serviceMap.has(service.key), `Duplicate onboarding service: ${service.key}`)
  serviceMap.set(service.key, service)
  check(Boolean(pageMap.get(service.startPath)), `Service ${service.key} has no start page ${service.startPath}`)
  check(Boolean(pageMap.get(service.marketingPath)), `Service ${service.key} has no marketing page ${service.marketingPath}`)
  check(Array.isArray(service.requiredDocuments) && service.requiredDocuments.length >= 4, `Service ${service.key} needs required policies`)
  for (const key of service.requiredDocuments || []) {
    const document = documentMap.get(key)
    check(Boolean(document), `Service ${service.key} references unknown policy ${key}`)
    check(document?.acceptanceRequired === true, `Service policy ${key} must require acceptance`)
  }
}
for (const key of ['sms', 'business-voip', 'ai-voice', 'wholesale']) {
  check(serviceMap.has(key), `Required onboarding service missing: ${key}`)
}

const stepMap = new Map()
for (const step of onboarding.steps || []) {
  check(!stepMap.has(step.key), `Duplicate onboarding step: ${step.key}`)
  stepMap.set(step.key, step)
  const route = pageMap.get(step.path)
  check(Boolean(route), `Onboarding step ${step.key} has no route ${step.path}`)
  check(route?.indexable === false, `Onboarding route ${step.path} must be noindex`)
  check(Boolean(step.title?.en && step.title?.es), `Onboarding step ${step.key} needs bilingual title`)
  check(Boolean(step.description?.en && step.description?.es), `Onboarding step ${step.key} needs bilingual description`)
  check(Array.isArray(step.requiredFor) && step.requiredFor.length, `Onboarding step ${step.key} needs service applicability`)

  const fieldKeys = new Set()
  for (const field of step.fields || []) {
    check(!fieldKeys.has(field.key), `Step ${step.key} has duplicate field ${field.key}`)
    fieldKeys.add(field.key)
    check(Boolean(field.label?.en && field.label?.es), `Field ${step.key}:${field.key} needs bilingual label`)
  }
  const acknowledgmentKeys = new Set()
  for (const acknowledgment of step.acknowledgments || []) {
    check(!acknowledgmentKeys.has(acknowledgment.key), `Step ${step.key} has duplicate acknowledgment ${acknowledgment.key}`)
    acknowledgmentKeys.add(acknowledgment.key)
    check(Boolean(acknowledgment.label?.en && acknowledgment.label?.es), `Acknowledgment ${step.key}:${acknowledgment.key} needs bilingual label`)
  }
}

const requiredSteps = [
  'overview', 'business-verification', 'service-selection',
  'sms-overview', 'sms-use-case', 'sms-consent', 'sms-sender-registration',
  'voice-overview', 'voice-use-case', 'voice-emergency-services', 'voice-caller-id', 'voice-call-recording',
  'ai-voice-overview', 'ai-voice-use-case', 'ai-voice-disclosure', 'ai-voice-consent',
  'wholesale-overview', 'wholesale-business', 'wholesale-downstream', 'wholesale-traffic', 'wholesale-robocall',
  'privacy-data', 'agreements', 'review', 'submitted'
]
for (const key of requiredSteps) check(stepMap.has(key), `Required onboarding step missing: ${key}`)
check(onboarding.submissionEndpoint === '/api/v1/website/onboarding/compliance', 'Onboarding endpoint is incorrect')
check(onboarding.activationGate?.manualReviewRequired === true, 'Manual review must remain required')
check(onboarding.activationGate?.activationAllowedOnSubmission === false, 'Submission must never activate service')
check(onboarding.activationGate?.approvedDoesNotAutoProvision === true, 'Approval must not automatically provision service')

for (const [key, value] of Object.entries(onboarding.activationGate?.capabilityFlags || {})) {
  check(value === false, `Capability ${key} must remain false`)
}
for (const key of [
  'LIVE_SMS_DELIVERY', 'LIVE_EMAIL_DELIVERY', 'LIVE_PSTN_DIALING',
  'ENABLE_PROVIDER_SUBMISSION', 'ENABLE_AUTOMATIC_PROVISIONING',
  'ODOO_DIRECT_PUBLIC_ACCESS', 'N8N_DIRECT_PUBLIC_ACCESS'
]) {
  check(onboarding.activationGate?.capabilityFlags?.[key] === false, `Required capability freeze missing: ${key}`)
}

if (production) {
  check(entity.status === 'approved', 'Production legal entity is not approved')
  for (const key of ['legalName', 'registrationNumber', 'businessAddress', 'country']) {
    const value = String(entity[key] || '')
    check(Boolean(value) && !value.includes('_REQUIRED'), `Production legal entity field ${key} is incomplete`)
  }
} else {
  warn(entity.status === 'approved', `Legal entity remains ${entity.status}`)
}

if (errors.length) {
  console.error(`Compliance validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  if (production) console.error('PRODUCTION_COMPLIANCE_GATE=BLOCKED')
  process.exit(1)
}

if (warnings.length) {
  console.warn(`Compliance validation passed structurally with ${warnings.length} publication warning(s):`)
  for (const warning of warnings) console.warn(`- ${warning}`)
}

console.log(JSON.stringify({
  status: 'pass',
  mode: production ? 'production' : 'structural',
  legalDocuments: legal.documents.length,
  onboardingServices: onboarding.services.length,
  onboardingSteps: onboarding.steps.length,
  productionReady: production,
  publicationWarnings: warnings.length,
  liveCapabilitiesEnabled: false
}, null, 2))
