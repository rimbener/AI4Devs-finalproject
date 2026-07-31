#!/usr/bin/env bash
# Prepare local Supabase, run Playwright app e2e, then reset DB (forwards all args).
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

bash "$APP_DIR/scripts/e2e-prepare-supabase.sh"

set +e
npx playwright test "$@"
code=$?
set -e

bash "$APP_DIR/scripts/e2e-cleanup-supabase.sh"
exit "$code"
