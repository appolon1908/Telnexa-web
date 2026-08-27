import onboardingManifest from '../../manifests/onboarding-gates.json'
import legalManifest from '../../manifests/legal-documents.json'
import type { H3Event } from 'h3'

interface PolicyAcceptance {
  key: string
  version: string
  statusAtAcceptance: string
  accepted: boolean
  acceptedAt: string
}

interface OnboardingPayload {
  schemaVersion: string
  selectedServices: string[]
  answers: Record<string, unknown>
  acknowledgments: Record<string, boolean>
  policyAcceptances: PolicyAcceptance[]
  completedSteps: string[]
  locale: string
  sourcePage: string
  activationRequested: boolean
}

const MAX_ONBOARDING_BYTES = 512 * 1024
const services = new Map((onboardingManifest.services as Array<any>).map(service => [service.key, service]))
const steps = onboardingManifest.steps as Array<any>
const documents = new Map((legalManifest.documents as Array<any>).map(document => [document.key, document]))

function meaningful(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  return value === true
}

function validIdempotencyKey(value: string) {
  return value.length >= 16 && value.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(value)
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 8) return undefined
  if (typeof value === 'string') return value.trim().replace(/\u0000/g, '').slice(0, 10_000)
  if (Array.isArray(value)) return value.slice(0, 200).map(item => sanitize(item, depth + 1))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key))
        .slice(0, 500)
        .map(([key, item]) => [key.slice(0, 160), sanitize(item, depth + 1)])
    )
  }
  if (typeof value === 'boolean' || typeof value === 'number' || value === null) return value
  return undefined
}

async function readLimitedJson(event: H3Event) {
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (contentLength > MAX_ONBOARDING_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Onboarding payload is too large' })
  }

  const raw = await readRawBody(event, false)
  if (typeof raw !== 'string' || !raw.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'A JSON object is required' })
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_ONBOARDING_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Onboarding payload is too large' })
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not-object')
    return sanitize(parsed) as OnboardingPayload
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'A valid JSON object is required' })
  }
}

function requiredDocumentsFor(selectedServices: string[]) {
  const keys = new Set<string>(['terms', 'privacy', 'acceptable-use'])
  for (const key of selectedServices) {
    const service = services.get(key)
    for (const documentKey of service?.requiredDocuments || []) keys.add(documentKey)
  }
  return [...keys]
}

function validatePayload(payload: OnboardingPayload, environment: string) {
  if (payload.schemaVersion !== '1.0') {
    throw createError({ statusCode: 422, statusMessage: 'Unsupported onboarding schema version' })
  }
  if (!Array.isArray(payload.selectedServices) || !payload.selectedServices.length) {
    throw createError({ statusCode: 422, statusMessage: 'At least one service must be selected' })
  }

  const selected = [...new Set(payload.selectedServices)]
  const unknownServices = selected.filter(key => !services.has(key))
  if (unknownServices.length) {
    throw createError({ statusCode: 422, statusMessage: `Unknown services: ${unknownServices.join(', ')}` })
  }

  if (!payload.answers || typeof payload.answers !== 'object' || Array.isArray(payload.answers)) {
    throw createError({ statusCode: 422, statusMessage: 'Onboarding answers are required' })
  }
  if (!payload.acknowledgments || typeof payload.acknowledgments !== 'object') {
    throw createError({ statusCode: 422, statusMessage: 'Onboarding acknowledgments are required' })
  }
  if (payload.activationRequested !== false) {
    throw createError({ statusCode: 422, statusMessage: 'Onboarding cannot request automatic activation' })
  }

  const answerServices = Array.isArray(payload.answers.services) ? payload.answers.services : []
  if (selected.sort().join('|') !== [...answerServices].sort().join('|')) {
    throw createError({ statusCode: 422, statusMessage: 'Selected services do not match the service-selection answer' })
  }

  const relationship = String(payload.answers['business.customerType'] || '')
  if (['reseller', 'wholesaler'].includes(relationship) && !selected.includes('wholesale')) {
    throw createError({ statusCode: 422, statusMessage: 'Reseller and wholesale relationships require the wholesale service review' })
  }

  const applicable = steps.filter(step =>
    step.requiredFor.includes('all') ||
    step.requiredFor.some((service: string) => selected.includes(service))
  )

  const missingSteps: string[] = []
  const missingFields: string[] = []
  const missingAcknowledgments: string[] = []

  for (const step of applicable) {
    if (['overview', 'submitted'].includes(step.kind)) continue

    if (!payload.completedSteps?.includes(step.key)) missingSteps.push(step.key)
    for (const field of step.fields || []) {
      if (field.required && !meaningful(payload.answers[field.key])) {
        missingFields.push(`${step.key}:${field.key}`)
      }
    }
    for (const acknowledgment of step.acknowledgments || []) {
      if (acknowledgment.required && payload.acknowledgments[acknowledgment.key] !== true) {
        missingAcknowledgments.push(`${step.key}:${acknowledgment.key}`)
      }
    }
  }

  if (missingSteps.length || missingFields.length || missingAcknowledgments.length) {
    throw createError({
      statusCode: 422,
      statusMessage: `Compliance pages incomplete; steps=${missingSteps.join(',') || 'none'} fields=${missingFields.join(',') || 'none'} acknowledgments=${missingAcknowledgments.join(',') || 'none'}`
    })
  }

  if (!Array.isArray(payload.policyAcceptances)) {
    throw createError({ statusCode: 422, statusMessage: 'Policy acceptances are required' })
  }

  const acceptanceMap = new Map(payload.policyAcceptances.map(item => [item.key, item]))
  const missingPolicies: string[] = []
  const stalePolicies: string[] = []
  const unapprovedPolicies: string[] = []

  for (const key of requiredDocumentsFor(selected)) {
    const document = documents.get(key)
    const acceptance = acceptanceMap.get(key)
    if (!document || !acceptance || acceptance.accepted !== true) {
      missingPolicies.push(key)
      continue
    }
    if (acceptance.version !== document.version) stalePolicies.push(key)
    if (!acceptance.acceptedAt || Number.isNaN(Date.parse(acceptance.acceptedAt))) stalePolicies.push(`${key}:acceptedAt`)
    if (environment === 'production' && document.status !== 'approved') unapprovedPolicies.push(key)
  }

  if (missingPolicies.length) {
    throw createError({ statusCode: 422, statusMessage: `Required policies not accepted: ${missingPolicies.join(', ')}` })
  }
  if (stalePolicies.length) {
    throw createError({ statusCode: 409, statusMessage: `Policy versions changed or acceptance timestamps are invalid: ${stalePolicies.join(', ')}` })
  }
  if (unapprovedPolicies.length) {
    throw createError({ statusCode: 503, statusMessage: `Production policies are not approved: ${unapprovedPolicies.join(', ')}` })
  }

  return { selectedServices: selected, applicableSteps: applicable.map(step => step.key) }
}

