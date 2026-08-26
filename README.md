# Telnexa Web

Production-oriented Nuxt 4 and Vue 3 website for Telnexa voice, SMS, email, CRM, automation, and private communications systems.

## Application scope

- 68 base routes
- 20 dedicated product landing pages
- 61 indexable base routes with English and Spanish alternates
- 13 typed conversion and support forms
- server-rendered metadata, canonical URLs, hreflang, robots, and sitemap output
- same-origin `/api` form boundary
- fail-closed forwarding to Codestra Middleware
- no direct browser access to Odoo, n8n, Jasmin, Postal, SIP providers, databases, or queues
- accessible responsive layouts for phones, tablets, laptops, and desktops
- non-root Docker image and exact release identity through `/version`

## Runtime toolchain

- Node.js 24.19.0 LTS
- npm 11.17.0
- Nuxt 4.5.2
- Vue 3 through the Nuxt dependency graph

The exact dependency graph is committed in `package-lock.json`; CI and Docker use `npm ci` rather than resolving new versions during review or release.

## Branches

- `main` — reviewed release history only
- `feat/nuxt-production-platform` — application source, contracts, tests, and application image
- `ops/production-deployment` — Docker Compose, Caddy, Kong, deployment automation, rollback, and production runbooks

Deployment files are intentionally developed in the operations branch so application review is not mixed with server changes.

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

CI additionally boots the production Nitro output, checks every public page and localized sitemap URL, submits all 13 form examples to the isolated non-production sink, and builds the non-root Docker image.

## Safety posture

A production form returns success only after the configured middleware accepts the request. Odoo and n8n remain behind middleware authorization, idempotency, consent, audit, retry, and replay controls. Live SMS, email, PSTN, provider submission, and automatic provisioning are not enabled by this repository.

See `docs/ARCHITECTURE.md` and `docs/BRANCHING.md`.
