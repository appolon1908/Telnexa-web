# Telnexa website GO/NO-GO checklist

## Source and review

- [ ] Application PR is based on the latest `main`.
- [ ] Application branch has no merge conflicts.
- [ ] Route, form, CTA, security, compliance, Nuxt build, runtime smoke, operations, and Docker checks pass on the exact head SHA.
- [ ] Dependency lockfile is committed and reviewed.
- [ ] Independent approval applies to the unchanged exact application SHA.
- [ ] Application and operations changes are merged through GitHub controls.
- [ ] `main` rules require pull requests, successful checks, linear history, and no force pushes.

## Legal publication and service onboarding

- [ ] `manifests/legal-entity.json` contains the approved contracting entity, registration number, address, country, and contacts.
- [ ] The responsible owner and counsel approve every publication-required English document.
- [ ] Counsel approves every Spanish translation.
- [ ] Each publication-required document has an effective date and non-draft version.
- [ ] Every approved policy version has an immutable SHA-256 archive entry.
- [ ] `npm run validate:production-compliance` passes.
- [ ] SMS onboarding covers use case, consent, opt-out, sender registration, privacy, and policy acceptance.
- [ ] Business VoIP onboarding covers calling purpose, emergency services, caller identity, recording, privacy, and policy acceptance.
- [ ] AI voice onboarding covers use case, AI identity disclosure, contact permission, voice rights, human handoff, recording, privacy, and policy acceptance.
- [ ] Wholesale onboarding covers entity profile, downstream KYB, nested resale, traffic profile, routing, identity, mitigation, traceback, privacy, and policy flow-down.
- [ ] Submission creates only a manual-review record and never changes a live capability flag.

## Immutable artifacts

- [ ] Website image was built from the protected merged SHA.
- [ ] Image is referenced by `@sha256:<digest>`, never a mutable tag.
- [ ] SBOM and provenance evidence exist.
- [ ] Kong image is also referenced by an approved immutable digest.
- [ ] `/version` reports the exact merged source SHA.

## Server and SSH

- [ ] `codestra-admin@49.12.145.107` accepts the approved ED25519 key.
- [ ] Server host key was verified out of band and stored in `known_hosts`.
- [ ] Password login, root login, and SSH agent forwarding remain disabled.
- [ ] Read-only preflight passes.
- [ ] Ports 3300, 38000, and 38100 are loopback-only.
- [ ] Existing unrelated containers and services are unchanged.
- [ ] At least 5 GiB of free disk is available.

## DNS and HTTPS

- [ ] `telnexa.co` resolves to `49.12.145.107`.
- [ ] `www.telnexa.co` resolves to `49.12.145.107` and redirects to the apex.
- [ ] `api.telnexa.co` remains on the existing SMS/backend host and is absent from the website Caddy configuration.
- [ ] Provider `/health` and `/ready` pass before and after the website rollout (`bash deployment/scripts/provider-health.sh`).
- [ ] Caddy configuration validates before reload.
- [ ] Public certificates match each hostname and validate through a public trust chain.
- [ ] HTTP redirects to HTTPS.
- [ ] Security headers and compression are present.

## Application and API

- [ ] `/healthz` is HTTP 200.
- [ ] `/readyz` is HTTP 200 with application and form delivery ready.
- [ ] `/version` matches the approved merged SHA.
- [ ] All 113 base pages return HTTP 200.
- [ ] All 78 Spanish indexable alternate pages return HTTP 200.
- [ ] Sitemap contains exactly 156 indexable URLs.
- [ ] No rendered CTA uses an empty URL, `#`, or `javascript:`.
- [ ] All 14 form routes reject invalid payloads without creating records.
- [ ] The compliance-onboarding route rejects incomplete pages, stale policy versions, and activation requests.
- [ ] Actual request-body byte limits are enforced even without a trustworthy `Content-Length`.
- [ ] Rate limiting, payload limits, request IDs, and idempotency are observable through Kong.

## Odoo and n8n

- [ ] Browser traffic cannot address Odoo or n8n directly.
- [ ] Middleware service identity has only the required permissions.
- [ ] Explicit canary approval is recorded.
- [ ] One website canary creates exactly one Odoo record.
- [ ] One compliance-onboarding canary creates exactly one review record and no provider action.
- [ ] One corresponding n8n workflow completes.
- [ ] Replay of the same idempotency key creates no duplicate record or workflow execution.
- [ ] Failure and retry evidence is available without exposing submitted personal data.

## Capability freeze

- [ ] `LIVE_SMS_DELIVERY=false`
- [ ] `LIVE_EMAIL_DELIVERY=false`
- [ ] `LIVE_PSTN_DIALING=false`
- [ ] `ENABLE_PROVIDER_SUBMISSION=false`
- [ ] `ENABLE_AUTOMATIC_PROVISIONING=false`
- [ ] `ODOO_DIRECT_PUBLIC_ACCESS=false`
- [ ] `N8N_DIRECT_PUBLIC_ACCESS=false`

## Recovery and approval

- [ ] Previous deployment environment and image digests are retained securely.
- [ ] Rollback was rehearsed and restored the prior release identity.
- [ ] Logs and deployment evidence contain no secrets or submitted form bodies.
- [ ] Legal, compliance, privacy, operations, security, and business owners approve public activation.

`PRODUCTION_GO=YES` is permitted only when every required item above is complete on the exact release SHA. Otherwise record `PRODUCTION_GO=NO` with the precise blocker.
