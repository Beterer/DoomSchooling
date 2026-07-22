#!/bin/sh
set -eu

: "${CLERK_PUBLISHABLE_KEY:?CLERK_PUBLISHABLE_KEY is required}"

case "$CLERK_PUBLISHABLE_KEY" in
  pk_test_*|pk_live_*) ;;
  *)
    echo "CLERK_PUBLISHABLE_KEY must be a Clerk publishable key" >&2
    exit 1
    ;;
esac

printf 'window.__DOOMSCHOOLING_CONFIG__ = Object.freeze({ clerkPublishableKey: "%s" });\n' \
  "$CLERK_PUBLISHABLE_KEY" > /srv/config.js

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
