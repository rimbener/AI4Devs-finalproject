# Risks — card-list-with-abm-dialog

| # | Risk | Type | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | First generic component (`CardListItem<TItem>`) in `@helsoft/components` — reviewers/implementers unfamiliar with the pattern could reach for `any` under time pressure | technical | L | M | `reviewer_slice`/`reviewer_engineering` check `.types.ts` for `any`/unconstrained generics; type-checked in Storybook stories with a concrete story-level `TItem`. |
| R2 | `Dialog`'s `onClose={undefined}` (block-dismiss-while-submitting) relies on `Dialog`'s existing `Modal onRequestClose={onClose}` tolerating an undefined handler — not exercised elsewhere in this lib | technical | L | L | Verified in task-3's unit/e2e tests (scrim/Escape no-ops while `isSubmitting`); `Dialog` itself is out of scope to modify (atom/organism ban). |
| R3 | `FlatList` + arbitrary caller `ReactNode` content (chosen over a plain `.map()`) could complicate stories/tests if a story's content is itself interactive/stateful | product | L | L | Storybook stories keep example content simple (text/labels); real caller screens are outside this feature's scope. |

## Dependencies
| Dependency | Status | Notes |
|---|---|---|
| `Card`, `Button`, `IconButton` atoms | available | Reused as-is, no atom edits. |
| `Dialog`, `SubmittingIndicator` | available | Reused as-is (`Dialog` organism, `SubmittingIndicator` molecule). |
