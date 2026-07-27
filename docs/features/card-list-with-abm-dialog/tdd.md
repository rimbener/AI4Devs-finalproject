# TDD log — card-list-with-abm-dialog

## Slice 1 (task-1) — Render titled card list with disabled/show flags and empty state

UI `.tsx` organism, implementation-first. No hook this slice (no dialog state yet).

Files: `card-list-with-abm-dialog.types.ts` (`CardListItem<TItem>` + slice-1 props subset),
`card-list-with-abm-dialog.tsx` (title/add-`Button`/`FlatList` of `Card` rows; disabled row =
`theme.disabledOpacity`; edit/remove `IconButton`s gated by `showEditButton`/`showRemoveButton`),
`.stories.tsx` (Populated/EmptyWithMessage/EmptyWithoutMessage/DisabledCard/EditOnlyCard/
RemoveOnlyCard/Interactive), `.e2e.js` (add-tap counter), `.test.tsx`.

@s → test: @s1 `renders the title, an Add button, and one Card per item` · @s2 `renders a
disabled item at theme.disabledOpacity...` · @s3/@s4 `hides only the edit/remove icon when
show*Button is false` · @s15/@s16 empty-state title/add/message tests · @s17 `calls onAddPress
once...` (+e2e).

Decisions: `IconButton` has no `testID` — wrapped each icon in a local `View testID=...` instead
of touching the atom (atom-ban). Add `Button` needs explicit `accessibilityLabel` (icon+label
concatenation otherwise). Per-item onPress/edit-remove accessible names deferred to task-2/3 —
icons render with interim `item.accessibleLabel` and no `onPress` this slice.

Gate: 69 suites/499 tests green · e2e 1 passed · check-types/lint/format clean · no hardcoded
strings/colors/dims.

## Slice 2 (task-2) — Wire edit/remove dialogs via the shared Dialog organism

UI `.tsx` → implementation-first; co-located `use-card-list-with-abm-dialog.ts` hook →
strict TDD (RED→GREEN, one `useState` per `state.mdc` — 1 state var, no reducer).

### Hook TDD cycles (`use-card-list-with-abm-dialog.test.ts`)
1. RED `starts with no dialog open` (module didn't exist) → GREEN: hook with
   `useState<{type:'edit'|'remove', item}|null>(null)` + `openEditDialog`/`openRemoveDialog`/
   `closeDialog` (all already green together; small hook, one pass).
2. `openEditDialog sets dialogState to the edit type for that item` — green.
3. `openRemoveDialog sets dialogState to the remove type for that item` — green.
4. `closeDialog clears dialogState back to null` — green.
`CardListDialogState<TItem>` kept **unexported** (hook-private per `types.mdc`).

### Component wiring (`card-list-with-abm-dialog.tsx` + `.types.ts`)
Added `renderEditForm`/`editDialogTitle`/`editSubmitLabel`/`editCancelLabel`/`onEditSubmit` and
the remove-side equivalents to `CardListWithABMDialogProps<TItem>`. Two `Dialog` instances
(reused as-is, not edited): `open={dialogState?.type === 'edit'|'remove'}`, `headline`/
`confirmLabel`/`cancelLabel` from the static props, body = `render*(dialogState.item)`.
`onConfirm` calls `onEditSubmit`/`onRemoveConfirm` with the item then `closeDialog()`; `onClose`
(Cancel/scrim/Escape, Dialog's own wiring) only calls `closeDialog()`. Row `IconButton`s now wire
`onPress` to `openEditDialog(item)`/`openRemoveDialog(item)` (previously inert in slice 1).

### @s → test map
| Scenario | Test |
|---|---|
| @s5 | `opens the edit dialog with renderEditForm(item) and the static edit chrome` |
| @s6 | `opens the remove dialog with renderRemoveConfirmation(item) and the static remove chrome` |
| @s7 | `calls onEditSubmit with the item once its dialog is submitted, then closes it` |
| @s8 | `calls onRemoveConfirm with the item once its dialog is submitted, then closes it` |
| @s9 | `closes the edit dialog without calling onEditSubmit when Cancel is pressed` |
| @s10 | `closes the remove dialog without calling onRemoveConfirm when Cancel is pressed` |

Extra (mutation-resistance): `only one dialog is open at a time — opening remove after edit
closes the edit dialog` (discriminated union invariant).

e2e (`card-list-with-abm-dialog.e2e.js`, Populated story): edit icon → submit closes dialog;
remove icon → cancel closes dialog without acting.

### Gotcha (debugging note, not a rule change)
RN's `Modal` (iOS branch) needs the prop transition `visible:false→true` flushed inside
`await act(async () => { fireEvent.press(...) })`, not a bare `fireEvent.press` — matches the
existing `pdf-document-list.test.tsx` delete-confirm pattern. Fixed by wrapping every dialog
open/submit/cancel press in `act`.

### Slice gate
- `pnpm --filter @helsoft/components test` — 70 suites / 512 tests green.
- `pnpm --filter @helsoft/components exec playwright test tests/e2e/organisms/card-list-with-abm-dialog --reporter=list` — 3 passed.
- `pnpm --filter @helsoft/components check-types` / `lint` — clean.
- `pnpm format` / `pnpm check-types` (repo-wide) — clean.
- No hardcoded strings — dialog chrome (`editDialogTitle` etc.) all props; no literal colors/dims.
