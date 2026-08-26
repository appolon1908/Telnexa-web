import pageManifest from '../../manifests/pages.json'

type PageCategory = 'core' | 'voice' | 'messaging' | 'email' | 'crm' | 'automation' | 'private-platform' | 'solution' | 'developer' | 'integration' | 'trust' | 'resource' | 'legal' | 'utility'

export interface TelnexaPage {
  path: string
  title: string
  category: PageCategory
  indexable: boolean
  form?: string
}

interface CategoryContent {
  eyebrow: string
  lead: string
  benefits: Array<{ title: string; text: string }>
  workflow: string[]
}

const categoryContent: Record<PageCategory, CategoryContent> = {
  core: {
    eyebrow: 'One connected platform',
    lead: 'Bring every customer conversation into one secure, measurable workspace built around your business.',
    benefits: [
      { title: 'Unified experience', text: 'Voice, SMS, email, CRM, and automation share one operating model.' },
      { title: 'Built to adapt', text: 'Start with one channel and expand without rebuilding your customer journey.' },
      { title: 'Human support', text: 'Design, migration, training, and operational support are part of the platform.' }
    ],
    workflow: ['Choose your channels', 'Connect your customer systems', 'Automate the repetitive work', 'Measure every conversation']
  },
  voice: {
    eyebrow: 'Telnexa Voice',
    lead: 'Clear, flexible business calling with the routing, control, analytics, and APIs modern teams expect.',
    benefits: [
      { title: 'Work from anywhere', text: 'Keep one professional phone system across office, remote, and mobile teams.' },
      { title: 'Route with intent', text: 'Direct conversations using schedules, skills, queues, IVR, and business rules.' },
      { title: 'See what matters', text: 'Understand service quality, outcomes, and operational trends without spreadsheet work.' }
    ],
    workflow: ['Receive or place a call', 'Apply identity and routing policy', 'Connect the right person or workflow', 'Record the outcome in CRM']
  },
  messaging: {
    eyebrow: 'Telnexa Messaging',
    lead: 'Create fast, permission-aware SMS experiences for notifications, support, campaigns, and two-way conversations.',
    benefits: [
      { title: 'Two-way by design', text: 'Continue the conversation in a shared inbox instead of sending disconnected alerts.' },
      { title: 'Delivery visibility', text: 'Track accepted, delivered, failed, and replied states through durable events.' },
      { title: 'Responsible controls', text: 'Use sender approval, consent, suppression, quiet hours, and audit history.' }
    ],
    workflow: ['Validate consent and sender', 'Reserve and route the message', 'Track provider delivery', 'Sync replies and outcomes']
  },
  email: {
    eyebrow: 'Telnexa Email',
    lead: 'Reliable business and application email with shared identity, automation, reporting, and deliverability controls.',
    benefits: [
      { title: 'Business ready', text: 'Professional mailboxes, shared addresses, and role-based access for growing teams.' },
      { title: 'Application delivery', text: 'Send transactional messages through a governed API or SMTP relay.' },
      { title: 'Connected reporting', text: 'Link delivery and engagement events back to campaigns and CRM records.' }
    ],
    workflow: ['Authenticate the sender', 'Render the approved message', 'Deliver through the selected route', 'Record delivery and engagement']
  },
  crm: {
    eyebrow: 'Telnexa CRM',
    lead: 'Turn calls, messages, emails, tasks, and customer history into one practical operating workspace.',
    benefits: [
      { title: 'One customer timeline', text: 'Keep conversations, activities, notes, and outcomes together.' },
      { title: 'Clear ownership', text: 'Use teams, stages, assignments, reminders, and service-level rules.' },
      { title: 'Odoo connected', text: 'Send qualified website activity through middleware into governed Odoo workflows.' }
    ],
    workflow: ['Capture the conversation', 'Match the customer record', 'Assign the next action', 'Measure the result']
  },
  automation: {
    eyebrow: 'Telnexa Automation',
    lead: 'Connect communications to n8n workflows that acknowledge, route, enrich, schedule, and follow up without losing control.',
    benefits: [
      { title: 'Durable events', text: 'Use signed, replay-protected events instead of fragile browser-to-workflow calls.' },
      { title: 'Human checkpoints', text: 'Keep approvals and exception handling where judgment is required.' },
      { title: 'Observable flows', text: 'Track retries, dead letters, correlation IDs, and final business outcomes.' }
    ],
    workflow: ['Accept and validate an event', 'Apply business policy', 'Run the approved workflow', 'Record completion or exception']
  },
  'private-platform': {
    eyebrow: 'Your private communications cloud',
    lead: 'Build a branded, dedicated communications system with the capabilities you need and the boundaries your business requires.',
    benefits: [
      { title: 'Your operating model', text: 'Design roles, queues, workflows, channels, and portals around your organization.' },
      { title: 'Private integration layer', text: 'Use Kong, Caddy, middleware, Odoo, and n8n without exposing internal services.' },
      { title: 'Controlled activation', text: 'Launch capabilities gradually with explicit safety and delivery gates.' }
    ],
    workflow: ['Map requirements', 'Design identity and tenancy', 'Build integrations and portals', 'Validate, stage, and activate']
  },
  solution: {
    eyebrow: 'Industry solution',
    lead: 'A communications operating model shaped around the service expectations, workflows, and controls of your industry.',
    benefits: [
      { title: 'Designed around work', text: 'Map channels to the real customer and employee journeys your team manages.' },
      { title: 'Connected systems', text: 'Integrate communications with CRM, scheduling, support, and operational tools.' },
      { title: 'Measurable outcomes', text: 'Track service, conversion, response, and workflow performance in one place.' }
    ],
    workflow: ['Map the customer journey', 'Choose channels and controls', 'Connect business systems', 'Launch with measurable goals']
  },
  developer: {
    eyebrow: 'Built for developers',
    lead: 'Composable APIs, signed webhooks, predictable errors, idempotency, and test-safe integration paths.',
    benefits: [
      { title: 'Consistent contracts', text: 'Use versioned endpoints and common request, error, and event conventions.' },
      { title: 'Safe retries', text: 'Idempotency and durable inbox/outbox patterns prevent duplicate business actions.' },
      { title: 'Operational clarity', text: 'Correlation IDs and delivery state make failures diagnosable.' }
    ],
    workflow: ['Authenticate the caller', 'Submit an idempotent request', 'Receive durable events', 'Reconcile final state']
  },
  integration: {
    eyebrow: 'Connected by design',
    lead: 'Integrate Telnexa through a governed middleware boundary instead of exposing business systems directly to the public web.',
    benefits: [
      { title: 'Kong gateway policy', text: 'Centralize authentication, rate limits, request IDs, and public API controls.' },
      { title: 'Odoo business records', text: 'Create leads, tickets, activities, and attribution through least-privilege identities.' },
      { title: 'n8n orchestration', text: 'Automate approved follow-up while keeping retries and replay protection durable.' }
    ],
    workflow: ['Receive through Caddy and Kong', 'Validate in middleware', 'Write the authoritative record', 'Publish the approved automation event']
  },
  trust: {
    eyebrow: 'Trust and operations',
    lead: 'Security, resilience, privacy, and operational evidence are designed into the platform—not added after launch.',
    benefits: [
      { title: 'Least privilege', text: 'Keep public, application, worker, and administrative identities separate.' },
      { title: 'Fail closed', text: 'Unavailable credentials or providers do not silently become permissive behavior.' },
      { title: 'Auditable operations', text: 'Preserve release identity, request history, delivery state, and rollback evidence.' }
    ],
    workflow: ['Define the control', 'Enforce it at the boundary', 'Monitor the evidence', 'Review and improve']
  },
  resource: {
    eyebrow: 'Learn with Telnexa',
    lead: 'Practical guidance for planning, launching, operating, and improving modern business communications.',
    benefits: [
      { title: 'Implementation guides', text: 'Move from product idea to secure, testable architecture.' },
      { title: 'Operational playbooks', text: 'Improve routing, service levels, follow-up, and delivery management.' },
      { title: 'Clear terminology', text: 'Understand communications concepts without unnecessary complexity.' }
    ],
    workflow: ['Choose a topic', 'Apply the guidance', 'Measure the outcome', 'Refine your operating model']
  },
  legal: {
    eyebrow: 'Telnexa policies',
    lead: 'The terms, privacy commitments, and acceptable-use boundaries that support responsible communications services.',
    benefits: [
      { title: 'Clear responsibilities', text: 'Understand the obligations of Telnexa and each customer.' },
      { title: 'Responsible use', text: 'Protect recipients, networks, and legitimate business communications.' },
      { title: 'Privacy principles', text: 'Use data for defined purposes with appropriate access and retention controls.' }
    ],
    workflow: ['Review the policy', 'Map it to your use case', 'Ask questions before activation', 'Keep records current']
  },
  utility: {
    eyebrow: 'Get started',
    lead: 'Tell us what you are building and the Telnexa team will route your request to the right specialist.',
    benefits: [
      { title: 'Fast qualification', text: 'Share the essentials once so the right team can prepare.' },
      { title: 'Practical next step', text: 'Receive a clear follow-up path rather than a generic autoresponder.' },
      { title: 'Protected intake', text: 'Submissions pass through the public API boundary and durable middleware workflow.' }
    ],
    workflow: ['Submit your request', 'Create the governed CRM record', 'Assign the right owner', 'Confirm the next action']
  }
}

