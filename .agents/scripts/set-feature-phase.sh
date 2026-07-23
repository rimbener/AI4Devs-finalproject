#!/usr/bin/env bash
# Set the feature pipeline phase in docs/features/<name>/tasks.md frontmatter.
# Replaces the lead's hand-rolled python3/sed edits of `tasks.md` (a recurring
# ops improvisation). This is the ONLY sanctioned way to flip the phase.
#
# Usage: set-feature-phase.sh <name> <phase>
#   phase ∈ pending|spec_drafted|spec_ready|approved|in_progress|in_review|mutation|pr_ready|done
set -euo pipefail

NAME="${1:?usage: set-feature-phase.sh <name> <phase>}"
PHASE="${2:?usage: set-feature-phase.sh <name> <phase>}"

case "$PHASE" in
  pending|spec_drafted|spec_ready|approved|in_progress|in_review|mutation|pr_ready|done) ;;
  *) echo "✗ invalid phase: $PHASE" >&2; exit 1 ;;
esac

ROOT="$(git rev-parse --show-toplevel)"
F="$ROOT/docs/features/$NAME/tasks.md"
[ -f "$F" ] || { echo "✗ no such file: $F" >&2; exit 1; }

# Rewrite the `phase:` line inside the leading frontmatter, preserving its trailing comment.
awk -v phase="$PHASE" '
  NR==1 && $0=="---" { infm=1; print; next }
  infm && $0=="---" { infm=0; print; next }
  infm && $0 ~ /^phase:[[:space:]]/ {
    comment=""; if (match($0, /#.*/)) comment=" " substr($0, RSTART, RLENGTH);
    print "phase: " phase comment; next
  }
  { print }
' "$F" > "$F.tmp" && mv "$F.tmp" "$F"

echo "✓ ${NAME}: phase → ${PHASE}"
grep -m1 '^phase:' "$F"
