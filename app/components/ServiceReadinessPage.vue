<script setup lang="ts">
const props = defineProps<{
  mode: 'ai-voice' | 'wholesale'
}>()

const route = useRoute()
const config = useRuntimeConfig()
const locale = computed<'en' | 'es'>(() => route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en')
const localizePath = (path: string) => locale.value === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path
const basePath = computed(() => route.path.replace(/^\/es(?=\/|$)/, '') || '/')
const canonical = computed(() => `${String(config.public.siteUrl).replace(/\/$/, '')}${route.path}`)
const englishUrl = computed(() => `${String(config.public.siteUrl).replace(/\/$/, '')}${basePath.value}`)
const spanishUrl = computed(() => `${String(config.public.siteUrl).replace(/\/$/, '')}${basePath.value === '/' ? '/es' : `/es${basePath.value}`}`)

const catalog = {
  'ai-voice': {
    eyebrow: { en: 'Telnexa AI Voice', es: 'Voz con IA de Telnexa' },
    title: { en: 'AI voice over IP that identifies itself.', es: 'Voz con IA sobre IP que se identifica.' },
    lead: {
      en: 'Build inbound and outbound AI voice experiences with explicit identity, consent review, human escalation, recording controls, and a governed path to production.',
      es: 'Crea experiencias de voz con IA entrantes y salientes con identidad explícita, revisión de consentimiento, escalamiento humano, controles de grabación y una ruta gobernada a producción.'
    },
    start: '/get-started/ai-voice',
    legal: [
      ['/legal/ai-voice', 'AI voice transparency'],
      ['/legal/voice-services', 'Voice services'],
      ['/legal/call-recording', 'Recording and transcription'],
      ['/legal/privacy', 'Privacy']
    ],
    pillars: [
      {
        title: { en: 'Disclose AI early', es: 'Divulga la IA desde el inicio' },
        text: {
          en: 'Identify the responsible business and tell people they are interacting with AI or synthetic voice before meaningful interaction.',
          es: 'Identifica a la empresa responsable e informa que la persona interactúa con IA o voz sintética antes de una interacción significativa.'
        }
      },
      {
        title: { en: 'Prove contact permission', es: 'Demuestra permiso de contacto' },
        text: {
          en: 'Document the lawful contact basis, audience, consent source, revocation path, and do-not-call controls before outbound use.',
          es: 'Documenta la base lícita, audiencia, fuente de consentimiento, revocación y controles de no llamar antes del uso saliente.'
        }
      },
      {
        title: { en: 'Keep a human accountable', es: 'Mantén responsabilidad humana' },
        text: {
          en: 'Provide a clear path to a person and give responsible operators the ability to monitor, pause, correct, and terminate the workflow.',
          es: 'Ofrece una vía clara hacia una persona y permite que operadores responsables monitoreen, pausen, corrijan y terminen el flujo.'
        }
      },
      {
        title: { en: 'Protect voice rights', es: 'Protege los derechos de voz' },
        text: {
          en: 'Use only licensed or authorized voices, prohibit impersonation, and retain evidence for voice, model, recording, and training rights.',
          es: 'Usa solo voces licenciadas o autorizadas, prohíbe la suplantación y conserva evidencia de derechos sobre voz, modelo, grabación y entrenamiento.'
        }
      }
    ],
    workflow: [
      { en: 'Verify the business and AI owner', es: 'Verifica la empresa y responsable de IA' },
      { en: 'Review use case, audience, regions, and decision impact', es: 'Revisa caso de uso, audiencia, regiones e impacto de decisiones' },
      { en: 'Approve disclosure, consent, voice rights, recording, and human handoff', es: 'Aprueba divulgación, consentimiento, derechos de voz, grabación y transferencia humana' },
      { en: 'Submit for manual compliance review with live calling disabled', es: 'Envía a revisión manual con llamadas reales deshabilitadas' }
    ],
    disclosure: {
      title: { en: 'Example opening pattern', es: 'Patrón de apertura de ejemplo' },
      text: {
        en: '“Hello, this is the Telnexa AI assistant calling on behalf of [responsible business] about [specific purpose]. This call may be recorded. You may ask for a person or opt out at any time.”',
        es: '«Hola, soy el asistente de IA de Telnexa y llamo en nombre de [empresa responsable] sobre [propósito específico]. Esta llamada puede grabarse. Puedes pedir hablar con una persona o excluirte en cualquier momento».' 
      }
    }
  },
  wholesale: {
    eyebrow: { en: 'Telnexa Wholesale', es: 'Telnexa Mayorista' },
    title: { en: 'Wholesale communications without anonymous traffic.', es: 'Comunicaciones mayoristas sin tráfico anónimo.' },
    lead: {
      en: 'Sell or aggregate voice, SMS, numbers, and private-platform capacity with downstream KYB, traffic transparency, identity, traceback, privacy, and suspension controls.',
      es: 'Vende o agrega capacidad de voz, SMS, números y plataforma privada con verificación posterior, transparencia de tráfico, identidad, trazabilidad, privacidad y controles de suspensión.'
    },
    start: '/get-started/wholesale',
    legal: [
      ['/legal/wholesale-reseller', 'Wholesale and reseller'],
      ['/legal/acceptable-use', 'Acceptable use'],
      ['/legal/security-disclosure', 'Security and disclosure'],
      ['/legal/data-processing-addendum', 'Data processing']
    ],
    pillars: [
      {
        title: { en: 'Know every downstream customer', es: 'Conoce a cada cliente posterior' },
        text: {
          en: 'Verify legal identity, beneficial ownership, business purpose, contacts, countries, and authorized services before production access.',
          es: 'Verifica identidad legal, beneficiarios, propósito, contactos, países y servicios autorizados antes del acceso de producción.'
        }
      },
      {
        title: { en: 'Disclose the real traffic profile', es: 'Divulga el perfil real de tráfico' },
        text: {
          en: 'Describe channels, origin, destination, volume, sender or caller identity, route ownership, providers, and high-risk categories.',
          es: 'Describe canales, origen, destino, volumen, identidad, propiedad de rutas, proveedores y categorías de alto riesgo.'
        }
      },
      {
        title: { en: 'Flow policies downstream', es: 'Traslada políticas a clientes posteriores' },
        text: {
          en: 'Contracts must carry privacy, consent, identity, abuse, traceback, monitoring, record-retention, and audit obligations.',
          es: 'Los contratos deben trasladar obligaciones de privacidad, consentimiento, identidad, abuso, trazabilidad, monitoreo, retención y auditoría.'
        }
      },
      {
        title: { en: 'Suspend first, investigate fast', es: 'Suspende primero e investiga rápido' },
        text: {
          en: 'Provide 24/7 abuse and traceback contacts and a tested process to block suspicious traffic without waiting for automated provisioning.',
          es: 'Proporciona contactos 24/7 de abuso y trazabilidad y un proceso probado para bloquear tráfico sospechoso sin aprovisionamiento automático.'
        }
      }
    ],
    workflow: [
      { en: 'Verify the wholesale entity and registrations', es: 'Verifica la entidad mayorista y registros' },
      { en: 'Document downstream KYB and policy flow-down', es: 'Documenta verificación posterior y traslado de políticas' },
      { en: 'Review traffic, routes, identity, mitigation, and privacy roles', es: 'Revisa tráfico, rutas, identidad, mitigación y roles de privacidad' },
      { en: 'Submit for manual approval with routing disabled', es: 'Envía a aprobación manual con rutas deshabilitadas' }
    ],
    disclosure: {
      title: { en: 'Mandatory wholesale disclosure', es: 'Divulgación mayorista obligatoria' },
      text: {
        en: 'The contracting wholesaler must disclose all trading names, downstream customer categories, nested resale, traffic origin and destination, number or sender sources, upstream and downstream providers, regulatory identifiers, abuse contacts, and mitigation controls. Undisclosed customers or traffic are not eligible for production activation.',
        es: 'El mayorista contratante debe divulgar nombres comerciales, categorías de clientes posteriores, reventa anidada, origen y destino del tráfico, fuentes de números o remitentes, proveedores, identificadores regulatorios, contactos de abuso y controles de mitigación. Clientes o tráfico no divulgados no son elegibles para activación.'
      }
    }
  }
} as const

const content = computed(() => catalog[props.mode])
const text = <T extends { en: string; es: string }>(value: T) => value[locale.value]
const title = computed(() => `${text(content.value.title)} | Telnexa`)
const description = computed(() => text(content.value.lead))

useSeoMeta({
  title,
  description,
  robots: 'index, follow, max-image-preview:large',
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: canonical,
  twitterCard: 'summary_large_image'
})

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: canonical.value },
    { rel: 'alternate', hreflang: 'en', href: englishUrl.value },
    { rel: 'alternate', hreflang: 'es', href: spanishUrl.value },
    { rel: 'alternate', hreflang: 'x-default', href: englishUrl.value }
  ],
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: text(content.value.title),
      description: text(content.value.lead),
      brand: { '@type': 'Brand', name: 'Telnexa' },
      url: canonical.value
    })
  }]
}))
</script>

