# Mutation — card-list-with-abm-dialog

## Round History

| Round | Base | total | killed | ignored | survived | errors | score % | Status |
|---|---|--:|--:|--:|--:|--:|--:|---|
| 1 (initial) | — | 79 | 51 | 0 | 27 | 1 | 65.4 | —  |
| 2 (kill pass) | — | 79 | 69 | 6 | 2 | 1 | 97.2 | Approved  |
| 3 (restructure investigation) | — | 79 | 69 | 6 | 2 | 1 | 97.2 | Human-accepted ✓  |
| 4 (bug-fix re-run, post-pr_ready) | feature-entrega3-HernanLaura | 87 | 75 | 0 | 5 | 1 | 93.8 | Survivors (new) — ESCALATE |
| 5 (kill pass, this round) | feature-entrega3-HernanLaura | 87 | 76 | 2 | 2 | 1 | 97.4 | **Approved — back to Round 2 baseline** |
| 6 (molecule extraction re-run) | feature-entrega3-HernanLaura | 90 | 76 | 0 | 4 | 2 ⚠ | 95.0 | NEW SURVIVORS — 2 from prior rounds + 2 new (testID exports) — ESCALATE |
| 7 (kill pass, testID export) | feature-entrega3-HernanLaura | 90 | 78 | 0 | 2 | 2 ⚠ | 97.5 | **Approved — back to Round 5/2 baseline** |
| 8 (Mini-gate 3 baseline, full rewrite) | feature-entrega3-HernanLaura | 690 | 530 | 0 | 113 | 43 ⚠ | 77.3 | **SURVIVORS — 113 survivors across 3 libs** |
| 9 (kill pass, Mini-gate 3 baseline) | feature-entrega3-HernanLaura | 686 | 641 | 0 | 1 | 44 ⚠ | 99.8 | **Approved — 1 documented-equivalent survivor remains** |

---

## Round 9 — Kill pass for the Round 8 baseline (113 survivors → 1) (2026-07-31)

**Verdict: 99.84% (641 killed / 642 valid mutants, 1 survivor, 44 error mutants ⚠, 686 total) —
Approved.** This is round 1 of this mutation gate's ≤2-round cap. Every one of Round 8's 113
survivors across `@helsoft/components`, `@helsoft/hooks`, and `@helsoft/study-buddy` was either
killed by a strengthened/new test or — for exactly one line — documented as equivalent with
justification in source. One additional untested file surfaced mid-round in `@helsoft/services`
(`ai-providers.helpers.ts`, 0 tests found on the Round 8 baseline) and was also brought to 100%.

### Score by lib

| lib | total | killed (incl. timeout) | survived | errors | score % |
|---|--:|--:|--:|--:|--:|
| @helsoft/services | 7 | 6 | 0 | 1 ⚠ | 100.0 |
| @helsoft/hooks | 77 | 44 (40 killed + 4 timeout) | 0 | 33 ⚠ | 100.0 |
| @helsoft/components | 244 | 238 | 0 | 6 ⚠ | 100.0 |
| @helsoft/study-buddy | 358 | 353 (326 killed + 27 timeout) | 1 | 4 ⚠ | 99.7 |
| **Total** | **686** | **641** | **1** | **44 ⚠** | **99.84** |

(Timeout mutants count as detected, same as Killed, per Stryker's own scoring and this feature's
established convention — see Round 8's "errors treated as detected" note, which applies the same
logic to Timeout.)

### `@helsoft/components` (17 organism survivors + 20 shared-`dialog`-organism survivors → 0)

- `use-card-list-with-abm-dialog.reducer.ts`'s `default` case (2 NoCoverage): added a real test —
  `cardListWithABMDialogReducer` dispatched with a cast-through unrecognized action type — asserting
  the reducer returns the existing state unchanged. The branch is reachable at runtime (defensive
  backstop against a stray action bypassing the type system), so this is a genuine kill, not a
  suppression.
