<script setup lang="ts">
const year = new Date().getFullYear()
const route = useRoute()
const locale = computed<'en' | 'es'>(() => route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en')
const localizePath = (path: string) => locale.value === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path

const groups = computed(() => [
  {
    title: locale.value === 'es' ? 'Productos' : 'Products',
    links: [
      [locale.value === 'es' ? 'VoIP empresarial' : 'Business VoIP', '/voice/business-voip'],
      ['Business SMS', '/messaging/business-sms'],
      [locale.value === 'es' ? 'Voz con IA' : 'AI Voice', '/voice/ai-voice'],
      [locale.value === 'es' ? 'Servicios mayoristas' : 'Wholesale services', '/wholesale'],
      [locale.value === 'es' ? 'Correo empresarial' : 'Business Email', '/email/business-email'],
      [locale.value === 'es' ? 'CRM de comunicaciones' : 'Communications CRM', '/crm/communications-crm']
    ]
  },
  {
    title: locale.value === 'es' ? 'Plataforma' : 'Platform',
    links: [
      [locale.value === 'es' ? 'Sistemas privados' : 'Private systems', '/platform/private-communications-system'],
      [locale.value === 'es' ? 'Automatización' : 'Automation', '/automation/n8n-workflows'],
      [locale.value === 'es' ? 'Integraciones' : 'Integrations', '/integrations'],
      [locale.value === 'es' ? 'Desarrolladores' : 'Developers', '/developers'],
      [locale.value === 'es' ? 'Comenzar revisión' : 'Start service review', '/get-started']
    ]
  },
  {
    title: locale.value === 'es' ? 'Confianza' : 'Trust',
    links: [
      [locale.value === 'es' ? 'Seguridad' : 'Security', '/security'],
      [locale.value === 'es' ? 'Confiabilidad' : 'Reliability', '/reliability'],
      [locale.value === 'es' ? 'Cumplimiento' : 'Compliance', '/compliance'],
      [locale.value === 'es' ? 'Accesibilidad' : 'Accessibility', '/legal/accessibility'],
      [locale.value === 'es' ? 'Divulgación de seguridad' : 'Security disclosure', '/legal/security-disclosure']
    ]
  },
  {
    title: locale.value === 'es' ? 'Legal y privacidad' : 'Legal and privacy',
    links: [
      [locale.value === 'es' ? 'Centro legal' : 'Legal center', '/legal'],
      [locale.value === 'es' ? 'Términos' : 'Terms', '/legal/terms'],
      [locale.value === 'es' ? 'Privacidad' : 'Privacy', '/legal/privacy'],
      [locale.value === 'es' ? 'Mensajería y SMS' : 'Messaging and SMS', '/legal/messaging-policy'],
      [locale.value === 'es' ? 'Voz con IA' : 'AI voice policy', '/legal/ai-voice'],
      [locale.value === 'es' ? 'Mayoristas y revendedores' : 'Wholesale and reseller', '/legal/wholesale-reseller'],
      [locale.value === 'es' ? 'Preferencias de cookies' : 'Cookie settings', '/cookie-settings'],
      [locale.value === 'es' ? 'Solicitud de privacidad' : 'Privacy request', '/privacy-request']
    ]
  }
])
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <section class="footer-intro">
        <NuxtLink class="brand brand-footer" :to="localizePath('/')" aria-label="Telnexa home">
          <span class="brand-mark" aria-hidden="true">T</span>
          <span>Telnexa</span>
        </NuxtLink>
        <p>
          {{ locale === 'es'
            ? 'Voz, SMS, correo, CRM, IA y automatización como una plataforma segura de comunicaciones.'
            : 'Voice, SMS, email, CRM, AI, and automation built as one secure communications platform.' }}
        </p>
        <NuxtLink class="button button-light" :to="localizePath('/get-started')">
          {{ locale === 'es' ? 'Iniciar revisión' : 'Start service review' }}
        </NuxtLink>
      </section>

      <section v-for="group in groups" :key="group.title" class="footer-group">
        <h2>{{ group.title }}</h2>
        <NuxtLink v-for="link in group.links" :key="link[1]" :to="localizePath(link[1])">
          {{ link[0] }}
        </NuxtLink>
      </section>
    </div>

    <div class="container footer-bottom">
      <span>© {{ year }} Telnexa. {{ locale === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.' }}</span>
      <NuxtLink :to="locale === 'es' ? route.path.replace(/^\/es(?=\/|$)/, '') || '/' : (route.path === '/' ? '/es' : `/es${route.path}`)">
        {{ locale === 'es' ? 'English' : 'Español' }}
      </NuxtLink>
    </div>
  </footer>
</template>
