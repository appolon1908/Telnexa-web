#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.production.yml"
ACTIVE_ENV="$DEPLOY_DIR/.env.production"
PREVIOUS_ENV="$DEPLOY_DIR/.env.production.previous"
EVIDENCE_DIR="$DEPLOY_DIR/evidence"

[[ "${CONFIRM_ROLLBACK:-}" == "YES" ]] || { echo 'Set CONFIRM_ROLLBACK=YES to proceed.' >&2; exit 1; }
[[ -f "$PREVIOUS_ENV" ]] || { echo 'No previous deployment environment is available.' >&2; exit 1; }

cp -f "$ACTIVE_ENV" "$DEPLOY_DIR/.env.production.failed" 2>/dev/null || true
cp -f "$PREVIOUS_ENV" "$ACTIVE_ENV"
chmod 0600 "$ACTIVE_ENV"

set -a
# shellcheck disable=SC1090
source "$ACTIVE_ENV"
set +a

docker compose --env-file "$ACTIVE_ENV" -f "$COMPOSE_FILE" config >/dev/null
docker compose --env-file "$ACTIVE_ENV" -f "$COMPOSE_FILE" pull
docker compose --env-file "$ACTIVE_ENV" -f "$COMPOSE_FILE" up -d --remove-orphans

for attempt in {1..45}; do
  if curl -fsS http://127.0.0.1:3300/healthz >/dev/null; then break; fi
  if (( attempt == 45 )); then echo 'Rollback health validation failed.' >&2; exit 1; fi
  sleep 2
done

actual_sha="$(curl -fsS http://127.0.0.1:3300/version | jq -r '.releaseSha // empty')"
[[ "$actual_sha" == "${NUXT_PUBLIC_RELEASE_SHA:-}" ]] || { echo "Rollback release mismatch: ${actual_sha:-none}" >&2; exit 1; }

install -d -m 0750 "$EVIDENCE_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
{
  echo "ROLLED_BACK_AT=$stamp"
  echo "RELEASE_SHA=$actual_sha"
  echo "RESULT=PASS"
} >"$EVIDENCE_DIR/rollback-$stamp.env"
chmod 0640 "$EVIDENCE_DIR/rollback-$stamp.env"

printf 'ROLLBACK=PASS RELEASE_SHA=%s\n' "$actual_sha"
