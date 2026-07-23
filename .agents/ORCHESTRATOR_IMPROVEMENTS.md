# Orchestrator improvements — backlog from last 3 runs

Derived from full `/ticket-orchestrator` runs:

| Feature | Date | Primary chat |
|---|---|---|
| `plan-entitlements-key-routing` | 2026-07-16 | `92a52f0c` |
| `activity-image-sizing` | 2026-07-20 | `ed0be3d5` |
| `activity-image-split-layout` | 2026-07-21 | `a151b823` (worktree) / boot `819af67f` |

Already applied from this pain: **drop pre-review mutation** (`a2268afe`, Jul 21). Yarn/`yarn test-ci` User Rule cleared (2026-07-23).

## ✅ Applied — 2026-07-23 (P0–P4 backlog)

- **P0 mutation tooling:** `run-mutation.sh` hardened (continue-on-lib-fail + aggregate exit, delivery-branch base via arg/`ORCHESTRATOR_BASE_REF`/auto-detect, refuse-if-active, non-TTY reporters, atom-ban exclusion+warn, calls parser); new `parse-mutation-report.mjs` (JSON→`mutation.md` table, surfaces error mutants); all 9 `stryker.config.mjs` → `reporters: [clear-text,json,html]`; `inPlace: true` baked into `supabase-services`; `mutation_tester.md` + SKILL → **escalate-only** (no PASS/`human-excluded` fabrication), helpers-only, atom ban.
- **P1 boot/lead:** new `.agents/scripts/bootstrap-worktree.sh` (delivery-branch base + `pnpm install` + seed docs) & `set-feature-phase.sh`; `orchestrator_lead.md` + `/ticket-orchestrator` use them; **post-`pr_ready` change → mini-gate** (gherkin + scoped tests + re-mutation); no bulk `python3`/`sed`; no `.agents/skills/**` edits in feature commits.
- **P2 review artifacts:** **keep review history forever** across `reviews_lead` / `reviewer_engineering` / `reviewer_slice` / `spec_reviewer` (durable trail, mark resolved, never 0-byte); `dod_validator` + `dod.md` reject empty reviews; `compact-docs` guards 0-byte review files.
- **P3 implementer:** atom ban hard rule + pre-slice recurring-findings checklist (barrels, helpers, Modal/`requestClose`, e2e-open, layout-behavior asserts, i18n-a11y keys, `@helsoft/rn-utils`, monorepo test cmd) + mutation-kill discipline baked into `implementer.md`.
- **P4 spec/CI:** `spec_partner` grills with real fixtures + pre-decides paid/shared-key scope in Open Decisions; `spec_reviewer` flags dual-owned `@s`; `reviews_lead` serializes flaky Storybook e2e + scoped-CI-when-documented + one-time `SafeAreaProvider` decorator guidance.
- **Docs:** `ORCHESTRATOR.md` principles/state-machine/scripts index + `ORCHESTRATOR_PLAN.md` updated (delivery-branch base, escalate-only, keep-history).
- **Partially / by design:** `tasks.md` index is already a bare index (no per-task status to flip — #15 N/A); the global Storybook `SafeAreaProvider` decorator (#13) is captured as guidance in `reviews_lead` (the `.storybook/` change itself is a repo-infra edit, not a harness-prompt change).

---

## Decisions (locked)

| Question | Decision |
|---|---|
| Human-excluded survivors in mutation gate? | **Escalate-only.** No inventing PASS via `human-excluded` columns. Cap → escalate to human; human may waive outside the gate, but agents must not rewrite `mutation.md` to 100% PASS. |
| Ban mutating `atoms/*` unless story owns the atom? | **Yes.** See §Atom mutate ban. |
| Default worktree base? | **Always delivery branch** (`feature-entregaN-*`), never blind `main`. |
| Review artifacts on APPROVED? | **Keep review history forever.** No prune-to-empty. Append/overwrite with full findings trail; never 0-byte `review*.md`. |

---

## Cross-run friction (summary)

Biggest tax: **ops improvisation** (mutation parse / base-ref / worktree) + **same review findings every feature** + **artifact prune that kills retros**.

| Pattern | Runs | Agents improvise |
|---|---|---|
| Wrong default base = `main` | boot + mutation | Recreate worktree from delivery branch; pass base-ref by hand |
| Mutation helper aborts mid-run (`set -e`) | sizing | First lib under 100% exits → re-run remaining libs manually |
| Sandbox / `inPlace` mismatch | entitlements (`supabase-services`) | Bypass `run-mutation.sh`, run `stryker --inPlace` by hand |
| No machine-readable report | all 3 | `tee /tmp/*.log` + `rg '[Survived]'` **or** `node -e` regex on `mutation.html` |
| Non-TTY / progress reporter noise | sizing | Stryker: *console doesn’t support `progress` → downgrade to `progress-append-only`* |
| Style/UI mutant flood | all 3 | Export styles + “stylesheet contracts”; style asserts that don’t kill layout mutants |
| Shared-atom blast radius | sizing `IconButton` | 19 survivors → revert atom; wrap instead |
| Slice CHANGES every slice | all 3 | barrels, a11y, Modal/`requestClose`, helpers co-location, weak e2e |
| Review prune → empty files | entitlements worst | No durable “what was fixed”; DoD cites empty as green |
| Lead python/sed ops | entitlements + split | Phase flips, tdd trim, renames, PASS rewrite for waived survivors |
| Post-DoD product/API change | split (any-image), entitlements rename | Skip re-mutation / re-review |
| CI flake tax | all 3 | Parallel Playwright / SafeArea / unrelated e2e charged to feature |

---

## Atom mutate ban

**Rule:** Do not mutate (and prefer not to edit) `libs/*/src/atoms/**` unless the user story **owns** that atom (story is about changing that atom’s API/behavior).

### Example — `activity-image-sizing`

- Story owned: `ImageLightbox` molecule + `SlideImage` organism.
- Story did **not** own: `IconButton` atom.
- For lightbox a11y focus, implementer/review added `ref` to `libs/components/src/atoms/icon-button/icon-button.tsx`.
- `run-mutation.sh` then mutated the **entire** atom (styles/defaults on pre-existing untested lines) → **19 survivors**, score ~54%. Real feature delta had **1** lightbox survivor.
- Fix: revert `IconButton`; put focus on wrappers (`View` / dialog container).

**Enforce in:**

1. `implementer.md` — hard rule: feature a11y/focus → wrap locally; don’t change shared atoms.
2. `mutation-testing` skill + `run-mutation.sh` — if changed path matches `**/atoms/**` and story/docs don’t claim atom ownership → **warn + exclude from mutate scope** (or fail with a clear message telling implementer to revert atom edits).
3. `reviewer_slice` / `reviewer_engineering` — flag atom API changes on non-atom stories as major.

---

## Priority backlog

### P0 — Mutation tooling

1. **Harden `run-mutation.sh`**
   - Don’t exit on first lib fail — run all libs, aggregate exit code.
   - Default / require delivery-branch base (env `ORCHESTRATOR_BASE_REF` or arg); never silently use `main` when delivery branch exists.
   - Non-TTY-safe reporters: drop `progress` in agent/CI (`CI=1` or `--reporters clear-text,json,html`).
   - Refuse if `.stryker-tmp` / Stryker pid already active.

2. **Emit + parse JSON**
   - Add `json` reporter (or post-process once in script).
   - New `parse-mutation-report.sh` (or `.mjs`) → stub `mutation.md` table: killed / survived / errors / score + `file:line` list.
   - Kills every ad-hoc `python` / `node -e` / `rg` scrape.

3. **Bake `inPlace` (or fix sandbox) for `@helsoft/supabase-services`**
   - Entitlements had to invent `--inPlace` for Edge-relative imports.
   - Config/script owns this — agents must not hand-roll Stryker unless helper says so.

4. **Mutation gate = escalate-only**
   - Threshold unmet after ≤ 2 kill rounds → `ESCALATE` (hard).
   - Agents must **not** rewrite survivors as PASS / human-excluded.
   - High `errors / generated` → warn (entitlements: 81 errors still “PASS”).
   - Document equivalents only with written justification (existing policy).

5. **Atom mutate ban** — see §Atom mutate ban.

### P1 — Boot / lead ops

6. **`scripts/bootstrap-worktree.sh <name>`**
   - Base = delivery branch always.
   - `pnpm install` (no fragile `node_modules` symlink).
   - Seed `docs/features/<name>/` from templates.
   - Print absolute cwd for agents.

7. **`scripts/set-feature-phase.sh <name> <phase>`**
   - Replace lead `python3`/`sed` on `tasks.md` frontmatter.

8. **Update `orchestrator_lead.md` + `/ticket-orchestrator`**
   - Worktree + mutation base = delivery branch.
   - Post-DoD AC/API change → mini-gate (gherkin + scoped tests + **re-mutation**).
   - Don’t edit `.agents/skills/**` inside feature commits.
   - Ban lead mass `python3` rewrites of tests/docs — ApplyPatch or checked-in scripts only.

### P2 — Review artifacts

9. **Keep review history forever**
   - Change `reviews_lead.md` / `reviewer_*` / `spec_reviewer`: on APPROVED, **retain** findings (mark resolved / append round), never empty file.
   - Optional: append-only `review-history.md` if overwrite-per-round stays, but durable record must exist.
   - DoD: reject 0-byte `review.md` / `review-engineering.md` / `review-slice.md` / `review-spec.md`.
   - `compact-docs`: do **not** wipe review findings; archive if needed, never delete content.

### P3 — Implementer checklist (bake into `implementer.md`)

Before each slice review:

- New public symbols → barrel exports.
- New pure helpers → `*.helpers.ts` (not component body).
- Loading UI → announced status (a11y).
- Overlay over imagery → `size={layout.touchTarget}`, `variant="filled"`, dialog name + focus in/out.
- **Never** change shared atoms for feature a11y — wrap locally (**atom ban**).
- **Never** `jest.mock('react-native')` for Modal — real Modal + `fireEvent(..., 'requestClose')`.
- E2E that claims expand/lightbox must assert **open**, not just visibility.
- Don’t spy global `React.useRef`.
- No regex-as-“integration” for SQL/Edge source text.
- Layout features: assert **containment/behavior**, not only style objects.
- i18n keys that reach a11y props must be asserted (kills `t("")` mutants).
- `AccessibilityInfo.*` only via platform helper (`@helsoft/rn-utils`).
- Tests: monorepo `pnpm --filter <ws> test -- <file>` — **not** `yarn test-ci`.

Mutation kill discipline:

- Style / `flattenStyle` asserts alone ≠ “killed” for layout mutants.
- Prefer behavioral tests; equivalents only with written justification.
- Don’t claim kill until Stryker re-run confirms.

### P4 — Spec / CI / product process

10. Grill with **real fixtures** when trigger depends on content (portrait-only → no portraits in live lesson).
11. Single-owner `@s` tags (avoid dual-owned scenarios).
12. Paid/shared-key scope: pre-decide rate/quota in Open Decisions (don’t invent mid-review).
13. Storybook `SafeAreaProvider` default decorator once — stop every feature fixing AppChrome e2e.
14. `reviews_lead`: serialize flaky Storybook e2e; scoped CI OK when debt pre-existing + documented.
15. Flip `tasks.md` index statuses when tasks done (or generate from `task-*.md`).

---

## Suggested implementation order

1. JSON report + parse helper + non-TTY reporters + continue-on-lib-fail in `run-mutation.sh`
2. Delivery-branch default (worktree + mutation + lead/skill docs)
3. `inPlace` / sandbox fix for `supabase-services`
4. Atom mutate ban (implementer + mutation script + reviewers)
5. Keep review history forever (agent prompts + DoD + compact-docs)
6. Implementer checklist from recurring findings
7. `bootstrap-worktree` + `set-feature-phase` scripts
8. Post-DoD change mini-gate
9. Escalate-only mutation wording in `mutation_tester.md` / skill / DoD

---

## Files to touch (when implementing)

| Area | Paths |
|---|---|
| Mutation | `.agents/skills/mutation-testing/SKILL.md`, `scripts/run-mutation.sh`, new parse script, `libs/*/stryker.config.mjs`, `.agents/agents/mutation_tester.md` |
| Lead / boot | `.agents/agents/orchestrator_lead.md`, Cursor command `ticket-orchestrator`, new bootstrap/phase scripts, `ORCHESTRATOR.md` (base-ref wording) |
| Implementer | `.agents/agents/implementer.md` |
| Review | `.agents/agents/reviews_lead.md`, `reviewer_engineering.md`, `reviewer_slice.md`, `spec_reviewer.md`, `.agents/skills/compact-docs/` |
| DoD | `.agents/agents/dod_validator.md` (reject empty reviews; escalate-only mutation) |

---

## Per-run notes (reference)

### `plan-entitlements-key-routing`

- Pre + post mutation; sandbox fail → ad-hoc `--inPlace`; 81 error mutants still PASS.
- Empty `review*.md` after APPROVED (intentional prune — bad for retros).
- Heavy lead `python3` / `sed` for docs/tests/renames.
- Slice themes: barrels, regex-on-migration, loading a11y, Edge coverage.

### `activity-image-sizing`

- Worktree from delivery branch (correct).
- Pre + post mutation (pre later dropped from pipeline).
- IconButton atom blast radius (19 survivors) — motivating case for atom ban.
- Modal/`requestClose` rabbit hole; orchestrator had to ship proven pattern.
- Ad-hoc `node -e` HTML report parse; progress-reporter non-TTY warning.
- Post-DoD: `AccessibilityInfo.sendAccessibilityEvent` missing on RN Web → `@helsoft/rn-utils`.

### `activity-image-split-layout`

- Boot from `main` → recreate on delivery branch.
- Full review escalate (layout majors); mutation 3 rounds → human TODO waive → lead rewrote PASS (forbidden under new escalate-only decision).
- Ad-hoc `tee`+`rg` survivor scrape; python phase edits.
- Post-DoD: portrait-only → any image without re-mutation.

---

## Out of scope / non-goals

- Formal `human-excluded` mutation schema (rejected — escalate-only).
- Re-introducing pre-review mutation.
- Global whole-repo Stryker runs.
