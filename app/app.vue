<script setup lang="ts">
const route = useRoute()
const locale = computed<'en' | 'es'>(() =>
  route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en'
)

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
    'data-horizon-root': '',
    'data-horizon-theme': 'telnexa',
    'data-horizon-appearance': 'dark'
  }
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
