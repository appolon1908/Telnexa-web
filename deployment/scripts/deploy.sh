#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.production.yml"
ACTIVE_ENV="$DEPLOY_DIR/.env.production"
PREVIOUS_ENV="$DEPLOY_DIR/.env.production.previous"
KONG_SOURCE="$DEPLOY_DIR/kong.yml"
KONG_RUNTIME="$DEPLOY_DIR/generated/kong.yml"
RELEASE_ENV="${1:-}"
APPLY_CADDY="${APPLY_CADDY:-0}"
CADDY_SOURCE="$DEPLOY_DIR/Caddyfile.telnexa"
CADDY_TARGET="${CADDY_TARGET:-/etc/caddy/sites-enabled/telnexa.caddy}"
EVIDENCE_DIR="$DEPLOY_DIR/evidence"
rollback_required=0

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
require_false() {
  local key="$1" value
  value="$(grep -E "^${key}=" "$ACTIVE_ENV" | tail -1 | cut -d= -f2- || true)"
  [[ "$value" == "false" ]] || fail "$key must remain false (found: ${value:-missing})"
}
rollback_on_error() {
  local status=$?
  if (( status != 0 )) && (( rollback_required == 1 )); then
    printf 'Deployment failed; attempting container rollback.\n' >&2
    if [[ -f "$PREVIOUS_ENV" ]]; then
      cp -f "$PREVIOUS_ENV" "$ACTIVE_ENV"
      chmod 0600 "$ACTIVE_ENV"
      docker compose --env-file "$ACTIVE_ENV" -f "$COMPOSE_FILE" up -d --remove-orphans || true
    fi
  fi
  exit "$status"
}
trap rollback_on_error EXIT

[[ -n "$RELEASE_ENV" ]] || fail "usage: $0 /secure/path/release.env"
[[ -f "$RELEASE_ENV" ]] || fail "release environment file not found: $RELEASE_ENV"
[[ -f "$COMPOSE_FILE" ]] || fail "Compose file missing"
[[ -f "$KONG_SOURCE" ]] || fail "Kong declarative configuration missing"
[[ -x "$SCRIPT_DIR/validate-compliance.sh" ]] || fail "Production compliance validator missing"

# This deliberately fails until counsel-approved documents, effective dates,
# legal-entity details, and immutable version archives are present.
"$SCRIPT_DIR/validate-compliance.sh"

"$SCRIPT_DIR/preflight.sh"

install -d -m 0750 "$DEPLOY_DIR/generated" "$EVIDENCE_DIR"
install -m 0600 "$RELEASE_ENV" "$ACTIVE_ENV.next"

if [[ -f "$ACTIVE_ENV" ]]; then
  cp -f "$ACTIVE_ENV" "$PREVIOUS_ENV"
  chmod 0600 "$PREVIOUS_ENV"
fi
mv -f "$ACTIVE_ENV.next" "$ACTIVE_ENV"
chmod 0600 "$ACTIVE_ENV"
rollback_required=1

set -a
# shellcheck disable=SC1090
source "$ACTIVE_ENV"
set +a

[[ "${TELNEXA_WEB_IMAGE:-}" =~ @sha256:[0-9a-f]{64}$ ]] || fail "TELNEXA_WEB_IMAGE must use an immutable sha256 digest"
[[ "${KONG_IMAGE:-}" =~ @sha256:[0-9a-f]{64}$ ]] || fail "KONG_IMAGE must use an immutable sha256 digest"
[[ "${NUXT_PUBLIC_RELEASE_SHA:-}" =~ ^[0-9a-f]{40}$ ]] || fail "NUXT_PUBLIC_RELEASE_SHA must be a full merged Git SHA"
[[ -n "${NUXT_MIDDLEWARE_BASE_URL:-}" ]] || fail "NUXT_MIDDLEWARE_BASE_URL is required"
[[ -n "${NUXT_MIDDLEWARE_SERVICE_TOKEN:-}" ]] || fail "NUXT_MIDDLEWARE_SERVICE_TOKEN is required"
require_false NUXT_DEV_FORM_SINK_ENABLED

for capability in \
  LIVE_SMS_DELIVERY \
  LIVE_EMAIL_DELIVERY \
  LIVE_PSTN_DIALING \
  ENABLE_PROVIDER_SUBMISSION \
  ENABLE_AUTOMATIC_PROVISIONING \
  ODOO_DIRECT_PUBLIC_ACCESS \
  N8N_DIRECT_PUBLIC_ACCESS; do
  require_false "$capability"
done

install -m 0644 "$KONG_SOURCE" "$KONG_RUNTIME"
docker compose --env-file "$ACTIVE_ENV" -f "$COMPOSE_FILE" config >/dev/null
docker compose --env-file "$ACTIVE_ENV" -f "$COMPOSE_FILE" pull
docker compose --env-file "$ACTIVE_ENV" -f "$COMPOSE_FILE" up -d --remove-orphans

for attempt in {1..60}; do
  if curl -fsS http://127.0.0.1:3300/healthz >/dev/null \
    && curl -fsS http://127.0.0.1:38100/status >/dev/null; then
    break
  fi
  if (( attempt == 60 )); then fail "application or Kong did not become healthy"; fi
  sleep 2
done

release_response="$(curl -fsS http://127.0.0.1:3300/version)"
actual_sha="$(jq -r '.releaseSha // empty' <<<"$release_response")"
[[ "$actual_sha" == "$NUXT_PUBLIC_RELEASE_SHA" ]] || fail "release identity mismatch: expected $NUXT_PUBLIC_RELEASE_SHA, got ${actual_sha:-none}"

if [[ "$APPLY_CADDY" == "1" ]]; then
  caddy validate --config "$CADDY_SOURCE" --adapter caddyfile
  sudo install -D -m 0644 "$CADDY_SOURCE" "$CADDY_TARGET"
  sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
  sudo systemctl reload caddy
fi

EXPECTED_RELEASE_SHA="$NUXT_PUBLIC_RELEASE_SHA" "$SCRIPT_DIR/smoke.sh"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
{
  echo "DEPLOYED_AT=$stamp"
  echo "RELEASE_SHA=$NUXT_PUBLIC_RELEASE_SHA"
  echo "WEB_IMAGE=$TELNEXA_WEB_IMAGE"
  echo "KONG_IMAGE=$KONG_IMAGE"
  echo "CADDY_APPLIED=$APPLY_CADDY"
  echo "PRODUCTION_COMPLIANCE_GATE=PASS"
  echo "LIVE_CAPABILITIES_ENABLED=NO"
} >"$EVIDENCE_DIR/deployment-$stamp.env"
chmod 0640 "$EVIDENCE_DIR/deployment-$stamp.env"

rollback_required=0
trap - EXIT
printf 'DEPLOYMENT=PASS RELEASE_SHA=%s\n' "$NUXT_PUBLIC_RELEASE_SHA"