export async function handleComplianceOnboarding(event: H3Event) {
  const config = useRuntimeConfig(event)
  const payload = await readLimitedJson(event)
  const requestId = String(getHeader(event, 'x-request-id') || crypto.randomUUID())
  const idempotencyKey = String(getHeader(event, 'idempotency-key') || '')

  if (!validIdempotencyKey(idempotencyKey)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid Idempotency-Key header is required' })
  }

  const environment = String(config.public.environment || 'development')
  const validation = validatePayload(payload, environment)
  const receivedAt = new Date().toISOString()

  const envelope = {
    schemaVersion: '1.0',
    type: 'compliance-onboarding',
    requestId,
    idempotencyKey,
    receivedAt,
    selectedServices: validation.selectedServices,
    applicableSteps: validation.applicableSteps,
    activationRequested: false,
    activationAllowed: false,
    manualReviewRequired: true,
    capabilityFlags: onboardingManifest.activationGate.capabilityFlags,
    payload
  }

  if (!config.middlewareBaseUrl) {
    if (config.devFormSinkEnabled && environment !== 'production') {
      setResponseStatus(event, 202)
      return {
        accepted: true,
        requestId,
        state: 'submitted',
        activationAllowed: false,
        manualReviewRequired: true,
        simulation: true,
        receivedAt
      }
    }
    throw createError({ statusCode: 503, statusMessage: 'Compliance onboarding delivery is not configured' })
  }

  const baseUrl = String(config.middlewareBaseUrl).replace(/\/$/, '')
  const downstreamPath = String(onboardingManifest.submissionEndpoint).replace(/^\/api/, '')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    'X-Request-ID': requestId,
    'X-Telnexa-Source': 'website-compliance-onboarding'
  }
  if (config.middlewareServiceToken) {
    headers.Authorization = `Bearer ${String(config.middlewareServiceToken)}`
  }

  try {
    const response = await $fetch.raw(`${baseUrl}${downstreamPath}`, {
      method: 'POST',
      headers,
      body: envelope,
      timeout: 15_000,
      retry: 0
    })

    setResponseStatus(event, 202)
    return {
      accepted: true,
      requestId: response.headers.get('x-request-id') || requestId,
      state: 'submitted',
      activationAllowed: false,
      manualReviewRequired: true,
      receivedAt
    }
  } catch (error: unknown) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'compliance_onboarding_delivery_failed',
      requestId,
      selectedServices: validation.selectedServices,
      message: error instanceof Error ? error.message : 'unknown error'
    }))
    throw createError({ statusCode: 503, statusMessage: 'Compliance onboarding delivery is temporarily unavailable' })
  }
}
