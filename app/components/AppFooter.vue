<script setup lang="ts">
const year = new Date().getFullYear()

const groups = [
  {
    title: 'Products',
    links: [
      ['Business VoIP', '/voice/business-voip'],
      ['Business SMS', '/messaging/business-sms'],
      ['Business Email', '/email/business-email'],
      ['Communications CRM', '/crm/communications-crm']
    ]
  },
  {
    title: 'Platform',
    links: [
      ['Private systems', '/platform/private-communications-system'],
      ['Automation', '/automation/n8n-workflows'],
      ['Integrations', '/integrations'],
      ['Developers', '/developers']
    ]
  },
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['Security', '/security'],
      ['Reliability', '/reliability'],
      ['Contact', '/contact']
    ]
  },
  {
    title: 'Legal',
    links: [
      ['Terms', '/legal/terms'],
      ['Privacy', '/legal/privacy'],
      ['Cookies', '/legal/cookies'],
      ['Acceptable use', '/legal/acceptable-use']
    ]
  }
]
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <section class="footer-intro">
        <NuxtLink class="brand brand-footer" to="/" aria-label="Telnexa home">
          <span class="brand-mark" aria-hidden="true">T</span>
          <span>Telnexa</span>
        </NuxtLink>
        <p>Voice, messaging, email, CRM, and automation built as one secure communications platform.</p>
        <NuxtLink class="button button-light" to="/request-quote">Build your solution</NuxtLink>
      </section>

      <section v-for="group in groups" :key="group.title" class="footer-group">
        <h2>{{ group.title }}</h2>
        <NuxtLink v-for="link in group.links" :key="link[1]" :to="link[1]">
          {{ link[0] }}
        </NuxtLink>
      </section>
    </div>

    <div class="container footer-bottom">
      <span>© {{ year }} Telnexa. All rights reserved.</span>
      <span>English · Español</span>
    </div>
  </footer>
</template>