- `use-card-list-with-abm-dialog.ts` (10 survivors): new tests for the `EMPTY_DIALOG_RESPONSE`
  exact-literal fallback, `onAddSubmit?.()`/`onRemoveConfirm?.()` optional chaining (the existing
  suite only exercised the analogous edit-dialog optional call), the auto-submit effect's compound
  `isSubmitting && state.dialogState === 'open'` guard (mounting with `isSubmitting` true before any
  dialog opens), the `wasReallySubmittingRef` initial-value guarantee (mounting directly into
  `'submitting'`), and — the trickiest one — a regression test proving the exit-effect's
  `state.dialogState !== 'submitting'` early-return reset must fire on **every** non-submitting
  render, not just the eventual close: without it, a stale "was really submitting" ref from one
  genuinely-async submit cycle silently auto-closes the very next dialog opened afterward. Verified
  by direct patch-and-run experiment before writing the fix (confirmed the exact mutant behavior
  first). 100% on this file.
- `card-list-with-abm-dialog.tsx` (3 survivors): one new test mounts with `isSubmitting` already
  `true` on the very first render and asserts the submitting dialog shows immediately (kills the
  `ObjectLiteral`/`'submitting'` StringLiteral mutants on `initialDialogState`). The sibling
  `'closed'` StringLiteral fallback is **documented equivalent in source** (see the code comment on
  `initialDialogState`): it can only ever seed the very first render while `isSubmitting` is false,
  and no path makes the shared `Dialog` visible from that state, so no test can observe a
  difference between `'closed'` and any other non-`'open'`/`'submitting'` string here.
- `components/header/card-list-with-abm-dialog-header.tsx` (2 survivors): two new tests — Add
  button hidden when `showAddButton` is false even with `onAddPress` set, and hidden when
  `onAddPress` is omitted even with `showAddButton` true — kill the `&&`/`||` compound-condition
  mutants.
- `components/list/card-list-with-abm-dialog-list.tsx` (1 survivor): `keyExtractor`'s `[]` deps
  array is genuinely referentially stable (no external deps ever change) — documented equivalent
  via the same `// Stryker disable next-line ArrayDeclaration` convention already used on the
  dispatch callbacks in `use-card-list-with-abm-dialog.ts`.
- `components/dialog/card-list-with-abm-dialog-dialog.tsx` (5 survivors): new tests for the
  fallback-branch themed spacer (added a `testID` to it — component-owned, not atom-ban) and for
  `onClose` being gated to `undefined` while `dialogState === 'submitting'` (scrim press must not
  dismiss). 100%.
- `organisms/dialog/dialog.tsx` — **shared organism, touched conservatively** per the task's
  guidance: added `testID`s to the scrim/surface/actions Views (mirrors the existing
  `account-menu.tsx` convention for the same shape) and targeted tests for exactly what this
  feature's own usage depends on — `confirmDisabled`, a caller-provided `actions` override, `onClose`
  gating (including a genuinely-`undefined` `onClose`), the surface's `stopPropagation` handler
  (verified via `fireEvent(el, 'press', { stopPropagation: jest.fn() })`, the same pattern
  `account-menu.test.tsx` already uses), the `typeof children === 'string'` branch (non-string
  children rendered directly, not re-wrapped), and one meaningful, specific style value per style
  object (not exhaustive snapshots) — e.g. `flex`/`alignItems` on the scrim, `width`/`maxWidth`/
  `cursor` on the surface, `flexDirection`/`justifyContent` on the actions row, `textAlign` on the
  headline for both icon/no-icon states. 100% on this file, including the previously-NoCoverage
  `textAlign: 'center'` branch (no prior test rendered `icon` set) and the `cursor: 'auto'` string
  literal.

### `@helsoft/hooks` (13 survivors → 0)

- `use-api-key.helpers.ts` (4 survivors): added a dedicated `use-api-key.helpers.test.ts` (none
  existed) asserting the exact i18n key per `ApiKeyErrorCode` and the `undefined` fallback for
  no error.
