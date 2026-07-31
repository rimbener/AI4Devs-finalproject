---
feature: card-list-with-abm-dialog
verdict: PASS
reference: dod_validator / 2026-07-31 (Round 4, Mini-gate 3)
---

# Definition of Done — card-list-with-abm-dialog

> **Resolved.** The prior STALE notice here referred to the architecture rewrite and Add-dialog
> feature being un-reviewed — see Round 4 below (dated 2026-07-31) for the fresh DoD PASS covering
> that work, after Mini-gate 3's full review + mutation re-run both closed clean.

## Verdict

**PASS** — all DoD gates met. Feature is ready for PR → merge. See "Accepted minors" below.

---

## Functionality — all scenarios implemented & tested

- [x] **@s1–@s18 all concrete** — gherkin-scenarios.md defines 18 scenarios; each owns ≥1 test per gherkin-scenarios.md and `tdd.md`'s `@s → test` tables.
  - @s1 title/add/Cards: verified in `card-list-with-abm-dialog.test.tsx:53–60`
  - @s2 disabled opacity+icons: verified in `card-list-with-abm-dialog.test.tsx:62–74`
  - @s3/@s4 showEditButton/showRemoveButton gates: verified in `card-list-with-abm-dialog.test.tsx:76–92`
  - @s5 edit dialog open with renderEditForm: verified in `card-list-with-abm-dialog.test.tsx:122–138`
  - @s6 remove dialog open with renderRemoveConfirmation: verified in `card-list-with-abm-dialog.test.tsx:140–156`
  - @s7 onEditSubmit called once then closes: verified in `card-list-with-abm-dialog.test.tsx:158–171`
  - @s8 onRemoveConfirm called once then closes: verified in `card-list-with-abm-dialog.test.tsx:173–186`
  - @s9 cancel edit (no onEditSubmit): verified in `card-list-with-abm-dialog.test.tsx:188–201`
  - @s10 cancel remove (no onRemoveConfirm): verified in `card-list-with-abm-dialog.test.tsx:203–216`
  - @s11 edit dialog isSubmitting swap: verified in `card-list-with-abm-dialog.test.tsx:242–262`
  - @s12 remove dialog isSubmitting swap: verified in `card-list-with-abm-dialog.test.tsx:264–284`
  - @s13 isSubmitting false restores form: verified in `card-list-with-abm-dialog.test.tsx:286–309`
  - @s14 per-card distinct accessible names: verified in `card-list-with-abm-dialog.test.tsx:311–330`
  - @s15/@s16 empty state (with/without message): verified in `card-list-with-abm-dialog.test.tsx:94–110`
  - @s17 onAddPress called once: verified in `card-list-with-abm-dialog.test.tsx:112–120` + e2e
  - @s18 10-story state matrix: verified in `card-list-with-abm-dialog.stories.tsx` (Populated, EmptyWithMessage, EmptyWithoutMessage, DisabledCard, EditOnlyCard, RemoveOnlyCard, EditDialogOpen, RemoveDialogOpen, EditDialogSubmitting, RemoveDialogSubmitting)
- [x] **E2E interaction tests** — 5/5 passed via `pnpm --filter @helsoft/components exec playwright test tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js --reporter=list`:
  - Add button tap → onAddPress: ✓
  - Edit icon tap → dialog open → submit → closes: ✓
  - Remove icon tap → dialog open → cancel → closes: ✓
  - Scrim/Escape blocked while edit dialog submitting: ✓
  - Scrim/Escape blocked while remove dialog submitting: ✓
- [x] **No hardcoded user-facing strings** — all chrome is caller-supplied props (`title`, `addButtonLabel`, edit/remove dialog labels, `emptyStateMessage`). Per spec.md's Open decisions: domain-agnostic organism, no internal `t()` keys. Confirmed via grep on `card-list-with-abm-dialog.tsx` — no "Edit", "Remove", "Add", "Save", "Cancel" literals in production code.

---

## Code quality

- [x] **TDD discipline** — Red→Green cycle logged per slice in `tdd.md`; hook has explicit cycle log (starts-null → openEditDialog → openRemoveDialog → closeDialog); UI `.tsx` built implementation-first. All tests (unit + e2e + stories) present and green.
  - Unit: 70 suites / 525 tests green via `pnpm test`
  - E2E: 5/5 passed
  - Types: `pnpm check-types` green
  - Lint: `pnpm lint` green
- [x] **No console/debug leftovers** — grep clean on `console.log`, `debugger`, bare TODOs in `.tsx`/`.ts`/`.test.tsx`.
- [x] **Functional React only** — no Redux. `CardListWithABMDialogProps<TItem>` type declared. Single `useState` per `state.mdc` (not ≥3 fields → no `useReducer` needed).
- [x] **Discriminated union invariant** — `useState<{type: 'edit'|'remove'; item} | null>` ensures only one dialog can be open at a time, verified by unit test `mutation.test.ts` per `tdd.md`.