<template>
  <article class="readiness-page" :class="`mode-${mode}`">
    <header class="readiness-hero">
      <div class="container readiness-hero-grid">
        <div>
          <span class="eyebrow">{{ text(content.eyebrow) }}</span>
          <h1>{{ text(content.title) }}</h1>
          <p>{{ text(content.lead) }}</p>
          <div class="hero-actions">
            <NuxtLink class="button" :to="localizePath(content.start)">
              {{ locale === 'es' ? 'Iniciar revisión obligatoria' : 'Start required review' }}
            </NuxtLink>
            <NuxtLink class="button button-ghost" :to="localizePath('/legal')">
              {{ locale === 'es' ? 'Revisar políticas' : 'Review policies' }}
            </NuxtLink>
          </div>
          <div class="activation-note">
            <strong>{{ locale === 'es' ? 'Sin activación automática' : 'No automatic activation' }}</strong>
            <span>{{ locale === 'es' ? 'La solicitud crea una revisión; no habilita tráfico real.' : 'Submission creates a review; it does not enable live traffic.' }}</span>
          </div>
        </div>

        <div class="readiness-stage" aria-label="Compliance readiness">
          <div class="stage-ring" />
          <div class="stage-panel">
            <span>01</span><strong>{{ locale === 'es' ? 'Verificar negocio' : 'Verify business' }}</strong>
            <span>02</span><strong>{{ locale === 'es' ? 'Divulgar uso y tráfico' : 'Disclose use and traffic' }}</strong>
            <span>03</span><strong>{{ locale === 'es' ? 'Aceptar políticas' : 'Accept policies' }}</strong>
            <span>04</span><strong>{{ locale === 'es' ? 'Revisión humana' : 'Human review' }}</strong>
          </div>
        </div>
      </div>
    </header>

    <section class="readiness-section">
      <div class="container">
        <div class="section-heading">
          <span>{{ locale === 'es' ? 'Requisitos fundamentales' : 'Core requirements' }}</span>
          <h2>{{ locale === 'es' ? 'Diseñado para pasar la revisión antes de activar.' : 'Designed to pass review before activation.' }}</h2>
        </div>
        <div class="pillar-grid">
          <article v-for="pillar in content.pillars" :key="pillar.title.en">
            <i aria-hidden="true">✦</i>
            <h3>{{ text(pillar.title) }}</h3>
            <p>{{ text(pillar.text) }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="disclosure-section">
      <div class="container disclosure-card">
        <span>{{ locale === 'es' ? 'Divulgación incorporada' : 'Built-in disclosure' }}</span>
        <h2>{{ text(content.disclosure.title) }}</h2>
        <blockquote>{{ text(content.disclosure.text) }}</blockquote>
      </div>
    </section>

    <section class="workflow-section">
      <div class="container workflow-grid">
        <div>
          <span>{{ locale === 'es' ? 'Ruta de aprobación' : 'Approval path' }}</span>
          <h2>{{ locale === 'es' ? 'Cada página debe completarse.' : 'Every applicable page must be completed.' }}</h2>
        </div>
        <ol>
          <li v-for="(item, index) in content.workflow" :key="item.en">
            <b>{{ String(index + 1).padStart(2, '0') }}</b>
            <strong>{{ text(item) }}</strong>
          </li>
        </ol>
      </div>
    </section>

    <section class="policy-section">
      <div class="container">
        <div class="section-heading">
          <span>{{ locale === 'es' ? 'Antes de enviar' : 'Before submission' }}</span>
          <h2>{{ locale === 'es' ? 'Políticas que debes revisar.' : 'Policies you must review.' }}</h2>
        </div>
        <div class="policy-links">
          <NuxtLink v-for="item in content.legal" :key="item[0]" :to="localizePath(item[0])">
            <strong>{{ item[1] }}</strong><span>→</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="final-readiness-cta">
      <div class="container">
        <h2>{{ locale === 'es' ? 'Prepara una solicitud verificable.' : 'Prepare a verifiable service request.' }}</h2>
        <p>{{ locale === 'es' ? 'Guarda tus respuestas, completa cada paso aplicable y envía para revisión manual.' : 'Save your answers, complete every applicable step, and submit for manual review.' }}</p>
        <NuxtLink class="button button-light" :to="localizePath(content.start)">
          {{ locale === 'es' ? 'Comenzar ahora' : 'Begin now' }}
        </NuxtLink>
      </div>
    </section>
  </article>
</template>

<style scoped>
.readiness-page { background: #f7f9fc; color: #07111f; }
.readiness-hero { min-height: 780px; display: grid; align-items: center; padding: 100px 0; background: radial-gradient(circle at 80% 15%, rgba(34,211,238,.24), transparent 30%), linear-gradient(145deg,#06101f,#132958 58%,#24215d); color: white; }
.mode-wholesale .readiness-hero { background: radial-gradient(circle at 80% 15%, rgba(16,185,129,.26), transparent 30%), linear-gradient(145deg,#05131a,#123b3d 58%,#164f43); }
.readiness-hero-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 70px; align-items: center; }
.readiness-hero h1 { max-width: 12ch; }
.readiness-hero p { max-width: 720px; margin-top: 26px; color: rgba(255,255,255,.74); font-size: clamp(1.1rem,2vw,1.38rem); }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.activation-note { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 28px; color: rgba(255,255,255,.72); font-size: .88rem; }
.activation-note strong { color: #67e8f9; }
.readiness-stage { position: relative; min-height: 480px; display: grid; place-items: center; }
.stage-ring { position: absolute; width: 440px; height: 440px; border: 1px solid rgba(255,255,255,.2); border-radius: 50%; box-shadow: 0 0 100px rgba(34,211,238,.12); }
.stage-panel { z-index: 2; width: min(420px,92%); display: grid; grid-template-columns: 44px 1fr; gap: 18px; padding: 32px; border: 1px solid rgba(255,255,255,.17); border-radius: 28px; background: rgba(4,12,28,.65); backdrop-filter: blur(20px); }
.stage-panel span { color: #67e8f9; font: 800 .76rem/1.4 ui-monospace,monospace; }
.stage-panel strong { padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.1); }
.readiness-section, .policy-section { padding: 110px 0; }
.section-heading > span, .workflow-grid > div > span, .disclosure-card > span { color: #2f68ff; font-size: .75rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.section-heading h2, .workflow-grid h2, .disclosure-card h2 { margin-top: 14px; }
.pillar-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 18px; margin-top: 46px; }
.pillar-grid article { min-height: 300px; padding: 28px; border: 1px solid rgba(7,17,31,.1); border-radius: 26px; background: white; }
.pillar-grid i { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 16px; background: linear-gradient(135deg,#22d3ee,#2f68ff); color: white; font-style: normal; }
.pillar-grid h3 { margin-top: 62px; }
.pillar-grid p { margin-top: 14px; }
.disclosure-section { padding: 0 0 110px; }
.disclosure-card { padding: clamp(32px,6vw,70px); border-radius: 36px; background: #07111f; color: white; }
.disclosure-card blockquote { margin: 30px 0 0; color: rgba(255,255,255,.78); font-size: clamp(1.08rem,2vw,1.35rem); line-height: 1.7; }
.workflow-section { padding: 110px 0; background: #eaf1fb; }
.workflow-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 80px; }
.workflow-grid ol { padding: 0; margin: 0; list-style: none; }
.workflow-grid li { display: grid; grid-template-columns: 56px 1fr; gap: 20px; min-height: 92px; align-items: center; border-bottom: 1px solid rgba(7,17,31,.12); }
.workflow-grid b { color: #2f68ff; font: 800 .76rem/1 ui-monospace,monospace; }
.policy-links { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; margin-top: 44px; }
.policy-links a { display: flex; justify-content: space-between; gap: 18px; padding: 24px; border: 1px solid rgba(7,17,31,.1); border-radius: 20px; background: white; }
.policy-links a span { color: #2f68ff; }
.final-readiness-cta { padding: 100px 0; background: linear-gradient(135deg,#2f68ff,#7759f1); color: white; text-align: center; }
.final-readiness-cta h2 { max-width: 18ch; margin-inline: auto; }
.final-readiness-cta p { max-width: 700px; margin: 20px auto 30px; color: rgba(255,255,255,.78); }
@media (max-width: 980px) {
  .readiness-hero-grid, .workflow-grid { grid-template-columns: 1fr; }
  .pillar-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (max-width: 640px) {
  .pillar-grid, .policy-links { grid-template-columns: 1fr; }
  .readiness-stage { min-height: 390px; }
  .stage-ring { width: 340px; height: 340px; }
}
</style>
