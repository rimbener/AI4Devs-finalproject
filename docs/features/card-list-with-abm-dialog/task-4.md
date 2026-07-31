---
id: task-4
title: "Post-hoc: architecture split (Context+reducer, atom/molecule/organism extraction) and Add-dialog feature"
slice: 4
scenarios: [s21, s22, s23, s24, s25, s26, s27]
status: done
paths: [libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.tsx, libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.types.ts, libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.stories.tsx, libs/components/src/atoms/card-list-with-abm-dialog-header/card-list-with-abm-dialog-header.test.tsx, libs/components/src/atoms/error-banner/error-banner.tsx, libs/components/src/atoms/error-banner/error-banner.stories.tsx, libs/components/src/atoms/error-banner/error-banner.test.tsx, libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.tsx, libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.stories.tsx, libs/components/src/molecules/card-list-with-abm-dialog-dialog/card-list-with-abm-dialog-dialog.test.tsx, libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.tsx, libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.stories.tsx, libs/components/src/organisms/card-list-with-abm-dialog-list/card-list-with-abm-dialog-list.test.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx, libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts, libs/components/src/organisms/card-list-with-abm-dialog/components/card-list-row-adapter.tsx, libs/components/src/organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.tsx, libs/components/src/organisms/card-list-with-abm-dialog/hooks/card-list-with-abm-dialog.context.types.tsx, libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.ts, libs/components/src/organisms/card-list-with-abm-dialog/hooks/use-card-list-with-abm-dialog.reducer.ts]
---

## Goal
This task documents work the human authored directly in the working tree (not run through `implementer`/`reviewer_slice`), after `task-3.md`/`pr_ready`. It covers two things:

1. **Architecture split**: the previously-flat `card-list-with-abm-dialog.tsx` was decomposed into `CardListWithABMDialogHeader` (atom), `CardListWithABMDialogList` (organism, wraps `FlatList` + `CardListRowAdapter`), `CardListWithABMDialogDialog` (molecule — the **one** shared `Dialog` instance for add/edit/remove/error/submitting, replacing the earlier two-separate-`<Dialog>`-elements wiring), and a `CardListWithABMDialogProvider`/`useCardListWithABMDialogContext` React Context (`state-sharing.mdc`) so these sub-components consume the shared value object without prop-drilling. Local dialog-open state moved from a 2-field `useState` discriminated union to a 3-field `useReducer` (`cardListWithABMDialogReducer`) — `dialogType`/`dialogItem`/`dialogState`, now legitimately crossing `state.mdc`'s ≥3-field threshold.
2. **Add-dialog feature**: `renderAddForm`/`addDialogTitle`/`addSubmitLabel`/`addCancelLabel`/`onAddSubmit` give the add button the same dialog-backed flow as edit/remove (previously a non-goal — `onAddPress` was a plain callback with no dialog). Plus `errorMessage` (forces the shared dialog open with an `ErrorBanner` body and a single Close action), `submitDisabled` (disables the dialog's confirm button), and `showAddButton` (toggles the header's add button).

## Done criteria
- [x] Scenarios s21-s25 covered by concrete tests at the organism (`card-list-with-abm-dialog.test.tsx`) level (add-dialog open/submit/cancel/no-flash/mutual-exclusivity); s26/s27 covered **end-to-end** from `CardListWithABMDialog` itself (not just the `CardListWithABMDialogDialog` molecule in isolation)
- [x] `spec_reviewer`-equivalent check — covered by the human sign-off on `@s13`'s amendment (spec.md) plus Mini-gate 3's full review
- [x] `reviewer_slice`-equivalent design/a11y coverage — folded into Mini-gate 3's full review (see `review.md`)
- [x] `reviews_lead` full review — Mini-gate 3, Round 1 (9 findings) → Round 2 (APPROVED, zero findings open)
- [x] `mutation_tester` re-run — Round 8 baseline 77.3% → Round 9 kill pass 99.84% (1 documented-equivalent survivor); mutation-kill's own production-source delta re-reviewed and closed clean (`review.md`)
- [x] `pnpm --filter @helsoft/components lint check-types test` green (72 suites / 549 tests, final)
- [x] `pnpm --filter @helsoft/study-buddy lint check-types test` green (46 suites / 426+ tests)
- [x] `dod_validator` Round 4 — **PASS**

## Follow-up fixes (landed after this task was first documented)
- `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` (context types) and `CardListItem.accessibleLabel` re-tightened to **required** (were briefly optional) — WCAG 4.1.2 regression closed; `CardListRowAdapter` no longer needs `?.()`.
- Dead `CardListItem.title?: string` field removed.
- `card-list-with-abm-dialog.test.tsx`'s mistagged `@s17` comment (and its sibling add-dialog/mutual-exclusivity tests) retagged to the correct `@s21`–`@s25`.
- `@s26`/`@s27` (errorMessage / submitDisabled) gained end-to-end tests on `CardListWithABMDialog` itself.
- The Add-dialog feature and the i18n-fallback amendment (cancel/save/close labels) were **accepted as-is** and are now written up as proper Open Decisions in `spec.md`, not flagged concerns.

## Notes
- **Mini-gate 3** (the full pipeline re-run this task's gates above refer to) additionally found and fixed: a CI-red stuck-forever `'submitting'`-state bug, a reverse-dependency anti-pattern repeated in the header/list/dialog sub-components (fixed by moving them into the organism's own private `components/{header,list,dialog}/` subfolders — the `paths` list above predates this move), dead/backwards `tsconfig.json` includes, a fragile grace-timer (documented as an accepted risk with a proving test), dead code, an out-of-scope `TextField` regression (reverted), a security minor on `Linking.openURL` (fixed with `isSafeExternalUrl()`), and a swallowed-rejection minor. Full detail in `review.md`'s Mini-gate 3 sections; `@s13`'s gherkin text was also amended with explicit human sign-off (`spec.md`'s Open Decisions).
- Paths above reflect this task's original file set; several were subsequently relocated during the fix round — see `spec.md`'s Architecture section for the current, authoritative file layout.