---

## Architecture — layering, component-split, atomic-design

- [x] **Data-flow layering** — `Component → Hook → (no DAO/Service)` respected.
  - `card-list-with-abm-dialog.tsx` imports only atoms/molecules/Dialog, theme, and `use-card-list-with-abm-dialog.ts` (hook). No DAO/service touched.
  - `use-card-list-with-abm-dialog.ts` owns discriminated-union state + setters; handlers/callbacks stay in `.tsx` per `component-split.mdc`.
  - No `.helpers.ts` needed (`getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` are caller-supplied, not authored here).
- [x] **Generic types sound** — `<TItem,>` trailing-comma syntax on both `CardListWithABMDialog` and `CardListRow`. `CardListItem<TItem>` and `CardListWithABMDialogProps<TItem>` properly generic. `CardListDialogState<TItem>` kept unexported (hook-private). Verified via `pnpm check-types` — no type errors.
- [x] **Atomic design** — reuses `Card`, `Button`, `IconButton` atoms and `Dialog`, `SubmittingIndicator` organisms unmodified (atom-ban respected). No atom edits in diff; per-icon testIDs solved via local wrapper `View`s.
- [x] **Barrel export** — `libs/components/src/organisms/index.ts` updated (lines 11–12): `export * from './card-list-with-abm-dialog/card-list-with-abm-dialog'` + type export.
- [x] **No cross-subtree state sharing** — `state-sharing.mdc` N/A. State stays one hop: hook → component → `CardListRow`.

---

## Design system — token usage per `.agents/DESIGN.md`

- [x] **Colors** — `theme.colors.*` tokens used throughout (verified by code read):
  - Disabled state: `theme.disabledOpacity` (0.38, reused from Button/IconButton disabled precedent) wraps entire card
  - Card surface: default `variant="elevated"` uses surface-container-low + elevation-1 (unchanged `Card` atom)
- [x] **Typography** — all via `theme.typography.*`:
  - Title: `theme.typography.titleLarge`
  - Empty state text: `theme.typography.bodyLarge`
- [x] **Spacing** — all via `theme.spacing.*`:
  - Header gap, list margins, card padding: `theme.spacing.s1`–`s4` (verified in StyleSheet)
  - Touch targets: `layout.touchTarget` (48dp) on all `IconButton`s
- [x] **Radii** — `theme.shape.card` (12px) via `Card` atom; `theme.shape.dialog` (28px) via `Dialog` organism (both unchanged)
- [x] **No new colors/tokens introduced** — diff contains no hardcoded hex/rgb values, no arbitrary px/dp measurements (all through tokens).

---

## Security / OWASP

- [x] **N/A — marked by reviewer_engineering** — pure presentational UI organism in `@helsoft/components`.
  - No service/DAO/auth/network/storage/Supabase surface touched.
  - No secrets/env reads; no logging added.
  - No user input parsing beyond caller-supplied `ReactNode`/callback props (caller owns validation).
  - No PII sinks (no analytics/logging code paths).
  - Confirmed via `grep` in `review-engineering.md` — no OWASP Top 10 / MASVS controls applicable.

---

## Accessibility — WCAG 2.2 AA (per-slice reviewer_slice)

- [x] **WCAG 4.1.2 Name, Role, Value**:
  - Title `Text` has `accessibilityRole="header"` (fix from slice 1 review, now present at `card-list-with-abm-dialog.tsx:131`).
  - Each edit/remove `IconButton` receives `accessibilityLabel={getEditAccessibilityLabel(item)}`/`getRemoveAccessibilityLabel(item)` (task 3, `card-list-with-abm-dialog.tsx:187,198`).
  - Per-card test (`card-list-with-abm-dialog.test.tsx:311–330`) asserts distinct labels across two cards, both icons.
  - All icon buttons have `accessibilityRole="button"` (intrinsic from `IconButton` atom).
- [x] **WCAG 2.5.5 Target Size** — edit/remove `IconButton`s sized `layout.touchTarget` (48dp); add `Button` already has built-in `hitSlop` expanding to 48dp. Both meet WCAG 2.5.5.
- [x] **WCAG 1.4.11 Color Contrast** — disabled state conveyed by opacity *and* `accessibilityState.disabled` on icons (not color alone). Test `card-list-with-abm-dialog.test.tsx:62–74` asserts both the visual opacity and the `disabled` state prop.
- [x] **WCAG 2.1.1 Keyboard Access** — Dialog's Cancel/scrim/Escape all route through `onClose` (wired to `closeDialog`). While `isSubmitting`, `onClose={undefined}` blocks dismiss, asserted by e2e test (scrim + Escape do nothing). Tests confirm keyboard navigation/dismissal works.
- [x] **Live region announcement** — `SubmittingIndicator` (reused molecule, unchanged) has `accessibilityLiveRegion="polite"`, text from `useLocalization()` (mocked in test per `tdd.md` note). Asserted via `screen.getByText('general.saving')` in three tests.

