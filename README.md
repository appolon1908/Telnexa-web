# Telnexa Web

## Repository authority

This repository is the **public Telnexa website, product-marketing and compliance/service-onboarding frontend authority**.

`appolon1908-hue/telnexa` is the separate **Telnexa SMS/backend runtime authority** and owns Jasmin HTTP/SMPP, SMS routing, DLR/MO callbacks, billing/wallet/ledger state, provider credentials and SMS runtime deployment.

This website must not become a second Jasmin/SMPP backend, SMS billing ledger or provider credential store. Browser/business requests cross the governed boundary through Kong/Middleware. Voice/contact-center operations are not owned by the Telnexa SMS backend; VICIdial/Asterisk integration is owned by `appolon1908-hue/Vicidialer-Codestra` and coordinated through Middleware.

```text
Browser -> Telnexa-web -> Kong -> Middleware -> telnexa/Jasmin (SMS)
                                      |
                                      +-> Vicidialer-Codestra (voice, separate system)
```

Production-oriented Nuxt 4 and Vue 3 website for Telnexa voice, SMS, AI voice over IP, email, CRM, automation, wholesale/reseller, and private communications systems.

## Application scope

- 113 base routes
- 21 dedicated product landing pages
- 78 indexable base routes with English and Spanish alternates
- 156 indexable sitemap URLs
- 14 typed conversion, support, and privacy-request forms
- 25 service-onboarding pages that gate SMS, business VoIP, AI voice, and wholesale review
- 23 substantive bilingual legal, privacy, disclosure, accessibility, security, and service-policy documents
- server-rendered metadata, canonical URLs, `hreflang`, robots, and sitemap output
- same-origin `/api` form and compliance-onboarding boundaries
- fail-closed forwarding to Codestra Middleware
- no direct browser access to Odoo, n8n, Jasmin, Postal, SIP providers, databases, or queues
- accessible responsive layouts for phones, tablets, laptops, and desktops
- non-root Docker image and exact release identity through `/version`

## Service activation model

Telnexa does not use a one-click production activation flow. A service request must pass:

```text
business verification
-> service selection
-> every applicable service page
-> privacy and data review
-> exact policy-version acceptance
-> authorized signer certification
-> manual compliance review
-> separate controlled provisioning
```

Supported reviewed service paths:

- Business SMS: use case, recipient relationship, opt-in evidence, sender registration, STOP/HELP, privacy, and policy acceptance
- Business VoIP: calling purpose, emergency services, caller identity, numbers, recording, privacy, and policy acceptance
- AI voice over IP: use case and risk, AI identity disclosure, contact permission, voice rights, recording, human handoff, privacy, and policy acceptance
- Wholesale/reseller: legal and regulatory profile, downstream KYB, nested resale, traffic profile, routing and identity, mitigation and traceback, privacy, DPA, and policy flow-down

Submission creates a review record only. It never provisions numbers, registers senders, sends messages, places calls, activates an AI agent, or enables wholesale routing.

## Legal publication gate

The repository contains structured legal drafts marked `counsel-review-required`. Production deployment is intentionally blocked until the responsible legal entity, effective dates, final versions, counsel approvals, and immutable SHA-256 policy archives are complete.

```bash
npm run validate:production-compliance
```

Do not bypass this gate. See:

- `docs/COMPLIANCE_ONBOARDING.md`
- `docs/LEGAL_COUNSEL_REVIEW.md`
- `docs/COMPLIANCE_SOURCE_REGISTER.md`
- `docs/ACTIVATION_MATRIX.md`
- `docs/GO_LIVE_CHECKLIST.md`

## Runtime toolchain

- Node.js 24.19.0 LTS
- npm 11.17.0
- Nuxt 4.5.2
- Vue 3 through the Nuxt dependency graph

The exact dependency graph is committed in `package-lock.json`; CI and Docker use `npm ci` rather than resolving new versions during review or release.

## Branch policy

- `main` — reviewed release history only
- `feat/<feature-name>` — application or product work
- `fix/<problem-name>` — defect remediation
- `ops/<infrastructure-change>` — deployment and infrastructure
- `docs/<documentation-change>` — documentation-only work

Work should enter `main` through an exact-head pull request and be removed after merge.

## Development

```bash
npm ci
cp .env.example .env
npm run dev
```

## Quality gates

```bash
npm run validate
npm test
npm run build
```

CI additionally boots the production Nitro output, checks the complete English and Spanish route surface, validates the 156-URL sitemap, submits all 14 form examples and one complete compliance-onboarding example to the isolated non-production sink, and builds the non-root Docker image.

## Safety posture

A production form returns success only after the configured middleware accepts the request. Odoo and n8n remain behind middleware authorization, idempotency, consent, audit, retry, and replay controls.

These capabilities remain false:

```text
LIVE_SMS_DELIVERY=false
LIVE_EMAIL_DELIVERY=false
LIVE_PSTN_DIALING=false
ENABLE_PROVIDER_SUBMISSION=false
ENABLE_AUTOMATIC_PROVISIONING=false
ODOO_DIRECT_PUBLIC_ACCESS=false
N8N_DIRECT_PUBLIC_ACCESS=false
```

See `docs/ARCHITECTURE.md`, `docs/BRANCHING.md`, and the compliance documentation above.
