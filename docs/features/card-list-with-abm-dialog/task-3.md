---
id: task-3
title: isSubmitting swap, per-card a11y labels, full Storybook coverage
slice: 3
scenarios: [s11, s12, s13, s14, s18]
status: done
paths: [libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.stories.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.test.tsx, libs/components/tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js]
---

## Goal
Implementation-first (UI `.tsx`): while `isSubmitting` is true, whichever dialog is open replaces its body entirely with `SubmittingIndicator`, passes `actions={<></>}` (or equivalent) to hide the default Cancel/Submit `Button`s, and passes `onClose={undefined}` to the underlying `Dialog` to block scrim/Escape dismiss (per spec.md's Open decisions). When `isSubmitting` returns to `false`, normal content/buttons/dismissibility return. Each card's edit/remove `IconButton` gets `accessibilityLabel={getEditAccessibilityLabel(item)}` / `getRemoveAccessibilityLabel(item)` instead of a generic "Edit"/"Remove". Round out `card-list-with-abm-dialog.stories.tsx` to the full state matrix required by s18 (populated, empty w/ and w/o message, disabled card, edit-only card, remove-only card, edit dialog open, remove dialog open, isSubmitting true for each dialog).

## Done criteria
- [x] Scenarios s11, s12, s13, s14, s18 covered by concrete test(s)
- [x] `card-list-with-abm-dialog.test.tsx` covers the isSubmitting swap (both dialogs, both directions) and per-card distinct accessible names
- [x] `card-list-with-abm-dialog.e2e.js` gains an interaction test asserting scrim/Escape does nothing while `isSubmitting` is true
- [x] `card-list-with-abm-dialog.stories.tsx` has one story per s18's listed state (10 stories)
- [x] `pnpm --filter @helsoft/components lint` + `check-types` + `test` green
- [x] No hardcoded accessible-name strings — always `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel`

## Notes
- `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` are pure functions of `item` — safe to keep in the `.tsx` inline at the `IconButton` call site (no `.helpers.ts` needed, they're caller-supplied, not authored here).
- This is the last slice — after it, `reviews_lead` (full review) → `mutation_tester` run against the whole feature diff vs the delivery branch.
