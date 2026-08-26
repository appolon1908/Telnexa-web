<script setup lang="ts">
const { page, content, locale, labels, englishUrl, spanishUrl, manifest } = usePageCatalog()
const config = useRuntimeConfig()

const description = computed(() => `${page.value.title}. ${locale.value === 'es' ? labels.value.lead : content.value.lead}`)
const canonicalUrl = computed(() => locale.value === 'es' ? spanishUrl.value : englishUrl.value)
const title = computed(() => `${page.value.title} | Telnexa`)
const localize = (path: string) => locale.value === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path

const primaryAction = computed(() => {
  if (page.value.form) return { label: locale.value === 'es' ? 'Comenzar' : 'Get started', to: '#lead-form', external: false }
  if (page.value.path === '/login' || page.value.path === '/portal') {
    return { label: locale.value === 'es' ? 'Abrir portal seguro' : 'Open secure portal', to: String(config.public.portalUrl), external: true }
  }
  if (page.value.path === '/status') {
    return { label: locale.value === 'es' ? 'Ver estado' : 'View live status', to: String(config.public.statusUrl), external: true }
  }
  return { label: labels.value.primary, to: localize('/schedule-demo'), external: false }
})

const relatedPages = computed(() => (manifest.pages as Array<{ path: string; title: string; category: string; indexable: boolean }>)
  .filter(item => item.indexable && item.path !== page.value.path && item.category === page.value.category)
  .slice(0, 4))

const pageSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': page.value.category === 'legal' ? 'WebPage' : 'Product',
  name: page.value.title,
  description: description.value,
  url: canonicalUrl.value,
  brand: { '@type': 'Brand', name: 'Telnexa' },
  provider: { '@type': 'Organization', name: 'Telnexa', url: String(config.public.siteUrl) }
}))

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
  robots: computed(() => page.value.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow')
})

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
    { rel: 'alternate', hreflang: 'en', href: englishUrl.value },
    { rel: 'alternate', hreflang: 'es', href: spanishUrl.value },
    { rel: 'alternate', hreflang: 'x-default', href: englishUrl.value }
  ],
  script: [{ type: 'application/ld+json', children: JSON.stringify(pageSchema.value) }]
}))
</script>

