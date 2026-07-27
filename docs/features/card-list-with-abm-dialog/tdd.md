# TDD log — card-list-with-abm-dialog

## Slice 1 (task-1) — Render titled card list with disabled/show flags and empty state

UI `.tsx` organism → implementation-first per `tdd.mdc` (impl → stories → interaction e2e → unit tests).
No local state this slice (no dialog yet) → no `use-card-list-with-abm-dialog.ts` per `component-split.mdc`.

### Files
- `card-list-with-abm-dialog.types.ts` — `CardListItem<TItem>` (full stable contract) + this
  slice's `CardListWithABMDialogProps<TItem>` subset (`title`/`items`/`addButtonLabel`/
  `onAddPress`/`emptyStateMessage`).
- `card-list-with-abm-dialog.tsx` — title + add `Button` (icon="add") + `FlatList` of `Card`
  rows; disabled row = `theme.disabledOpacity`; edit/remove `IconButton`s gated by
  `showEditButton`/`showRemoveButton`, disabled-when-item-disabled.
- `card-list-with-abm-dialog.stories.tsx` — Populated, EmptyWithMessage, EmptyWithoutMessage,
  DisabledCard, EditOnlyCard, RemoveOnlyCard, Interactive (add-tap counter demo).
- `card-list-with-abm-dialog.e2e.js` — one interaction test (add-button tap → counter increments).
- `card-list-with-abm-dialog.test.tsx` — RTL coverage below.
- Exported from `organisms/index.ts`.

### @s → test map
| Scenario | Test |
|---|---|
| @s1 | `renders the title, an Add button, and one Card per item` |
| @s2 | `renders a disabled item at theme.disabledOpacity with disabled edit/remove icons` |
| @s3 | `hides only the edit icon when showEditButton is false` |
| @s4 | `hides only the remove icon when showRemoveButton is false` |
| @s15 | `renders the title, add button, and emptyStateMessage when items is empty and message is set` |
| @s16 | `renders the title and add button but nothing else when items is empty and no message is set` |
| @s17 | `calls onAddPress once when the add button is pressed` (+ empty-state variant) + e2e `tapping the add button calls onAddPress` |

Extra (mutation-resistance, not @s-mapped): FlatList `keyExtractor` by id; non-disabled item keeps
full opacity + enabled icons; both flags omitted → neither icon renders.

### Notes / decisions
- Atom-ban: `IconButton` has no `testID` prop — wrapped each icon in a local `View testID=...`
  instead of adding one to the atom. `Card`'s existing `testID` prop is reused directly (no atom
  change) to assert the disabled-opacity style.
- Add `Button` needs an explicit `accessibilityLabel={addButtonLabel}` — without it RTL's
  accessible-name computation concatenates the leading icon ligature text with the label
  (matches `Button`'s own test-file convention for icon+label buttons).
- Per-item `accessibilityLabel`/edit-remove accessible names and onPress wiring are deferred to
  task-2/3 per spec.md's builder-function design decision — icons render inert (no `onPress`)
  and without a computed accessible name this slice.
- Stories: this is the lib's first generic component; `Meta`/`StoryObj` need a concrete
  component type, so the story casts `CardListWithABMDialog` to
  `ComponentType<CardListWithABMDialogProps<StoryFlashcard>>` for a representative `TItem`.

### Slice gate
- `pnpm --filter @helsoft/components test` — 69 suites / 499 tests green.
- `pnpm --filter @helsoft/components exec playwright test tests/e2e/organisms/card-list-with-abm-dialog --reporter=list` — 1 passed.
- `pnpm --filter @helsoft/components check-types` / `lint` — clean.
- `pnpm format` / `pnpm check-types` (repo-wide) — clean.
- No hardcoded strings/colors/dims — `title`/`addButtonLabel`/`emptyStateMessage` are props;
  styling via `theme.spacing`/`theme.typography`/`theme.colors`/`theme.disabledOpacity`.
