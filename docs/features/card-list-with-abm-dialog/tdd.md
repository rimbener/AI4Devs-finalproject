# TDD log — card-list-with-abm-dialog

## Slice 1 (task-1) — Render titled card list with disabled/show flags and empty state

UI `.tsx` organism, implementation-first. No hook this slice (no dialog state yet).

Files: `.types.ts` (`CardListItem<TItem>` + slice-1 props), `.tsx` (title/add-`Button`/
`FlatList` of `Card` rows; disabled row = `theme.disabledOpacity`; edit/remove `IconButton`s
gated by `showEditButton`/`showRemoveButton`), `.stories.tsx` (Populated/EmptyWithMessage/
EmptyWithoutMessage/DisabledCard/EditOnlyCard/RemoveOnlyCard/Interactive), `.e2e.js` (add-tap
counter), `.test.tsx`.

@s → test: @s1 title/add/one-Card-per-item · @s2 disabled opacity+disabled icons · @s3/@s4
show*Button hides only that icon · @s15/@s16 empty-state · @s17 onAddPress (+e2e).

Decisions: `IconButton` has no `testID` — wrapped each icon in a local `View testID=...`
(atom-ban). Add `Button` needs explicit `accessibilityLabel`. Per-item edit/remove accessible
names + `onPress` deferred to slice 2/3.

Gate: 69 suites/499 tests green · e2e 1 passed · check-types/lint/format clean.

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
