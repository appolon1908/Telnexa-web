import legalManifest from '../../manifests/legal-documents.json'
import legalEntity from '../../manifests/legal-entity.json'
import legalVersions from '../../manifests/legal-versions.json'
import onboardingManifest from '../../manifests/onboarding-gates.json'

export type ComplianceLocale = 'en' | 'es'

export interface LocalizedText {
  en: string
  es: string
}

export interface LegalSection {
  heading: LocalizedText
  paragraphs: { en: string[]; es: string[] }
  bullets: { en: string[]; es: string[] }
}

export interface LegalDocument {
  key: string
  path: string
  title: LocalizedText
  summary: LocalizedText
  version: string
  effectiveDate: string | null
  status: string
  indexable: boolean
  publicationRequired: boolean
  acceptanceRequired: boolean
  audiences: string[]
  requiredFor: string[]
  sections: LegalSection[]
  sourceRefs: string[]
}

export interface OnboardingFieldOption {
  value: string
  label: LocalizedText
}

export interface OnboardingField {
  key: string
  label: LocalizedText
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'multiselect' | 'number'
  required: boolean
  options?: OnboardingFieldOption[]
  help?: LocalizedText
}

export interface OnboardingAcknowledgment {
  key: string
  label: LocalizedText
  required: boolean
}

export interface OnboardingStep {
  key: string
  path: string
  title: LocalizedText
  description: LocalizedText
  requiredFor: string[]
  kind: 'form' | 'overview' | 'agreements' | 'review' | 'submitted'
  fields: OnboardingField[]
  acknowledgments: OnboardingAcknowledgment[]
  nextPath?: string
  legalLinks?: string[]
}

export interface OnboardingService {
  key: string
  label: LocalizedText
  description: LocalizedText
  startPath: string
  marketingPath: string
  requiredDocuments: string[]
}

function stripLocale(path: string) {
  if (path === '/es') return '/'
  return path.replace(/^\/es(?=\/|$)/, '') || '/'
}

export function useComplianceCatalog() {
  const route = useRoute()
  const config = useRuntimeConfig()

  const locale = computed<ComplianceLocale>(() =>
    route.path === '/es' || route.path.startsWith('/es/') ? 'es' : 'en'
  )
  const basePath = computed(() => stripLocale(route.path))
  const localizePath = (path: string) =>
    locale.value === 'es' ? (path === '/' ? '/es' : `/es${path}`) : path

  const document = computed<LegalDocument | null>(() =>
    (legalManifest.documents as LegalDocument[]).find(item => item.path === basePath.value) || null
  )
  const step = computed<OnboardingStep | null>(() =>
    (onboardingManifest.steps as OnboardingStep[]).find(item => item.path === basePath.value) || null
  )

  const canonicalUrl = computed(() => {
    const localized = locale.value === 'es'
      ? (basePath.value === '/' ? '/es' : `/es${basePath.value}`)
      : basePath.value
    return `${String(config.public.siteUrl).replace(/\/$/, '')}${localized}`
  })
  const englishUrl = computed(() =>
    `${String(config.public.siteUrl).replace(/\/$/, '')}${basePath.value}`
  )
  const spanishUrl = computed(() =>
    `${String(config.public.siteUrl).replace(/\/$/, '')}${basePath.value === '/' ? '/es' : `/es${basePath.value}`}`
  )

  const documents = legalManifest.documents as LegalDocument[]
  const services = onboardingManifest.services as OnboardingService[]
  const steps = onboardingManifest.steps as OnboardingStep[]

  const documentByKey = (key: string) => documents.find(item => item.key === key)
  const serviceByKey = (key: string) => services.find(item => item.key === key)
  const requiredDocumentsForServices = (selectedServices: string[]) => {
    const keys = new Set<string>(['terms', 'privacy', 'acceptable-use'])
    for (const serviceKey of selectedServices) {
      for (const key of serviceByKey(serviceKey)?.requiredDocuments || []) keys.add(key)
    }
    return [...keys].map(documentByKey).filter(Boolean) as LegalDocument[]
  }

  return {
    locale,
    basePath,
    localizePath,
    document,
    step,
    canonicalUrl,
    englishUrl,
    spanishUrl,
    documents,
    services,
    steps,
    legalEntity,
    legalVersions,
    legalManifest,
    onboardingManifest,
    documentByKey,
    serviceByKey,
    requiredDocumentsForServices
  }
}
