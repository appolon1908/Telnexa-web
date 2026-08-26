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

const labels: Record<string, string> = {
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
  subject: 'Subject'
}

const longFields = new Set(['message', 'products', 'useCase', 'workflow', 'requirements', 'systems'])
const selectOptions: Record<string, string[]> = {
  employees: ['1–10', '11–50', '51–200', '201–1,000', '1,001+'],
  partnerType: ['Referral partner', 'Reseller', 'Technology partner', 'Carrier or provider', 'Other'],
  numberCount: ['1–10', '11–50', '51–250', '251–1,000', '1,001+']
}

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
    if (!privacyAccepted.value) throw new Error('Please accept the privacy notice before submitting.')

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
        event: 'generate_lead',
        form_type: contract.value.key,
        page_path: route.path
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'The request could not be submitted.'
    state.error = message.includes('fetch')
      ? 'The service is temporarily unavailable. Your request was not lost or marked as accepted. Please try again.'
      : message
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
          <option value="" disabled>Select an option</option>
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

      <label v-if="contract.key !== 'newsletter'">
        <span>Phone <small>(optional)</small></span>
        <input v-model="values.phone" type="tel" name="phone" autocomplete="tel" maxlength="40">
      </label>

      <label class="honeypot" aria-hidden="true">
        <span>Website</span>
        <input v-model="values.website" type="text" name="website" tabindex="-1" autocomplete="off">
      </label>

      <label class="checkbox-field field-wide">
        <input v-model="privacyAccepted" type="checkbox" required>
        <span>I agree that Telnexa may process this request according to the <NuxtLink to="/legal/privacy">privacy policy</NuxtLink>.</span>
      </label>
    </div>

    <button class="button form-submit" type="submit" :disabled="state.pending">
      {{ state.pending ? 'Submitting…' : contract.label }}
    </button>

    <p v-if="state.success" class="form-message form-success" role="status">
      Thank you. Your request was accepted and assigned for follow-up.
    </p>
    <p v-if="state.error" class="form-message form-error" role="alert">
      {{ state.error }}
    </p>
  </form>
</template>
