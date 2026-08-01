# ORCHESTRATOR.md — Agentic Orchestrator (source of truth)

> **Rule of precedence:** if this file conflicts with any agent/command/rule file, **this file wins** — except the canonical project rules in `.agents/rules/` (`global.mdc`, `hooks-service-dao.mdc`, `state.mdc`, `state-sharing.mdc`, `atomic-design.mdc`, `component-split.mdc`, `e2e.mdc`, …) and `.agents/DESIGN.md` for UI/copy, which always take precedence on _how code is written_. The step-by-step protocol lives in `.agents/agents/orchestrator_lead.md` and is **not** duplicated here.

Takes one user story from `user-stories/` to a validated, PR-ready feature through four phases, driven by `orchestrator_lead` with **exactly one human approval** — `spec_partner` grills the human (asks questions), writes the spec + Gherkin contract, `spec_reviewer` vets them, and the human then approves the **spec + Gherkin once**. Full rationale: `/ORCHESTRATOR_PLAN.md`.

## Principles

- **One worktree per feature**, always cut from the **delivery branch** (`feature-entrega*`), never a blind `main` — via `.agents/scripts/bootstrap-worktree.sh`. All work — docs + code — happens there; the human merges the PR. **One feature at a time** (`progress/current.md`).
- **State on disk, not in chat.** Agents write to `docs/features/<name>/` and return one reference line (anti-"telephone" rule).
- **TDD by file type.** Non-UI `.ts` (services/DAOs/hooks/helpers/reducers) is strict TDD — no production code without a failing test that demands it. UI `.tsx` is implementation-first: impl → stories → interaction e2e → unit tests (`.agents/rules/tdd.mdc`).
- **The review is the whole game.** Agents draft; judgment prunes. **Validation is compute-bound** — mutation proves the tests bite.
- **Escalate, don't fake.** The mutation gate is escalate-only — unmet after 2 rounds → `ESCALATE`; agents never rewrite survivors as PASS or invent `human-excluded` waivers.
- **Review history is durable.** `review*.md` are kept forever (findings marked resolved), never emptied — retros depend on the trail.
- **Atom ban.** Don't edit/mutate shared atoms (`libs/*/src/atoms/**`) for a feature's own a11y/focus unless the story owns the atom — wrap locally.
- **No hand-rolled ops.** Phase flips via `set-feature-phase.sh`; mutation via the `mutation-testing` helpers; no bulk `python3`/`sed`; feature commits never touch `.agents/skills/**`.

## Pipeline & state machine

```
pending
  → spec_partner        → grills the human (asks questions) → writes spec.md, tasks.md,
        task-N.md, gherkin-scenarios.md (+ risks.md → gitignored tmp/<name>/)           [spec_drafted]
  → spec_reviewer       → review-spec.md; vets the bundle
        (1 round: reviews once, spec_partner fixes every finding, no re-review)         [spec_ready]
  → ⏸ HUMAN GATE: approve the spec + Gherkin contract (the pipeline's ONE approval)     [approved]
  → implementer       → per vertical slice: build (TDD for .ts / impl-first for .tsx) → reviewer_slice (ONE agent,
        checks all .agents/rules/ + design + accessibility; 1 round, no re-review)
        → fix every finding → commit; no slice N+1 until findings fixed                 [in_progress]
  ── quality gate (after all slices) ──
  → reviews_lead (full)            → CI once + reviewer_engineering (code · architecture ·
        performance · security), the sole full reviewer → review.md; fix every finding
        (≤ 2 rounds)                                                                     [in_review]
  → mutation_tester                → mutation.md; changed files vs the delivery branch;
        kill every survivor (≤ 2 rounds) or ESCALATE. If the fix changed SOURCE (not
        just tests) → re-run the full review on that delta; test-only fix → skip        [mutation]
  → dod_validator       → dod.md (validate only, no PR)                                 [pr_ready]
  → ⟵ human opens & merges the PR                                                       [done]
```

Only `orchestrator_lead` writes the feature phase (in `tasks.md` frontmatter); `implementer` flips `task-N.md` statuses. Everything after the gate is autonomous up to `pr_ready`.

## Roles (see `.agents/agents/<name>.md` — each reviewer file carries its own rubric)

