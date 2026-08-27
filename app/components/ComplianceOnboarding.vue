<script setup lang="ts">
import type { OnboardingField, OnboardingStep } from '~/composables/useComplianceCatalog'
interface StoredOnboardingState {
  schemaVersion: string
  values: Record<string, any>
  acknowledgments: Record<string, boolean>
  acceptedDocuments: Record<string, boolean>
  completedSteps: string[]
  receipt: null | {
    requestId: string
    state: string
    activationAllowed: boolean
    simulation?: boolean
    receivedAt?: string
  }
}

const {
  locale,
  step: currentStep,
  steps,
  services,
  documents,
  localizePath,
  canonicalUrl,
  englishUrl,
  spanishUrl,
  requiredDocumentsForServices
} = useComplianceCatalog()

if (!currentStep.value) {
  throw createError({ statusCode: 404, statusMessage: 'Onboarding step not found' })
}

const storageKey = 'telnexa-compliance-onboarding-v1'
const hydrated = ref(false)
const state = reactive<StoredOnboardingState>({
  schemaVersion: '1.0',
  values: {},
  acknowledgments: {},
  acceptedDocuments: {},
  completedSteps: [],
  receipt: null
})
const ui = reactive({ pending: false, error: '', saved: false })

const selectedServices = computed<string[]>(() =>
  Array.isArray(state.values.services)
    ? state.values.services.filter((value: unknown): value is string => typeof value === 'string')
    : []
)

const applicableSteps = computed(() =>
  steps.filter(item =>
    item.requiredFor.includes('all') ||
    item.requiredFor.some(service => selectedServices.value.includes(service))
  )
)

const currentIndex = computed(() =>
  applicableSteps.value.findIndex(item => item.key === currentStep.value!.key)
)

const requiredDocuments = computed(() =>
  requiredDocumentsForServices(selectedServices.value)
)

const localized = <T extends { en: string; es: string }>(value: T) => value[locale.value]

function meaningful(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return value.trim().length > 0
  return value !== undefined && value !== null && value !== false
}

function ensureFieldDefaults() {
  for (const field of currentStep.value?.fields || []) {
    if (!(field.key in state.values)) {
      state.values[field.key] = field.type === 'multiselect' ? [] : ''
    }
  }
  for (const acknowledgment of currentStep.value?.acknowledgments || []) {
    if (!(acknowledgment.key in state.acknowledgments)) {
      state.acknowledgments[acknowledgment.key] = false
    }
  }
}

function stepComplete(item: OnboardingStep) {
  if (item.kind === 'overview') return true
  if (item.kind === 'submitted') return Boolean(state.receipt)

  const fieldsComplete = item.fields.every(field =>
    !field.required || meaningful(state.values[field.key])
  )
  const acknowledgmentsComplete = item.acknowledgments.every(item =>
    !item.required || state.acknowledgments[item.key] === true
  )

  if (item.key === 'service-selection') {
    const relationship = String(state.values['business.customerType'] || '')
    if (!selectedServices.value.length) return false
    if (['reseller', 'wholesaler'].includes(relationship) && !selectedServices.value.includes('wholesale')) {
      return false
    }
  }

  if (item.kind === 'agreements') {
    const documentsComplete = requiredDocuments.value.every(item =>
      state.acceptedDocuments[item.key] === true
    )
    return fieldsComplete && acknowledgmentsComplete && documentsComplete
  }

  return fieldsComplete && acknowledgmentsComplete
}

const firstIncomplete = computed(() =>
  applicableSteps.value.find(item =>
    !['overview', 'submitted'].includes(item.kind) && !stepComplete(item)
  ) || null
)

const prerequisiteBlocker = computed(() => {
  if (currentIndex.value < 0) return applicableSteps.value[0] || null
  return applicableSteps.value
    .slice(0, currentIndex.value)
    .find(item => !['overview', 'submitted'].includes(item.kind) && !stepComplete(item)) || null
})

const progressTotal = computed(() =>
  applicableSteps.value.filter(item => item.kind !== 'submitted').length
)
const progressComplete = computed(() =>
  applicableSteps.value.filter(item => item.kind !== 'submitted' && stepComplete(item)).length
)

const currentTitle = computed(() => localized(currentStep.value!.title))
const currentDescription = computed(() => localized(currentStep.value!.description))
const title = computed(() => `${currentTitle.value} | Telnexa`)
const description = computed(() => currentDescription.value)

