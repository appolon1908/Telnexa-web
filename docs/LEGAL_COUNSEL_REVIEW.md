# Legal counsel and responsible-owner publication checklist

The legal content in this repository is an implementation draft. It is deliberately marked `counsel-review-required` and cannot pass the production compliance gate until the following work is completed.

## Responsible legal entity

Replace every `_REQUIRED` value in `manifests/legal-entity.json` and approve:

- exact contracting legal name;
- registration or tax identifier;
- registered business address;
- country and governing-law strategy;
- privacy, security, abuse, accessibility, regulatory, support, and legal-notice contacts.

Set `status` to `approved` only after the responsible owner confirms the data.

## Jurisdiction and product review

Counsel and the responsible product/compliance owners must review at least:

- SMS consent, opt-out, sender identity, quiet hours, content restrictions, carrier/program rules, and record retention;
- outbound voice purpose, caller identity, do-not-call, revocation, artificial/prerecorded voice, and recording requirements;
- emergency-services availability, registered locations, nomadic users, power/internet dependency, and customer notices;
- AI identity disclosure, synthetic voice, consent, voice and likeness rights, human escalation, sensitive domains, high-impact decisions, and prohibited impersonation;
- wholesale/reseller KYB, downstream flow-down, nested resale, route transparency, sender/caller identity, traceback, mitigation, registration, suspension, and audit;
- privacy roles, lawful bases, notices, consumer/data-subject rights, retention, international transfers, subprocessors, security, CPNI where applicable, and breach response;
- accessibility obligations for VoIP, messaging, email, portals, documentation, and support;
- fees, taxes, surcharges, payment, refunds, termination, service levels, limitations, indemnity, dispute resolution, and governing law.

## Publication workflow

For each publication-required document:

1. approve the final English text;
2. approve the Spanish translation;
3. assign an effective date;
4. replace `2026.08-draft` with the approved version;
5. set `status` to `approved`;
6. render and archive the exact published content;
7. calculate the archive SHA-256;
8. add the key, version, effective date, path, and SHA-256 to `manifests/legal-versions.json`;
9. run structural CI;
10. run `npm run validate:production-compliance`;
11. independently review the exact release SHA.

## Change control

Any later policy change requires a new version and immutable archive entry. Existing customer acceptances remain tied to their exact version. Material changes may require notice, renewed acceptance, or migration controls based on the approved legal strategy.

## Production approval

Do not remove or bypass the publication gate to deploy faster. A production release is eligible only when:

```text
LEGAL_ENTITY=APPROVED
ALL_PUBLICATION_DOCUMENTS=APPROVED
EFFECTIVE_DATES=SET
IMMUTABLE_VERSION_ARCHIVES=COMPLETE
PRODUCTION_COMPLIANCE_VALIDATION=PASS
LIVE_DELIVERY_CAPABILITIES=FALSE
```