const spanishLabels = {
  platform: 'Plataforma de comunicaciones',
  lead: 'Conecta voz, SMS, correo, CRM y automatización en una experiencia segura y fácil de operar.',
  primary: 'Solicitar una demostración',
  secondary: 'Ver la plataforma',
  benefits: 'Diseñado para trabajar mejor',
  workflow: 'Cómo funciona',
  integrations: 'Conecta cada conversación con tu negocio',
  final: 'Construyamos tu sistema de comunicaciones'
}

export function usePageCatalog() {
  const route = useRoute()
  const config = useRuntimeConfig()
  const locale = computed<'en' | 'es'>(() => route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en')
  const basePath = computed(() => {
    if (locale.value === 'es') {
      const stripped = route.path.replace(/^\/es(?=\/|$)/, '')
      return stripped || '/'
    }
    return route.path || '/'
  })

  const page = computed<TelnexaPage>(() => {
    const found = (pageManifest.pages as TelnexaPage[]).find(item => item.path === basePath.value)
    if (!found) {
      throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }
    return found
  })

  const content = computed(() => categoryContent[page.value.category])
  const localizedPath = computed(() => locale.value === 'es' ? (page.value.path === '/' ? '/es' : `/es${page.value.path}`) : page.value.path)
  const englishUrl = computed(() => `${String(config.public.siteUrl).replace(/\/$/, '')}${page.value.path}`)
  const spanishUrl = computed(() => `${String(config.public.siteUrl).replace(/\/$/, '')}${page.value.path === '/' ? '/es' : `/es${page.value.path}`}`)

  const labels = computed(() => locale.value === 'es'
    ? spanishLabels
    : {
        platform: content.value.eyebrow,
        lead: content.value.lead,
        primary: 'Book a demo',
        secondary: 'Explore the platform',
        benefits: 'Built for better work',
        workflow: 'How it works',
        integrations: 'Connect every conversation to your business',
        final: 'Build your communications system'
      })

  return {
    page,
    content,
    locale,
    labels,
    localizedPath,
    englishUrl,
    spanishUrl,
    manifest: pageManifest
  }
}
