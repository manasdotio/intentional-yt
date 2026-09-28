#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/scripts/package.cjs" "${1:-$SCRIPT_DIR/intentional-yt.zip}"
