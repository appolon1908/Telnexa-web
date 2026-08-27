<script setup lang="ts">
const route = useRoute()
const locale = computed<'en' | 'es'>(() => route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en')
const basePath = computed(() => route.path.replace(/^\/es(?=\/|$)/, '') || '/')
const localizePath = (path: string) => locale.value === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path

const context = computed(() => {
  if (basePath.value === '/voice/ai-voice') {
    return {
      title: { en: 'AI voice requires disclosure and consent review.', es: 'La voz con IA requiere revisión de divulgación y consentimiento.' },
      text: {
        en: 'Complete AI identity, contact-permission, voice-rights, recording, and human-handoff pages before review.',
        es: 'Completa páginas de identidad de IA, permiso de contacto, derechos de voz, grabación y transferencia humana antes de revisión.'
      },
      start: '/get-started/ai-voice',
      policy: '/legal/ai-voice'
    }
  }
  if (basePath.value.startsWith('/messaging/')) {
    return {
      title: { en: 'SMS activation starts with documented consent.', es: 'La activación SMS comienza con consentimiento documentado.' },
      text: {
        en: 'Complete use-case, opt-in, sender, opt-out, privacy, and policy acceptance pages before review.',
        es: 'Completa caso de uso, suscripción, remitente, exclusión, privacidad y aceptación de políticas antes de revisión.'
      },
      start: '/get-started/sms',
      policy: '/legal/messaging-policy'
    }
  }
  if (basePath.value.startsWith('/voice/')) {
    return {
      title: { en: 'Business VoIP requires identity and emergency readiness.', es: 'VoIP empresarial requiere identidad y preparación de emergencia.' },
      text: {
        en: 'Complete calling-purpose, emergency-services, number authorization, recording, privacy, and policy pages before review.',
        es: 'Completa propósito de llamadas, emergencias, autorización de números, grabación, privacidad y políticas antes de revisión.'
      },
      start: '/get-started/voice',
      policy: '/legal/voice-services'
    }
  }
  if (basePath.value === '/wholesale') {
    return {
      title: { en: 'Wholesale traffic must be fully disclosed.', es: 'El tráfico mayorista debe divulgarse completamente.' },
      text: {
        en: 'Complete downstream KYB, traffic profile, routing, identity, mitigation, privacy, and policy flow-down pages.',
        es: 'Completa verificación posterior, perfil de tráfico, rutas, identidad, mitigación, privacidad y traslado de políticas.'
      },
      start: '/get-started/wholesale',
      policy: '/legal/wholesale-reseller'
    }
  }
  return null
})

const text = <T extends { en: string; es: string }>(value: T) => value[locale.value]
</script>

<template>
  <section v-if="context" class="activation-notice" aria-label="Service activation requirements">
    <div class="container notice-grid">
      <div>
        <span>{{ locale === 'es' ? 'Revisión obligatoria antes de activar' : 'Required before activation' }}</span>
        <h2>{{ text(context.title) }}</h2>
        <p>{{ text(context.text) }}</p>
      </div>
      <div class="notice-actions">
        <NuxtLink class="button button-light" :to="localizePath(context.start)">
          {{ locale === 'es' ? 'Comenzar requisitos' : 'Start requirements' }}
        </NuxtLink>
        <NuxtLink class="notice-link" :to="localizePath(context.policy)">
          {{ locale === 'es' ? 'Leer política' : 'Read policy' }} →
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.activation-notice { padding: 56px 0; background: linear-gradient(135deg,#2f68ff,#7154e8); color: white; }
.notice-grid { display: grid; grid-template-columns: 1fr auto; gap: 44px; align-items: center; }
.activation-notice span { color: #bff5ff; font-size: .74rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.activation-notice h2 { max-width: 24ch; margin-top: 10px; font-size: clamp(1.8rem,4vw,3.2rem); }
.activation-notice p { max-width: 760px; margin-top: 12px; color: rgba(255,255,255,.76); }
.notice-actions { display: grid; justify-items: center; gap: 12px; }
.notice-link { color: white; font-weight: 800; }
@media (max-width: 800px) {
  .notice-grid { grid-template-columns: 1fr; }
  .notice-actions { justify-items: start; }
}
</style>
