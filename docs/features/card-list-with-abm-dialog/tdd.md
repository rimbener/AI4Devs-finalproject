# TDD log — card-list-with-abm-dialog

## Slice 1 (task-1) — Render titled card list with disabled/show flags and empty state

UI `.tsx` organism, implementation-first. No hook this slice.
Files: `.types.ts`, `.tsx`, `.stories.tsx`, `.e2e.js`, `.test.tsx`.
@s → test: @s1 title/add/one-Card-per-item · @s2 disabled opacity+disabled icons · @s3/@s4
show*Button hides only that icon · @s15/@s16 empty-state · @s17 onAddPress (+e2e).
Decisions: `IconButton` has no `testID` — wrapped each icon in a local `View testID=...`
(atom-ban). Gate: 69 suites/499 tests green · e2e 1 passed · check-types/lint/format clean.

## Slice 2 (task-2) — Wire edit/remove dialogs via the shared Dialog organism

UI `.tsx` → implementation-first; co-located `use-card-list-with-abm-dialog.ts` hook → strict
TDD (RED→GREEN, one `useState` per `state.mdc`).

### Hook TDD cycles
1. RED `starts with no dialog open` → GREEN: `useState<{type:'edit'|'remove',item}|null>(null)` +
   `openEditDialog`/`openRemoveDialog`/`closeDialog`.
2. `openEditDialog sets dialogState to the edit type` — green.
3. `openRemoveDialog sets dialogState to the remove type` — green.
4. `closeDialog clears dialogState back to null` — green.
`CardListDialogState<TItem>` kept unexported (hook-private).

### Component wiring
Added `renderEditForm`/`editDialogTitle`/.../`onEditSubmit` + remove-side equivalents. Two
`Dialog` instances (reused as-is): `open={dialogState?.type === 'edit'|'remove'}`, chrome from
static props, body = `render*(dialogState.item)`. `onConfirm` → `onEditSubmit`/`onRemoveConfirm`
then `closeDialog()`; `onClose` (Cancel/scrim/Escape) only `closeDialog()`. Row `IconButton`s wire
`onPress` to `openEditDialog(item)`/`openRemoveDialog(item)`.

### @s → test map
| Scenario | Test |
|---|---|
| @s5 | opens the edit dialog with renderEditForm(item) + static edit chrome |
| @s6 | opens the remove dialog with renderRemoveConfirmation(item) + static remove chrome |
| @s7 | calls onEditSubmit with the item once submitted, then closes |
| @s8 | calls onRemoveConfirm with the item once submitted, then closes |
| @s9 | closes edit dialog without onEditSubmit on Cancel |
| @s10 | closes remove dialog without onRemoveConfirm on Cancel |

Extra: only one dialog open at a time (discriminated union invariant).

e2e (Populated story): edit icon → submit closes dialog; remove icon → cancel closes without acting.

