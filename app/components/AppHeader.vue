<script setup lang="ts">
import { telnexaDomains } from '~/config/domains'

const route = useRoute()
const menuOpen = ref(false)
const locale = computed<'en' | 'es'>(() => route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en')
const localizePath = (path: string) => locale.value === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') menuOpen.value = false
}

onMounted(() => window.addEventListener('keydown', closeOnEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', closeOnEscape))

const navigation = computed(() => [
  { label: locale.value === 'es' ? 'Voz' : 'Voice', to: localizePath('/voice/business-voip') },
  { label: 'SMS', to: localizePath('/messaging/business-sms') },
  { label: locale.value === 'es' ? 'Voz con IA' : 'AI Voice', to: localizePath('/voice/ai-voice') },
  { label: locale.value === 'es' ? 'Correo' : 'Email', to: localizePath('/email/business-email') },
  { label: locale.value === 'es' ? 'Mayorista' : 'Wholesale', to: localizePath('/wholesale') },
  { label: 'CRM', to: localizePath('/crm/communications-crm') },
  { label: locale.value === 'es' ? 'Desarrolladores' : 'Developers', to: localizePath('/developers') }
])
</script>

<template>
  <header class="site-header hz-site-header">
    <div class="container header-inner hz-container hz-site-header__inner">
      <NuxtLink class="brand hz-brand" :to="localizePath('/')" aria-label="Telnexa home">
        <span class="brand-mark hz-brand__mark" aria-hidden="true">T</span>
        <span>Telnexa</span>
        <span class="hz-brand__domain">telnexa.co</span>
      </NuxtLink>

      <nav class="primary-nav hz-site-nav hz-site-nav--desktop" aria-label="Primary navigation">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          class="hz-site-nav__link"
          :to="item.to"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="header-actions hz-header-actions">
        <a
          class="text-link hz-button hz-button--secondary hz-button--small"
          :href="telnexaDomains.portal"
          rel="noopener noreferrer"
        >
          {{ locale === 'es' ? 'Portal de clientes' : 'Client portal' }}
        </a>
        <NuxtLink class="button button-small hz-button hz-button--primary hz-button--small" :to="localizePath('/get-started')">
          {{ locale === 'es' ? 'Comenzar' : 'Get started' }}
        </NuxtLink>
        <button
          class="menu-toggle hz-button hz-button--secondary hz-menu-button"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="primary-navigation-mobile"
          :aria-label="menuOpen ? (locale === 'es' ? 'Cerrar navegación' : 'Close navigation') : (locale === 'es' ? 'Abrir navegación' : 'Open navigation')"
          @click="menuOpen = !menuOpen"
        >
          {{ menuOpen ? '×' : '☰' }}
        </button>
      </div>
    </div>

    <div v-if="menuOpen" id="primary-navigation-mobile" class="hz-mobile-panel" data-open="true">
      <nav class="hz-container hz-mobile-panel__inner" aria-label="Mobile navigation">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          class="hz-site-nav__link"
          :to="item.to"
        >
          {{ item.label }}
        </NuxtLink>
        <a class="hz-site-nav__link" :href="telnexaDomains.portal" rel="noopener noreferrer">
          {{ locale === 'es' ? 'Portal de clientes' : 'Client portal' }}
        </a>
        <a class="hz-site-nav__link" :href="telnexaDomains.status" rel="noopener noreferrer">
          {{ locale === 'es' ? 'Estado del servicio' : 'Service status' }}
        </a>
      </nav>
    </div>
  </header>
</template>