useSeoMeta({
  title,
  description,
  robots: 'noindex, nofollow, noarchive',
  ogTitle: title,
  ogDescription: description,
  ogUrl: canonicalUrl
})

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
    { rel: 'alternate', hreflang: 'en', href: englishUrl.value },
    { rel: 'alternate', hreflang: 'es', href: spanishUrl.value },
    { rel: 'alternate', hreflang: 'x-default', href: englishUrl.value }
  ]
}))

function saveState() {
  if (!import.meta.client || !hydrated.value) return
  localStorage.setItem(storageKey, JSON.stringify(state))
  ui.saved = true
  window.setTimeout(() => { ui.saved = false }, 1200)
}

function resetState() {
  state.values = {}
  state.acknowledgments = {}
  state.acceptedDocuments = {}
  state.completedSteps = []
  state.receipt = null
  ensureFieldDefaults()
  if (import.meta.client) localStorage.removeItem(storageKey)
  navigateTo(localizePath('/get-started'))
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<StoredOnboardingState>
      if (parsed.schemaVersion === '1.0') {
        state.values = parsed.values || {}
        state.acknowledgments = parsed.acknowledgments || {}
        state.acceptedDocuments = parsed.acceptedDocuments || {}
        state.completedSteps = parsed.completedSteps || []
        state.receipt = parsed.receipt || null
      }
    }
  } catch {
    localStorage.removeItem(storageKey)
  } finally {
    hydrated.value = true
    ensureFieldDefaults()
  }
})

watch(currentStep, ensureFieldDefaults, { immediate: true })
watch(state, saveState, { deep: true })

function fieldError(item: OnboardingField) {
  return item.required && !meaningful(state.values[item.key])
}

function validateCurrent() {
  ui.error = ''
  const item = currentStep.value!

  const missingFields = item.fields
    .filter(field => field.required && !meaningful(state.values[field.key]))
    .map(field => localized(field.label))

  const missingAcknowledgments = item.acknowledgments
    .filter(acknowledgment => acknowledgment.required && !state.acknowledgments[acknowledgment.key])

  if (item.key === 'service-selection') {
    const relationship = String(state.values['business.customerType'] || '')
    if (!selectedServices.value.length) {
      missingFields.push(locale.value === 'es' ? 'Servicios solicitados' : 'Services requested')
    }
    if (['reseller', 'wholesaler'].includes(relationship) && !selectedServices.value.includes('wholesale')) {
      ui.error = locale.value === 'es'
        ? 'Selecciona también Servicios mayoristas y de reventa para una relación de revendedor o mayorista.'
        : 'Select Wholesale and reseller services for a reseller or wholesale relationship.'
      return false
    }
  }

  if (item.kind === 'agreements') {
    const missingDocuments = requiredDocuments.value.filter(document =>
      state.acceptedDocuments[document.key] !== true
    )
    if (missingDocuments.length) {
      ui.error = locale.value === 'es'
        ? `Acepta las políticas requeridas: ${missingDocuments.map(item => item.title.es).join(', ')}.`
        : `Accept the required policies: ${missingDocuments.map(item => item.title.en).join(', ')}.`
      return false
    }
  }

  if (missingFields.length || missingAcknowledgments.length) {
    ui.error = locale.value === 'es'
      ? `Completa todos los campos y certificaciones obligatorios. Faltan: ${missingFields.join(', ') || 'certificaciones'}.`
      : `Complete every required field and certification. Missing: ${missingFields.join(', ') || 'certifications'}.`
    return false
  }
  return true
}

function markCurrentComplete() {
  if (!state.completedSteps.includes(currentStep.value!.key)) {
    state.completedSteps.push(currentStep.value!.key)
  }
}

function nextStepPath() {
  const item = currentStep.value!
  if (item.nextPath) {
    const explicit = applicableSteps.value.find(candidate => candidate.path === item.nextPath)
    if (explicit) return explicit.path
  }
  const index = applicableSteps.value.findIndex(candidate => candidate.key === item.key)
  return applicableSteps.value[index + 1]?.path || '/get-started/review'
}

function previousStepPath() {
  const index = applicableSteps.value.findIndex(candidate => candidate.key === currentStep.value!.key)
  return applicableSteps.value[Math.max(index - 1, 0)]?.path || '/get-started'
}