### Gotcha
RN `Modal` (iOS branch) needs `visible:false→true` flushed inside
`await act(async () => { fireEvent.press(...) })`, not bare `fireEvent.press` (matches
`pdf-document-list.test.tsx`'s delete-confirm pattern).

### Slice gate
70 suites/512 tests · e2e 3 passed · check-types/lint/format clean (repo-wide too).

## Slice 3 (task-3) — isSubmitting swap, per-card a11y labels, full Storybook coverage

UI `.tsx`, implementation-first (no new hook — pure prop/JSX wiring in the existing component).

### Changes
`.types.ts`: added `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`
(`(item) => string`) and `isSubmitting: boolean` to `CardListWithABMDialogProps<TItem>`.
`.tsx`: replaced the slice-1 interim `accessibilityLabel={item.accessibleLabel}` on both
IconButtons with `getEditAccessibilityLabel(item)`/`getRemoveAccessibilityLabel(item)` calls at
the `CardListRow` call sites (no leftover interim wiring). Each `Dialog`'s body now branches on
`isSubmitting`: `<SubmittingIndicator />` (reused molecule) instead of `render*(item)`; `actions`
gets a module-level `EMPTY_DIALOG_ACTIONS` (`<></>`, truthy-but-empty so `Dialog`'s
`actions ?? (<default buttons>)` fallback doesn't fire) instead of the default Cancel/Confirm
row; `onClose` is `undefined` while submitting so scrim/Escape are inert (`Dialog`/`SubmittingIndicator`
untouched — reused as-is).

### @s → test map
| Scenario | Test |
|---|---|
| @s11 | `.test.tsx`: edit dialog body → SubmittingIndicator, Save/Cancel hidden, while isSubmitting |
| @s12 | `.test.tsx`: remove dialog body → SubmittingIndicator, Remove/Keep-it hidden, while isSubmitting |
| @s13 | `.test.tsx`: isSubmitting true→false via `rerender` restores form + buttons |
| @s11/@s12 (dismiss) | `.e2e.js`: scrim tap + Escape do nothing on `edit-dialog-submitting`/`remove-dialog-submitting` stories |
| @s14 | `.test.tsx`: get*AccessibilityLabel(item) builds a distinct name per card, both icons |
| @s18 | `.stories.tsx`: 10 states — Populated, EmptyWithMessage, EmptyWithoutMessage, DisabledCard, EditOnlyCard, RemoveOnlyCard, EditDialogOpen, RemoveDialogOpen, EditDialogSubmitting, RemoveDialogSubmitting (+ pre-existing Interactive) |

New stories use a Storybook `play` function (`userEvent.click` on the built accessible label) to
reach "dialog open" state, since open-dialog state is internal to the hook (not prop-driven).

`.test.tsx` gained a `jest.mock('@helsoft/localization', ...)` (SubmittingIndicator calls
`useLocalization`), matching `api-key-form-dialog.test.tsx`'s existing pattern.

### Slice gate
`@helsoft/components test` — 70 suites / 515 tests green. `playwright test
tests/e2e/organisms/card-list-with-abm-dialog --reporter=list` — 5 passed. `check-types`/`lint`
(workspace + repo-wide) / `pnpm format` — clean. No hardcoded accessible-name strings — all via
`getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`. No leftover task-2/3 deferral comments.

## Post-pr_ready bug fix (mini-gate) — empty-dialog flash on close

Root cause: `closeDialog()` nulled `dialogState` synchronously while the shared `Dialog`'s
`Modal` (`animationType="fade"`) fades out over its own duration — `renderDialogBody` returned
null for the remainder of the fade, flashing an empty dialog.

Fix (`use-card-list-with-abm-dialog.ts`): added a second `isOpen` boolean, decoupled from
`dialogState`. `openEditDialog`/`openRemoveDialog` set both `dialogState` and `isOpen=true`;
`closeDialog` only flips `isOpen=false` — `dialogState` (last `{type,item}`) is never cleared,
so only the next `open*Dialog` call replaces it. `card-list-with-abm-dialog.tsx`: `Dialog`'s
`open` gated on `isOpen && dialogState?.type === 'edit'|'remove'`; `renderDialogBody`/
`handleEditConfirm`/`handleRemoveConfirm` keep reading `dialogState` unconditionally (unchanged).
No edit to `Dialog`/`Modal` (atom/organism ban respected).

### @s → test map
| Scenario | Test |
|---|---|
| @s19 | `use-...test.ts`: `closeDialog` flips `isOpen` false, keeps last `dialogState` (edit) · `.test.tsx`: `keeps supplying the edit dialog its last content in the same render Close flips open false` |
| @s20 | `use-...test.ts`: same for remove · `.test.tsx`: same test, remove dialog |

`.test.tsx` gained a `jest.mock('../dialog/dialog', ...)` — `jest.fn(actual.Dialog)`, fully
delegating (no behavior change to any other test) — to inspect the `open`/`children` props
`CardListWithABMDialog` hands `Dialog` at the exact tick `closeDialog` runs (the real Modal is
instant-hide under the RN jest mock, so a plain DOM query can't observe a mid-fade state).
Gotcha: comparing captured React elements with `toEqual` recurses pathologically (dev-only
class-component getters) — assert the rendered body's plain string content instead.
`use-...test.ts`'s old "closeDialog clears dialogState back to null" assertion is now inverted
(dialogState persists); added an "opening after closing replaces the stale dialogState" case.

### Gate
`@helsoft/components lint check-types test` — 70 suites / 529 tests green. `playwright test
tests/e2e/organisms/card-list-with-abm-dialog --reporter=list` — 5 passed (unchanged, no new
e2e — animation-timing behavior isn't reliably assertable via Playwright without flakiness;
covered at the hook/component prop level instead). `pnpm format` clean. @s7–@s10/@s11–@s13
unaffected (same assertions, still green).
