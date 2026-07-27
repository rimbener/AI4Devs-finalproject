---
feature: card-list-with-abm-dialog
verdict: PASS
reference: dod_validator / 2026-07-27
---

# Definition of Done — card-list-with-abm-dialog

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

