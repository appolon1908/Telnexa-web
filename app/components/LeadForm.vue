<script setup lang="ts">
import formsManifest from '../../manifests/forms.json'

const props = defineProps<{
  formKey: string
  locale: 'en' | 'es'
}>()

interface FormContract {
  key: string
  endpoint: string
  label: string
  required: string[]
}

const route = useRoute()
const contract = computed<FormContract>(() => {
  const found = (formsManifest.forms as FormContract[]).find(form => form.key === props.formKey)
  if (!found) throw new Error(`Unknown form contract: ${props.formKey}`)
  return found
})

const values = reactive<Record<string, string>>({})
const privacyAccepted = ref(false)
const state = reactive({ pending: false, success: false, error: '' })

const labels = computed<Record<string, string>>(() => props.locale === 'es'
  ? {
      name: 'Nombre completo',
      email: 'Correo de trabajo',
      company: 'Empresa',
      message: '¿Cómo podemos ayudarte?',
      products: 'Productos o canales necesarios',
      employees: 'Número de empleados',
      partnerType: 'Tipo de colaboración',
      useCase: '¿Qué estás construyendo?',
      workflow: 'Flujo para automatizar',
      requirements: 'Requisitos de plataforma',
      systems: 'Sistemas a conectar',
      numberCount: 'Números a portar',
      subject: 'Asunto',
      requestType: 'Tipo de solicitud de privacidad',
      jurisdiction: 'País, estado o jurisdicción',
      details: 'Detalles de la solicitud'
    }
  : {
      name: 'Full name',
      email: 'Work email',
      company: 'Company',
      message: 'How can we help?',
      products: 'Products or channels needed',
      employees: 'Number of employees',
      partnerType: 'Partnership type',
      useCase: 'What are you building?',
      workflow: 'Workflow to automate',
      requirements: 'Platform requirements',
      systems: 'Systems to connect',
      numberCount: 'Numbers to port',
      subject: 'Subject',
      requestType: 'Privacy request type',
      jurisdiction: 'Country, state, or jurisdiction',
      details: 'Request details'
    }
)

const longFields = new Set(['message', 'products', 'useCase', 'workflow', 'requirements', 'systems', 'details'])
const selectOptions = computed<Record<string, string[]>>(() => ({
  employees: ['1–10', '11–50', '51–200', '201–1,000', '1,001+'],
  partnerType: props.locale === 'es'
    ? ['Socio de referencia', 'Revendedor', 'Socio tecnológico', 'Operador o proveedor', 'Otro']
    : ['Referral partner', 'Reseller', 'Technology partner', 'Carrier or provider', 'Other'],
  numberCount: ['1–10', '11–50', '51–250', '251–1,000', '1,001+'],
  requestType: props.locale === 'es'
    ? ['Acceso', 'Corrección', 'Eliminación', 'Portabilidad', 'Limitar el uso', 'No vender ni compartir', 'Revocar consentimiento', 'Otro']
    : ['Access', 'Correction', 'Deletion', 'Portability', 'Limit use', 'Do not sell or share', 'Withdraw consent', 'Other']
}))

const submitLabel = computed(() => {
  if (props.locale === 'en') return contract.value.label
  const translations: Record<string, string> = {
    contact: 'Contactar ventas',
    demo: 'Programar demostración',
    quote: 'Solicitar cotización',
    enterprise: 'Hablar con ventas empresariales',
    partner: 'Solicitar colaboración',
    'developer-access': 'Solicitar acceso de desarrollador',
    automation: 'Planificar automatización',
    'private-platform': 'Diseñar plataforma privada',
    integration: 'Planificar integración',
    porting: 'Iniciar portabilidad',
    support: 'Abrir solicitud de soporte',
    signup: 'Crear cuenta',
    newsletter: 'Suscribirse',
    'privacy-request': 'Enviar solicitud de privacidad'
  }
  return translations[contract.value.key] || contract.value.label
})

function inputType(field: string) {
  if (field === 'email') return 'email'
  return 'text'
}

function trackingContext() {
  const allowed = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  return Object.fromEntries(allowed
    .filter(key => typeof route.query[key] === 'string')
    .map(key => [key, String(route.query[key]).slice(0, 160)]))
}

