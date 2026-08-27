# Service activation matrix

| Gate | SMS | Business VoIP | AI voice | Wholesale |
|---|---:|---:|---:|---:|
| Business and beneficial-owner verification | Required | Required | Required | Required |
| Use-case and traffic disclosure | Required | Required | Required | Required |
| Recipient/called-party relationship | Required | Required | Required | Required |
| Consent or lawful-contact basis | Required | Required | Required | Required through flow-down |
| Sender/caller identity authorization | Required | Required | Required | Required |
| STOP / do-not-call / revocation | Required | Required | Required | Required through flow-down |
| Emergency-services review | — | Required | Conditional on service design | Conditional on voice |
| Recording/transcription review | Conditional | Conditional | Required | Conditional |
| AI disclosure and human handoff | — | — | Required | Required when downstream AI is allowed |
| Voice/likeness rights | — | — | Required | Required when downstream AI is allowed |
| Downstream KYB and nested-resale disclosure | — | — | — | Required |
| Traffic origin, destination, route and provider disclosure | Required | Required | Required | Required |
| Traceback and mitigation | Conditional | Conditional | Conditional | Required |
| Privacy, retention, DPA and subprocessor review | Required | Required | Required | Required |
| Exact policy-version acceptance | Required | Required | Required | Required |
| Manual compliance review | Required | Required | Required | Required |
| Automatic activation | Prohibited | Prohibited | Prohibited | Prohibited |
