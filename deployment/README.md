# Telnexa production deployment

This directory deploys the reviewed Telnexa website to `49.12.145.107` without exposing the Nuxt or Kong management listeners publicly.

## Topology

```text
Internet
  -> Caddy :80/:443
      -> telnexa.co pages -> 127.0.0.1:3300 -> Nuxt
      -> telnexa.co/api -> 127.0.0.1:38000 -> Kong -> Nuxt server API
          -> private Codestra Middleware -> Odoo / n8n
```

`api.telnexa.co` remains the SMS/backend endpoint owned by `appolon1908-hue/telnexa`. This website rollout must not move its DNS, install a virtual host for it, or replace its provider routes. The provider currently runs behind its existing Nginx edge; website form endpoints stay on `telnexa.co/api/v1/website/*`.

The browser never receives the private middleware URL or service token and never addresses Odoo or n8n directly.

## Runtime variables

Private Nuxt settings use Nuxt runtime variable names:

```text
NUXT_MIDDLEWARE_BASE_URL
NUXT_MIDDLEWARE_SERVICE_TOKEN
NUXT_DEV_FORM_SINK_ENABLED=false
```

Do not build middleware credentials or test simulation flags into the image. The production release file must set the private values at container runtime.

## Safety invariants

- website and Kong images are supplied by immutable digest
- Nuxt is bound to `127.0.0.1:3300`
- Kong proxy is bound to `127.0.0.1:38000`
- Kong status is bound to `127.0.0.1:38100`
- Kong Admin API is disabled
- live SMS, email, PSTN, provider submission, automatic provisioning, and direct Odoo/n8n access remain false
- public smoke tests use invalid empty form bodies and must receive `422`, so they create no CRM or automation records
- the Odoo/n8n canary is a separate manual action and requires `ALLOW_TEST_RECORD_CREATE=YES`

## Deployment sequence

1. Merge the application and operations pull requests after exact-head CI.
2. Publish the website image from the exact protected `main` SHA.
3. Supply an approved immutable Kong digest.
4. Verify website DNS for `telnexa.co` and `www.telnexa.co` points to the approved website host `49.12.145.107`. Preserve `api.telnexa.co` and all SMS/backend DNS records.
5. Verify the server host key out of band and store it in the production environment secret.
6. Create the protected release environment file from `.env.production.example`.
7. Run `scripts/preflight.sh` without changing the host.
8. Run `scripts/deploy.sh /secure/path/release.env`.
9. Apply Caddy only after validation and an approved change window.
10. Run the optional Odoo/n8n canary only with explicit authorization.

The deployment workflow is manual and requires the `production` GitHub environment. It never changes DNS and cannot bypass missing SSH, middleware, certificate, image, or approval gates.

## Provider regression check

Both preflight and public smoke run `bash scripts/provider-health.sh`. This performs bounded, certificate-verified GET requests to the existing provider `/health` and `/ready` endpoints, rejects redirects and non-200 responses, and requires readiness status `ready`. It sends no message or customer data. A provider failure blocks website rollout.

The September 10 live check found website apex DNS still on the provider host and a certificate hostname mismatch. The public website has not been certified or deployed by this source repair. Source CI, compliance approval, immutable artifacts, staging and the protected production change remain required.
