#!/usr/bin/env bash
# Wipe golden-path DB writes (real pdf upload/extract rows) after app Playwright e2e.
# Invoked by scripts/run-e2e.sh. Skip with SKIP_E2E_SUPABASE_PREPARE=1 (same hatch as prepare).
set -euo pipefail

if [[ "${SKIP_E2E_SUPABASE_PREPARE:-}" == "1" ]]; then
  echo "SKIP_E2E_SUPABASE_PREPARE=1 — skipping post-e2e db reset."
  exit 0
fi

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$APP_DIR/../.." && pwd)"

cd "$ROOT"
echo "Resetting local DB after e2e (drop golden-path uploads / restore seed)..."
npx supabase db reset