- `use-api-key.ts` (3 survivors): three new tests for `isError: saveMutation.isError ||
  removeMutation.isError` — neither/only-save/only-remove failing — kill the compound-conditional
  and logical-operator mutants.
- `use-interaction-state.ts` (1 survivor): `onPressOut` was never exercised by any test (its
  `setPress(false)` was NoCoverage) — added a test pressing in, hovering in, then `onPressOut`,
  asserting `press` clears while `hover` is untouched.

**Investigation: why `@helsoft/hooks` has 33 error mutants vs. 6 (components) / 4 (study-buddy).**
This is a **benign, structural difference in tooling, not a test-infra gap.** `@helsoft/hooks`'
`stryker.config.mjs` is the only one of the three that runs the TypeScript checker
(`checkers: ['typescript']`, `tsconfigFile: 'tsconfig.json'`) ahead of the test runner — the other
two libs are `jest-expo`/babel-based with "Jest + tsc handle types elsewhere" (see their own
`stryker.config.mjs` header comments). Because this lib is written in strict TypeScript, many
mutations that would otherwise need a runtime test to catch instead fail to *compile* against the
lib's own strongly-typed test files (e.g. mutating an object literal a test destructures a
specific property from, or mutating an array element into a value the declared element type
rejects) — Stryker reports these as `CompileError`, which this feature's established convention
(Rounds 1–8) already treats as detected, same as `RuntimeError`. Spot-checked two representative
error mutants: `use-ai-providers.ts`'s `ArrayDeclaration` mutant fails with `error TS2322: Type
'string' is not assignable to type 'SavedProviderKey'` (a strict return-type check on a fixture),
and `use-interaction-state.ts`'s `ObjectLiteral` mutant fails with `error TS2339: Property 'hover'
does not exist on type '{}'` (test file destructures the hook's return shape). Both are the type
checker doing exactly its job — an *extra* layer of mutant-killing this lib gets "for free" from
its own strict typing, not a gap. No fix needed; this is the expected, correct behavior of a lib
that opted into the TypeScript checker.

### `@helsoft/study-buddy` (60+ survivors → 1 documented-equivalent)

- `hooks/use-api-key-manager.reducer.ts` (5 survivors): new tests for the `initialApiKeyManagerState`
  default (`formMode: 'add'`), the `submit/sync` success-settle fallback with neither the modal nor
  the remove confirmation open, and — the interesting one — `confirm-remove/close`: a mutant that
  deletes its `return` statement makes it fall through into `submit/sync`'s success-settle logic
  (no `break`), which happens to also clear `confirmingRemove` but additionally, incorrectly, flips
  `dialogIsSubmitting` true. The old test only asserted `confirmingRemove` was cleared; the new one
  asserts the *whole* resulting state via `toEqual`, catching the side effect. Verified via a real
  scoped Stryker run against the actual mutant diff before writing the fix.
- `hooks/use-api-key-manager.ts` (4 survivors): `isEmpty` false-once-saved test, plus a direct unit
  test for the previously-dead `closeRemoveModal` export (mirrors the existing `closeModal` test —
  both are legitimate, symmetric hook API surface even though the current `ApiKeySettingsScreen`
  consumer doesn't wire `closeRemoveModal` up itself).
- `hooks/use-api-key-settings-providers.ts` (3 survivors) and `hooks/use-api-key-settings.ts` (1
  survivor, previously untested at the hook level): two new dedicated test files (`use-api-key-
  settings-providers.test.ts`, `use-api-key-settings.test.ts`) — neither existed before — asserting
  each `useMemo`/`useCallback`'s dependency array by changing the underlying catalog/provider-names
  map on rerender and checking the derived value updates.
- `use-lesson-generation.ts` (1 survivor, confirmed in-scope via `git diff` against the base ref —
  this feature's own "migrate api-key settings" commit changed this file to compute
  `enabledProviders` locally via the new `getEnabledProviders` helper): new test changes the
  `providers` catalog on rerender and asserts `savedProviders` recomputes.
- `add-api-key.helpers.ts` (1 survivor, `isSafeExternalUrl`'s `^` anchor): new test with an
  `https://` scheme appearing later in the string, not at the start — must still reject.
