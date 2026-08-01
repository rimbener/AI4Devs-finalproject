#!/usr/bin/env bash
# Ensure local Supabase is up and freshly reset before app-level Playwright e2e.
# Invoked by scripts/run-e2e.sh (not Storybook e2e). Skip with SKIP_E2E_SUPABASE_PREPARE=1.
set -euo pipefail

if [[ "${SKIP_E2E_SUPABASE_PREPARE:-}" == "1" ]]; then
  echo "SKIP_E2E_SUPABASE_PREPARE=1 — skipping supabase start / db reset."
  exit 0
fi

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$APP_DIR/../.." && pwd)"
ENV_FILE="$APP_DIR/.env"
ENV_BACKUP="$APP_DIR/.env.e2e-backup"
# Set after .env is rewritten to the local stack — only then may we restore on failure
# (a stale backup from a prior crash must not overwrite .env if we never touched it).
ENV_REWRITTEN=0

restore_env_on_prepare_failure() {
  local ec=$?
  if [[ "$ENV_REWRITTEN" -eq 1 && "$ec" -ne 0 && -f "$ENV_BACKUP" ]]; then
    mv "$ENV_BACKUP" "$ENV_FILE"
    echo "Prepare failed — restored original $ENV_FILE from $ENV_BACKUP" >&2
  fi
}
trap restore_env_on_prepare_failure EXIT

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop first." >&2
  exit 1
fi

# `supabase db reset` wipes the ENTIRE local database (all manually created accounts,
# uploads, lessons), not just e2e rows. Ask before destroying it; CI and
# E2E_ACCEPT_DB_RESET=1 consent implicitly.
if [[ "${CI:-}" != "true" && "${CI:-}" != "1" && "${E2E_ACCEPT_DB_RESET:-}" != "1" ]]; then
  if [[ -t 0 ]]; then
    echo "e2e prepare will RESET the entire local Supabase database (all local data is lost)"
    echo "and temporarily point $ENV_FILE at the local stack (restored after the run)."
    read -r -p "Continue? [y/N] " answer
    if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
      echo "Aborted. Re-run with E2E_ACCEPT_DB_RESET=1 to skip this prompt." >&2
      exit 1
    fi
  else
    echo "Refusing to reset the local Supabase DB without consent (non-interactive shell)." >&2
    echo "Set E2E_ACCEPT_DB_RESET=1 (or CI=true) to proceed." >&2
    exit 1
  fi
fi

cd "$ROOT"
echo "Starting local Supabase (no-op if already running)..."
npx supabase start

# status -o env may mix human lines on stdout; pick only KEY=value rows.
STATUS="$(npx supabase status -o env 2>/dev/null || true)"
API_URL="$(printf '%s\n' "$STATUS" | sed -n 's/^API_URL=//p' | head -1 | tr -d '"')"
ANON_KEY="$(printf '%s\n' "$STATUS" | sed -n 's/^ANON_KEY=//p' | head -1 | tr -d '"')"

if [[ -z "$API_URL" || -z "$ANON_KEY" ]]; then
  echo "Failed to read API_URL / ANON_KEY from \`supabase status\`." >&2
  exit 1
fi

# Preserve the developer's .env (typically hosted-project credentials) so cleanup can
# restore it. Don't clobber an existing backup — it holds the original from a previous
# run whose cleanup never ran (crash/CTRL-C).
touch "$ENV_FILE"
if [[ ! -f "$ENV_BACKUP" ]]; then
  cp "$ENV_FILE" "$ENV_BACKUP"
fi

# Upsert Expo public vars so `pnpm web` hits this local stack.
TMP="$(mktemp)"
grep -vE '^(EXPO_PUBLIC_SUPABASE_URL|EXPO_PUBLIC_SUPABASE_ANON_KEY)=' "$ENV_FILE" >"$TMP" || true
{
  cat "$TMP"
  printf 'EXPO_PUBLIC_SUPABASE_URL=%s\n' "$API_URL"
  printf 'EXPO_PUBLIC_SUPABASE_ANON_KEY=%s\n' "$ANON_KEY"
} >"$ENV_FILE"
rm -f "$TMP"
ENV_REWRITTEN=1
echo "Wrote $ENV_FILE → $API_URL (original backed up at $ENV_BACKUP)"

echo "Resetting local DB (seeded accounts / clean slate for e2e)..."
npx supabase db reset
