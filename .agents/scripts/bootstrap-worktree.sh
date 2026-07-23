#!/usr/bin/env bash
# Bootstrap a feature git worktree for the orchestrator.
#
# Usage: bootstrap-worktree.sh <name> [base-ref]
#
# - Base = the delivery branch, ALWAYS — never a blind `main`. Resolution order:
#   explicit arg → $ORCHESTRATOR_BASE_REF → newest local `feature-entrega*` → error.
#   (Blind `main` was a recurring boot bug: the feature branched off stale history.)
# - Creates .worktrees/<name> on a new `feat/<name>` branch cut from that base.
# - Runs `pnpm install` inside the worktree (no fragile node_modules symlink).
# - Seeds docs/features/<name>/ from .agents/templates/ (spec.md, tasks.md, task.md
#   → task-1.md) — NOT risks.md (that goes to tmp/<name>/, landed at PR time).
# - Prints the absolute worktree path so agents cd into the right place.
set -uo pipefail

NAME="${1:?usage: bootstrap-worktree.sh <name> [base-ref]}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

resolve_base() {
  if [ "${2:-}" != "" ]; then echo "$2"; return; fi
  if [ "${ORCHESTRATOR_BASE_REF:-}" != "" ]; then echo "$ORCHESTRATOR_BASE_REF"; return; fi
  git for-each-ref --sort=-committerdate --format='%(refname:short)' \
    'refs/heads/feature-entrega*' 2>/dev/null | head -1
}
BASE="$(resolve_base "$@")"
if [ -z "$BASE" ]; then
  echo "✗ no delivery branch found (feature-entrega*) and no base given. Pass one: bootstrap-worktree.sh $NAME <delivery-branch>" >&2
  exit 1
fi
echo "▷ base (delivery) branch: $BASE"

WT=".worktrees/${NAME}"
if [ -d "$WT" ]; then
  echo "✗ worktree already exists: $WT (remove it first: git worktree remove $WT)" >&2
  exit 1
fi

git worktree add "$WT" -b "feat/${NAME}" "$BASE" || exit 1
WT_ABS="$(cd "$WT" && pwd)"

echo "▷ pnpm install in worktree…"
( cd "$WT_ABS" && pnpm install ) || { echo "✗ pnpm install failed in $WT_ABS" >&2; exit 1; }

# Seed feature docs from templates (not risks.md — it's written to tmp/<name>/).
DOCS="${WT_ABS}/docs/features/${NAME}"
mkdir -p "$DOCS"
cp "${WT_ABS}/.agents/templates/spec.md"  "${DOCS}/spec.md"
cp "${WT_ABS}/.agents/templates/tasks.md" "${DOCS}/tasks.md"
cp "${WT_ABS}/.agents/templates/task.md"  "${DOCS}/task-1.md"
echo "▷ seeded ${DOCS} (spec.md, tasks.md, task-1.md)"

echo "✓ worktree ready — cd into:"
echo "${WT_ABS}"