async function continueStep() {
  if (!validateCurrent()) return
  markCurrentComplete()
  saveState()
  await navigateTo(localizePath(nextStepPath()))
}

async function submitReview() {
  if (!validateCurrent()) return
  markCurrentComplete()

  const incomplete = applicableSteps.value.filter(item =>
    !['overview', 'submitted'].includes(item.kind) && !stepComplete(item)
  )
  if (incomplete.length) {
    ui.error = locale.value === 'es'
      ? 'Completa todas las páginas obligatorias antes de enviar.'
      : 'Complete every required page before submission.'
    await navigateTo(localizePath(incomplete[0].path))
    return
  }

  ui.pending = true
  ui.error = ''

  try {
    const acceptedAt = new Date().toISOString()
    const policyAcceptances = requiredDocuments.value.map(document => ({
      key: document.key,
      version: document.version,
      statusAtAcceptance: document.status,
      accepted: state.acceptedDocuments[document.key] === true,
      acceptedAt
    }))

    const payload = {
      schemaVersion: '1.0',
      selectedServices: selectedServices.value,
      answers: state.values,
      acknowledgments: state.acknowledgments,
      policyAcceptances,
      completedSteps: state.completedSteps,
      locale: locale.value,
      sourcePage: useRoute().path,
      activationRequested: false
    }

    const idempotencyKey = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const response = await $fetch<{
      accepted: boolean
      requestId: string
      state: string
      activationAllowed: boolean
      simulation?: boolean
      receivedAt?: string
    }>('/api/v1/website/onboarding/compliance', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
        'X-Request-ID': idempotencyKey
      },
      body: payload
    })

    state.receipt = {
      requestId: response.requestId,
      state: response.state,
      activationAllowed: response.activationAllowed,
      simulation: response.simulation,
      receivedAt: response.receivedAt
    }
    saveState()
    await navigateTo(localizePath('/get-started/submitted'))
  } catch (error: any) {
    const statusMessage = error?.data?.statusMessage || error?.statusMessage || error?.message
    ui.error = statusMessage || (locale.value === 'es'
      ? 'La solicitud no pudo enviarse. No se activó ningún servicio.'
      : 'The request could not be submitted. No service was activated.')
  } finally {
    ui.pending = false
  }
}

const currentLegalDocuments = computed(() =>
  (currentStep.value?.legalLinks || [])
    .map(key => documents.find(item => item.key === key))
    .filter(Boolean)
)

const serviceCards = computed(() =>
  currentStep.value?.key === 'overview'
    ? services
    : services.filter(service => currentStep.value?.requiredFor.includes(service.key))
)
</script>

