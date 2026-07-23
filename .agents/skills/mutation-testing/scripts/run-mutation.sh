#!/usr/bin/env bash
# Run StrykerJS scoped to a feature's CHANGED source files, per lib.
#
# Usage:
#   run-mutation.sh [base-ref]
#
# Base ref resolution (first that applies):
#   1) explicit arg              run-mutation.sh feature-entrega3-HernanLaura
#   2) $ORCHESTRATOR_BASE_REF    export ORCHESTRATOR_BASE_REF=feature-entrega3-HernanLaura
#   3) auto-detected delivery branch  (a local `feature-entrega*` branch; the feature
#      worktree is cut from the delivery branch, never blind `main`)
#   4) fallback: main
# NEVER silently diff against `main` when a delivery branch exists — that pulls the
# whole entregas history into scope and floods mutation with pre-existing lines.
#
# Computes files changed since the merge-base with base-ref via three-dot
# (`git diff A...B` ≡ `git diff $(merge-base A B) B`). Filters to each lib's
# mutate-able source (excludes tests, stories, e2e, index barrels, test-utils),
# then applies the ATOM MUTATE BAN, then runs `stryker run --mutate` per lib.
#
# Hardened for agent/CI use:
#   - continues on a failing lib and aggregates the exit code (does NOT abort on
#     the first lib under threshold — every affected lib is measured);
#   - non-TTY-safe: the per-lib config emits `clear-text,json,html` (no `progress`),
#     and CI=1 is exported so Stryker never selects an interactive reporter;
#   - refuses to start if a Stryker run is already active (`.stryker-tmp`);
#   - after all libs, calls parse-mutation-report.mjs to stub the mutation.md table.
#
# Atom mutate ban: files under `**/src/atoms/**` are EXCLUDED from the mutate scope
# unless the story owns that atom. Ownership is signalled by env
# `ORCHESTRATOR_ATOM_OWNED` (comma-separated atom paths or names) — set it only when
# the user story is about changing that atom's API/behavior. Otherwise the script
# warns and drops the atom from scope (feature a11y/focus belongs on local wrappers,
# not shared atoms). See .agents/skills/mutation-testing/SKILL.md §Atom mutate ban.

set -uo pipefail   # NOT -e: we want to run every lib and aggregate

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# --- base ref ---------------------------------------------------------------
resolve_base() {
  if [ "${1:-}" != "" ]; then echo "$1"; return; fi
  if [ "${ORCHESTRATOR_BASE_REF:-}" != "" ]; then echo "$ORCHESTRATOR_BASE_REF"; return; fi
  # newest local delivery branch, if any
  local delivery
  delivery="$(git for-each-ref --sort=-committerdate --format='%(refname:short)' \
                'refs/heads/feature-entrega*' 2>/dev/null | head -1)"
  if [ -n "$delivery" ]; then echo "$delivery"; return; fi
  echo "main"
}
BASE="$(resolve_base "${1:-}")"
echo "▷ mutation base-ref: ${BASE}"
if [ "$BASE" = "main" ] && git for-each-ref 'refs/heads/feature-entrega*' | grep -q .; then
  echo "⚠ base is 'main' but a delivery branch exists — pass the delivery branch (arg or ORCHESTRATOR_BASE_REF) so scope stays the feature delta, not the whole entrega." >&2
fi

# --- refuse if a Stryker run is already active ------------------------------
if find libs -maxdepth 2 -type d -name '.stryker-tmp' 2>/dev/null | grep -q .; then
  echo "✗ a Stryker run looks active (found .stryker-tmp). Wait for it to finish or remove stale dirs, then retry." >&2
  exit 2
fi

export CI=1   # keep Stryker off interactive/progress reporters in agent/CI shells

LIBS=("libs/services:@helsoft/services" "libs/supabase-services:@helsoft/supabase-services" "libs/hooks:@helsoft/hooks" "libs/components:@helsoft/components" "libs/logging-in-out:@helsoft/logging-in-out" "libs/activities:@helsoft/activities" "libs/study-buddy:@helsoft/study-buddy")

atom_owned() {  # $1 = repo-relative file path; 0 if the story owns this atom
  local f="$1" tok
  [ "${ORCHESTRATOR_ATOM_OWNED:-}" = "" ] && return 1
  IFS=',' read -ra toks <<< "$ORCHESTRATOR_ATOM_OWNED"
  for tok in "${toks[@]}"; do
    tok="$(echo "$tok" | xargs)"; [ -z "$tok" ] && continue
    [[ "$f" == *"$tok"* ]] && return 0
  done
  return 1
}

any=0
fail=0
for entry in "${LIBS[@]}"; do
  lib="${entry%%:*}"
  pkg="${entry##*:}"

  files="$(git diff --name-only "${BASE}...HEAD" -- "${lib}/src" \
    | grep -E '\.(ts|tsx)$' \
    | grep -vE '\.(test|stories)\.(ts|tsx)$|\.e2e\.js$|/index\.ts$|/(test-utils|testing)/' || true)"

  # Atom mutate ban: drop atoms the story doesn't own.
  kept=""
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if [[ "$f" == *"/src/atoms/"* ]] && ! atom_owned "$f"; then
      echo "⚠ ${pkg}: atom NOT owned by this story, excluding from mutate scope: ${f}" >&2
      echo "   (feature a11y/focus → wrap locally; don't edit shared atoms. If the story DOES own it, set ORCHESTRATOR_ATOM_OWNED.)" >&2
      continue
    fi
    kept="${kept}${f}"$'\n'
  done <<< "$files"
  files="$(printf '%s' "$kept" | sed '/^$/d')"

  if [ -z "${files}" ]; then
    echo "· ${pkg}: no changed source in scope, skipping"
    continue
  fi

  any=1
  rel="$(printf '%s\n' "${files}" | sed "s#^${lib}/##" | paste -sd, -)"
  echo "▶ ${pkg}: mutating ${rel}"
  if ! pnpm --filter "${pkg}" exec stryker run --mutate "${rel}"; then
    echo "✗ ${pkg}: stryker exited non-zero (threshold unmet or run error) — continuing with remaining libs" >&2
    fail=1
  fi
done

if [ "${any}" = 0 ]; then
  echo "No changed source files to mutate against ${BASE}."
  exit 0
fi

# --- stub the mutation.md table from the JSON reports (no ad-hoc scraping) ---
if [ -n "${ORCHESTRATOR_FEATURE:-}" ] && command -v node >/dev/null 2>&1; then
  node "${SCRIPT_DIR}/parse-mutation-report.mjs" "${ORCHESTRATOR_FEATURE}" || true
else
  echo "ℹ set ORCHESTRATOR_FEATURE=<name> to auto-stub docs/features/<name>/mutation.md from the JSON reports." >&2
fi

[ "${fail}" = 0 ] && echo "✓ all libs met threshold" || echo "✗ one or more libs under threshold — see per-lib output + mutation.md; kill survivors or ESCALATE (never rewrite as PASS)."
exit "${fail}"