| Agent | Phase | Writes | Edits code? |
|---|---|---|---|
| `orchestrator_lead` | orchestrates all | `progress/*`, phase in `tasks.md` | no |
| `spec_partner` | 1 — grill (`grill-me`) then write spec + `gherkin-scenarios.md` | spec bundle + `gherkin-scenarios.md` | no |
| `spec_reviewer` | 1 — spec review (pre-gate, on the written bundle) | `review-spec.md` | no |
| `implementer` | 2 — build (TDD for `.ts` / impl-first for `.tsx`) | `src/`, `tests/`, `tdd.md`, task statuses | **yes** |
| `reviewer_slice` | 2 — per slice (all `.agents/rules/` + design + accessibility, one agent) | `review-slice.md` | no |
| `reviews_lead` | 3 — full review round (CI once, invokes the sole reviewer) | `review.md` | no |
| `reviewer_engineering` (code · architecture · performance · security) | 3 — full review's sole reviewer | `review-engineering.md` | no |
| `mutation_tester` | 3 — StrykerJS, once after the full review (changed files vs the delivery branch; escalate-only) | `mutation.md` | no |
| `dod_validator` | 4 — DoD | `dod.md` | no |

`implementer` is the **only** agent that edits feature code. Reviewers and leads prune, they don't patch.

## Models (per-agent `model:` frontmatter)

- **Opus** — `spec_partner` (highest-leverage reasoning).
- **Sonnet** — `orchestrator_lead`, `spec_reviewer`, `implementer`, `reviewer_slice`, `reviews_lead`, and the full reviewer `reviewer_engineering`.
- **Haiku** — `mutation_tester`, `dod_validator` (mechanical).

## Gates (all must pass to advance — full detail in `orchestrator_lead.md` §Protocol)

1. **spec_drafted → spec_ready** — `spec_partner` grills + writes the bundle, then `spec_reviewer` reviews it **once (1 round)**; `spec_partner` fixes every finding; no re-review; an unresolvable finding → escalate. (Automated — not a human approval.)
2. **HUMAN GATE (the one approval)** — the human approves `spec.md` + `gherkin-scenarios.md` together → `approved`. This is the pipeline's only human sign-off.
3. **per-slice** — lint + check-types + tests (+ e2e where relevant) green; slice `@s` covered; `tdd.md` ≤ 8 000 bytes; `reviewer_slice` reviews **once (1 round)**, every finding fixed (no minors accepted), no re-review; unresolvable → escalate.
4. **full review** — every finding fixed, any severity (≤ 2 rounds); after round 2: open blocker/major → escalate; only minors → ship as documented, human-accepted risks.
5. **mutation** — once after the full review; 100% killed on the changed lines vs the delivery branch (≤ 2 rounds, else **escalate** — never a fabricated PASS). **If killing survivors changed production source** (not just tests), the full review re-runs on that delta (bounded); a test-only mutation fix skips it.
6. **pr_ready** — `dod_validator` all-pass; human opens/merges the PR → `done`.

## Artifact map — `docs/features/<name>/`

```
spec.md  tasks.md  task-1.md … task-N.md
gherkin-scenarios.md  review-spec.md  tdd.md
review-slice.md
review-engineering.md
review.md  mutation.md  dod.md
risks.md   # lands here only at PR time (step 10); during the run it lives in tmp/<name>/
```

**`risks.md` is written to a gitignored `tmp/<name>/` folder** by `spec_partner` and is **never re-read into context** during the run (not reviewed, not part of the bundle). `orchestrator_lead` moves `tmp/<name>/risks.md` → `docs/features/<name>/risks.md` at PR prep (step 11) so it ships in the PR.

Session state: `progress/current.md` (active pointer) + `progress/history.md` (append-only, one line per entry).

## Token-efficiency rules (why the pipeline is shaped this way)

- **Rubrics live in each reviewer's agent file** — there is no shared review-standards doc loaded into every context.
- **CI runs once per review round** (by `reviews_lead`); reviewers never re-run `pnpm lint`/`check-types`/`test` — they get the status and judge the **diff**, not the world.
- **One full reviewer** — `reviewer_engineering` (code · architecture · performance · security) is the sole full-review agent; it self-marks performance and/or security `N/A` when the diff can't trigger them (recorded in `review-engineering.md`). **Design & accessibility are not in the full review** — `reviewer_slice` covers them per slice. (Folding all review lenses into one per-slice agent + one full agent removes fan-out context/token cost entirely.)
- **Per-slice review is ONE agent** (`reviewer_slice`): all `.agents/rules/` + design + accessibility, not a lead + fan-out.
- **Mutation runs once, after the full review** (changed files vs the delivery branch) — no separate pre-review pass; escalate-only. **A mutation fix that changes production source re-triggers the full review** on that delta (bounded); a test-only fix doesn't — cheapest way to keep the review honest without re-reviewing test-only edits.
- **Quiet runners everywhere** — `turbo --output-logs=errors-only`; scoped `pnpm --filter <ws> test -- <file> --silent` during TDD cycles; Stryker `--logLevel warn` (log to file, read the summary); Playwright `--reporter=list`.
- **Artifact hygiene** — a fact lives in exactly one place, others link (ACs only in `gherkin-scenarios.md`; `tasks.md` a bare index; DoD cites rather than restates). Logs are summaries (`tdd.md` = `@s → test` map + one line per cycle, ≤ 8 000 bytes, enforced at each slice gate). One `review-<type>.md` per reviewer, updated each round to a **durable findings trail** (fixed items marked `resolved`, kept — **never emptied / 0-byte**, even on APPROVED), never `-r2`/`-r3` copies. State lines are one line. **`risks.md` never enters context** — written once to `tmp/<name>/`, landed in `docs/` only at PR time.

