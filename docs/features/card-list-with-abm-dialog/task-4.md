---
id: task-4
title: "Post-hoc: architecture split (Context+reducer, atom/molecule/organism extraction) and Add-dialog feature"
slice: 4
scenarios: [s21, s22, s23, s24, s25, s26, s27]
status: in_review
paths: [libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.tsx, libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.types.ts, libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.stories.tsx, libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.test.tsx, libs/components/src/atoms/error-banner/error-banner.tsx, libs/components/src/atoms/error-banner/error-banner.stories.tsx, libs/components/src/atoms/error-banner/error-banner.test.tsx, libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.tsx, libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.stories.tsx, libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.test.tsx, libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.tsx, libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.stories.tsx, libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.test.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts, libs/components/src/organisms/card-list-with-abm-dialog/components/card-list-row-adapter.tsx, libs/components/src/organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.tsx, libs/components/src/organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.types.tsx, libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts, libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.reducer.ts]
---

## Goal
This task documents work the human authored directly in the working tree (not run through `implementer`/`reviewer_slice`), after `task-3.md`/`pr_ready`. It covers two things:

1. **Architecture split**: the previously-flat `card-list-with-abm-dialog.tsx` was decomposed into `CardListWithABMDialogHeader` (atom), `CardListWithABMDialogList` (organism, wraps `FlatList` + `CardListRowAdapter`), `CardListWithABMDialogDialog` (molecule — the **one** shared `Dialog` instance for add/edit/remove/error/submitting, replacing the earlier two-separate-`<Dialog>`-elements wiring), and a `CardListWithABMDialogProvider`/`useCardListWithABMDialogContext` React Context (`state-sharing.mdc`) so these sub-components consume the shared value object without prop-drilling. Local dialog-open state moved from a 2-field `useState` discriminated union to a 3-field `useReducer` (`cardListWithABMDialogReducer`) — `dialogType`/`dialogItem`/`dialogState`, now legitimately crossing `state.mdc`'s ≥3-field threshold.
2. **Add-dialog feature**: `renderAddForm`/`addDialogTitle`/`addSubmitLabel`/`addCancelLabel`/`onAddSubmit` give the add button the same dialog-backed flow as edit/remove (previously a non-goal — `onAddPress` was a plain callback with no dialog). Plus `errorMessage` (forces the shared dialog open with an `ErrorBanner` body and a single Close action), `submitDisabled` (disables the dialog's confirm button), and `showAddButton` (toggles the header's add button).

## Done criteria
- [x] Scenarios s21-s25 covered by concrete tests at the organism (`card-list-with-abm-dialog.test.tsx`) level (add-dialog open/submit/cancel/no-flash/mutual-exclusivity); s26/s27 covered **end-to-end** from `CardListWithABMDialog` itself (not just the `CardListWithABMDialogDialog` molecule in isolation)
- [ ] `spec_reviewer`-equivalent check of this task's own scenarios/paths — **not run**
- [ ] `reviewer_slice` (design/a11y/all `.agents/rules/`) — **not run**
- [ ] `reviews_lead` full review (code/architecture/performance/security) — **not run against this delta**; `review.md`'s existing APPROVED rounds predate this work
- [ ] `mutation_tester` re-run against the current shape — **not run**; `mutation.md`'s accepted 97.2–97.5% predates this work
- [x] `pnpm --filter @helsoft/components lint check-types test` green (re-verified after the follow-up fixes below: 72 suites / 517 tests)
- [x] `pnpm --filter @helsoft/study-buddy check-types` green (confirms `api-key-settings-screen-item.tsx`'s `CardListItem` mapper still satisfies the tightened types)

## Follow-up fixes (landed after this task was first documented)
- `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` (context types) and `CardListItem.accessibleLabel` re-tightened to **required** (were briefly optional) — WCAG 4.1.2 regression closed; `CardListRowAdapter` no longer needs `?.()`.
- Dead `CardListItem.title?: string` field removed.
- `card-list-with-abm-dialog.test.tsx`'s mistagged `@s17` comment (and its sibling add-dialog/mutual-exclusivity tests) retagged to the correct `@s21`–`@s25`.
- `@s26`/`@s27` (errorMessage / submitDisabled) gained end-to-end tests on `CardListWithABMDialog` itself.
- The Add-dialog feature and the i18n-fallback amendment (cancel/save/close labels) were **accepted as-is** and are now written up as proper Open Decisions in `spec.md`, not flagged concerns.

## Notes
- This task's `status: in_review` (not `done`) is deliberate — the code exists and is now more thoroughly unit-tested, but has not cleared this feature's own quality gate (slice review → full review → mutation). Treat `tasks.md`'s `phase: pr_ready` as **stale** until this task is actually re-reviewed and mutation is re-run — see `spec.md`'s "Outstanding" section.
