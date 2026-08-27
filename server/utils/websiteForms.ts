import formsManifest from '../../manifests/forms.json'
import type { H3Event } from 'h3'

interface FormContract {
  key: string
  endpoint: string
  required: string[]
}

const MAX_FORM_BYTES = 64 * 1024
const contracts = new Map(
  (formsManifest.forms as FormContract[]).map(contract => [contract.key, contract])
)

function cleanValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return undefined
  if (typeof value === 'string') return value.trim().replace(/\u0000/g, '').slice(0, 5000)
  if (Array.isArray(value)) return value.slice(0, 50).map(item => cleanValue(item, depth + 1))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key))
        .slice(0, 50)
        .map(([key, item]) => [key.slice(0, 80), cleanValue(item, depth + 1)])
    )
  }
  if (typeof value === 'boolean' || typeof value === 'number' || value === null) return value
  return undefined
}

function validIdempotencyKey(value: string) {
  return value.length >= 16 && value.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(value)
}

async function readLimitedJson(event: H3Event) {
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (contentLength > MAX_FORM_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Form payload is too large' })
  }

  const raw = await readRawBody(event, false)
  if (typeof raw !== 'string' || !raw.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'A JSON object is required' })
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_FORM_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Form payload is too large' })
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not-object')
    }
    return parsed as Record<string, unknown>
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'A valid JSON object is required' })
  }
}

export async function handleWebsiteForm(event: H3Event, explicitFormKey?: string) {
  const config = useRuntimeConfig(event)
  const formKey = explicitFormKey || String(getRouterParam(event, 'form') || '')
  const contract = contracts.get(formKey)

  if (!contract) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown form' })
  }

  const body = await readLimitedJson(event)
  const requestId = String(getHeader(event, 'x-request-id') || crypto.randomUUID())
  const idempotencyKey = String(getHeader(event, 'idempotency-key') || '')
  if (!validIdempotencyKey(idempotencyKey)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid Idempotency-Key header is required' })
  }

  const cleaned = cleanValue(body) as Record<string, unknown>
  const missing = contract.required.filter(field => typeof cleaned[field] !== 'string' || !String(cleaned[field]).trim())
  if (missing.length) {
    throw createError({ statusCode: 422, statusMessage: `Missing required fields: ${missing.join(', ')}` })
  }

  if (typeof cleaned.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
    throw createError({ statusCode: 422, statusMessage: 'A valid email address is required' })
  }

  if (cleaned.website) {
    setResponseStatus(event, 202)
    return { accepted: true, requestId }
  }

  const envelope = {
    schemaVersion: '1.1',
    type: formKey,
    requestId,
    idempotencyKey,
    receivedAt: new Date().toISOString(),
    activationRequested: false,
    payload: cleaned
  }

  const environment = String(config.public.environment || 'development')
  if (!config.middlewareBaseUrl) {
    if (config.devFormSinkEnabled && environment !== 'production') {
      setResponseStatus(event, 202)
      return { accepted: true, requestId, simulation: true }
    }
    throw createError({ statusCode: 503, statusMessage: 'Form delivery is not configured' })
  }

  const downstreamPath = formKey === 'newsletter'
    ? '/v1/website/newsletter'
    : `/v1/website/forms/${encodeURIComponent(formKey)}`
  const baseUrl = String(config.middlewareBaseUrl).replace(/\/$/, '')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    'X-Request-ID': requestId,
    'X-Telnexa-Source': 'website'
  }
  if (config.middlewareServiceToken) {
    headers.Authorization = `Bearer ${String(config.middlewareServiceToken)}`
  }

  try {
    const response = await $fetch.raw(`${baseUrl}${downstreamPath}`, {
      method: 'POST',
      headers,
      body: envelope,
      timeout: 10_000,
      retry: 0
    })

    setResponseStatus(event, 202)
    return {
      accepted: true,
      requestId: response.headers.get('x-request-id') || requestId
    }
  } catch (error: unknown) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'website_form_delivery_failed',
      requestId,
      formKey,
      message: error instanceof Error ? error.message : 'unknown error'
    }))
    throw createError({ statusCode: 503, statusMessage: 'Form delivery is temporarily unavailable' })
  }
}
