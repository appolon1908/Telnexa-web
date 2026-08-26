# Telnexa website architecture

## Request path

```text
Browser
  -> Caddy TLS edge
  -> Kong public API policy for /api
  -> Nuxt server route
  -> Codestra middleware
     -> Odoo through a least-privilege service identity
     -> n8n through a signed, replay-protected delivery contract
```

The browser never receives internal service credentials and never connects directly to Odoo, n8n, SMS gateways, mail systems, SIP providers, databases, queues, or administration interfaces.

## Application structure

```text
app/
  components/       shared navigation, page renderer, forms, consent
  composables/      page catalog, localization, SEO URL resolution
  layouts/          accessible global shell
  pages/            English and Spanish route entry points
  assets/css/       responsive design system
manifests/
  pages.json        68-route source of truth
  forms.json        13-form source of truth
server/
  api/              same-origin public form endpoints
  middleware/       response security controls
  routes/           health, readiness, release, sitemap, robots
  utils/            validation and middleware forwarding
scripts/            contract and runtime smoke checks
tests/              static contract and boundary tests
```

## Form acceptance

A successful response means the request passed validation and the configured downstream middleware accepted it. Production does not use the isolated development sink. Every submission carries an idempotency key and request ID. The middleware remains responsible for durable storage, Odoo record creation, n8n delivery, retries, replay protection, suppression, and operational exception handling.

## Search rendering

All public pages are server-rendered. Product and policy sections use prerender-compatible route rules; resource content may use short stale-while-revalidate caching. Utility and conversion routes are marked `noindex`. The sitemap contains English and Spanish alternates for 61 indexable base routes.

## Release identity

`NUXT_PUBLIC_RELEASE_SHA` is embedded during the immutable image build and returned by `/version`. Production deployment must compare that value to the exact protected merged SHA before public activation.