<template>
  <div>
    <section class="hero-section" :class="`theme-${page.category}`">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">{{ locale === 'es' ? labels.platform : content.eyebrow }}</span>
          <h1>{{ page.title }}</h1>
          <p class="hero-lead">{{ locale === 'es' ? labels.lead : content.lead }}</p>
          <div class="hero-actions">
            <a v-if="primaryAction.external" class="button" :href="primaryAction.to" rel="noopener noreferrer">
              {{ primaryAction.label }}
            </a>
            <NuxtLink v-else class="button" :to="primaryAction.to">
              {{ primaryAction.label }}
            </NuxtLink>
            <NuxtLink class="button button-ghost" :to="localize('/platform')">
              {{ labels.secondary }}
            </NuxtLink>
          </div>
          <ul class="hero-proof" aria-label="Platform highlights">
            <li>API-first</li>
            <li>Odoo connected</li>
            <li>n8n ready</li>
            <li>Private deployment options</li>
          </ul>
        </div>

        <div class="signal-stage" aria-label="Telnexa communications workflow preview">
          <div class="stage-orbit orbit-one" />
          <div class="stage-orbit orbit-two" />
          <div class="stage-card stage-main">
            <div class="stage-label"><span class="live-dot" /> Communication command center</div>
            <div class="channel-row">
              <span>Voice</span><strong>Ready</strong>
            </div>
            <div class="channel-row">
              <span>SMS</span><strong>Governed</strong>
            </div>
            <div class="channel-row">
              <span>Email</span><strong>Connected</strong>
            </div>
            <div class="channel-row">
              <span>CRM</span><strong>Synced</strong>
            </div>
          </div>
          <div class="stage-card stage-float stage-float-one">
            <span>Automation</span>
            <strong>Workflow completed</strong>
          </div>
          <div class="stage-card stage-float stage-float-two">
            <span>Customer record</span>
            <strong>Next action assigned</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-light">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow">{{ labels.benefits }}</span>
          <h2>{{ locale === 'es' ? 'Todo lo necesario para comunicarte con claridad.' : `Everything ${page.title} needs to work beautifully.` }}</h2>
        </div>
        <div class="card-grid three-column">
          <article v-for="benefit in content.benefits" :key="benefit.title" class="feature-card">
            <div class="feature-icon" aria-hidden="true">✦</div>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-dark">
      <div class="container split-grid">
        <div>
          <span class="eyebrow eyebrow-light">{{ labels.workflow }}</span>
          <h2>From customer signal to completed business action.</h2>
          <p class="section-lead">Telnexa keeps public traffic, policy, business records, and automation in clearly separated layers.</p>
        </div>
        <ol class="workflow-list">
          <li v-for="(step, index) in content.workflow" :key="step">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <strong>{{ step }}</strong>
          </li>
        </ol>
      </div>
    </section>

    <section class="section integration-section">
      <div class="container integration-grid">
        <div class="integration-copy">
          <span class="eyebrow">{{ labels.integrations }}</span>
          <h2>One safe path from your website to your operating systems.</h2>
          <p>Forms and API requests enter through Caddy and Kong, are validated by middleware, and only then reach Odoo or approved n8n workflows. The browser never receives internal credentials.</p>
          <NuxtLink class="text-action" :to="localize('/integrations/odoo-n8n')">Explore the integration architecture →</NuxtLink>
        </div>
        <div class="architecture-card" aria-label="Integration architecture">
          <div>Nuxt / Vue</div><span>HTTPS</span>
          <div>Caddy + Kong</div><span>Policy</span>
          <div>Codestra Middleware</div><span>Durable events</span>
          <div class="architecture-targets"><b>Odoo CRM</b><b>n8n</b><b>Providers</b></div>
        </div>
      </div>
    </section>

    <section v-if="relatedPages.length" class="section section-soft">
      <div class="container">
        <div class="section-heading compact">
          <span class="eyebrow">Keep exploring</span>
          <h2>Related Telnexa capabilities</h2>
        </div>
        <div class="card-grid four-column">
          <NuxtLink v-for="related in relatedPages" :key="related.path" class="related-card" :to="localize(related.path)">
            <span>{{ related.category }}</span>
            <strong>{{ related.title }}</strong>
            <i aria-hidden="true">→</i>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section v-if="page.form" id="lead-form" class="section form-section">
      <div class="container form-grid">
        <div>
          <span class="eyebrow">Start the conversation</span>
          <h2>Tell us what you need.</h2>
          <p class="section-lead">Your submission is validated, assigned a request ID, and delivered through the governed middleware workflow.</p>
        </div>
        <LeadForm :form-key="page.form" :locale="locale" />
      </div>
    </section>

    <section class="section faq-section">
      <div class="container">
        <div class="section-heading compact">
          <span class="eyebrow">Frequently asked</span>
          <h2>Practical answers before you start.</h2>
        </div>
        <div class="faq-list">
          <details>
            <summary>Can Telnexa work with our existing systems?</summary>
            <p>Yes. Integrations are designed through a middleware boundary so existing CRM, automation, identity, and provider systems remain controlled.</p>
          </details>
          <details>
            <summary>Can we begin with only one channel?</summary>
            <p>Yes. Voice, SMS, email, CRM, and automation can be introduced in stages while preserving one long-term architecture.</p>
          </details>
          <details>
            <summary>Does submitting a form activate live messaging or calling?</summary>
            <p>No. Website intake creates a governed sales or support workflow. Live delivery and provider capabilities require separate approval and activation.</p>
          </details>
        </div>
      </div>
    </section>

    <section class="final-cta">
      <div class="container final-cta-inner">
        <div>
          <span class="eyebrow eyebrow-light">{{ labels.final }}</span>
          <h2>Make every conversation easier to start, manage, and improve.</h2>
        </div>
        <NuxtLink class="button button-light" :to="localize('/request-quote')">Request a solution plan</NuxtLink>
      </div>
    </section>
  </div>
</template>
