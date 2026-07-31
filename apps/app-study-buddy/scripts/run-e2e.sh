#!/usr/bin/env bash
# Prepare local Supabase, then run Playwright app e2e (forwards all args).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

bash "$APP_DIR/scripts/e2e-prepare-supabase.sh"
exec npx playwright test "$@"
