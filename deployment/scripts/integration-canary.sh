#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${ALLOW_TEST_RECORD_CREATE:-}" == "YES" ]] || { echo 'Set ALLOW_TEST_RECORD_CREATE=YES for this controlled canary.' >&2; exit 1; }
[[ -n "${CANARY_EMAIL:-}" ]] || { echo 'CANARY_EMAIL is required.' >&2; exit 1; }
[[ -n "${CANARY_STATUS_URL:-}" ]] || { echo 'CANARY_STATUS_URL is required.' >&2; exit 1; }
[[ -n "${CANARY_STATUS_TOKEN:-}" ]] || { echo 'CANARY_STATUS_TOKEN is required.' >&2; exit 1; }
[[ "${LIVE_SMS_DELIVERY:-false}" == "false" ]] || { echo 'LIVE_SMS_DELIVERY must remain false.' >&2; exit 1; }
[[ "${LIVE_EMAIL_DELIVERY:-false}" == "false" ]] || { echo 'LIVE_EMAIL_DELIVERY must remain false.' >&2; exit 1; }
[[ "${LIVE_PSTN_DIALING:-false}" == "false" ]] || { echo 'LIVE_PSTN_DIALING must remain false.' >&2; exit 1; }

request_id="$(cat /proc/sys/kernel/random/uuid)"
marker="TELNEXA-WEB-CANARY-${request_id}"
payload="$(jq -n \
  --arg name 'Telnexa Integration Canary' \
  --arg email "$CANARY_EMAIL" \
  --arg company "$marker" \
  --arg sourcePage '/deployment-canary' \
  '{name:$name,email:$email,company:$company,sourcePage:$sourcePage,locale:"en",consent:{privacyAccepted:true,marketingAccepted:false},canary:true}')"

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT
code="$(curl -sS --proto '=https' --tlsv1.2 \
  -o "$response_file" -w '%{http_code}' \
  -X POST https://telnexa.co/api/v1/website/forms/demo \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $request_id" \
  -H "X-Request-ID: $request_id" \
  --data "$payload")"
[[ "$code" == "202" ]] || { echo "Canary submission returned $code" >&2; cat "$response_file" >&2; exit 1; }
accepted_id="$(jq -r '.requestId // empty' "$response_file")"
[[ -n "$accepted_id" ]] || { echo 'Canary response did not include a request ID.' >&2; exit 1; }

for attempt in {1..60}; do
  status="$(curl -fsS --proto '=https' --tlsv1.2 \
    -H "Authorization: Bearer $CANARY_STATUS_TOKEN" \
    "${CANARY_STATUS_URL}?requestId=${accepted_id}")"

  odoo="$(jq -r '.odoo.status // empty' <<<"$status")"
  n8n="$(jq -r '.n8n.status // empty' <<<"$status")"
  duplicate_count="$(jq -r '.duplicateCount // 0' <<<"$status")"

  if [[ "$odoo" == "created" && "$n8n" == "completed" && "$duplicate_count" == "0" ]]; then
    printf 'INTEGRATION_CANARY=PASS REQUEST_ID=%s ODOO=created N8N=completed DUPLICATES=0\n' "$accepted_id"
    exit 0
  fi

  sleep 5
done

echo "Integration canary did not reach the required terminal state for request $accepted_id." >&2
exit 1
