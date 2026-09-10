#!/usr/bin/env bash
set -Eeuo pipefail

# This hostname belongs to the SMS runtime, independently of website DNS.
# No credentials, redirects, POST requests, or provider commands are used.
for endpoint in health ready; do
  response="$(curl --silent --show-error --fail --proto '=https' --tlsv1.2 \
    --connect-timeout 5 --max-time 12 --max-filesize 65536 \
    --user-agent 'Telnexa-Provider-Readiness/1.0' \
    --write-out $'\n%{http_code}' "https://api.telnexa.co/$endpoint")" || {
    printf 'PROVIDER_HEALTH=FAIL endpoint=%s transport\n' "$endpoint" >&2
    exit 1
  }
  status="${response##*$'\n'}"
  body="${response%$'\n'*}"
  [[ "$status" == "200" ]] || {
    printf 'PROVIDER_HEALTH=FAIL endpoint=%s status=%s\n' "$endpoint" "$status" >&2
    exit 1
  }
  if [[ "$endpoint" == "ready" ]] && ! jq -e '.status == "ready"' <<<"$body" >/dev/null 2>&1; then
    printf 'PROVIDER_HEALTH=FAIL endpoint=ready invalid-readiness\n' >&2
    exit 1
  fi
done
printf 'PROVIDER_HEALTH=PASS\n'
