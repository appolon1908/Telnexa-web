<script setup lang="ts">
const config = useRuntimeConfig()
const consent = useCookie<'accepted' | 'declined' | null>('telnexa-analytics-consent', {
  sameSite: 'lax',
  secure: true,
  maxAge: 60 * 60 * 24 * 180,
  default: () => null
})

const visible = computed(() => consent.value === null)

function loadAnalytics() {
  if (!import.meta.client || !config.public.gtmId || document.querySelector('[data-telnexa-gtm]')) return

  const id = String(config.public.gtmId)
  if (!/^GTM-[A-Z0-9]+$/.test(id)) return

  const browserWindow = window as Window & { dataLayer?: unknown[] }
  browserWindow.dataLayer = browserWindow.dataLayer || []
  browserWindow.dataLayer.push({ event: 'telnexa_consent_granted', timestamp: Date.now() })

  const script = document.createElement('script')
  script.async = true
  script.dataset.telnexaGtm = 'true'
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)
}

function choose(value: 'accepted' | 'declined') {
  consent.value = value
  if (value === 'accepted') loadAnalytics()
}

onMounted(() => {
  if (consent.value === 'accepted') loadAnalytics()
})
</script>

<template>
  <aside v-if="visible" class="consent-banner" aria-label="Analytics preferences">
    <div>
      <strong>Your privacy, your choice.</strong>
      <p>Essential cookies keep the site working. Optional analytics help improve the experience and load only after consent.</p>
    </div>
    <div class="consent-actions">
      <button class="button button-ghost" type="button" @click="choose('declined')">Essential only</button>
      <button class="button" type="button" @click="choose('accepted')">Allow analytics</button>
    </div>
  </aside>
</template>
