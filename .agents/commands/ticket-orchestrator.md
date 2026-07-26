---
description: Run the agentic orchestrator on a user story — plan gate → spec + Gherkin → TDD (per-slice review) → full review → mutation → DoD (PR-ready)
argument-hint: "<story> — the name of a file in user-stories/pending/ (with or without .md), e.g. lesson-list"
---

# /ticket-orchestrator — run the agentic orchestrator

Act as **`orchestrator_lead`** and drive the full pipeline for ONE feature. Story: `$ARGUMENTS`

## Boot

1. **Read the source of truth:** `.agents/ORCHESTRATOR.md` (roles, gates, state machine, DoD). It governs everything below; the canonical code rules in `.agents/rules/*` govern how code is written.
2. **Resolve the story:** open `user-stories/pending/$ARGUMENTS.md` (accept the name with or without `.md`; if not in `pending/`, check `user-stories/in-progress/` for a resume). If it doesn't exist, list `user-stories/pending/*.md` and stop. Derive a kebab `<name>`.
3. **Create the worktree + mark in-progress:** run `.agents/scripts/bootstrap-worktree.sh <name> [delivery-branch]` — it bases the worktree on the **delivery branch** (`feature-entrega*`, never a blind `main`), `pnpm install`s inside it, seeds `docs/features/<name>/` from templates (spec/tasks/task-1, not risks.md), and prints the worktree path; `cd` there — **all** work (docs + code + commits) happens there. `export ORCHESTRATOR_BASE_REF=<delivery-branch>` and `ORCHESTRATOR_FEATURE=<name>`. **Move the story:** `git mv user-stories/pending/<story>.md user-stories/in-progress/<story>.md` + commit; set phase with `.agents/scripts/set-feature-phase.sh <name> pending` (no hand-edited frontmatter). Point `progress/current.md` at the folder. `risks.md` → gitignored `tmp/<name>/`, never re-read; landed in `docs/` at PR time (step 5).

## Run the phases (guard every gate; state on disk)

1. `spec_partner` runs in **plan mode**: grills the human **read-only** and returns a **plan** (spec overview + task/slice breakdown + `@s` scenario outline) — **no files yet** → **⏸ HUMAN GATE** (single, up front: approve the plan) → on approval, re-invoke `spec_partner` to **author** `spec.md` + `tasks.md` + `task-N.md` + `gherkin-scenarios.md` (`risks.md` → gitignored `tmp/<name>/`) → `spec_reviewer` vets the **written** bundle (`review-spec.md`) **once (1 round)**; `spec_partner` fixes every finding (no re-review; unresolvable → escalate) → `spec_ready`.
2. `implementer` → one vertical slice at a time — **TDD for non-UI `.ts`**, **implementation-first for UI `.tsx`** (impl → stories → interaction e2e → unit tests); **after each slice, invoke `reviewer_slice` directly (ONE agent: checks the slice against all `.agents/rules/` + design + accessibility)** — **1 round**: reviews once, `implementer` fixes every finding, no re-review (unresolvable → escalate) → next slice.
3. After all slices — **quality gate: full review → mutation**:
   a. `reviews_lead` in **`full` mode** → runs CI **once**, then invokes the **sole full reviewer `reviewer_engineering`** (code · architecture · performance · security) → consolidated `review.md` → `implementer` fixes every finding (≤ 2 rounds; any severity incl. minor). Design & accessibility were already covered per slice by `reviewer_slice`.
   b. `mutation_tester` → StrykerJS **once** (via `run-mutation.sh`), on the feature's changed files vs the **delivery branch** (covers the review's fixes too) → `implementer` kills every survivor (≤ 2 rounds; unresolved → **ESCALATE**, never a fabricated PASS).
4. `dod_validator` → `dod.md` (validate only) → **`pr_ready`**.
5. **Mark done + land risks + compact:** move `tmp/<name>/risks.md` → `docs/features/<name>/risks.md` (`mkdir -p` if needed) so it ships in the PR; `git mv user-stories/in-progress/<story>.md user-stories/done/<story>.md`; `git add docs/features/<name>/risks.md` + commit; run the compact-docs **script** (`.agents/skills/compact-docs/scripts/compact-docs.sh <name>`) — **script only, no agent trimming**.

At `pr_ready`, tell me the feature is ready and that opening & merging the PR is my manual step. Append a one-line entry to `progress/history.md`.

## Rules

- Stop and wait at the human gate. Never skip it. One feature at a time.
- Subagents write to `docs/features/<name>/` and return one reference line — read the file if you need detail; don't relay walls of text.
- `implementer` is the only agent that edits feature code.
- Worktree + mutation base = the **delivery branch** (`feature-entrega*`), never a blind `main`. Flip phase via `set-feature-phase.sh`; never bulk `python3`/`sed` rewrites (ApplyPatch or a checked-in script).
- Never edit `.agents/skills/**` or other harness files inside a feature commit.
- **Mutation is escalate-only** — unmet after ≤ 2 rounds → `ESCALATE`; never rewrite `mutation.md` to a PASS. Keep `review*.md` as durable history (never empty).
- **Post-`pr_ready` AC/API/product change → mini-gate:** update gherkin + scoped tests + re-run mutation (and full review if code changed) before returning to `pr_ready`.
