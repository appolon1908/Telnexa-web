#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
EXPECTED_IP="${EXPECTED_IP:-49.12.145.107}"
MIN_FREE_GIB="${MIN_FREE_GIB:-5}"
failures=0

pass() { printf 'PASS %-34s %s\n' "$1" "${2:-}"; }
fail() { printf 'FAIL %-34s %s\n' "$1" "${2:-}" >&2; failures=$((failures + 1)); }
info() { printf 'INFO %-34s %s\n' "$1" "${2:-}"; }

for command in docker curl jq openssl getent ss git; do
  if command -v "$command" >/dev/null 2>&1; then pass "command:$command" "$(command -v "$command")"; else fail "command:$command" "missing"; fi
done

if docker compose version >/dev/null 2>&1; then pass docker-compose "$(docker compose version --short 2>/dev/null || true)"; else fail docker-compose missing; fi
if command -v caddy >/dev/null 2>&1; then pass caddy "$(caddy version 2>/dev/null || true)"; else fail caddy missing; fi

host_ips="$(hostname -I 2>/dev/null || true)"
if grep -qw "$EXPECTED_IP" <<<"$host_ips"; then pass expected-server-ip "$EXPECTED_IP"; else fail expected-server-ip "host reports: ${host_ips:-unknown}"; fi

free_kib="$(df -Pk / | awk 'NR==2 {print $4}')"
free_gib=$((free_kib / 1024 / 1024))
if (( free_gib >= MIN_FREE_GIB )); then pass disk-free "${free_gib}GiB"; else fail disk-free "${free_gib}GiB; require ${MIN_FREE_GIB}GiB"; fi

for port in 3300 38000 38100; do
  if ss -lntH "sport = :$port" | grep -q .; then
    info "loopback-port:$port" "already in use; confirm it belongs to the approved Telnexa stack"
  else
    pass "loopback-port:$port" available
  fi
done

for host in telnexa.co www.telnexa.co; do
  resolved="$(getent ahostsv4 "$host" 2>/dev/null | awk 'NR==1 {print $1}')"
  if [[ "$resolved" == "$EXPECTED_IP" ]]; then pass "dns:$host" "$resolved"; else fail "dns:$host" "resolved=${resolved:-none}, expected=$EXPECTED_IP"; fi
done

if bash "$SCRIPT_DIR/provider-health.sh"; then pass provider-api-health; else fail provider-api-health "existing SMS provider must remain ready"; fi

info running-containers "$(docker ps --format '{{.Names}}' | paste -sd, -)"
info listening-ports "read-only inventory follows"
ss -lntp || true

if (( failures > 0 )); then
  printf 'PREFLIGHT=FAIL failures=%d\n' "$failures" >&2
  exit 1
fi

printf 'PREFLIGHT=PASS\n'
