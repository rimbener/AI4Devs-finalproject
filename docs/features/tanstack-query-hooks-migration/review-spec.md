# Spec review — tanstack-query-hooks-migration

Reviewer: `spec_reviewer` (1 round, per `.agents/ORCHESTRATOR.md`). Scope: `spec.md`, `tasks.md`, `task-1.md`–`task-12.md`, `gherkin-scenarios.md`. (`risks.md` out of scope.)

**Verdict: CHANGES_REQUESTED** — 2 findings, both minor. Per protocol every finding must be fixed regardless of severity.

## Findings

1. **[minor, open] Dual-owned scenario `@s24`** — `task-5.md` and `task-6.md` both list `s24` in `scenarios:` frontmatter (and `tasks.md`'s index repeats the dual listing). `task-5` is a pure prerequisite (export `SIGNED_URL_TTL_SECONDS`, no behavior to test); the real assertion (both `staleTime`/`gcTime` derived and strictly under the TTL) is only testable in `task-6`, which owns the hook. Fix: drop `s24` from `task-5.md`'s `scenarios:` frontmatter and from its row in `tasks.md`; `task-6` remains sole owner.

2. **[minor, open] `tasks.md` frontmatter phase is stale** — `tasks.md` line 3 reads `phase: approved`, but the bundle is now fully authored (phase should read `spec_drafted` at this point in the pipeline, later `spec_ready` once this review closes). Per `.agents/ORCHESTRATOR.md`, only `orchestrator_lead` writes this field (via `set-feature-phase.sh`) — `spec_partner` should not hand-edit it; flagging so `orchestrator_lead` corrects it via the script once findings are fixed.

## What checked out clean

- All 58 `@s` scenarios (`s1`–`s58`) covered by exactly one task each (aside from the `s24` dual-claim above); no orphaned scenarios or tasks.
- D1 (task-8, task-9), D2 (task-1), D3 (task-8), D4 (task-3, task-4), D5 (task-7), D6 (task-5, task-6) all correctly referenced against actual task numbering.
- 3 accepted behavior changes and 4 story amendments in `spec.md` are traceable to the implementing task(s).
- All task `paths` are valid and consistent with `hooks-service-dao.mdc`; no component work, so `atomic-design.mdc`/`component-split.mdc` don't apply.
- `tasks.md` is a bare index; `spec.md` stays terse and links out rather than duplicating ACs/implementation detail.
- Slice 8 (task-10–task-12, docs-only) is explicitly flagged as scenario-free in both `gherkin-scenarios.md` and each task's Notes — not an oversight.
- Spot-checked task Goal/Notes against current source (`use-session.ts`, `use-api-key.ts`, `use-profile.ts`, `use-lesson-attempt.ts`, `query-provider.tsx`) — all accurate.

## Resolution

Updated by `spec_partner` after the one-round fix. Findings are retained verbatim above — this file is durable history, never emptied.

1. **[resolved — `spec_partner`]** `s24` is now solely owned by `task-6`. `task-5.md`'s frontmatter reads `scenarios: []`, and its `tasks.md` row reads `—`. A note in `task-5.md`'s Notes records *why* it is scenario-free (pure prerequisite; the TTL-derivation assertion is only observable on the hook) so the emptiness cannot later be mistaken for an oversight. A closing line in `tasks.md` lists all four deliberately scenario-free tasks (task-5, task-10, task-11, task-12) and restates that all 58 scenarios are owned by exactly one task.

2. **[deferred to `orchestrator_lead` — not actionable by `spec_partner`]** `tasks.md`'s `phase:` field is deliberately left untouched at `approved`. Per `.agents/ORCHESTRATOR.md` only `orchestrator_lead` writes it, via `set-feature-phase.sh`; `spec_partner` hand-editing it would violate that ownership rule. The orchestrator flips it to `spec_ready` with the script now that finding 1 is closed. No spec-bundle change is required for this finding.

**No finding materially changed the approved plan** — scope, slices, decisions D1–D6 and the 58-scenario contract are all unchanged, so no re-escalation to the human gate was needed.
