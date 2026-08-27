<script setup lang="ts">
const {
  locale,
  document: complianceDocument,
  documents,
  legalEntity,
  legalVersions,
  localizePath,
  canonicalUrl,
  englishUrl,
  spanishUrl
} = useComplianceCatalog()

const config = useRuntimeConfig()

if (!complianceDocument.value) {
  throw createError({ statusCode: 404, statusMessage: 'Compliance document not found' })
}

const copy = computed(() => {
  const item = complianceDocument.value!
  return {
    title: item.title[locale.value],
    summary: item.summary[locale.value],
    sections: item.sections.map(section => ({
      heading: section.heading[locale.value],
      paragraphs: section.paragraphs[locale.value],
      bullets: section.bullets[locale.value]
    }))
  }
})

const statusLabel = computed(() => {
  const status = complianceDocument.value!.status
  if (status === 'approved') return locale.value === 'es' ? 'Aprobado para publicación' : 'Approved for publication'
  return locale.value === 'es' ? 'Borrador — revisión legal requerida' : 'Draft — legal review required'
})

const related = computed(() => {
  const current = complianceDocument.value!
  const candidates = documents.filter(item => item.key !== current.key)
  const scored = candidates.map(item => ({
    item,
    score:
      item.requiredFor.filter(value => current.requiredFor.includes(value)).length * 3 +
      item.audiences.filter(value => current.audiences.includes(value)).length
  }))
  return scored.sort((a, b) => b.score - a.score || a.item.title.en.localeCompare(b.item.title.en))
    .slice(0, current.key === 'legal-center' ? 30 : 6)
    .map(entry => entry.item)
})

const approvedEntity = computed(() =>
  legalEntity.status === 'approved' &&
  !String(legalEntity.legalName).includes('_REQUIRED')
)

const analyticsConsent = useCookie<'accepted' | 'declined' | null>('telnexa-analytics-consent', {
  sameSite: 'lax',
  secure: true,
  maxAge: 60 * 60 * 24 * 180,
  default: () => null
})
const cookieMessage = ref('')

function setAnalyticsConsent(value: 'accepted' | 'declined') {
  analyticsConsent.value = value
  cookieMessage.value = value === 'accepted'
    ? (locale.value === 'es' ? 'Analítica opcional permitida.' : 'Optional analytics allowed.')
    : (locale.value === 'es' ? 'Solo cookies esenciales.' : 'Essential cookies only.')
}

const title = computed(() => `${copy.value.title} | Telnexa`)
const description = computed(() => copy.value.summary)
const robots = computed(() => complianceDocument.value!.indexable
  ? 'index, follow, max-image-preview:large'
  : 'noindex, nofollow, noarchive'
)

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
  robots
})

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
    { rel: 'alternate', hreflang: 'en', href: englishUrl.value },
    { rel: 'alternate', hreflang: 'es', href: spanishUrl.value },
    { rel: 'alternate', hreflang: 'x-default', href: englishUrl.value }
  ],
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: copy.value.title,
      description: copy.value.summary,
      url: canonicalUrl.value,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Telnexa',
        url: String(config.public.siteUrl)
      },
      dateModified: complianceDocument.value!.effectiveDate || '2026-08-27'
    })
  }]
}))
</script>

