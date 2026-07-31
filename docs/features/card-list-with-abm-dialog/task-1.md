---
id: task-1
title: Render titled card list with disabled/show flags and empty state
slice: 1
scenarios: [s1, s2, s3, s4, s15, s16, s17]
status: done
paths: [libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.stories.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx, libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js, libs/components/src/organisms/index.ts]
---

## Goal
Implementation-first (UI `.tsx`, per `tdd.mdc`): build `CardListWithABMDialog` rendering `title`, an add `Button` (`icon="add"`, `addButtonLabel`, wired to `onAddPress`), and a `FlatList` of `Card`s — one per `CardListItem<TItem>` — each showing `item.content`. Per-item `disabled` renders the card at `theme.disabledOpacity`; `showEditButton`/`showRemoveButton` independently gate whether each `IconButton` renders (disabled cards still render both icons, disabled via `IconButton`'s own `disabled` prop, per spec.md's Open decisions). Empty `items` still renders `title` + add button; `emptyStateMessage` renders in its place when provided, else nothing. No dialog wiring yet (task-2).

## Done criteria
- [x] Scenarios s1, s2, s3, s4, s15, s16, s17 covered by concrete test(s)
- [x] Implementation follows `component-split.mdc` (`.tsx` / `.types.ts` / `use-card-list-with-abm-dialog.ts` if local state is needed this slice / `.stories.tsx`) and `atomic-design.mdc`
- [x] `card-list-with-abm-dialog.test.tsx` (RTL) + a `card-list-with-abm-dialog.e2e.js` interaction test for the add-button tap (`onAddPress`) per `e2e.mdc` (no render-only e2e)
- [x] `pnpm --filter @helsoft/components lint` + `check-types` + `test` green
- [x] No hardcoded strings/colors/dimensions — `addButtonLabel`/`title`/`emptyStateMessage` are props; styling via `theme.*` tokens
- [x] Exported from `libs/components/src/organisms/index.ts`

## Notes
- `CardListItem<TItem>` and `CardListWithABMDialogProps<TItem>` (full shape in `spec.md`) live in `card-list-with-abm-dialog.types.ts`; this slice only needs the fields relevant to s1–s4/s15–s17 (`id`, `content`, `accessibleLabel` unused until task-3, `disabled`, `showEditButton`, `showRemoveButton`, `data`) plus `title`, `items`, `addButtonLabel`, `onAddPress`, `emptyStateMessage` — the full generic type can be authored now even though later fields (`renderEditForm`, `isSubmitting`, etc.) aren't wired until task-2/3.
- `keyExtractor` uses `item.id` (per `FlatList` precedent in `pdf-document-list.tsx`).
- Reuse `Card`, `Button`, `IconButton` atoms as-is — no atom edits (atom-ban).
- **Historical record — paths above no longer match the current tree.** The header/list rendering built in this slice was later extracted into `atoms/card-list-with-abm-dialog-header/` and `organisms/card-list-with-abm-dialog-list/`; see `task-4.md` and `spec.md`'s Architecture section for where this functionality lives now.