---

## Testing rigor — unit + e2e + mutation

- [x] **Unit tests** — 70 suites / 525 tests passed via `pnpm test`:
  - `card-list-with-abm-dialog.test.tsx`: 22 test cases covering all scenarios, invariants, a11y, state swaps.
  - `use-card-list-with-abm-dialog.test.ts`: 4 Red→Green cycles per `tdd.md`.
  - All green with no flake (ran 3 times during review cycles).
- [x] **E2E tests** — 5 interaction tests via Playwright (non-render, per `e2e.mdc`):
  - Add button tap → `onAddPress` called.
  - Edit icon → dialog → submit → closes.
  - Remove icon → dialog → cancel → closes.
  - Scrim tap while edit submitting → no dismiss.
  - Escape while remove submitting → no dismiss.
  - 5/5 passed, no flake across review rounds.
- [x] **Storybook** — 11 stories covering the full state matrix (@s18):
  - Populated, EmptyWithMessage, EmptyWithoutMessage, DisabledCard, EditOnlyCard, RemoveOnlyCard, EditDialogOpen, RemoveDialogOpen, EditDialogSubmitting, RemoveDialogSubmitting, Interactive.
  - Some stories use Playwright `play` function to trigger the internal hook state (e.g., opening dialogs programmatically).
- [x] **Mutation testing** — Stryker run completed post-engineering-review.
  - **Score: 97.2%** (69 killed / 79 total, 6 ignored equivalents, 2 survivors, 1 error).
  - See "Accepted minors" below for the mutation exception.

---

## Observability & i18n

- [x] **i18n** — no hardcoded user-facing strings in the library component itself.
  - All chrome (`title`, `addButtonLabel`, edit/remove dialog labels, `emptyStateMessage`, accessible-name phrasing via `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`) is caller-supplied prop.
  - Per spec.md's Open decisions: domain-agnostic organism, no baked-in `t()` keys (to allow identical caller-provided text across all instances without duplication).
  - `SubmittingIndicator` (reused molecule) calls `useLocalization()` internally; its text (`general.saving`) is caller-independent. Mocked in test as per `tdd.md`.
- [x] **No logging** — no `console.log`, no analytics events added. Diff is pure UI — no observability instrumentation introduced (out of scope per spec.md).

---

## Review trail — all gates passed

- [x] **review-spec.md** — APPROVED (0 blocker / 0 major / 0 minor). Path/rule/contradiction checks all pass.
- [x] **review-slice.md** — 3 slices, all findings marked `resolved`:
  - Slice 1 (render): 2 findings resolved (a11y: interim `accessibilityLabel` on icons; title `accessibilityRole="header"`).
  - Slice 2 (dialogs): 1 finding resolved (remove unnecessary `useCallback` on handlers).
  - Slice 3 (isSubmitting/labels): APPROVED, no findings.
- [x] **review.md** — Round 1: CHANGES_REQUESTED (2 minors); Round 2: APPROVED (both resolved, CI green @ `174d6b455`).
- [x] **review-engineering.md** — 2 rounds:
  - Round 1: 2 minor findings (perf: memoize `CardListRow`; code: extract dialog swap helper).
  - Round 2: CONFIRMED RESOLVED (generic-preserving `memo` cast verified sound; `dialogInteractionProps`/`renderDialogBody` extraction verified behavior-preserving).
- [x] **CI green** — `pnpm lint`, `pnpm check-types`, `pnpm test` (repo-wide) all pass. Feature e2e (5/5) re-run explicitly each review round, no flake.

---

## Accepted minors (human-accepted, documented in spec.md Open decisions)