- `add-api-key.tsx` (13 survivors): the focus effect (`if (formProvider && textFieldRef.current)
  textFieldRef.current.focus()`) had no observable signal through React Native's test renderer
  without either an outright-banned `jest.mock('react-native')` or a fragile native-ref workaround
  — extracted into a small, directly-testable `focusApiKeyField(ref, formProvider)` helper in
  `add-api-key.helpers.ts` (TDD: red test first, then the extraction), unit-tested in isolation
  (focuses/doesn't focus/doesn't throw on a detached ref), and the component-level tests now assert
  the effect calls the (mocked) helper with the live `formProvider` on every dependency change. Also
  new: the radio group's translated accessible name, the visible (not just accessible-name) input
  label text, the native `editable` prop (not just the mirrored `accessibilityState.disabled`) for
  both disabled states, and theme-color style assertions on the locked-provider label and the input
  field's `marginTop`.
- `api-key-settings-screen-item.tsx` (2 survivors): one style assertion (`headlineSmall` +
  `onPrimary` + `s2` margin) on the provider-name title.
- `api-key-settings-button.tsx` (6 survivors): style assertions on the error container's `gap`, the
  error message's typography/color, and the visually-hidden loading label's offscreen positioning.
- `api-key-settings-screen.tsx` (18+ survivors → 1 remaining): the largest single file. New/
  strengthened tests cover: `handleClose` (resets both mutations — was entirely NoCoverage),
  `renderRemoveConfirmation`'s body text and its `[t]` dependency (a locale-function change on
  rerender), the `items` `useMemo`'s dependency array (a newly-saved key appearing after rerender),
  opening the **replace** dialog end-to-end (previously entirely untested — no test exercised
  `onEditPress`/`editDialogTitle`/`getEditAccessibilityLabel` at all), `handleSave`'s
  `if (manager.formProvider)` guard (pressing the disabled Save button with no provider selected —
  confirmed the button's own `disabled` prop genuinely blocks the press, so this only asserts the
  one reachable "safe no-op" outcome; the guard itself is defensive/unreachable and is documented as
  such with a `// Stryker disable next-line` comment, though that directive did not actually suppress
  this specific mutant in Stryker's report — see below), `addDialogTitle`/`removeDialogTitle`'s
  templates (asserted via visible headline text once each dialog is open), and five style
  assertions (`cardList`/`card`/`removeConfirmationText`/`progressIndicator`).
  - `handleRemove`'s `if (manager.confirmingRemove)` guard is the same shape as `handleSave`'s —
    documented in source, with a test that locks the one reachable outcome
    (`removeApiKey` always called with the confirmed provider, never `undefined`).
  - **The one remaining survivor**: `removeProviderLabel`'s `: ''` fallback (line 43,
    `manager.confirmingRemove ? settings.providerNames[manager.confirmingRemove] : ''`). This is
    provably equivalent to `providerLabel`'s analogous, successfully-suppressed fallback:
    `CardListWithABMDialog`'s internal `openRemoveModal`/`openEditDialog` and this screen's own
    `manager.openReplaceModal`/`setConfirmingRemove` dispatches land in the *same* synchronous
    event-handler call (the organism's `openEditDialog`/`openRemoveDialog` call the consumer's
    `onEditPress`/`onRemovePress` prop *and* dispatch its own internal `dialogType` change in one
    function body), so there is no render where the relevant dialog is open with the corresponding
    id/provider still `null`. Attempted a `// Stryker disable next-line StringLiteral` comment in
    two placements (directly before the `: '';` continuation line, and before the whole
    `const removeProviderLabel = ...` statement) — **neither suppressed this specific mutant** in
    an actual Stryker re-run, unlike the identical single-line pattern on `providerLabel` one line
    above, which the directive does honor. This looks like a Stryker limitation on multi-line
    ternary alternate-branches specifically, not a misapplied comment. Left as a documented,
    plain-comment (non-directive) equivalent survivor rather than force an artificial test or a
    behavior change to a correctly-working fallback — consistent with this feature's established
    "don't hide a real killed mutant, but don't force 100% on a genuinely unreachable branch either"
    precedent from Rounds 1–7's `handleEditConfirm`/`handleRemoveConfirm` guards.

