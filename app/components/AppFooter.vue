<script setup lang="ts">
import { codestraProductNetwork, telnexaDomains } from '~/config/domains'

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
      [locale.value === 'es' ? 'Correo empresarial' : 'Business Email', '/email/business-email'],
      [locale.value === 'es' ? 'CRM de comunicaciones' : 'Communications CRM', '/crm/communications-crm']
    ]
  },
  {
    title: locale.value === 'es' ? 'Plataforma y confianza' : 'Platform and trust',
    links: [
      [locale.value === 'es' ? 'Sistemas privados' : 'Private systems', '/platform/private-communications-system'],
      [locale.value === 'es' ? 'Automatización' : 'Automation', '/automation/n8n-workflows'],
      [locale.value === 'es' ? 'Integraciones' : 'Integrations', '/integrations'],
      [locale.value === 'es' ? 'Seguridad' : 'Security', '/security'],
      [locale.value === 'es' ? 'Confiabilidad' : 'Reliability', '/reliability'],
      [locale.value === 'es' ? 'Cumplimiento' : 'Compliance', '/compliance']
    ]
  },
  {
    title: locale.value === 'es' ? 'Legal y privacidad' : 'Legal and privacy',
    links: [
      [locale.value === 'es' ? 'Centro legal' : 'Legal center', '/legal'],
      [locale.value === 'es' ? 'Términos' : 'Terms', '/legal/terms'],
      [locale.value === 'es' ? 'Privacidad' : 'Privacy', '/legal/privacy'],
      [locale.value === 'es' ? 'Mensajería y SMS' : 'Messaging and SMS', '/legal/messaging-policy'],
      [locale.value === 'es' ? 'Accesibilidad' : 'Accessibility', '/legal/accessibility'],
      [locale.value === 'es' ? 'Preferencias de cookies' : 'Cookie settings', '/cookie-settings']
    ]
  }
])
</script>

<template>
  <footer class="site-footer hz-site-footer">
    <div class="container hz-container">
      <div class="footer-grid hz-site-footer__grid">
        <section class="footer-intro hz-site-footer__intro" aria-labelledby="telnexa-footer-title">
          <NuxtLink class="brand brand-footer hz-brand" :to="localizePath('/')" aria-label="Telnexa home">
            <span class="brand-mark hz-brand__mark" aria-hidden="true">T</span>
            <span>Telnexa</span>
            <span class="hz-brand__domain">telnexa.co</span>
          </NuxtLink>
          <p class="hz-eyebrow">Codestra product network</p>
          <h2 id="telnexa-footer-title" class="hz-site-footer__title">
            {{ locale === 'es' ? 'Comunicaciones empresariales, como un solo sistema.' : 'Business communications, operated as one system.' }}
          </h2>
          <p>
            {{ locale === 'es'
              ? 'Voz, SMS, correo, CRM, IA y automatización como una plataforma segura de comunicaciones.'
              : 'Voice, SMS, email, CRM, AI, and automation built as one secure communications platform.' }}
          </p>
          <div class="hz-domain-list" aria-label="Telnexa domains">
            <a class="hz-domain-chip" :href="telnexaDomains.public">telnexa.co</a>
            <a class="hz-domain-chip" :href="telnexaDomains.portal">app.telnexa.co</a>
            <a class="hz-domain-chip" :href="telnexaDomains.status">status.telnexa.co</a>
            <a class="hz-domain-chip" :href="telnexaDomains.identity">auth.codestra.co</a>
          </div>
          <NuxtLink class="button button-light hz-button hz-button--primary" :to="localizePath('/get-started')">
            {{ locale === 'es' ? 'Iniciar revisión' : 'Start service review' }}
          </NuxtLink>
        </section>

        <nav v-for="group in groups" :key="group.title" class="footer-group" :aria-label="group.title">
          <h3 class="hz-site-footer__heading">{{ group.title }}</h3>
          <ul class="hz-site-footer__links">
            <li v-for="link in group.links" :key="link[1]">
              <NuxtLink class="hz-site-footer__link" :to="localizePath(link[1])">{{ link[0] }}</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>

      <div class="footer-bottom hz-site-footer__bottom">
        <span>© {{ year }} Telnexa. {{ locale === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.' }}</span>
        <div class="hz-footer-legal">
          <a v-for="product in codestraProductNetwork" :key="product.href" class="hz-site-footer__link" :href="product.href">
            {{ product.label }}
          </a>
          <NuxtLink class="hz-site-footer__link" :to="locale === 'es' ? route.path.replace(/^\/es(?=\/|$)/, '') || '/' : (route.path === '/' ? '/es' : `/es${route.path}`)">
            {{ locale === 'es' ? 'English' : 'Español' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