## Entry

```
/ticket-orchestrator <story>      # reads user-stories/pending/<story>.md, invokes orchestrator_lead
# Story lifecycle: user-stories/pending/ → (on start) in-progress/ → (on pr_ready) done/ — moved via git mv, committed on feat/<name>
```

## Definition of Done

See `/ORCHESTRATOR_PLAN.md` §7. Validated by `dod_validator`: Functionality · Code quality · Architecture · Design system · Security (OWASP) · Accessibility (WCAG 2.2 AA) · Testing rigor · Observability & i18n.

## Rules index (passive standards)

- `.agents/rules/global.mdc` — monorepo spec · `hooks-service-dao.mdc` — layering (data-fetching hooks use tanstack-query) · `tanstack-query.mdc` — `useQuery`/`useMutation` in `@helsoft/hooks` (one `QueryClient`, expose mutation primitives, normalize errors, `QueryClientProvider`+`waitFor` in tests) · `state.mdc` — ≥3 related local states → `useReducer` · `state-sharing.mdc` — React Context to avoid deep / large prop-drilling · `atomic-design.mdc` — component structure (every component ships a `.stories.tsx`) · `component-split.mdc` — UI file split · `types.mdc` — `*.types.ts` only for cross-file types (single-file → inline); no result types, prefer inference · `i18n.mdc` — `t('ns.key')` inline, no `labels` object (key dictionaries excepted) · `tdd.mdc` — Three Laws, Red→Green→Refactor · `pre-slice-checklist.mdc` — recurring pre-slice self-check (barrels, helpers, a11y, atom ban, Modal, e2e, layout, i18n, test cmd) · `e2e.mdc` — Playwright e2e are interaction-only (no render-only presence tests)
- `.agents/DESIGN.md` — brand/design system (colors, type, voice, MD3 foundations, token↔repo mapping); canonical for UI/copy (not a `.mdc` rule file)
- Reviewer rubrics: **in each `.agents/agents/reviewer_*.md` + `spec_reviewer.md`** (no separate rules file)

## Skills index (invocable procedures)

- `.agents/skills/grill-me/` — relentless one-question-at-a-time interview (runs a `/grilling` session); **used by `spec_partner`** to drive the Phase-1 debate
- `.agents/skills/gherkin-authoring/` — the `@s` contract (used by `spec_partner`)
- `.agents/skills/mutation-testing/` — StrykerJS scoped to changed files: `scripts/run-mutation.sh [base-ref]` (hardened: continue-on-lib-fail, delivery-branch base, non-TTY reporters, atom-ban) + `scripts/parse-mutation-report.mjs <name>` (JSON → `mutation.md` table) (used by `mutation_tester`)
- `.agents/skills/storybook-e2e-tests/` — Playwright e2e for Storybook components (used by `implementer`)
- `.agents/skills/compact-docs/` — pre-PR doc cleanup (used by `orchestrator_lead`, step 9)
- `.agents/skills/orchestrator-run-retro/` — mine last N orchestrator runs → improvement backlog (`.agents/ORCHESTRATOR_IMPROVEMENTS.md`)

## Scripts index (checked-in ops — no hand-rolled `python3`/`sed`)

- `.agents/scripts/bootstrap-worktree.sh <name> [delivery-branch]` — worktree off the delivery branch + `pnpm install` + seed docs (used by `orchestrator_lead`, step 1)
- `.agents/scripts/set-feature-phase.sh <name> <phase>` — the only sanctioned way to flip `tasks.md` phase (used by `orchestrator_lead`)
- `.agents/skills/mutation-testing/scripts/{run-mutation.sh,parse-mutation-report.mjs}` — mutation run + JSON→`mutation.md` (used by `mutation_tester`)
- `.agents/skills/compact-docs/scripts/compact-docs.sh <name>` — pre-PR mechanical cleanup (guards against 0-byte review files)