### `@helsoft/services` (new file surfaced mid-round)

`ai-providers.helpers.ts` (`getEnabledProviders`/`getEnabledProviderIds`/`getProviderNames`/
`getProviderGuidanceUrls`) — added by this feature's "migrate api-key settings" commit — had **zero**
test coverage (Stryker: "No tests were found"). Added `ai-providers.helpers.test.ts` (strict TDD,
6 tests) covering every exported function. 100%.

### Gates (Round 9)

- `pnpm --filter @helsoft/services test`, `pnpm --filter @helsoft/hooks test`,
  `pnpm --filter @helsoft/components test`, `pnpm --filter @helsoft/study-buddy test` — all green
  (services 30/30, hooks 190/190, components 547/547, study-buddy 426/426).
- `pnpm --filter @helsoft/services lint check-types`, `pnpm --filter @helsoft/hooks lint
  check-types`, `pnpm --filter @helsoft/components lint check-types`, `pnpm --filter
  @helsoft/study-buddy lint check-types` — all clean (`pnpm format` applied once for cosmetic
  wrapping; no behavior changes).
- `pnpm --filter @helsoft/components exec playwright test
  tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js --reporter=list` —
  green (see below for count).
- Full scoped Stryker re-run (`.agents/skills/mutation-testing/scripts/run-mutation.sh
  feature-entrega3-HernanLaura` + `parse-mutation-report.mjs card-list-with-abm-dialog`) across all
  4 affected libs: 686 total mutants, 641 killed (incl. 31 timeout), 1 survived (documented
  equivalent above), 44 errors (investigated, treated as detected per established convention) —
  **99.84%**.

### Survivors — Round 9

- `libs/study-buddy/src/components/api-key-settings-screen/api-key-settings-screen.tsx:43` —
  `StringLiteral` (`''` → `"Stryker was here!"`) on `removeProviderLabel`'s unreachable fallback.
  Documented equivalent (see above); not suppressible via `Stryker disable` comment for this
  specific multi-line-ternary shape, and not worth an architecture change to chase the last 0.16%
  of score on a provably-unreachable branch.

---

## Round 8 — Mini-gate 3 architecture rewrite + ApiKeySettingsScreen consumer wiring (2026-07-31)

**Verdict: 77.3%, 113 survivors, 43 errors ⚠ — ESCALATE.** This baseline covers the post-rewrite codebase after the full architecture refactor: Context + `useReducer`, organism-private component subfolders (header/list/dialog/), new Add-dialog feature, and real ApiKeySettingsScreen consumer wiring. This is NOT a continuation of Rounds 1–7; it measures the entire new code shape.

### Scope

The mutation run scoped to changed files across the feature branch (`feat/card-list-with-abm-dialog`) vs. base ref (`feature-entrega3-HernanLaura`), spanning multiple libs:

- **@helsoft/components** (251 mutants, 198 killed, 43 survived, 6 errors = 82.2%)
  - Organism: `card-list-with-abm-dialog/` (rewritten with new sub-components: header, list, dialog)
  - Molecule: `card-list-row/`
  - Organism: `dialog/` (shared organism)
  - Other organisms/molecules changed or touched by this feature

- **@helsoft/hooks** (77 mutants, 35 killed, 9 survived, 33 errors = 79.5%)
  - New/modified hooks including `use-api-key*` and `use-interaction-state`
  - High error count (33 errors) suggests test-run configuration issues or external API mock gaps

- **@helsoft/study-buddy** (362 mutants, 297 killed, 61 survived, 4 errors = 83.0%)
  - `ApiKeySettingsScreen` and related components (new consumer wiring for CardListWithABMDialog)
  - `ApiKeySettingsButton`
  - Associated service hooks and reducers

