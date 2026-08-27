#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
LEGAL="$ROOT_DIR/manifests/legal-documents.json"
ENTITY="$ROOT_DIR/manifests/legal-entity.json"
VERSIONS="$ROOT_DIR/manifests/legal-versions.json"
ONBOARDING="$ROOT_DIR/manifests/onboarding-gates.json"

fail() { printf 'PRODUCTION_COMPLIANCE_GATE=BLOCKED %s\n' "$*" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || fail "jq is required"
for file in "$LEGAL" "$ENTITY" "$VERSIONS" "$ONBOARDING"; do
  [[ -f "$file" ]] || fail "missing manifest: $file"
  jq empty "$file" >/dev/null || fail "invalid JSON: $file"
done

jq -e '
  all(.documents[] | select(.publicationRequired == true);
    .status == "approved"
    and (.effectiveDate | type == "string")
    and (.effectiveDate | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))
    and (.version | ascii_downcase | contains("draft") | not)
  )
' "$LEGAL" >/dev/null || fail "one or more required legal documents are not approved, dated, or final"

jq -e '
  .status == "approved"
  and ([.legalName, .registrationNumber, .businessAddress, .country]
    | all(type == "string" and length > 2 and (contains("_REQUIRED") | not)))
' "$ENTITY" >/dev/null || fail "responsible legal entity is incomplete or not approved"

jq -e --slurpfile versions "$VERSIONS" '
  all(.documents[] | select(.publicationRequired == true);
    . as $document
    | $versions[0].versions
    | any(
        .key == $document.key
        and .version == $document.version
        and .effectiveDate == $document.effectiveDate
        and (.sha256 | type == "string")
        and (.sha256 | test("^[0-9a-f]{64}$"))
      )
  )
' "$LEGAL" >/dev/null || fail "one or more approved documents lack an immutable SHA-256 archive entry"

jq -e '
  .activationGate.manualReviewRequired == true
  and .activationGate.activationAllowedOnSubmission == false
  and .activationGate.approvedDoesNotAutoProvision == true
  and (.activationGate.capabilityFlags | all(. == false))
' "$ONBOARDING" >/dev/null || fail "onboarding activation freeze is missing or unsafe"

printf 'PRODUCTION_COMPLIANCE_GATE=PASS\n'
