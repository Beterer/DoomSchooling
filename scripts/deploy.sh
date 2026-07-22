#!/usr/bin/env bash
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-167.233.202.234}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_DIR="${DEPLOY_DIR:-/home/deploy/doomschooling}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/notice_vps}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_SRC="${REPO_ROOT}/infra/compose/docker-compose.prod.yml"
BOX_COMPOSE="${DEPLOY_DIR}/docker-compose.prod.yml"

echo ">>> Deploying DoomSchooling to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}"

ssh -i "$SSH_KEY" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "install -d -m 700 '${DEPLOY_DIR}'"

echo ">>> Syncing docker-compose.prod.yml"
if ssh -i "$SSH_KEY" "${DEPLOY_USER}@${DEPLOY_HOST}" "test -f '${BOX_COMPOSE}'"; then
  tr -d '\r' < "$COMPOSE_SRC" | ssh -i "$SSH_KEY" "${DEPLOY_USER}@${DEPLOY_HOST}" \
    "cp -a '${BOX_COMPOSE}' '${BOX_COMPOSE}.bak.\$(date +%s)' && cat > '${BOX_COMPOSE}'"
else
  tr -d '\r' < "$COMPOSE_SRC" | ssh -i "$SSH_KEY" "${DEPLOY_USER}@${DEPLOY_HOST}" \
    "cat > '${BOX_COMPOSE}'"
fi

ssh -i "$SSH_KEY" "${DEPLOY_USER}@${DEPLOY_HOST}" "DEPLOY_DIR='${DEPLOY_DIR}' bash -s" <<'REMOTE'
set -euo pipefail
cd "$DEPLOY_DIR"
COMPOSE="docker compose -f docker-compose.prod.yml"

test -f .env || { echo 'ERROR: .env is missing on the VPS' >&2; exit 1; }
chmod 600 .env

echo ">>> Validating compose configuration"
$COMPOSE config --quiet

echo ">>> Pulling images"
$COMPOSE pull

echo ">>> Starting the stack"
$COMPOSE up -d

echo ">>> Waiting for the loopback health check"
ok=0
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5173/api/health || true)
  if [ "$code" = "200" ]; then ok=1; break; fi
  sleep 2
done

if [ "$ok" -ne 1 ]; then
  echo 'ERROR: DoomSchooling did not become healthy' >&2
  $COMPOSE ps
  $COMPOSE logs --tail 50 api web cloudflared
  exit 1
fi

$COMPOSE ps
echo ">>> DoomSchooling deploy complete"
REMOTE