### Key findings

1. **Low overall score (77.3%)** — well below the 100% threshold. The architecture rewrite introduced extensive new test gaps, particularly in:
   - API Key manager screen layout/styling (many survivors in `api-key-settings-screen.tsx` style objects)
   - Dialog component styles and edge cases (many survivors in `dialog.tsx`)
   - New conditional render paths in form components (`add-api-key.tsx`)
   - Reducer edge cases in both `card-list-with-abm-dialog` and `api-key-manager`

2. **High error count (43 ⚠)** — spread across 3 libs:
   - @helsoft/components: 6 errors (mostly StyleSheet.create theme-factory crashes, matching Round 7 pattern)
   - @helsoft/hooks: 33 errors (likely related to test-mock setup or missing provider context in unit tests)
   - @helsoft/study-buddy: 4 errors
   - Error mutants are **treated as detected per established convention** (see Rounds 1–7 error investigations)

3. **NoCoverage mutants (6 entries in survivor list)** — code branches never executed by any test:
   - `use-card-list-with-abm-dialog.reducer.ts:45,46` — default reducer case (untouched path)
   - `use-api-key-manager.reducer.ts:108` — specific dispatch edge case
   - `use-api-key-manager.ts:95-97` — early return in subscription effect
   - `dialog.tsx:85` — CSS text-align value
   - `use-interaction-state.ts:21` — BooleanLiteral onPressOut

### Survivors breakdown

**From card-list-with-abm-dialog (17 survivors):**
- `use-card-list-with-abm-dialog.reducer.ts`: 2 NoCoverage (default case)
- `use-card-list-with-abm-dialog.ts`: 8 survivors (optional chaining on optional handlers, conditional guards, empty dialog-response object)
- `card-list-with-abm-dialog.tsx`: 3 survivors (initialDialogState string literals, empty object)
- `components/dialog/card-list-with-abm-dialog-dialog.tsx`: 5 survivors (onClose conditional, StringLiteral state, ternary type check, style objects)
- `components/header/card-list-with-abm-dialog-header.tsx`: 2 survivors (compound && and || conditions)
- `components/list/card-list-with-abm-dialog-list.tsx`: 1 survivor (dependency array)

**From dialog organism (23 survivors):**
- Mostly style objects (ObjectLiteral, StringLiteral) — cascading theme/layout properties that tests render but don't inspect for exact values
- Event handler shortcuts (`ArrowFunction` arrow → undefined)
- Style array assertions

**From @helsoft/hooks (13 survivors):**
- `use-api-key.helpers.ts`: 4 survivors (error-key string literals and object keys)
- `use-api-key.ts`: 3 survivors (isError compound conditional expression and logical operator variants)
- `use-interaction-state.ts`: 1 survivor (ArrowFunction)

**From @helsoft/study-buddy (60+ survivors):**
- `api-key-settings-screen.tsx`: 18+ survivors (conditional renders, event handlers, dependency arrays, style objects)
- `api-key-settings-button.tsx`: 6 survivors (style object properties)
- `add-api-key.tsx`: 9 survivors (conditional render logic, form fields, event handlers)
- `hooks/use-api-key-manager.reducer.ts`: 4 survivors (action dispatch guards, string literals)
- `hooks/use-api-key-manager.ts`: 1 survivor (conditional effect guard)
- `hooks/use-api-key-settings-providers.ts`: 3 survivors (dependency arrays)
- `api-key-settings-screen-item.tsx`: 2 survivors (style objects)
- `add-api-key.helpers.ts`: 1 survivor (regex)
- `use-lesson-generation.ts`: 1 survivor (dependency array)

### Why this is fresh baseline (not a continuation of Round 7)

Rounds 1–7 measured only the card-list-with-abm-dialog organism and its immediate molecule/hook dependencies (total ~90 mutants, 78 killed, 2 survived). Round 8's **690 mutants** span the entire refactored feature scope:

