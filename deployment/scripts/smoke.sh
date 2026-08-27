#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
PAGES="$DEPLOY_DIR/../manifests/pages.json"
FORMS="$DEPLOY_DIR/../manifests/forms.json"
ONBOARDING="$DEPLOY_DIR/../manifests/onboarding-gates.json"
EXPECTED_IP="${EXPECTED_IP:-49.12.145.107}"
EXPECTED_RELEASE_SHA="${EXPECTED_RELEASE_SHA:-}"
USER_AGENT='Telnexa-Deployment-Smoke/1.1'

for file in "$PAGES" "$FORMS" "$ONBOARDING"; do
  [[ -f "$file" ]] || { echo "Missing $file" >&2; exit 1; }
done

for host in telnexa.co api.telnexa.co; do
  resolved="$(getent ahostsv4 "$host" | awk 'NR==1 {print $1}')"
  [[ "$resolved" == "$EXPECTED_IP" ]] || { echo "$host resolves to ${resolved:-none}, expected $EXPECTED_IP" >&2; exit 1; }
done

http_code="$(curl -sS -o /dev/null -w '%{http_code}' -A "$USER_AGENT" http://telnexa.co/)"
[[ "$http_code" == "301" || "$http_code" == "308" ]] || { echo "HTTP redirect returned $http_code" >&2; exit 1; }

curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" https://telnexa.co/healthz >/dev/null
curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" https://api.telnexa.co/healthz >/dev/null
curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" https://telnexa.co/readyz | jq -e '.status == "ready" and .checks.application == true and .checks.forms == true' >/dev/null

version="$(curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" https://telnexa.co/version)"
actual_sha="$(jq -r '.releaseSha // empty' <<<"$version")"
if [[ -n "$EXPECTED_RELEASE_SHA" && "$actual_sha" != "$EXPECTED_RELEASE_SHA" ]]; then
  echo "Public release mismatch: expected $EXPECTED_RELEASE_SHA, got ${actual_sha:-none}" >&2
  exit 1
fi

while IFS= read -r path; do
  curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" "https://telnexa.co${path}" >/dev/null
done < <(jq -r '.pages[].path' "$PAGES")

while IFS= read -r path; do
  if [[ "$path" == "/" ]]; then localized="/es"; else localized="/es${path}"; fi
  curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" "https://telnexa.co${localized}" >/dev/null
done < <(jq -r '.pages[] | select(.indexable == true) | .path' "$PAGES")

sitemap="$(curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" https://telnexa.co/sitemap.xml)"
url_count="$(grep -o '<url>' <<<"$sitemap" | wc -l | tr -d ' ')"
expected_sitemap="$(jq -r '.indexableBaseRouteCount * 2' "$PAGES")"
[[ "$url_count" == "$expected_sitemap" ]] || { echo "Sitemap contains $url_count URLs; expected $expected_sitemap" >&2; exit 1; }

for path in / /voice/ai-voice /wholesale /legal /legal/privacy /legal/messaging-policy /legal/ai-voice /legal/wholesale-reseller; do
  html="$(curl -fsS --proto '=https' --tlsv1.2 -A "$USER_AGENT" "https://telnexa.co${path}")"
  if grep -Eqi 'href=["'\'']#["'\'']|javascript:' <<<"$html"; then
    echo "Dead or unsafe CTA found on ${path}." >&2
    exit 1
  fi
done

while IFS=$'\t' read -r key endpoint; do
  request_id="$(cat /proc/sys/kernel/random/uuid)"
  code="$(curl -sS --proto '=https' --tlsv1.2 -A "$USER_AGENT" \
    -o "/tmp/telnexa-form-${key}.json" -w '%{http_code}' \
    -X POST "https://telnexa.co${endpoint}" \
    -H 'Content-Type: application/json' \
    -H "Idempotency-Key: $request_id" \
    -H "X-Request-ID: $request_id" \
    --data '{}')"
  [[ "$code" == "422" ]] || { echo "No-write form validation for $key returned $code" >&2; cat "/tmp/telnexa-form-${key}.json" >&2; exit 1; }
done < <(jq -r '.forms[] | [.key, .endpoint] | @tsv' "$FORMS")

onboarding_endpoint="$(jq -r '.submissionEndpoint' "$ONBOARDING")"
request_id="$(cat /proc/sys/kernel/random/uuid)"
onboarding_code="$(curl -sS --proto '=https' --tlsv1.2 -A "$USER_AGENT" \
  -o /tmp/telnexa-onboarding-validation.json -w '%{http_code}' \
  -X POST "https://telnexa.co${onboarding_endpoint}" \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $request_id" \
  -H "X-Request-ID: $request_id" \
  --data '{}')"
[[ "$onboarding_code" == "422" ]] || {
  echo "No-write onboarding validation returned $onboarding_code" >&2
  cat /tmp/telnexa-onboarding-validation.json >&2
  exit 1
}

route_count="$(jq -r '.baseRouteCount + .indexableBaseRouteCount' "$PAGES")"
form_count="$(jq -r '.forms | length' "$FORMS")"
printf 'PUBLIC_SMOKE=PASS RELEASE_SHA=%s ROUTES=%s FORMS=%s ONBOARDING=1 SITEMAP_URLS=%s\n' \
  "$actual_sha" "$route_count" "$form_count" "$url_count"