async function submit() {
  state.pending = true
  state.error = ''
  state.success = false

  try {
    if (!privacyAccepted.value) {
      throw new Error(props.locale === 'es'
        ? 'Acepta el aviso de privacidad antes de enviar.'
        : 'Please accept the privacy notice before submitting.')
    }

    const payload = {
      ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])),
      sourcePage: route.path,
      locale: props.locale,
      consent: {
        privacyAccepted: true,
        marketingAccepted: false,
        capturedAt: new Date().toISOString()
      },
      attribution: trackingContext()
    }

    const idempotencyKey = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`

    await $fetch(contract.value.endpoint, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
        'X-Request-ID': idempotencyKey
      },
      body: payload
    })

    state.success = true
    Object.keys(values).forEach(key => { values[key] = '' })
    privacyAccepted.value = false

    if (import.meta.client) {
      const browserWindow = window as Window & { dataLayer?: unknown[] }
      browserWindow.dataLayer?.push({
        event: contract.value.key === 'privacy-request' ? 'privacy_request_submit' : 'generate_lead',
        form_type: contract.value.key,
        page_path: route.path
      })
    }
  } catch (error: any) {
    const statusMessage = error?.data?.statusMessage || error?.statusMessage || error?.message
    state.error = statusMessage || (props.locale === 'es'
      ? 'No se pudo enviar la solicitud.'
      : 'The request could not be submitted.')
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <form class="lead-form" novalidate @submit.prevent="submit">
    <div class="form-fields">
      <label v-for="field in contract.required" :key="field" :class="{ 'field-wide': longFields.has(field) }">
        <span>{{ labels[field] || field }}</span>

        <textarea
          v-if="longFields.has(field)"
          v-model="values[field]"
          :name="field"
          rows="4"
          maxlength="3000"
          required
        />

        <select v-else-if="selectOptions[field]" v-model="values[field]" :name="field" required>
          <option value="" disabled>{{ locale === 'es' ? 'Selecciona una opción' : 'Select an option' }}</option>
          <option v-for="option in selectOptions[field]" :key="option" :value="option">{{ option }}</option>
        </select>

        <input
          v-else
          v-model="values[field]"
          :type="inputType(field)"
          :name="field"
          :autocomplete="field === 'name' ? 'name' : field === 'email' ? 'email' : field === 'company' ? 'organization' : 'off'"
          maxlength="320"
          required
        >
      </label>

      <label v-if="contract.key !== 'newsletter' && contract.key !== 'privacy-request'">
        <span>{{ locale === 'es' ? 'Teléfono' : 'Phone' }} <small>({{ locale === 'es' ? 'opcional' : 'optional' }})</small></span>
        <input v-model="values.phone" type="tel" name="phone" autocomplete="tel" maxlength="40">
      </label>

      <label class="honeypot" aria-hidden="true">
        <span>Website</span>
        <input v-model="values.website" type="text" name="website" tabindex="-1" autocomplete="off">
      </label>

      <label class="checkbox-field field-wide">
        <input v-model="privacyAccepted" type="checkbox" required>
        <span>
          {{ locale === 'es' ? 'Acepto que Telnexa procese esta solicitud según la' : 'I agree that Telnexa may process this request according to the' }}
          <NuxtLink :to="locale === 'es' ? '/es/legal/privacy' : '/legal/privacy'">
            {{ locale === 'es' ? 'política de privacidad' : 'privacy policy' }}
          </NuxtLink>.
        </span>
      </label>
    </div>

    <button class="button form-submit" type="submit" :disabled="state.pending">
      {{ state.pending ? (locale === 'es' ? 'Enviando…' : 'Submitting…') : submitLabel }}
    </button>

    <p v-if="state.success" class="form-message form-success" role="status">
      {{ locale === 'es'
        ? 'Gracias. Tu solicitud fue aceptada y recibió un identificador para seguimiento.'
        : 'Thank you. Your request was accepted and assigned for follow-up.' }}
    </p>
    <p v-if="state.error" class="form-message form-error" role="alert">
      {{ state.error }}
    </p>
  </form>
</template>
