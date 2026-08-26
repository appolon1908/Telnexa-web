<script setup lang="ts">
const route = useRoute()
const menuOpen = ref(false)

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

const navigation = [
  { label: 'Voice', to: '/voice/business-voip' },
  { label: 'SMS', to: '/messaging/business-sms' },
  { label: 'Email', to: '/email/business-email' },
  { label: 'CRM', to: '/crm/communications-crm' },
  { label: 'Automation', to: '/automation/n8n-workflows' },
  { label: 'Developers', to: '/developers' }
]
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <NuxtLink class="brand" to="/" aria-label="Telnexa home">
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
        <NuxtLink class="text-link" to="/login">Sign in</NuxtLink>
        <NuxtLink class="button button-small" to="/schedule-demo">Book a demo</NuxtLink>
      </div>
    </div>
  </header>
</template>
