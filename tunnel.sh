#!/usr/bin/env bash
# Start the dev server and expose it via the named Cloudflare tunnel.
# Loads CLOUDFLARE_TUNNEL_TOKEN from .env
# Your app will be live at https://doomschooling.org

set -a
source "$(dirname "$0")/.env"
set +a

if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
  echo "Error: CLOUDFLARE_TUNNEL_TOKEN is not set in .env"
  exit 1
fi

pnpm dev &
DEV_PID=$!

sleep 3
cloudflared tunnel run --token "$CLOUDFLARE_TUNNEL_TOKEN"

kill $DEV_PID 2>/dev/null
