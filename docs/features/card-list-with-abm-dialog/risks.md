# Risks — card-list-with-abm-dialog

| # | Risk | Type | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | First generic component (`CardListItem<TItem>`) in `@helsoft/components` — reviewers/implementers unfamiliar with the pattern could reach for `any` under time pressure | technical | L | M | `reviewer_slice`/`reviewer_engineering` check `.types.ts` for `any`/unconstrained generics; type-checked in Storybook stories with a concrete story-level `TItem`. |
| R2 | `Dialog`'s `onClose={undefined}` (block-dismiss-while-submitting) relies on `Dialog`'s existing `Modal onRequestClose={onClose}` tolerating an undefined handler — not exercised elsewhere in this lib | technical | L | L | Verified in task-3's unit/e2e tests (scrim/Escape no-ops while `isSubmitting`); `Dialog` itself is out of scope to modify (atom/organism ban). |
| R3 | `FlatList` + arbitrary caller `ReactNode` content (chosen over a plain `.map()`) could complicate stories/tests if a story's content is itself interactive/stateful | product | L | L | Storybook stories keep example content simple (text/labels); real caller screens are outside this feature's scope. |
| R4 | `.agents/skills/mutation-testing/scripts/parse-mutation-report.mjs` overwrites `mutation.md` wholesale on each run rather than appending — every mutation re-run this feature required manually reconstructing prior-round history from git/conversation context to keep the durable trail | technical (tooling) | M | L | Worked around each time (rounds 4, 6→7) by hand-restoring prior rounds before appending the new one. Not blocking this feature; worth a future fix to the shared skill script so it appends instead of overwriting. |
| R5 | Human-authored architecture rewrite (Context+`useReducer`, atom/molecule/organism extraction) and a new Add-dialog feature landed directly in the working tree, outside `implementer`/`reviewer_slice`, after `pr_ready`. `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`/`CardListItem.accessibleLabel` became optional (WCAG 4.1.2 risk for future callers that omit them — every current caller still supplies them); the "no internal i18n" decision was partially reversed (cancel/submit/close now fall back to `t()` keys); `errorMessage`/`submitDisabled` are untested end-to-end from the top-level component. None of this went through spec/gherkin/review/mutation. | product + technical | H | M | Documented post-hoc in `spec.md`'s "Issues found by this doc pass", `gherkin-scenarios.md` (`@s21`–`@s27`), and `task-4.md`. `review.md`/`review-engineering.md`/`mutation.md`/`dod.md` all flagged `STALE` at the top. Mitigation is re-review + mutation re-run — not done by this pass (docs-only). |

## Dependencies
| Dependency | Status | Notes |
|---|---|---|
| `Card`, `Button`, `IconButton` atoms | available | Reused as-is, no atom edits. |
| `Dialog`, `SubmittingIndicator` | available | Reused as-is (`Dialog` organism, `SubmittingIndicator` molecule). |
