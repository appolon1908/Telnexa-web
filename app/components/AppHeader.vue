<script setup lang="ts">
const route = useRoute()
const menuOpen = ref(false)
const locale = computed<'en' | 'es'>(() => route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en')
const localizePath = (path: string) => locale.value === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

const navigation = computed(() => [
  { label: locale.value === 'es' ? 'Voz' : 'Voice', to: localizePath('/voice/business-voip') },
  { label: 'SMS', to: localizePath('/messaging/business-sms') },
  { label: locale.value === 'es' ? 'Voz con IA' : 'AI Voice', to: localizePath('/voice/ai-voice') },
  { label: locale.value === 'es' ? 'Correo' : 'Email', to: localizePath('/email/business-email') },
  { label: locale.value === 'es' ? 'Mayorista' : 'Wholesale', to: localizePath('/wholesale') },
  { label: 'CRM', to: localizePath('/crm/communications-crm') },
  { label: locale.value === 'es' ? 'Desarrolladores' : 'Developers', to: localizePath('/developers') },
  { label: locale.value === 'es' ? 'Legal' : 'Legal', to: localizePath('/legal') }
])
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <NuxtLink class="brand" :to="localizePath('/')" aria-label="Telnexa home">
        <span class="brand-mark" aria-hidden="true">T</span>
        <span>Telnexa</span>
      </NuxtLink>

      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="primary-navigation"
        aria-label="Toggle navigation"
        @click="menuOpen = !menuOpen"
      >
        <span />
        <span />
      </button>

      <nav id="primary-navigation" class="primary-nav" :class="{ open: menuOpen }" aria-label="Primary navigation">
        <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to">
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="header-actions">
        <NuxtLink class="text-link" :to="localizePath('/login')">
          {{ locale === 'es' ? 'Ingresar' : 'Sign in' }}
        </NuxtLink>
        <NuxtLink class="button button-small" :to="localizePath('/get-started')">
          {{ locale === 'es' ? 'Comenzar' : 'Get started' }}
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
