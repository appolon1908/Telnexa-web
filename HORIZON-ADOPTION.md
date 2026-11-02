# Horizon portfolio-shell adoption

## Authority

- Horizon repository: `appolon1908-hue/SDK-repository`
- Foundation PR: `#73`
- Visual-contract exact head: `7db4c6549a0a007922355090f03c082a308f3855`
- Governance validator: `b258cf952df3a2ef11a2ba2e0df16c7983ee2a99`
- Adoption branch: `feature/horizon-portfolio-shell-v1`
- Product theme: `telnexa`
- Runtime activation: **not included**

## Canonical domains

| Role | Domain |
|---|---|
| Public website | `https://telnexa.co` |
| Customer portal and account authority | `https://app.telnexa.co` |
| Service status | `https://status.telnexa.co` |
| Shared identity host | `https://auth.codestra.co` |
| Canonical identity issuer | `https://auth.codestra.co/realms/codestra` |
| Corporate authority | `https://codestra.co` |

These hosts are separate trust boundaries. The public website must not collect account credentials or imply that its catalog-rendered utility pages are a real login implementation.

## Authentication classification

`Telnexa-web` is registered as `public-only`.

- The header contains a direct **Client portal** link to `https://app.telnexa.co`.
- The compatibility paths `/login`, `/signup`, `/portal` and their Spanish forms issue a server-side handoff to the real portal authority.
- The public site stores no login token and contains no local logout control.
- Any protected Telnexa portal must be implemented and registered in its authoritative repository with real Keycloak or same-origin BFF login, session bootstrap, fail-closed route guards, 401/403 handling, provider logout, backend authorization, and durable identity `issuer + subject`.
- Fake account forms and decorative Sign in/Log out controls are prohibited.

Authoritative handoff files:

- `app/components/AppHeader.vue`
- `server/middleware/portal-handoff.ts`
- `tests/contracts/portal-handoff.test.mjs`
- `app/config/domains.ts`

## Page and color rule

`app/app.vue` defines the Horizon root and dynamic English/Spanish document language. Every page rendered through `app/layouts/default.vue` inherits:

- the `telnexa` Horizon theme;
- the shared header and footer;
- typography, spacing, focus, forms, cards, tables, and CTA hierarchy;
- consent and service-activation components;
- every applicable loading, empty, partial, stale, degraded, unauthorized, validation-error, server-error, offline, and durable-success state.

New page and component changes must use Horizon variables. New raw hex, RGB, HSL, Lab, LCH, or OKLCH values are rejected outside registered token files. Semantic success, warning, danger, and information colors remain separate from the Telnexa accent.

The generated `app/assets/css/horizon.css` adapter is pinned to the visual-contract exact head and will be replaced by the exact released `@codestra/intake-ui` package after publication.

## New page and suite rule

A new Telnexa page must remain below the registered Nuxt root, inherit the default shell, use tokens, preserve bilingual routing, implement applicable page states, and add contract/accessibility evidence.

A new Telnexa suite or portal cannot be production-certified by adding a directory or hostname alone. It must register:

1. its canonical HTTPS domain and surface type;
2. root layout, page roots, theme, token file, and public or operator shell;
3. real login, session, guard, logout, issuer, client, scopes, audience, redirect/logout URIs, and roles when protected;
4. backend-authoritative permission, tenant, record, capability, and state checks;
5. page-state, accessibility, build, test, security, deployment, and rollback gates.

`horizon/suite.json` and `.github/workflows/horizon-contract.yml` enforce these source-side rules.

## Preserved behavior

- English and Spanish routes;
- localized header and footer copy;
- service-review, support, compliance, security, reliability, privacy, and legal routes;
- consent banner and service activation notice;
- noindex controls for compatibility account, support, and submission paths;
- Nuxt runtime configuration and deployment behavior.

## Validation

```bash
npm ci
npm run validate
npm test
npm run build
```

This branch does not activate communications delivery, API writes, identity clients, DNS, deployment, or production runtime traffic.