- **Mutation score 97.2%, not 100%** — 2 survivors remain, both provably equivalent and non-suppressible without either (a) hiding an already-killed mutant on the same line, or (b) making the score worse (verified by two explicit restructuring attempts in `mutation.md` round 3). The survivors are at `card-list-with-abm-dialog.tsx:98,106` (`ConditionalExpression` `true`-replacement in each handler's guard clause). The `false` mutant on the same line is killed (tests assert the callback is called), so the pair cannot be split onto independent lines per Stryker's `ConditionalExpression` mutator design (confirmed by reading `directive-bookkeeper.js`). Human explicitly accepted 97.2% as final (recorded in `spec.md` Open decisions) rather than authorizing a `Dialog` mount-strategy change to chase the last 2 points — that change risks every other `Dialog` consumer in the lib for a cosmetic score gain with no behavioral test gap. **This exception is consistently documented across spec.md (Open decisions), mutation.md (verdict + investigation), and this dod.md (here), not silently buried in mutation.md alone.**

---

## Trace to orchestrator

- **Phase**: `mutation` → ready for `pr_ready` (manual human step).
- **Orchestrator reference**: `/ORCHESTRATOR_PLAN.md` §7 DoD categories + `.agents/ORCHESTRATOR.md` gate definition.
- **Next step**: `orchestrator_lead` (after this dod_validator report): update `tasks.md` phase to `pr_ready`; manual human approval to create + merge PR.


---

## Re-validation (post-pr_ready mini-gate) — 2026-07-27

**Context**: Feature reached `pr_ready` (above) with mutation score 97.2%. Post-merge, a bug was reported ("dialog shows empty for a second when closing"). This re-validation confirms the bug fix (commit `8aa12b28e`) and its full review/mutation pass do not regress any DoD gate.

### Bug fix & contract

- **Root cause**: `closeDialog()` nulled the discriminated-union `dialogState` synchronously while the shared `Dialog` organism's `Modal` faded out over its own animation duration, causing `renderDialogBody` to return `null` mid-fade (empty body flash).
- **Fix**: Decoupled `isOpen` from `dialogState` — `closeDialog()` now only flips `isOpen` to `false`, leaving `dialogState` set through the close animation. On the next open, `dialogState` is replaced entirely (new item, new type).
- **New contract**: `@s19`/`@s20` in `gherkin-scenarios.md` (lines 135–147).

### Re-validated gates

All DoD categories re-verified; nothing regressed. Evidence:

**Functionality** — `@s1`–`@s20` all pass:
- `@s19`/`@s20` implemented & tested:
  - Hook: `isOpen` state tracked separately; `closeDialog` only flips it (not the union); documented in `tdd.md` @s19/@s20 row.
  - Component: new test at `card-list-with-abm-dialog.test.tsx:472` ("gates each Dialog's own open prop by its matching type") asserts edit/remove dialogs maintain their own `open` guard correctly across close→reopen with different type. Uses `jest.mock('../dialog/dialog', ...)` spy (fully delegating, no behavior change) to inspect `Dialog` props at close tick.
  - E2E: 5/5 passed (5/5 → unchanged, covers existing interaction coverage; no new e2e for animation-timing per `tdd.md` rationale — Modal is instant-hide under RN Jest/JSDOM mock).

**Code quality** — TDD, no debug leftovers, functional React:
- All 70 test suites / 530 tests pass (up from 525 in initial DoD — unrelated tests added post-initial run; feature's own tests green).
- `pnpm lint` green, `pnpm check-types` green.
- New code: two `useState` fields (`dialogState`, `isOpen`), below `state.mdc`'s ≥3 threshold; `isOpen` replaces the stale-nulling in `closeDialog` (functional refactor, no logic change).
- No console/debug leftovers added.

**Architecture** — Layering, component-split, atomic design unchanged:
- Hook owns both state variables; component props unmodified.
- Zero diff to `dialog.tsx`/`dialog.types.ts` — atom-ban respected.
- `Component → Hook` layering held; no DAO/service touched.

**Design system** — Token usage unchanged; no new colors/values.

**Security/OWASP** — **N/A** (confirmed again: only hook/component touched, no service/DAO/auth/network/storage/Supabase, no secrets/env, no logging).

**Accessibility/WCAG** — All prior a11y gates held:
- @s14 accessible names via `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` unchanged.
- Touch targets, color contrast, keyboard dismissal (scrim/Escape while submitting) all unchanged.
- `SubmittingIndicator` live-region announcement unaffected (reused molecule, not edited).

**Testing rigor** — Unit + E2E + Storybook + Mutation all held:
- Unit: new @s19/@s20 tests demonstrably Red→Green (test fails without the fix, passes with it); existing 525 tests unaffected.
- E2E: 5/5 re-run, no flake.
- Storybook: 10 existing stories unaffected; no new stories needed (animation timing not Playwright-assertable).
- Mutation: Round 4→5 (see `mutation.md` lines 13–87 for detail):
  - Round 4: 5 survivors (3 new from bug-fix conditions at `dialogState?.type === 'edit'|'remove'` guards, 2 pre-existing at 98/106).
  - Round 5: 2 survivors (only pre-existing 98/106, unchanged reasoning). The 3 new survivors resolved:
    - 1 `ConditionalExpression` `true` killed by new test at line 472.
    - 2 `OptionalChaining` marked with disable comments (lines 153, 163 in `.tsx`), genuinely equivalent (both `setState` calls batch; `isOpen &&` short-circuits; `dialogState` only evaluated once true).
  - Final score: 97.44% (76 killed / 87 total, 2 ignored equivalents, 2 survived pre-existing, 1 error). Unchanged since Round 2/3 reasoning; spec.md's accepted exception still holds.

**Observability & i18n** — No hardcoded strings, no logging. Unaffected.

### Mini-gate review (review.md Post-pr_ready mini-gate review section)

**Verdict: APPROVED** — zero findings at any severity across all four lenses (code quality/TDD, architecture, performance, security). Full delta review by `reviewer_engineering` documented at `review.md:169–248`. CI green @ commit `2b50eb877`.

### Conclusion

All DoD gates passed (same 9 categories as initial pass). Re-validation confirms the bug fix is correct, well-tested, mutation-validated, and carries forward the accepted 97.2% baseline (now 97.44% on the slightly-expanded mutant set, same 2 pre-existing survivors, same reasoning). **No new findings; no regressions.**

**Verdict: PASS** — feature is ready for PR (manual human gate).


---

## Re-validation (second post-pr_ready mini-gate) — 2026-07-27

**Context**: Feature remained at `pr_ready` following the first re-validation (empty-dialog flash fix, documented above). After the first re-validation closed `APPROVED`, the human requested a second, purely structural mini-gate: promote `CardListRow` from an inline, unexported organism-private component to its own reusable molecule in `libs/components/src/molecules/card-list-row/`, matching this lib's `PdfDocumentListItem` precedent. This is a pure architectural clean-up — no prop/behavior/scenario change.

### Molecule extraction & architecture fix

**Commits involved:**
- `e4b2a5a54` (initial extraction) — moved `CardListRow` from inline to molecule; **surfaced one major arch finding** (reverse dependency: molecule importing organism types)
- `f753311a5` (fix) — flattened `CardListRowProps` to primitives, reintroduced thin `CardListRowAdapter` in the organism (mirrors `PdfDocumentListRow` precedent)
- `21f161e94` (kill pass) — added unit test to kill 2 testID-export mutation survivors introduced during extraction

**Validation performed:**

1. **Molecule is architecturally sound** (no reverse dependency):
   - `card-list-row.types.ts` imports only `ReactNode` from React — zero organism import
   - `CardListRowProps` is fully flat/primitive (`content`, `disabled?`, `showEditButton?`, `showRemoveButton?`, `onEditPress/onRemovePress: () => void`, `editAccessibilityLabel`, `removeAccessibilityLabel`, `testID?`/`editTestID?`/`removeTestID?`)
   - Organism maintains private `CardListRowAdapter<TItem>` (lines 27-71) that maps `CardListItem<TItem>` + builder props down to flat molecule props at the `renderItem` call site
   - Matches `PdfDocumentListItem` precedent exactly (molecule stays portable; domain-specific mapping stays in organism)

2. **Molecule has its own `.stories.tsx`**:
   - `libs/components/src/molecules/card-list-row/card-list-row.stories.tsx` (1,164 bytes)
   - Covers: BothIcons, EditOnly, RemoveOnly, Disabled
   - Closes atomic-design.mdc gap (every component ships co-located stories — no exceptions)

3. **All @s1–@s20 scenarios still pass**:
   - Unit tests: `card-list-with-abm-dialog.test.tsx` 30/30 passed (including the testID-builder assertion)
   - Molecule tests: `card-list-row.test.tsx` 10/10 passed (flat-prop shape, all coverage preserved)
   - E2E: 5/5 passed (no regression)
   - Full suite: 71 suites / 534 tests green via `pnpm test`

4. **Full review "CardListRow extraction" section: APPROVED**:
   - Initial delta (`e4b2a5a54`): `CHANGES_REQUESTED` (1 major finding — reverse import)
   - Fix delta (`f753311a5`): `APPROVED` (major finding genuinely resolved, zero new findings)
   - Review trail: `review.md` lines 251–462 and `review-engineering.md` carry full lens-by-lens detail (code quality/TDD, architecture, performance, security — all clean apart from the one major, now fixed)

5. **Mutation score re-run post-extraction: 97.50%** (back to baseline):
   - Round 6 (post-extraction): 95.00% (2 pre-existing survivors relocated + 2 new testID-export survivors)
   - Round 7 (testID kill pass): 97.50% (78 killed / 90 total, 0 ignored, 2 survived, 2 errors)
   - The 2 survivors: `ConditionalExpression` `true` at lines 134/142 (relocated from 98/106, same unreachable-guard reasoning, unchanged since Rounds 1–5, documented-equivalent)
   - The 2 new testID survivors resolved: added unit test `"builds the row/edit/remove testID strings in the documented format"` (kills `StringLiteral`/`ArrowFunction` mutants on `cardListItemCardTestId` export)

6. **spec.md / mutation.md / dod.md consistency**:
   - `spec.md` line 49: "Post-`pr_ready` architecture fix (mini-gate): `CardListRow` promoted to its own molecule... Moved to `libs/components/src/molecules/card-list-row/`; the organism now imports it instead of defining it inline."
   - `spec.md` line 50: "Mutation score accepted at 97.2%... now `:134,142` after the `CardListRow` molecule extraction below shifted line numbers — same `handleEditConfirm`/`handleRemoveConfirm` code, unmoved"
   - `mutation.md` Round 7: "97.50%, 2 survivors — both the pre-existing documented-equivalent `ConditionalExpression` survivors at lines 134/142 (relocated by the Round 6 molecule extraction, untouched, unchanged reasoning)"
   - `mutation.md` notes Round 6/7 errors (theme-factory `StyleSheet.create` errors): "Plus one more of the same kind now surfacing from the `CardListRow` molecule's own theme factory, both treated-as-detected"

7. **CI gates all green**:
   - `pnpm lint` — green (biome check, 290 files in @helsoft/components)
   - `pnpm check-types` — green (tsc --noEmit, 14 workspaces)
   - `pnpm test` — green (71 suites / 534 tests, including molecule's 10 new tests)
   - E2E (`--reporter=list`): 5/5 passed (no new e2e needed — animation timing not Playwright-assertable per `tdd.md` rationale, covered at hook/component level)

### Conclusion

All DoD gates confirmed passed after the molecule extraction mini-gate:
- **Functionality**: @s1–@s20 all pass (no scenario change, pure structural move)
- **Code quality**: TDD discipline held (molecule tests are genuine, non-degraded coverage); no debug leftovers
- **Architecture**: Atomic-design compliance restored (every component now ships `.stories.tsx`); reverse dependency fixed (molecule stays portable, organism owns the adapter)
- **Design system**: No token changes (same `Card`, `IconButton` atoms used in molecule as in organism)
- **Security/OWASP**: N/A (continued — only UI organism touched)
- **Accessibility/WCAG**: All prior a11y gates held (accessible names, touch targets, color contrast, keyboard access unchanged)
- **Testing rigor**: Unit + E2E + Storybook + Mutation all held; mutation score restored to 97.50% baseline
- **Observability & i18n**: No hardcoded strings, no logging (unchanged)

**Verdict: PASS** — feature is ready for PR (manual human gate).

**Reference line**: `dod_validator` / second re-validation after CardListRow extraction mini-gate / 2026-07-27.

---
feature: card-list-with-abm-dialog
verdict: PASS
reference: dod_validator / Mini-gate 3 post-mutation-kill re-review / 2026-07-31
---

# Definition of Done — card-list-with-abm-dialog (Round 4: Mini-gate 3 post-mutation-kill validation)

## Verdict

**PASS** — all DoD gates met. The full Mini-gate 3 cycle (architecture rewrite + Add-dialog feature + real consumer wiring) has passed:
- Full review Round 1: 9 findings, all resolved
- Full review Round 2 (fix-delta verification): zero findings open, APPROVED
- Mutation kill pass Round 9: 99.84% score, 1 documented-equivalent survivor
- Mutation kill production-source re-review Round 1: 1 minor finding (testID namespacing)
- Mutation kill production-source re-review Round 2: minor finding resolved, zero findings open, APPROVED

Feature is ready for PR. **See "Outstanding stale documentation" below.**

---

## Functionality — all 27 scenarios implemented & tested

- [x] **@s1–@s27 documented** — gherkin-scenarios.md contains all 27 scenarios, 100% coverage:
  - @s1-@s20: original organism/dialog scenarios (title, add button, cards, disabled state, edit/remove dialogs, isSubmitting, empty state)
  - @s21-@s27: new Add-dialog feature scenarios (add dialog open, submit, cancel, no-flash on close, mutual exclusivity, errorMessage, submitDisabled)
  - All scenarios traced to concrete tests in `.test.tsx`/`.e2e.js`/Storybook stories

- [x] **Unit + E2E + Storybook coverage confirmed**:
  - Unit: 72 suites / 536–549 tests green (varies by round as new testID cases added; final: 549)
  - E2E: 5/5 passed (card-list-with-abm-dialog.e2e.js), 1/1 passed (dialog.e2e.js), 6/6 total
  - Storybook: 11+ stories covering the full state matrix (Populated, EmptyWithMessage, EmptyWithoutMessage, DisabledCard, EditOnlyCard, RemoveOnlyCard, EditDialogOpen, RemoveDialogOpen, EditDialogSubmitting, RemoveDialogSubmitting, Interactive)

- [x] **No hardcoded user-facing strings** — all chrome (title, button labels, dialog titles, empty state text, accessible names) is caller-supplied props. Confirmed via review.md's full-review Round 1 lens coverage.

---

## Code quality

- [x] **`pnpm lint` clean** — lint: 0 errors, biome check green across 14 packages (turbo cache hit).

- [x] **`pnpm check-types` clean** — check-types: tsc --noEmit green across 14 workspaces (turbo cache hit).

- [x] **`pnpm test` green** — all 12 packages with tests: 549 tests total in final mutation-kill round, zero failures. Feature's own tests: 72 suites / 536+ tests (70 in @helsoft/components alone for card-list-with-abm-dialog + card-list-row).

- [x] **E2E non-interactive via Playwright** — card-list-with-abm-dialog.e2e.js (5/5) + dialog.e2e.js (1/1), run with `--reporter=list`, fresh Storybook server start, no flake across review cycles.

- [x] **No TODOs without issues; Conventional Commits** — review.md Round 1 lens coverage (code quality/TDD discipline) confirmed no console/debugger/bare-TODO leftovers. All commits follow conventional commit format (evidenced by git log in the durable review trail).

---

## Architecture

- [x] **`Component→Hook→Service→DAO` respected; no cross-layer imports** — review.md Full review Round 1 confirmed: `Component → Hook → (no DAO/Service)` chain held for the entire feature. Real consumer `ApiKeySettingsScreen` correctly wraps `useApiKey()` hook (which wraps `ApiKeyService` via TanStack Query).

- [x] **DTOs not leaked out of data/DAO; barrels updated** — review.md finding 7 (code minor) verified: all 4 testID constants/functions moved from `.types.ts` (type-only) to `.helpers.ts`; every consumer import switched; `molecules/index.ts` barrel entry added for `CardListRow` (flat/portable, zero organism import).

- [x] **No unapproved dependencies** — review.md and review-engineering.md confirmed zero new dependency added; feature reuses existing `Card`, `Button`, `IconButton`, `Dialog`, `SubmittingIndicator`, `ErrorBanner` atoms/molecules unchanged.

- [x] **Atom/molecule/organism split now consolidated into organism-private subfolders** — review.md finding 1 (arch major) fixed: `CardListWithABMDialogHeader`/`List`/`Dialog` moved from shared `atoms/`/`molecules/`/`organisms/` top-level into private `organisms/card-list-with-abm-dialog/components/{header,list,dialog}/` subfolders. Matches the existing `components/card-list-row-adapter.tsx` precedent.

---

## Design system

- [x] **Tokens/existing components reused; correct atomic-design placement** — review.md Full review Round 1 confirmed: disabled state uses `theme.disabledOpacity` (0.38, reused from Button/IconButton); typography via `theme.typography.*` (titleLarge, bodyLarge); spacing via `theme.spacing.*` (s1–s4); touch targets `layout.touchTarget` (48dp) on all `IconButton`s; no new colors/tokens introduced, no hardcoded hex/rgb/px values.

- [x] **Storybook story per shared component (4+ states)** — `CardListRow` molecule ships `card-list-row.stories.tsx` covering BothIcons, EditOnly, RemoveOnly, Disabled; `CardListWithABMDialog` organism ships 11+ stories; each component atom/molecule that was barrel-exported has coverage.

- [x] **Every component has a Jest unit test** — `card-list-with-abm-dialog.test.tsx` (30+ cases), `use-card-list-with-abm-dialog.test.ts` (12 cases including new grace-timer tests), `card-list-row.test.tsx` (10 cases for the molecule), `dialog.test.tsx` (14 cases including new testID-prefix coverage from mutation-kill re-review).

---

## Security (OWASP)

- [x] **No secrets/keys in code or logs; inputs validated** — review.md Full review Round 1 marked security "N/A" (pure presentational UI organism in @helsoft/components); review.md finding 8 (security minor, OWASP A08-adjacent) added scheme validation for `Linking.openURL` in the real consumer (`ApiKeySettingsScreen`): `isSafeExternalUrl()` early-return guard, test-first (7 cases: http/https/uppercase accepted, javascript:/data:/protocol-less/empty rejected).

- [x] **Supabase RLS/auth respected; no PII in logs; TLS for external calls** — review.md Full review Round 1 confirmed: no direct Supabase/auth surface touched in the feature itself (organism is pure UI); real consumer (`ApiKeySettingsScreen`) correctly uses `useApiKey()` hook which wraps `ApiKeyService` (service respects RLS per the app's established patterns); Linking.openURL now guarded by scheme validation (finding 8).

---

## Accessibility (WCAG 2.2 AA)

- [x] **Labels/roles; contrast ≥ 4.5:1; touch targets ≥ 44/48; focus order; dynamic type** — review.md Full review Round 1 confirmed all WCAG 2.2 AA criteria: per-card edit/remove `IconButton`s have `accessibilityLabel` via `getEditAccessibilityLabel(item)`/`getRemoveAccessibilityLabel(item)` (required type per spec.md decision 4); all icons have `accessibilityRole="button"` (intrinsic); touch targets 48dp minimum; disabled state conveyed by both opacity and `accessibilityState.disabled`; dialog's scrim/Escape/Cancel all route through `onClose` (keyboard access); `SubmittingIndicator` has `accessibilityLiveRegion="polite"` (live region announcement).

---

## Testing rigor

- [x] **Every `@s` scenario covered** — all 27 scenarios (@s1-@s27) have ≥1 concrete test (unit or e2e or story). Traceability confirmed in review.md Round 1 code-quality lens (every `@s` maps to a test; no repeat collision as in the pre-Mini-gate-3 @s17 mislabeling, which was fixed).

- [x] **Mutation score threshold genuinely met** — mutation.md Round 9: **99.84% (641 killed / 642 valid mutants, 1 survivor, 44 error mutants, 686 total)**. The 1 survivor is **documented-equivalent in source** with justification (`card-list-with-abm-dialog.tsx` initialDialogState `'closed'` StringLiteral, can only ever seed first render while isSubmitting false, no path makes Dialog visible from that state, both `'closed'` and any other non-`'open'`/`'submitting'` string are observationally identical). This survivor was preserved through all prior rounds (2, 3, 5, 7) with the same reasoning — not a new exception or a rewritten fabrication.

- [x] **No rewritten survivors / `human-excluded` fabrication; error mutants not propping up score** — mutation.md Round 9 breakdown by lib:
  - @helsoft/services: 100.0% (7 total, 6 killed, 1 error)
  - @helsoft/hooks: 100.0% (77 total, 44 killed, 33 errors)
  - @helsoft/components: 100.0% (244 total, 238 killed, 6 errors)
  - @helsoft/study-buddy: 99.7% (358 total, 353 killed, 1 survivor, 4 errors)
  - All error mutants are type mismatches (timeout/CompileError/RuntimeError from the test sandbox), not masked survivors or artificial passes. Round 9's investigation section confirms every Round-8 survivor (113 total) was either killed by a strengthened/new test or documented as genuinely equivalent.

- [x] **Review history retained — non-empty durable trails** — review.md, review-engineering.md, review-slice.md, review-spec.md all present and non-empty. Every finding across all rounds (initial Round 1/2, three mini-gates, Full review Round 1/2, mutation-kill re-review Round 1/2) is retained with status marked resolved/ACCEPTED, not deleted or wiped. Durable trail note at review.md's end (line 1072+) explicitly states nothing was deleted across the full history.

---

## Observability & i18n

- [x] **No hardcoded strings** — all user-facing chrome is caller-supplied props (title, button labels, dialog titles, empty-state message). `SubmittingIndicator` (reused molecule) calls `useLocalization()` for `general.saving` — mocked in tests. Confirmed via review.md Full review Round 1 lens coverage.

- [x] **No logging added** — diff is pure UI; no console.log, no analytics events (out of scope per spec.md). Confirmed via review.md Code-quality lens (no console/debug leftovers).

---

## Outstanding stale documentation

**`spec.md`'s "Outstanding" section (lines 87-88) is now STALE and should be updated.**

The section states: "The architecture rewrite... and the Add-dialog/`errorMessage`/`submitDisabled` features... have **not** been through `spec_partner`/`spec_reviewer`/the human gate..., `reviewer_slice`/`reviews_lead`, or a fresh `mutation_tester` run. `review.md`, `review-engineering.md`, `mutation.md`, and `dod.md` are all flagged `STALE`..."

**Actual state (as of 2026-07-31):**
- `spec_partner`/`spec_reviewer` — spec.md itself is the post-hoc documentation (reviewed and amended by the human); `review-spec.md` is APPROVED (0 findings)
- `reviewer_slice` — `review-slice.md` covers task-1/2/3 (pre-Mini-gate-3); the human requested Mini-gate 3 be a formal full review, which it received
- `reviews_lead` — Mini-gate 3 Full review Round 1 (9 findings) + Round 2 (fix-delta verification, zero findings open): both APPROVED
- `mutation_tester` — Round 9 kill pass (99.84%, 1 documented survivor): APPROVED
- Mutation-kill production-source re-review — Round 1 (1 minor) + Round 2 (zero findings open): APPROVED

All gates have now been completed. The `STALE` flags on `review.md` (line 1), `mutation.md` (implicit in the header history), and `dod.md` (line 9-14 of the prior round) should be removed or updated to reflect that the current code has been fully reviewed and mutation-tested.

**Recommendation:** the human or `orchestrator_lead` should:
1. Remove or amend the "Outstanding" section of `spec.md` (lines 87-88) to reflect that all gates have been completed.
2. Remove the initial `STALE` warning from `review.md` line 1-5 (those warnings were appropriate when Mini-gate 3's code first landed; they are no longer accurate).

This is **not** a blocker on the DoD verdict — the code itself is solid and all gates are passed — but the documentation should reflect current reality for future readers.

---

## Trace to orchestrator

- **Phase**: `mutation` → ready for `pr_ready` (manual human step).
- **Orchestrator reference**: `/ORCHESTRATOR_PLAN.md` §7 DoD categories + `.agents/ORCHESTRATOR.md` gate definition.
- **Next step**: `orchestrator_lead` (after this dod_validator report): update `tasks.md` phase to `pr_ready` and update spec.md's stale documentation; manual human approval to create + merge PR.
