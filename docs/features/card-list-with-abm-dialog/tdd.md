# TDD log — card-list-with-abm-dialog

## Slice 1 (task-1) — Render titled card list with disabled/show flags and empty state

UI `.tsx` organism, implementation-first. No hook this slice.
@s → test: @s1 title/add/one-Card-per-item · @s2 disabled opacity+disabled icons · @s3/@s4
show*Button hides only that icon · @s15/@s16 empty-state · @s17 onAddPress (+e2e).
Decision: `IconButton` has no `testID` — wrapped each icon in a local `View testID=...` (atom-ban).
Gate: 69 suites/499 tests green · e2e 1 passed · check-types/lint/format clean.

## Slice 2 (task-2) — Wire edit/remove dialogs via the shared Dialog organism

UI `.tsx` implementation-first; co-located `use-card-list-with-abm-dialog.ts` hook → strict TDD
(`useState<{type:'edit'|'remove',item}|null>`, one `useState` per `state.mdc`).

### @s → test map
| Scenario | Test |
|---|---|
| @s5 | opens edit dialog with renderEditForm(item) + static edit chrome |
| @s6 | opens remove dialog with renderRemoveConfirmation(item) + static remove chrome |
| @s7 | calls onEditSubmit with the item once submitted, then closes |
| @s8 | calls onRemoveConfirm with the item once submitted, then closes |
| @s9 | closes edit dialog without onEditSubmit on Cancel |
| @s10 | closes remove dialog without onRemoveConfirm on Cancel |

Extra: only one dialog open at a time (discriminated union invariant). e2e (Populated story): edit
icon → submit closes dialog; remove icon → cancel closes without acting.
Gotcha: RN `Modal` needs `visible:false→true` flushed inside `await act(async () => {...})`.
Gate: 70 suites/512 tests · e2e 3 passed · check-types/lint/format clean (repo-wide too).

## Slice 3 (task-3) — isSubmitting swap, per-card a11y labels, full Storybook coverage

UI `.tsx`, implementation-first (pure prop/JSX wiring, no new hook).
`.types.ts`: added `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` +
`isSubmitting: boolean`. `.tsx`: each `Dialog` body branches on `isSubmitting` →
`SubmittingIndicator`, `actions` → `EMPTY_DIALOG_ACTIONS`, `onClose` → `undefined`.

### @s → test map
| Scenario | Test |
|---|---|
| @s11 | edit dialog body → SubmittingIndicator, Save/Cancel hidden, while isSubmitting |
| @s12 | remove dialog body → SubmittingIndicator, Remove/Keep-it hidden, while isSubmitting |
| @s13 | isSubmitting true→false via rerender restores form + buttons |
| @s11/@s12 (dismiss) | e2e: scrim tap + Escape do nothing on submitting stories |
| @s14 | get*AccessibilityLabel(item) builds a distinct name per card, both icons |
| @s18 | 10 stories: Populated/EmptyWithMessage/EmptyWithoutMessage/DisabledCard/EditOnlyCard/RemoveOnlyCard/EditDialogOpen/RemoveDialogOpen/EditDialogSubmitting/RemoveDialogSubmitting/Interactive |

Gate: 70 suites/515 tests · e2e 5 passed · check-types/lint/format clean. No hardcoded
accessible-name strings.

## Post-pr_ready bug fix (mini-gate) — empty-dialog flash on close

Root cause: `closeDialog()` nulled `dialogState` synchronously while `Dialog`'s `Modal` fades out
over its own duration — `renderDialogBody` returned null for the rest of the fade.
Fix: added a second `isOpen` boolean, decoupled from `dialogState`; `closeDialog` only flips
`isOpen=false`, never clears `dialogState` — next `open*Dialog` replaces it. `Dialog`'s `open`
gated on `isOpen && dialogState?.type === 'edit'|'remove'`.

### @s → test map
| Scenario | Test |
|---|---|
| @s19 | hook: closeDialog flips isOpen false, keeps last dialogState (edit) · component: keeps supplying edit dialog its last content through close |
| @s20 | same, remove dialog |

Gotcha: comparing captured React elements with `toEqual` recurses pathologically — assert the
rendered body's plain string content instead.
Gate: 70 suites/529 tests green · e2e 5 passed (unchanged — animation timing not reliably
Playwright-assertable, covered at hook/component prop level) · format clean.

## Post-pr_ready architecture fix (mini-gate) — CardListRow promoted to a molecule

Extracted the unexported, inline `memo`-wrapped generic `CardListRow` (+ its
`cardListItem*TestId` helpers + row-only styles `disabledCard`/`row`/`content`/`actions`) from
`card-list-with-abm-dialog.tsx` into `libs/components/src/molecules/card-list-row/` (mirrors
`pdf-document-list-item`'s precedent): `.tsx`, `.types.ts` (`CardListRowProps<TItem>`, importing
`CardListItem<TItem>` from the organism's types), new `.stories.tsx` (BothIcons/EditOnly/
RemoveOnly/Disabled — `CardListRow` had zero story coverage before, an `atomic-design.mdc` gap),
`.test.tsx` (icon-visibility/disabled/a11y-label/press-callback/layout tests, moved from the
organism's test file). Organism imports `CardListRow` + testID helpers from the molecule; its own
test file keeps only organism-level behavior (dialogs, isSubmitting, empty state, list rendering),
treating `CardListRow` as a real (non-mocked) child. No prop/behavior/API change — pure structural
move, no new `@s` scenarios. `spec.md`'s accepted-mutant line refs (`:98,106` → `:81,89`) updated
to match shifted `handleEditConfirm`/`handleRemoveConfirm` line numbers (code itself unmoved; no
Stryker-disable comment references a literal line number, so none needed updating).
Gate: 71 suites/534 tests green · e2e 5 passed (testIDs unchanged) · check-types/lint/format
clean (workspace + repo-wide).

## Mini-gate review fix — flatten CardListRowProps (drop organism-type import)

Full-review [arch] major: molecule imported `CardListItem<TItem>` from the organism it was
extracted out of — reverse dependency, didn't match `pdf-document-list-item`'s flat precedent.
Fix: flattened `CardListRowProps` to primitives (`content`, `disabled?`, `showEditButton?`/
`showRemoveButton?`, `onEditPress: () => void`, `onRemovePress: () => void`,
`editAccessibilityLabel`/`removeAccessibilityLabel: string`, `testID?`/`editTestID?`/
`removeTestID?: string` — mirrors `Card`'s own `testID?`). `card-list-row.tsx` is now a plain
(non-generic) `memo`d component — no cast needed. Reintroduced a thin, unexported, generic
`CardListRowAdapter` in `card-list-with-abm-dialog.tsx` (mirrors `PdfDocumentListRow`) mapping
`CardListItem<TItem>` down to the flat props at the `renderItem` call site; the three
`cardListItem*TestId` helpers moved back to the organism (their own literal templates, never a
molecule concern). Pure structural fix — no `@s` scenario changed; `card-list-row.test.tsx`/
`.stories.tsx` updated to the flat shape with equivalent coverage.
Gate: 71 suites/533 tests green · e2e 5 passed (testIDs unchanged) · check-types/lint/format
clean (workspace + repo-wide).