<template>
  <article class="compliance-page">
    <header class="compliance-hero">
      <div class="container compliance-hero-grid">
        <div>
          <NuxtLink class="legal-kicker" :to="localizePath('/legal')">
            {{ locale === 'es' ? 'Centro legal y de cumplimiento' : 'Legal and compliance center' }}
          </NuxtLink>
          <h1>{{ copy.title }}</h1>
          <p class="compliance-summary">{{ copy.summary }}</p>
        </div>

        <aside class="document-meta" aria-label="Document status">
          <span :class="['status-chip', { approved: complianceDocument?.status === 'approved' }]">
            {{ statusLabel }}
          </span>
          <dl>
            <div>
              <dt>{{ locale === 'es' ? 'Versión' : 'Version' }}</dt>
              <dd>{{ complianceDocument?.version }}</dd>
            </div>
            <div>
              <dt>{{ locale === 'es' ? 'Vigencia' : 'Effective' }}</dt>
              <dd>{{ complianceDocument?.effectiveDate || (locale === 'es' ? 'Pendiente de aprobación' : 'Pending approval') }}</dd>
            </div>
            <div>
              <dt>{{ locale === 'es' ? 'Entidad' : 'Entity' }}</dt>
              <dd>{{ approvedEntity ? legalEntity.legalName : (locale === 'es' ? 'Pendiente de publicación' : 'Pending publication') }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </header>

    <section v-if="complianceDocument?.status !== 'approved'" class="draft-warning">
      <div class="container">
        <strong>{{ locale === 'es' ? 'No usar como contrato de producción todavía.' : 'Not yet approved for production contracting.' }}</strong>
        <p>
          {{ locale === 'es'
            ? 'La implementación bloquea el despliegue de producción hasta que la entidad responsable, la fecha de vigencia, la versión inmutable y la aprobación legal estén completas.'
            : 'The implementation blocks production deployment until the responsible entity, effective date, immutable version, and legal approval are complete.' }}
        </p>
      </div>
    </section>

    <div class="container compliance-layout">
      <main class="document-body">
        <section v-for="section in copy.sections" :key="section.heading" class="legal-section">
          <h2>{{ section.heading }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.bullets.length">
            <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>

        <section v-if="complianceDocument?.key === 'cookie-settings'" class="preference-panel">
          <h2>{{ locale === 'es' ? 'Preferencias de analítica' : 'Analytics preferences' }}</h2>
          <p>
            {{ locale === 'es'
              ? 'Las cookies esenciales permanecen activas. La analítica opcional solo se carga después de tu elección.'
              : 'Essential cookies remain active. Optional analytics loads only after your choice.' }}
          </p>
          <div class="preference-actions">
            <button class="button button-ghost" type="button" @click="setAnalyticsConsent('declined')">
              {{ locale === 'es' ? 'Solo esenciales' : 'Essential only' }}
            </button>
            <button class="button" type="button" @click="setAnalyticsConsent('accepted')">
              {{ locale === 'es' ? 'Permitir analítica' : 'Allow analytics' }}
            </button>
          </div>
          <p v-if="cookieMessage" role="status">{{ cookieMessage }}</p>
        </section>

        <section
          v-if="['privacy-request', 'do-not-sell-or-share'].includes(complianceDocument?.key || '')"
          class="privacy-form-panel"
        >
          <h2>{{ locale === 'es' ? 'Enviar una solicitud verificable' : 'Submit a verifiable request' }}</h2>
          <p>
            {{ locale === 'es'
              ? 'No incluyas contraseñas, números de tarjeta, identificadores gubernamentales ni registros médicos en el formulario.'
              : 'Do not include passwords, payment-card numbers, government identifiers, or medical records in the form.' }}
          </p>
          <LeadForm form-key="privacy-request" :locale="locale" />
        </section>

        <section v-if="complianceDocument?.key === 'version-history'" class="version-panel">
          <h2>{{ locale === 'es' ? 'Versiones aprobadas archivadas' : 'Archived approved versions' }}</h2>
          <p v-if="!legalVersions.versions.length">
            {{ locale === 'es'
              ? 'Todavía no existen versiones aprobadas. El despliegue de producción permanece bloqueado.'
              : 'No approved versions exist yet. Production deployment remains blocked.' }}
          </p>
          <ol v-else>
            <li v-for="version in legalVersions.versions" :key="`${version.key}-${version.version}`">
              <strong>{{ version.key }} · {{ version.version }}</strong>
              <span>{{ version.effectiveDate }} · {{ version.sha256 }}</span>
            </li>
          </ol>
        </section>
      </main>

      <aside class="document-sidebar">
        <section>
          <h2>{{ locale === 'es' ? 'Aplica a' : 'Applies to' }}</h2>
          <div class="tag-list">
            <span v-for="audience in complianceDocument?.audiences" :key="audience">{{ audience }}</span>
          </div>
        </section>

        <section v-if="complianceDocument?.sourceRefs.length">
          <h2>{{ locale === 'es' ? 'Referencias regulatorias' : 'Regulatory references' }}</h2>
          <p>
            {{ locale === 'es'
              ? 'Las referencias respaldan el diseño de controles, pero no sustituyen asesoría jurídica específica.'
              : 'References support control design but do not replace jurisdiction-specific legal advice.' }}
          </p>
          <div class="tag-list">
            <span v-for="source in complianceDocument?.sourceRefs" :key="source">{{ source }}</span>
          </div>
        </section>

        <section>
          <h2>{{ locale === 'es' ? 'Contacto' : 'Contact' }}</h2>
          <p>{{ legalEntity.privacyEmail }}</p>
          <p>{{ legalEntity.abuseEmail }}</p>
          <p>{{ legalEntity.accessibilityEmail }}</p>
        </section>

        <NuxtLink class="button sidebar-cta" :to="localizePath('/get-started')">
          {{ locale === 'es' ? 'Iniciar revisión de servicio' : 'Start service review' }}
        </NuxtLink>
      </aside>
    </div>

    <section class="related-policies">
      <div class="container">
        <div class="related-heading">
          <span>{{ locale === 'es' ? 'Documentos relacionados' : 'Related documents' }}</span>
          <h2>{{ locale === 'es' ? 'Revisa las obligaciones aplicables.' : 'Review the policies that apply.' }}</h2>
        </div>
        <div class="policy-grid">
          <NuxtLink
            v-for="item in related"
            :key="item.key"
            class="policy-card"
            :to="localizePath(item.path)"
          >
            <span>{{ item.status === 'approved' ? 'Approved' : 'Draft' }}</span>
            <strong>{{ item.title[locale] }}</strong>
            <p>{{ item.summary[locale] }}</p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.compliance-page { background: #f7f9fc; color: #07111f; }
.compliance-hero {
  padding: clamp(88px, 12vw, 150px) 0 74px;
  background:
    radial-gradient(circle at 84% 18%, rgba(34, 211, 238, .2), transparent 30%),
    linear-gradient(145deg, #06101f, #102958 62%, #123d63);
  color: white;
}
.compliance-hero-grid { display: grid; grid-template-columns: 1.25fr .75fr; gap: 64px; align-items: end; }
.legal-kicker { display: inline-block; margin-bottom: 24px; color: #67e8f9; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: .78rem; }
.compliance-hero h1 { max-width: 12ch; font-size: clamp(3rem, 7vw, 6.5rem); }
.compliance-summary { max-width: 760px; margin-top: 26px; color: rgba(255,255,255,.76); font-size: clamp(1.08rem, 2vw, 1.34rem); }
.document-meta { padding: 26px; border: 1px solid rgba(255,255,255,.16); border-radius: 26px; background: rgba(4,12,28,.48); backdrop-filter: blur(18px); }
.status-chip { display: inline-flex; padding: 8px 12px; border-radius: 999px; background: #fff2cc; color: #6b4900; font-size: .78rem; font-weight: 800; }
.status-chip.approved { background: #d1fae5; color: #065f46; }
.document-meta dl { margin: 24px 0 0; }
.document-meta dl div { display: grid; grid-template-columns: 100px 1fr; gap: 12px; padding: 12px 0; border-top: 1px solid rgba(255,255,255,.12); }
.document-meta dt { color: rgba(255,255,255,.58); }
.document-meta dd { margin: 0; font-weight: 700; }
.draft-warning { padding: 22px 0; background: #fff5d9; border-bottom: 1px solid #efcf74; }
.draft-warning .container { display: grid; grid-template-columns: max-content 1fr; gap: 24px; align-items: center; }
.draft-warning p { color: #684d10; }
.compliance-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: clamp(40px, 8vw, 96px); padding-block: 90px; }
.document-body { min-width: 0; }
.legal-section { padding: 0 0 46px; margin-bottom: 46px; border-bottom: 1px solid rgba(7,17,31,.12); }
.legal-section h2, .preference-panel h2, .privacy-form-panel h2, .version-panel h2 { max-width: 20ch; font-size: clamp(1.9rem, 4vw, 3.1rem); }
.legal-section p, .legal-section li { font-size: 1.04rem; line-height: 1.75; }
.legal-section p { margin-top: 18px; }
.legal-section ul { display: grid; gap: 12px; padding-left: 24px; margin: 24px 0 0; }
.document-sidebar { align-self: start; position: sticky; top: 108px; display: grid; gap: 18px; }
.document-sidebar section { padding: 24px; border: 1px solid rgba(7,17,31,.11); border-radius: 22px; background: white; }
.document-sidebar h2 { font-size: 1rem; letter-spacing: -.02em; }
.document-sidebar p { margin-top: 10px; font-size: .9rem; overflow-wrap: anywhere; }
.tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.tag-list span { padding: 6px 9px; border-radius: 999px; background: #edf3ff; color: #23437a; font-size: .75rem; font-weight: 700; }
.sidebar-cta { width: 100%; text-align: center; }
.preference-panel, .privacy-form-panel, .version-panel { padding: 32px; margin: 0 0 46px; border: 1px solid rgba(7,17,31,.12); border-radius: 28px; background: white; }
.preference-panel p, .privacy-form-panel > p, .version-panel p { margin-top: 18px; }
.preference-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.version-panel ol { display: grid; gap: 14px; padding-left: 20px; margin-top: 22px; }
.version-panel li span { display: block; color: #5f6f82; font-size: .86rem; overflow-wrap: anywhere; }
.related-policies { padding: 88px 0 120px; background: #081525; color: white; }
.related-heading span { color: #67e8f9; font-size: .78rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.related-heading h2 { margin-top: 14px; }
.policy-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 42px; }
.policy-card { min-height: 220px; padding: 26px; border: 1px solid rgba(255,255,255,.13); border-radius: 24px; background: rgba(255,255,255,.05); }
.policy-card > span { color: #67e8f9; font-size: .72rem; font-weight: 800; text-transform: uppercase; }
.policy-card strong { display: block; margin-top: 28px; font-size: 1.25rem; }
.policy-card p { margin-top: 12px; color: rgba(255,255,255,.62); font-size: .91rem; }
@media (max-width: 900px) {
  .compliance-hero-grid, .compliance-layout { grid-template-columns: 1fr; }
  .document-sidebar { position: static; }
  .policy-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .draft-warning .container { grid-template-columns: 1fr; gap: 4px; }
}
@media (max-width: 620px) {
  .policy-grid { grid-template-columns: 1fr; }
  .document-meta dl div { grid-template-columns: 1fr; gap: 2px; }
  .compliance-layout { padding-block: 60px; }
}
</style>
