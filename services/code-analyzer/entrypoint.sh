#!/bin/sh
set -e

# Write Kilo Code auth tokens from the base64-encoded env var.
# Generate the value with: base64 -w 0 ~/.local/share/kilo/auth.json
if [ -n "$KILO_AUTH_JSON_B64" ]; then
    mkdir -p /root/.local/share/kilo
    printf '%s' "$KILO_AUTH_JSON_B64" | base64 -d > /root/.local/share/kilo/auth.json
fi

exec "$@"
