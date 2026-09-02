# Horizon portfolio-shell adoption

## Authority

- Horizon repository: `appolon1908-hue/SDK-repository`
- Foundation PR: `#73`
- Foundation exact head: `7db4c6549a0a007922355090f03c082a308f3855`
- Adoption branch: `feature/horizon-portfolio-shell-v1`
- Product theme: `telnexa`
- Runtime activation: **not included**

## Canonical domains

| Role | Domain |
|---|---|
| Public website | `https://telnexa.co` |
| Customer portal | `https://app.telnexa.co` |
| Service status | `https://status.telnexa.co` |
| Shared identity | `https://auth.codestra.co` |
| Corporate authority | `https://codestra.co` |

## Preserved behavior

- English and Spanish routes
- localized header and footer copy
- service review and sign-in routes
- compliance, security, reliability, privacy and legal links
- consent banner and service activation notice
- noindex controls for account, support and submission routes
- Nuxt runtime configuration and deployment behavior

The generated `app/assets/css/horizon.css` adapter is pinned to the foundation exact head and will be replaced by the exact released `@codestra/intake-ui` package after publication.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

No communications delivery, API, identity, DNS, deployment or production-runtime behavior is changed by this branch.