1. **New architecture code:** The organism subfolders (header, list, dialog components) are entirely new and unmeasured in prior rounds.
2. **New consumer wiring:** The ApiKeySettingsScreen integration is brand-new; this is the first mutation pass that includes it.
3. **Expanded scope:** Several libs (@helsoft/hooks, @helsoft/study-buddy) have undergone changes that affect many files simultaneously — this is a full integration test baseline, not a surgical fix pass.

The 2 pre-existing survivors from Rounds 1–7 (`card-list-with-abm-dialog.tsx` lines 134/142 — unreachable guard in `handleEditConfirm`/`handleRemoveConfirm`) **are no longer visible in this run** because those exact guards were refactored as part of the architecture rewrite and moved to the new sub-components (`card-list-with-abm-dialog-dialog.tsx`). The new structure has similar guards but in different files/lines.

### Path forward (Round 9, implementer)

1. **Kill the 113 survivors** across the three libs by strengthening tests. Most gaps are straightforward:
   - Add style/layout inspections in organism/molecule tests (don't just render, assert theme property values)
   - Add conditional-render path tests (open/close dialogs, toggle error banners, etc.)
   - Add event-handler binding tests (assert callbacks are invoked with correct parameters)
   - Add object/array equality tests for settings and configuration
   - Add reducer action-dispatch coverage for all reducer cases (particularly edge cases in `api-key-manager.reducer.ts`)

2. **Investigate the 33 errors in @helsoft/hooks** — likely test-mock or provider-context gaps:
   - Check if integration tests for `useApiKey` and `useAiProviders` need provider context setup
   - Verify that error mutants (theme factory crashes) follow the established convention

3. **Do not rewrite as PASS** — the 77.3% score is not equivalent-mutant ceiling; it is genuine test coverage gaps after the rewrite.

### Relationship to review findings

The full `reviews_lead` + `reviewer_engineering` pass (see `docs/features/card-list-with-abm-dialog/review.md` "Mini-gate 3" sections) approved the architecture and all 9 fix rounds. This mutation run now validates that the test suite covers the approved code — it does not. The implementer will iterate until the score reaches 100% or all survivors are documented as equivalent (with justification in this file).

---

## Round 7 — Kill pass for the 2 new Round-6 testID-export survivors (2026-07-27)

**Verdict: 97.50%, 2 survivors — both the pre-existing documented-equivalent `ConditionalExpression`
survivors at lines 134/142 (relocated by the Round 6 molecule extraction, untouched, unchanged
reasoning from Rounds 1–5). The 2 NEW survivors from Round 6's `cardListItemCardTestId` export are
resolved.**

### What changed

Added one direct unit test to `card-list-with-abm-dialog.test.tsx` asserting the exact resolved
string each testID-builder export produces, instead of only exercising them indirectly through
`getByTestId` lookups (which pass regardless of the literal's exact content, since the same
literal is used to both build and query):

```ts
it('builds the row/edit/remove testID strings in the documented format', () => {
  expect(cardListItemCardTestId('item-1')).toBe('card-list-with-abm-dialog-card-item-1');
  expect(cardListItemEditTestId('item-1')).toBe('card-list-with-abm-dialog-edit-item-1');
  expect(cardListItemRemoveTestId('item-1')).toBe('card-list-with-abm-dialog-remove-item-1');
});
```

This is a real, valuable assertion (locks the testID contract that every other test and the
Playwright e2e suite rely on for row/edit/remove element lookup), not a metrics-gaming hack. It
directly kills both Round 6 survivors:

- `card-list-with-abm-dialog.tsx:21` — `StringLiteral` (empty-string replacement on
  `` `card-list-with-abm-dialog-card-${id}` ``) — **KILLED**: the new `toBe` assertion fails
  outright against `''`.
- `card-list-with-abm-dialog.tsx:21` — `ArrowFunction` (`() => undefined` replacement) — **KILLED**:
  the new assertion fails against `undefined`.

No production code changed — this was a pure test-strengthening fix per the "kill mutation
survivors by strengthening the test wherever possible" rule; the export's behavior was already
correct.

### Score analysis (Round 7)

- **Round 6**: 90 mutants, 76 killed, 0 ignored, 4 survived (2 pre-existing relocated + 2 new
  testID-export), 2 errors. Score = 76/(76+4+2) = 95.00%.
- **Round 7**: 90 mutants, 78 killed, 0 ignored, 2 survived (134/142, unchanged, documented
  equivalent), 2 errors. Score = 78/(78+2+2) = 97.50%.

### Gates (Round 7)

- `pnpm --filter @helsoft/components test -- card-list-with-abm-dialog.test.tsx --silent` — new
  test green alongside the existing 29 in the file (30/30).
- `pnpm --filter @helsoft/components test` — 71/71 suites, 534/534 tests green.
- `pnpm --filter @helsoft/components lint` — clean.
- `pnpm --filter @helsoft/components check-types` — clean.
- `pnpm --filter @helsoft/components exec playwright test
  tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js --reporter=list`
  — 5/5 passed.
- Stryker re-run (`.agents/skills/mutation-testing/scripts/run-mutation.sh
  feature-entrega3-HernanLaura` + `parse-mutation-report.mjs card-list-with-abm-dialog`) scoped to
  this feature's 5 changed/new files: 90 mutants, 78 killed, 0 ignored, 2 survived (134/142,
  documented equivalent, untouched), 2 errors (both investigated — the pre-existing theme-factory
  `StyleSheet.create` `ArrowFunction` RuntimeError from Rounds 1–6, plus one more of the same kind
  now surfacing from the `CardListRow` molecule's own theme factory, both treated-as-detected per
  the established convention) — **97.50%**.

