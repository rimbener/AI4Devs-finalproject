# TDD log — card-list-with-abm-dialog

## Slice 1 (task-1) — Render titled card list, disabled/show flags, empty state
UI `.tsx` impl-first. @s1 title/add/one-Card-per-item · @s2 disabled opacity+icons · @s3/@s4
show*Button per-icon · @s15/@s16 empty-state · @s17 onAddPress (+e2e). `IconButton` has no
`testID` — wrapped in a local `View testID=...` (atom-ban).
Gate: 69 suites/499 tests · e2e 1 passed · check-types/lint/format clean.

## Slice 2 (task-2) — Edit/remove dialogs via the shared Dialog organism
Impl-first `.tsx`; co-located `use-card-list-with-abm-dialog.ts` hook → strict TDD.
| @s | Test |
|---|---|
| @s5/@s6 | opens edit/remove dialog with render*Form(item) + static chrome |
| @s7/@s8 | calls onEditSubmit/onRemoveConfirm with item once submitted, then closes |
| @s9/@s10 | closes edit/remove dialog without callback on Cancel |
Gotcha: RN `Modal` needs `visible:false→true` flushed inside `await act(async () => {})`.
Gate: 70 suites/512 tests · e2e 3 passed · check-types/lint/format clean.

## Slice 3 (task-3) — isSubmitting swap, per-card a11y labels, full Storybook
| @s | Test |
|---|---|
| @s11/@s12 | edit/remove body → SubmittingIndicator, buttons hidden, while isSubmitting |
| @s13 | isSubmitting true→false via rerender closes the dialog (reconciled below) |
| @s11/@s12 dismiss | e2e: scrim tap + Escape no-op on submitting stories |
| @s14 | get*AccessibilityLabel(item) distinct name per card, both icons |
| @s18 | 10 stories (Populated…Interactive) |
Gate: 70 suites/515 tests · e2e 5 passed · check-types/lint/format clean.

## Mini-gate — empty-dialog flash on close
Root cause: `closeDialog()` nulled `dialogState` while `Modal` faded out. Fix: added `isOpen`
bool decoupled from `dialogState`; `closeDialog` only flips `isOpen=false`.
| @s | Test |
|---|---|
| @s19/@s20 | hook: closeDialog flips isOpen false, keeps last dialogState (edit/remove) |
Gate: 70 suites/529 tests · e2e 5 passed · format clean.

## Mini-gate — CardListRow promoted to a molecule
Extracted inline `CardListRow` into `molecules/card-list-row/` (mirrors `pdf-document-list-item`).
Pure structural move, no new `@s`.
Gate: 71 suites/534 tests · e2e 5 passed · clean.

## Mini-gate review fix — flatten CardListRowProps (drop organism-type import)
Flattened `CardListRowProps` to primitives; reintroduced `CardListRowAdapter` in the organism
(mirrors `PdfDocumentListRow`). Pure structural fix, no `@s` changed.
Gate: 71 suites/533 tests · e2e 5 passed · clean.

## Mini-gate 3 CI-red fix — stuck-forever submitting, @s13 reconciliation, onAddPress e2e
F1[blocker]: exit-'submitting' effect only reacted to `isSubmitting` changing — no-op-submit
caller stuck forever. Fix: reducer's `submit` preserves dialogType/dialogItem; ref-gated effect
closes immediately on genuine true→false, else 50ms grace timer.
F2[major]: @s13 reconciled to "closes" (not "restores") — matches real consumer's sticky-flag
reducer. gherkin-scenarios.md's @s13 text changed (human-approved criterion — flagged).
F3[major]: Interactive story lost onAddPress/"Added N times" — restored; e2e locator → role.
| @s | Test |
|---|---|
| F1 | hook: eventually closes (fake-timer grace) · closes immediately on real true→false |
| @s13 | component: closes (not restores), `open` prop asserted directly |
| @s17/@s21 | component: onAddPress via real add-button wiring · e2e: role-scoped add button |
Gate: 72 suites/520 tests (25 repeat runs, 0 flakes) · e2e 5/5 · clean.

## Full-review Round 1 fix round — 9 findings
1: moved Header/List/Dialog into `organisms/card-list-with-abm-dialog/components/{header,list,dialog}/`
(mirrors `card-list-row-adapter`) — imports/Storybook titles updated.
2: `components|study-buddy/tsconfig.json`'s stale/backwards `include` additions removed.
3 (fallback, timer kept): accepted-risk comment + 2 fake-timer tests genuinely advancing past
50ms (boundary + delayed-then-true `isSubmitting`) — coverage add, no behavior change.
4: deleted confirmed-dead `prevDialogRef`/`default`-branch/its populating effect.
5: reverted out-of-scope `text-field.tsx` focus-border regression (byte-identical to delivery).
6: `.context.types.tsx`→`.ts` rename (zero JSX).
7: moved 4 testID constants/fns from `.types.ts` to new `.helpers.ts`.
8: TDD — red `add-api-key.helpers.test.ts` (isSafeExternalUrl, 7 cases) → green helper → wired
as early-return guard before `Linking.openURL`; new test rejects `javascript:`.
9: documented `.catch(() => {})` swallow as intentional best-effort no-op (no logger in repo).
| Finding | Test |
|---|---|
| 3 | hook: grace-boundary + genuinely-delayed-async-submit tests |
| 8 | helpers: `isSafeExternalUrl` (7 cases) · component: rejects `javascript:` guidance url |
Gate: components 72 suites/522 tests, study-buddy 44 suites/392 tests, both lint/check-types
clean · e2e 5/5 (`--reporter=list`, no stale :6011 server).
