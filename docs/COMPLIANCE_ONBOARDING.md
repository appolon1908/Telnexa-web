# Telnexa compliance onboarding and activation gates

## Purpose

The public website now treats SMS, business VoIP, AI voice over IP, and wholesale/reseller capacity as reviewed communications services rather than self-activating products.

The browser may collect and save an onboarding draft. Submission creates a compliance-review record through the same-origin Nuxt API and Codestra Middleware. It does not provision numbers, register senders, send messages, place calls, create an AI voice campaign, or enable wholesale routing.

## Required service paths

| Service | Marketing page | Onboarding entry | Required review pages |
|---|---|---|---|
| Business SMS | `/messaging/business-sms` | `/get-started/sms` | use case, consent and opt-out, sender registration |
| Business VoIP | `/voice/business-voip` | `/get-started/voice` | use case, emergency services, caller identity, recording |
| AI voice over IP | `/voice/ai-voice` | `/get-started/ai-voice` | use case and risk, AI disclosure, consent and voice rights, recording |
| Wholesale/reseller | `/wholesale` | `/get-started/wholesale` | entity profile, downstream KYB, traffic profile, mitigation and traceback |

Every request also passes business verification, service selection, privacy/data review, policy-version acceptance, final certification, and manual review.

## Browser and server boundary

```text
Visitor
  -> Nuxt/Vue onboarding pages
  -> POST /api/v1/website/onboarding/compliance
  -> actual request-byte limit
  -> schema and step validation
  -> exact policy-version validation
  -> request ID + idempotency key
  -> Codestra Middleware
  -> Odoo compliance-review record
  -> approved n8n follow-up workflow
```

The browser never receives Odoo, n8n, Jasmin, Postal, SIP-provider, database, or queue credentials.

## Required legal pages

The legal manifest includes substantive English and Spanish drafts for:

- Terms of Service
- Privacy Policy
- Cookie Policy
- Acceptable Use Policy
- Service Level Policy
- Messaging and SMS Policy
- Anti-Spam and Consent Policy
- Voice Services Policy
- AI Voice Transparency and Use Policy
- Emergency Services Disclosure
- Call Recording and Transcription Policy
- Number Porting and Authorization Policy
- Wholesale and Reseller Policy
- Data Processing Addendum
- Subprocessor List
- Security and Responsible Disclosure Policy
- Accessibility Statement
- Regulatory Fees and Surcharges Disclosure
- Policy Version History
- Privacy request, sale/share opt-out, and cookie-settings utilities

## Production legal-publication gate

Normal CI validates structure, bilingual completeness, route coverage, service applicability, source references, policy acceptance, and capability freezes.

Production deployment additionally runs:

```bash
npm run validate:production-compliance
```

That command fails until all publication-required documents:

1. have `status: approved`;
2. have a valid effective date;
3. use a non-draft version;
4. have an immutable SHA-256 archive entry;
5. identify the approved legal entity, address, registration number, and country.

The repository intentionally starts with `counsel-review-required` documents and a placeholder legal entity. This makes the production path fail closed instead of publishing unapproved terms.

## Capability freeze

The onboarding and deployment manifests require:

```text
LIVE_SMS_DELIVERY=false
LIVE_EMAIL_DELIVERY=false
LIVE_PSTN_DIALING=false
ENABLE_PROVIDER_SUBMISSION=false
ENABLE_AUTOMATIC_PROVISIONING=false
ODOO_DIRECT_PUBLIC_ACCESS=false
N8N_DIRECT_PUBLIC_ACCESS=false
```

Submission, compliance approval, or an Odoo stage change must not automatically change these flags.

## Middleware contract

The website submits a durable review envelope with:

- selected services;
- every applicable completed step;
- sanitized answers;
- required acknowledgments;
- exact policy keys and versions;
- authorized signer certification;
- request ID and idempotency key;
- `activationRequested: false`;
- `activationAllowed: false`;
- all capability flags false.

Middleware owns tenant isolation, service authorization, idempotency, durable inbox/outbox, Odoo mapping, n8n event publication, audit, and replay protection.

## Review-state model

```text
draft
-> submitted
-> under-review
-> needs-information
-> approved or rejected
```

`approved` means the commercial/compliance request may proceed to a separate controlled provisioning process. It does not itself enable a provider or live traffic.
