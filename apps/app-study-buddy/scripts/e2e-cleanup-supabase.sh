#!/usr/bin/env bash
# Wipe golden-path DB writes (real pdf upload/extract rows) after app Playwright e2e,
# then restore the developer's original .env saved by e2e-prepare-supabase.sh.
# Invoked by scripts/run-e2e.sh. Skip with SKIP_E2E_SUPABASE_PREPARE=1 (same hatch as prepare).
set -euo pipefail

if [[ "${SKIP_E2E_SUPABASE_PREPARE:-}" == "1" ]]; then
  echo "SKIP_E2E_SUPABASE_PREPARE=1 — skipping post-e2e db reset."
  exit 0
fi

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$APP_DIR/../.." && pwd)"
ENV_FILE="$APP_DIR/.env"
ENV_BACKUP="$APP_DIR/.env.e2e-backup"

restore_env() {
  if [[ -f "$ENV_BACKUP" ]]; then
    mv "$ENV_BACKUP" "$ENV_FILE"
    echo "Restored original $ENV_FILE from $ENV_BACKUP"
  fi
}
# Always restore .env — even when db reset fails (set -e would otherwise skip the restore).
trap restore_env EXIT

cd "$ROOT"
# Safe by construction: run-e2e.sh always runs prepare first, so at this point the local
# DB holds only seed data + this run's golden-path rows (consent was given in prepare).
echo "Resetting local DB after e2e (drop golden-path uploads / restore seed)..."
npx supabase db reset