### Survivors — Round 7 (unchanged from Round 6, relocated from Rounds 1–5)

- `card-list-with-abm-dialog.tsx:134` — `ConditionalExpression` (`true` replacement) —
  `if (dialogState?.type === 'edit')` guard in `handleEditConfirm`. Relocated from line 98 (Round
  5) / line 98 (Rounds 1–4) by the Round 6 molecule extraction. Same documented-equivalent
  reasoning carried forward unchanged (see Rounds 1–3's full investigation below): the guard's
  else-branch never fires via any real interaction path, since this Dialog's own Save button (the
  only caller of `handleEditConfirm`) only exists in the render tree while `open`, i.e. while
  `dialogState?.type === 'edit'` already holds.
- `card-list-with-abm-dialog.tsx:142` — `ConditionalExpression` (`true` replacement) — same
  reasoning, `handleRemoveConfirm`'s `dialogState?.type === 'remove'` guard, relocated from line
  106.

### Files changed this round

- `libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx` —
  added the testID-builder-format assertion (kills the 2 Round-6 `StringLiteral`/`ArrowFunction`
  survivors on `cardListItemCardTestId`). No production source touched.

---

## Prior rounds (Rounds 1-6) — ARCHIVED

> See the git history of this file for full details on Rounds 1–6 (total > 1600 lines of investigation, restructuring experiments, error analysis). Key summary:
>
> - **Rounds 1–3 (old measure)**: 79 mutants → 97.2% with 2 documented-equivalent survivors
> - **Round 4**: Bug-fix introduced 3 new survivors (87 mutants) → 93.75%
> - **Round 5**: Kill pass resolved 3 survivors → 97.44%
> - **Round 6**: Molecule extraction → 90 mutants, 2 pre-existing + 2 new survivors → 95%
> - **Round 7**: Kill pass for 2 new survivors → back to 97.5%
>
> All prior analysis, error investigations, and equivalent-mutant justifications are preserved in the git history (commit history of this file and `docs/features/card-list-with-abm-dialog/` folder). The 2 survivors from Rounds 1–7 were relocated during the Round 6 refactor and are no longer directly comparable to Round 8's code shape, which is a complete architectural rewrite.