<template>
  <div class="onboarding-page">
    <header class="onboarding-header">
      <div class="container onboarding-header-grid">
        <div>
          <span class="onboarding-kicker">{{ locale === 'es' ? 'Activación con revisión' : 'Reviewed activation' }}</span>
          <h1>{{ currentTitle }}</h1>
          <p>{{ currentDescription }}</p>
        </div>

        <aside class="progress-card">
          <span>{{ locale === 'es' ? 'Progreso aplicable' : 'Applicable progress' }}</span>
          <strong>{{ progressComplete }} / {{ progressTotal }}</strong>
          <div class="progress-track" aria-hidden="true">
            <i :style="{ width: `${progressTotal ? (progressComplete / progressTotal) * 100 : 0}%` }" />
          </div>
          <small>
            {{ locale === 'es'
              ? 'La aprobación nunca activa tráfico automáticamente.'
              : 'Approval never activates traffic automatically.' }}
          </small>
        </aside>
      </div>
    </header>

    <section class="capability-freeze">
      <div class="container freeze-grid">
        <strong>{{ locale === 'es' ? 'Capacidades reales deshabilitadas' : 'Live capabilities disabled' }}</strong>
        <span>SMS</span>
        <span>PSTN / VoIP</span>
        <span>AI voice</span>
        <span>Wholesale routing</span>
        <span>{{ locale === 'es' ? 'Aprovisionamiento automático' : 'Automatic provisioning' }}</span>
      </div>
    </section>

    <div class="container onboarding-layout">
      <aside class="step-navigation" aria-label="Onboarding steps">
        <div class="step-nav-heading">
          <strong>{{ locale === 'es' ? 'Páginas requeridas' : 'Required pages' }}</strong>
          <button type="button" @click="resetState">{{ locale === 'es' ? 'Reiniciar' : 'Reset' }}</button>
        </div>
        <ol>
          <li v-for="item in applicableSteps" :key="item.key">
            <NuxtLink
              :to="localizePath(item.path)"
              :class="{
                current: item.key === currentStep?.key,
                complete: stepComplete(item),
                locked: prerequisiteBlocker && applicableSteps.indexOf(item) > applicableSteps.indexOf(prerequisiteBlocker)
              }"
            >
              <i aria-hidden="true">{{ stepComplete(item) ? '✓' : applicableSteps.indexOf(item) + 1 }}</i>
              <span>{{ localized(item.title) }}</span>
            </NuxtLink>
          </li>
        </ol>
      </aside>

      <main class="onboarding-card">
        <div v-if="prerequisiteBlocker" class="blocked-panel">
          <span>{{ locale === 'es' ? 'Paso obligatorio pendiente' : 'Required step incomplete' }}</span>
          <h2>{{ localized(prerequisiteBlocker.title) }}</h2>
          <p>
            {{ locale === 'es'
              ? 'Debes completar las páginas anteriores aplicables antes de continuar.'
              : 'Complete the applicable earlier pages before continuing.' }}
          </p>
          <NuxtLink class="button" :to="localizePath(prerequisiteBlocker.path)">
            {{ locale === 'es' ? 'Completar paso pendiente' : 'Complete required step' }}
          </NuxtLink>
        </div>

        <template v-else>
          <div class="card-heading">
            <span>{{ locale === 'es' ? 'Revisión de cumplimiento' : 'Compliance review' }}</span>
            <h2>{{ currentTitle }}</h2>
            <p>{{ currentDescription }}</p>
          </div>

          <section v-if="currentStep?.kind === 'overview'" class="overview-content">
            <div class="service-grid">
              <article v-for="service in serviceCards" :key="service.key">
                <span>{{ service.key }}</span>
                <h3>{{ localized(service.label) }}</h3>
                <p>{{ localized(service.description) }}</p>
                <NuxtLink class="text-action" :to="localizePath(service.marketingPath)">
                  {{ locale === 'es' ? 'Ver servicio' : 'View service' }} →
                </NuxtLink>
              </article>
            </div>

            <div class="overview-notice">
              <strong>{{ locale === 'es' ? 'Qué ocurre después' : 'What happens next' }}</strong>
              <ol>
                <li>{{ locale === 'es' ? 'Verificación de empresa y autoridad' : 'Business and authority verification' }}</li>
                <li>{{ locale === 'es' ? 'Revisión específica por servicio' : 'Service-specific review' }}</li>
                <li>{{ locale === 'es' ? 'Aceptación de versiones exactas de políticas' : 'Exact policy-version acceptance' }}</li>
                <li>{{ locale === 'es' ? 'Revisión humana antes de aprovisionamiento' : 'Human review before provisioning' }}</li>
              </ol>
            </div>
          </section>

          <form
            v-else-if="currentStep?.kind === 'form'"
            class="onboarding-form"
            novalidate
            @submit.prevent="continueStep"
          >
            <div class="field-grid">
              <fieldset
                v-for="field in currentStep.fields"
                :key="field.key"
                :class="{ wide: ['textarea', 'multiselect'].includes(field.type) }"
              >
                <legend>
                  {{ localized(field.label) }}
                  <small v-if="!field.required">{{ locale === 'es' ? '(opcional)' : '(optional)' }}</small>
                </legend>

                <textarea
                  v-if="field.type === 'textarea'"
                  v-model="state.values[field.key]"
                  rows="5"
                  maxlength="5000"
                  :required="field.required"
                />

                <select
                  v-else-if="field.type === 'select'"
                  v-model="state.values[field.key]"
                  :required="field.required"
                >
                  <option value="" disabled>{{ locale === 'es' ? 'Selecciona una opción' : 'Select an option' }}</option>
                  <option v-for="option in field.options || []" :key="option.value" :value="option.value">
                    {{ localized(option.label) }}
                  </option>
                </select>

                <div v-else-if="field.type === 'multiselect'" class="option-grid">
                  <label v-for="option in field.options || []" :key="option.value" class="option-card">
                    <input v-model="state.values[field.key]" type="checkbox" :value="option.value">
                    <span>{{ localized(option.label) }}</span>
                  </label>
                </div>

                <input
                  v-else
                  v-model="state.values[field.key]"
                  :type="field.type"
                  :required="field.required"
                  maxlength="500"
                >

                <small v-if="field.help">{{ localized(field.help) }}</small>
                <small v-if="fieldError(field)" class="field-required">
                  {{ locale === 'es' ? 'Obligatorio' : 'Required' }}
                </small>
              </fieldset>
            </div>

            <div v-if="currentStep.acknowledgments.length" class="acknowledgments">
              <h3>{{ locale === 'es' ? 'Certificaciones obligatorias' : 'Required certifications' }}</h3>
              <label v-for="item in currentStep.acknowledgments" :key="item.key">
                <input v-model="state.acknowledgments[item.key]" type="checkbox">
                <span>{{ localized(item.label) }}</span>
              </label>
            </div>

            <div class="form-navigation">
              <NuxtLink class="button button-ghost" :to="localizePath(previousStepPath())">
                {{ locale === 'es' ? 'Atrás' : 'Back' }}
              </NuxtLink>
              <button class="button" type="submit">
                {{ locale === 'es' ? 'Guardar y continuar' : 'Save and continue' }}
              </button>
            </div>
          </form>

          <section v-else-if="currentStep?.kind === 'agreements'" class="agreements-panel">
            <p class="agreement-intro">
              {{ locale === 'es'
                ? 'Cada aceptación queda ligada a la clave y versión mostradas. Las políticas todavía marcadas como borrador bloquean producción aunque puedan revisarse en este entorno.'
                : 'Each acceptance is tied to the displayed key and version. Policies still marked as drafts block production even though they can be reviewed in this environment.' }}
            </p>

            <div class="agreement-list">
              <label v-for="item in requiredDocuments" :key="item.key" class="agreement-card">
                <input v-model="state.acceptedDocuments[item.key]" type="checkbox">
                <span>
                  <strong>{{ item.title[locale] }}</strong>
                  <small>{{ item.version }} · {{ item.status }}</small>
                  <NuxtLink :to="localizePath(item.path)" target="_blank">
                    {{ locale === 'es' ? 'Abrir documento' : 'Open document' }}
                  </NuxtLink>
                </span>
              </label>
            </div>

            <div class="acknowledgments">
              <label v-for="item in currentStep.acknowledgments" :key="item.key">
                <input v-model="state.acknowledgments[item.key]" type="checkbox">
                <span>{{ localized(item.label) }}</span>
              </label>
            </div>

            <div class="form-navigation">
              <NuxtLink class="button button-ghost" :to="localizePath(previousStepPath())">
                {{ locale === 'es' ? 'Atrás' : 'Back' }}
              </NuxtLink>
              <button class="button" type="button" @click="continueStep">
                {{ locale === 'es' ? 'Aceptar y continuar' : 'Accept and continue' }}
              </button>
            </div>
          </section>

          <section v-else-if="currentStep?.kind === 'review'" class="review-panel">
            <div class="review-summary">
              <article>
                <span>{{ locale === 'es' ? 'Servicios' : 'Services' }}</span>
                <strong>{{ selectedServices.map(key => services.find(item => item.key === key)?.label[locale]).join(', ') }}</strong>
              </article>
              <article>
                <span>{{ locale === 'es' ? 'Páginas completadas' : 'Completed pages' }}</span>
                <strong>{{ progressComplete }} / {{ progressTotal }}</strong>
              </article>
              <article>
                <span>{{ locale === 'es' ? 'Políticas aceptadas' : 'Policies accepted' }}</span>
                <strong>{{ requiredDocuments.filter(item => state.acceptedDocuments[item.key]).length }} / {{ requiredDocuments.length }}</strong>
              </article>
              <article>
                <span>{{ locale === 'es' ? 'Activación automática' : 'Automatic activation' }}</span>
                <strong>{{ locale === 'es' ? 'Deshabilitada' : 'Disabled' }}</strong>
              </article>
            </div>

            <div class="field-grid review-signature">
              <fieldset v-for="field in currentStep.fields" :key="field.key">
                <legend>{{ localized(field.label) }}</legend>
                <input v-model="state.values[field.key]" :type="field.type" required maxlength="500">
              </fieldset>
            </div>

            <div class="acknowledgments">
              <h3>{{ locale === 'es' ? 'Certificación final' : 'Final certification' }}</h3>
              <label v-for="item in currentStep.acknowledgments" :key="item.key">
                <input v-model="state.acknowledgments[item.key]" type="checkbox">
                <span>{{ localized(item.label) }}</span>
              </label>
            </div>

            <div class="submission-warning">
              <strong>{{ locale === 'es' ? 'Solo revisión manual' : 'Manual review only' }}</strong>
              <p>
                {{ locale === 'es'
                  ? 'Este envío no autoriza tráfico, aprovisionamiento, números, remitentes, llamadas, voces de IA ni clientes posteriores.'
                  : 'This submission does not authorize traffic, provisioning, numbers, senders, calling, AI voices, or downstream customers.' }}
              </p>
            </div>

            <div class="form-navigation">
              <NuxtLink class="button button-ghost" :to="localizePath(previousStepPath())">
                {{ locale === 'es' ? 'Atrás' : 'Back' }}
              </NuxtLink>
              <button class="button" type="button" :disabled="ui.pending" @click="submitReview">
                {{ ui.pending
                  ? (locale === 'es' ? 'Enviando…' : 'Submitting…')
                  : (locale === 'es' ? 'Enviar para revisión' : 'Submit for review') }}
              </button>
            </div>
          </section>

          <section v-else-if="currentStep?.kind === 'submitted'" class="submitted-panel">
            <div v-if="state.receipt">
              <span class="receipt-icon" aria-hidden="true">✓</span>
              <h2>{{ locale === 'es' ? 'Solicitud aceptada para revisión' : 'Request accepted for review' }}</h2>
              <p>
                {{ locale === 'es'
                  ? 'Guarda el identificador. El equipo de cumplimiento puede solicitar evidencia adicional.'
                  : 'Save the identifier. The compliance team may request additional evidence.' }}
              </p>
              <dl>
                <div><dt>Request ID</dt><dd>{{ state.receipt.requestId }}</dd></div>
                <div><dt>Status</dt><dd>{{ state.receipt.state }}</dd></div>
                <div><dt>Activation allowed</dt><dd>{{ state.receipt.activationAllowed ? 'yes' : 'no' }}</dd></div>
                <div v-if="state.receipt.simulation"><dt>Environment</dt><dd>non-production simulation</dd></div>
              </dl>
              <NuxtLink class="button" :to="localizePath('/')">
                {{ locale === 'es' ? 'Volver a Telnexa' : 'Return to Telnexa' }}
              </NuxtLink>
            </div>
            <div v-else class="blocked-panel">
              <h2>{{ locale === 'es' ? 'No existe una solicitud enviada' : 'No submitted request found' }}</h2>
              <NuxtLink class="button" :to="localizePath('/get-started/review')">
                {{ locale === 'es' ? 'Ir a revisión' : 'Go to review' }}
              </NuxtLink>
            </div>
          </section>

          <p v-if="ui.error" class="error-message" role="alert">{{ ui.error }}</p>
          <p v-if="ui.saved" class="saved-message" role="status">{{ locale === 'es' ? 'Guardado localmente' : 'Saved locally' }}</p>

          <aside v-if="currentLegalDocuments.length" class="legal-links">
            <strong>{{ locale === 'es' ? 'Lee antes de continuar' : 'Read before continuing' }}</strong>
            <NuxtLink
              v-for="item in currentLegalDocuments"
              :key="item.key"
              :to="localizePath(item.path)"
              target="_blank"
            >
              {{ item.title[locale] }} · {{ item.version }}
            </NuxtLink>
          </aside>

          <div v-if="currentStep?.kind === 'overview'" class="form-navigation">
            <NuxtLink
              v-if="currentStep.key !== 'overview'"
              class="button button-ghost"
              :to="localizePath(previousStepPath())"
            >
              {{ locale === 'es' ? 'Atrás' : 'Back' }}
            </NuxtLink>
            <button class="button" type="button" @click="continueStep">
              {{ locale === 'es' ? 'Comenzar requisitos' : 'Start requirements' }}
            </button>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.onboarding-page { min-height: 100vh; background: #f4f7fb; color: #07111f; }
.onboarding-header {
  padding: clamp(84px, 11vw, 132px) 0 60px;
  background:
    radial-gradient(circle at 82% 10%, rgba(139,92,246,.26), transparent 28%),
    radial-gradient(circle at 15% 10%, rgba(34,211,238,.22), transparent 30%),
    linear-gradient(145deg, #06101f, #132958 58%, #261b5c);
  color: white;
}
.onboarding-header-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 60px; align-items: end; }
.onboarding-kicker { color: #67e8f9; font-size: .78rem; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
.onboarding-header h1 { margin-top: 18px; max-width: 13ch; font-size: clamp(2.8rem, 6vw, 5.8rem); }
.onboarding-header p { max-width: 760px; margin-top: 24px; color: rgba(255,255,255,.73); font-size: 1.08rem; }
.progress-card { padding: 26px; border: 1px solid rgba(255,255,255,.17); border-radius: 26px; background: rgba(4,12,28,.54); }
.progress-card > span, .progress-card small { display: block; color: rgba(255,255,255,.62); }
.progress-card strong { display: block; margin-top: 8px; font-size: 2.3rem; }
.progress-track { height: 8px; margin: 18px 0; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.14); }
.progress-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #22d3ee, #8b5cf6); transition: width .25s ease; }
.capability-freeze { border-bottom: 1px solid #bad2f2; background: #eaf4ff; }
.freeze-grid { min-height: 58px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
.freeze-grid strong { margin-right: auto; }
.freeze-grid span { padding: 5px 9px; border-radius: 999px; background: white; color: #29456e; font-size: .73rem; font-weight: 800; }
.onboarding-layout { display: grid; grid-template-columns: 310px minmax(0, 1fr); gap: 32px; align-items: start; padding-block: 56px 110px; }
.step-navigation { position: sticky; top: 104px; max-height: calc(100vh - 130px); overflow: auto; padding: 20px; border: 1px solid rgba(7,17,31,.1); border-radius: 24px; background: white; }
.step-nav-heading { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid rgba(7,17,31,.1); }
.step-nav-heading button { border: 0; background: transparent; color: #2f68ff; font-weight: 750; cursor: pointer; }
.step-navigation ol { display: grid; gap: 5px; padding: 14px 0 0; margin: 0; list-style: none; }
.step-navigation a { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: center; padding: 9px; border-radius: 12px; color: #5f6f82; font-size: .83rem; }
.step-navigation a i { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 50%; background: #eef2f7; font-style: normal; font-size: .68rem; font-weight: 800; }
.step-navigation a.current { background: #edf3ff; color: #173a70; font-weight: 800; }
.step-navigation a.complete i { background: #d1fae5; color: #065f46; }
.step-navigation a.locked { opacity: .56; }
.onboarding-card { position: relative; min-height: 620px; padding: clamp(28px, 5vw, 58px); border: 1px solid rgba(7,17,31,.1); border-radius: 32px; background: white; box-shadow: 0 24px 70px rgba(7,17,31,.08); }
.card-heading > span { color: #2f68ff; font-size: .75rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.card-heading h2 { margin-top: 12px; max-width: 17ch; font-size: clamp(2rem, 4vw, 3.7rem); }
.card-heading p { max-width: 800px; margin-top: 18px; font-size: 1.02rem; }
.service-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin-top: 34px; }
.service-grid article { min-height: 250px; padding: 26px; border: 1px solid rgba(7,17,31,.1); border-radius: 24px; background: linear-gradient(155deg, #fff, #f5f8ff); }
.service-grid article > span { color: #8b5cf6; font-size: .7rem; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
.service-grid h3 { margin-top: 34px; }
.service-grid p { margin-top: 12px; }
.text-action { display: inline-block; margin-top: 20px; color: #2f68ff; font-weight: 800; }
.overview-notice { padding: 26px; margin-top: 24px; border-radius: 24px; background: #07111f; color: white; }
.overview-notice ol { display: grid; gap: 10px; padding-left: 20px; margin: 16px 0 0; color: rgba(255,255,255,.72); }
.onboarding-form, .agreements-panel, .review-panel { margin-top: 38px; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 20px; }
.field-grid fieldset { min-width: 0; padding: 0; border: 0; }
.field-grid fieldset.wide { grid-column: 1 / -1; }
.field-grid legend { display: block; margin-bottom: 8px; font-weight: 750; }
.field-grid legend small { color: #708094; font-weight: 500; }
.field-grid input:not([type="checkbox"]), .field-grid textarea, .field-grid select {
  width: 100%; min-height: 52px; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 14px; background: white; color: #07111f;
}
.field-grid textarea { min-height: 138px; resize: vertical; }
.field-grid input:focus, .field-grid textarea:focus, .field-grid select:focus { border-color: #2f68ff; outline: 3px solid rgba(47,104,255,.14); }
.field-required { display: block; margin-top: 6px; color: #a33b31; }
.option-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
.option-card { display: flex; gap: 10px; align-items: flex-start; padding: 15px; border: 1px solid #d9e1eb; border-radius: 15px; cursor: pointer; }
.option-card:has(input:checked) { border-color: #2f68ff; background: #edf3ff; }
.option-card input { margin-top: 4px; }
.acknowledgments { display: grid; gap: 12px; padding: 24px; margin-top: 28px; border: 1px solid #d8e2ef; border-radius: 22px; background: #f7faff; }
.acknowledgments h3 { margin-bottom: 4px; }
.acknowledgments label { display: flex; gap: 12px; align-items: flex-start; line-height: 1.5; }
.acknowledgments input { margin-top: 5px; }
.form-navigation { display: flex; justify-content: space-between; gap: 12px; margin-top: 34px; }
.agreement-intro { padding: 18px; border-left: 4px solid #f59e0b; background: #fff8e8; color: #684d10; }
.agreement-list { display: grid; gap: 12px; margin-top: 24px; }
.agreement-card { display: flex; gap: 14px; align-items: flex-start; padding: 20px; border: 1px solid #d9e1eb; border-radius: 18px; cursor: pointer; }
.agreement-card:has(input:checked) { border-color: #10b981; background: #ecfdf5; }
.agreement-card input { margin-top: 5px; }
.agreement-card strong, .agreement-card small, .agreement-card a { display: block; }
.agreement-card small { margin-top: 4px; color: #708094; }
.agreement-card a { margin-top: 8px; color: #2f68ff; font-weight: 800; }
.review-summary { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
.review-summary article { padding: 20px; border-radius: 18px; background: #f1f5fa; }
.review-summary span { display: block; color: #708094; font-size: .78rem; }
.review-summary strong { display: block; margin-top: 7px; }
.review-signature { margin-top: 28px; }
.submission-warning { padding: 22px; margin-top: 24px; border: 1px solid #f2c76b; border-radius: 18px; background: #fff7df; }
.submission-warning p { margin-top: 6px; color: #684d10; }
.blocked-panel { display: grid; justify-items: start; gap: 16px; padding: 30px; border: 1px solid #f2c76b; border-radius: 24px; background: #fff8e8; }
.blocked-panel > span { color: #8a5d00; font-size: .74rem; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
.submitted-panel { text-align: center; }
.submitted-panel > div { display: grid; justify-items: center; gap: 18px; }
.receipt-icon { display: grid; width: 74px; height: 74px; place-items: center; border-radius: 50%; background: #d1fae5; color: #047857; font-size: 2rem; }
.submitted-panel dl { width: min(620px, 100%); text-align: left; }
.submitted-panel dl div { display: grid; grid-template-columns: 170px 1fr; gap: 16px; padding: 13px 0; border-bottom: 1px solid #d9e1eb; }
.submitted-panel dd { margin: 0; overflow-wrap: anywhere; font-weight: 700; }
.error-message { padding: 15px; margin-top: 22px; border-radius: 14px; background: #fee2e2; color: #991b1b; }
.saved-message { position: absolute; top: 18px; right: 20px; padding: 7px 10px; border-radius: 999px; background: #d1fae5; color: #065f46; font-size: .75rem; font-weight: 800; }
.legal-links { display: grid; gap: 8px; padding: 20px; margin-top: 26px; border-radius: 18px; background: #edf3ff; }
.legal-links a { color: #234b8c; font-weight: 750; }
@media (max-width: 980px) {
  .onboarding-header-grid, .onboarding-layout { grid-template-columns: 1fr; }
  .step-navigation { position: static; max-height: none; }
  .step-navigation ol { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 680px) {
  .field-grid, .service-grid, .review-summary, .option-grid { grid-template-columns: 1fr; }
  .step-navigation ol { grid-template-columns: 1fr; }
  .onboarding-card { padding: 24px; border-radius: 24px; }
  .form-navigation { flex-direction: column-reverse; }
  .form-navigation .button { width: 100%; }
  .freeze-grid strong { width: 100%; margin-top: 12px; }
  .submitted-panel dl div { grid-template-columns: 1fr; gap: 2px; }
}
</style>
